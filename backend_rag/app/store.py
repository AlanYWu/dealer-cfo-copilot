"""Per-user Elasticsearch index wrapper.

Layout per user:
  - Index `rag-<sanitized_user_id>` with mappings:
      docId, docName, folder      keyword
      page                        integer
      text                        text (english analyzer, BM25)
      contextBefore, contextAfter text (index: false — stored, not searched)
      embedding                   dense_vector (cosine, dims from EMBED_MODEL)

ES handles BOTH keyword (BM25) and vector (kNN) search; no rank-bm25, no
in-memory chunk list.
"""
from __future__ import annotations

import re
import uuid
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

from elasticsearch import Elasticsearch
from elasticsearch.exceptions import NotFoundError, ConnectionError as ESConnectionError

from .config import (
    BM25_FIELD_BOOST_DOCNAME,
    BM25_FIELD_BOOST_FOLDER,
    BM25_FIELD_BOOST_TEXT,
    BM25_MIN_SHOULD_MATCH,
    ELASTICSEARCH_URL,
    REFINE_THRESHOLD,
)
from .embed import embed_dim


def _index(user_id: str) -> str:
    safe = re.sub(r"[^a-z0-9_-]+", "-", user_id.lower()).strip("-")
    return f"rag-{safe or 'anon'}"


@dataclass
class ChunkRecord:
    id: str
    doc_id: str
    doc_name: str
    folder: str
    page: int
    text: str
    context_before: str
    context_after: str


class Store:
    def __init__(self) -> None:
        self._client = Elasticsearch(ELASTICSEARCH_URL, request_timeout=120)

    # -- health -------------------------------------------------------
    def health(self) -> bool:
        try:
            return bool(self._client.ping())
        except ESConnectionError:
            return False

    # -- index lifecycle ----------------------------------------------
    def _ensure_index(self, user_id: str) -> bool:
        """Returns True if the index already existed, False if it was just created."""
        name = _index(user_id)
        if self._client.indices.exists(index=name):
            return True
        self._client.indices.create(
            index=name,
            settings={"number_of_shards": 1, "number_of_replicas": 0},
            mappings={
                "properties": {
                    "docId":       {"type": "keyword"},
                    "docName": {
                        "type": "keyword",
                        "fields": {"text": {"type": "text", "analyzer": "english"}},
                    },
                    "folder": {
                        "type": "keyword",
                        "fields": {"text": {"type": "text", "analyzer": "english"}},
                    },
                    "page":        {"type": "integer"},
                    "text":        {"type": "text", "analyzer": "english"},
                    "contextBefore": {"type": "text", "index": False},
                    "contextAfter":  {"type": "text", "index": False},
                    "embedding": {
                        "type": "dense_vector",
                        "dims": embed_dim(),
                        "index": True,
                        "similarity": "cosine",
                    },
                }
            },
            wait_for_active_shards=1,
        )
        # Belt-and-braces: ensure the shard is allocated before we touch it.
        self._client.cluster.health(index=name, wait_for_status="yellow", timeout="30s")
        return False

    # -- ingest / delete ----------------------------------------------
    def upsert(
        self,
        user_id: str,
        records: List[ChunkRecord],
        vectors: List[List[float]],
        doc_id: str,
    ) -> None:
        existed = self._ensure_index(user_id)
        name = _index(user_id)
        # Drop any prior chunks for this doc before re-indexing — only meaningful
        # if the index already existed; a fresh index has nothing to delete.
        if existed:
            self._delete_by_docid(name, doc_id)
        if not records:
            self._client.indices.refresh(index=name)
            return
        ops: List[dict] = []
        for r, v in zip(records, vectors):
            ops.append({"index": {"_index": name, "_id": r.id}})
            ops.append({
                "docId": r.doc_id,
                "docName": r.doc_name,
                "folder": r.folder,
                "page": r.page,
                "text": r.text,
                "contextBefore": r.context_before,
                "contextAfter": r.context_after,
                "embedding": v,
            })
        self._client.bulk(operations=ops, refresh=True)

    def delete_doc(self, user_id: str, doc_id: str) -> None:
        name = _index(user_id)
        try:
            self._delete_by_docid(name, doc_id)
            self._client.indices.refresh(index=name)
        except NotFoundError:
            return

    def _delete_by_docid(self, index: str, doc_id: str) -> None:
        if not self._client.indices.exists(index=index):
            return
        self._client.delete_by_query(
            index=index,
            query={"term": {"docId": doc_id}},
            refresh=True,
            conflicts="proceed",
        )

    # -- query --------------------------------------------------------
    def vector_search(
        self,
        user_id: str,
        vector: List[float],
        scope_folders: Optional[List[str]],
        scope_docs: Optional[List[str]],
        limit: int,
    ) -> List[Tuple[ChunkRecord, float]]:
        name = _index(user_id)
        if not self._client.indices.exists(index=name):
            return []
        knn: dict = {
            "field": "embedding",
            "query_vector": vector,
            "k": limit,
            "num_candidates": max(100, limit * 2),
        }
        filt = self._build_filter(scope_folders, scope_docs)
        if filt:
            knn["filter"] = filt
        res = self._client.search(
            index=name, knn=knn, size=limit, source_excludes=["embedding"]
        )
        return [(self._to_record(h), float(h["_score"])) for h in res["hits"]["hits"]]

    def keyword_search(
        self,
        user_id: str,
        query: str,
        scope_folders: Optional[List[str]],
        scope_docs: Optional[List[str]],
        size: int,
    ) -> Tuple[List[Tuple[ChunkRecord, float]], int]:
        name = _index(user_id)
        if not self._client.indices.exists(index=name):
            return [], 0
        body: dict = {
            "bool": {
                "must": [{
                    "multi_match": {
                        "query": query,
                        "type": "best_fields",
                        "fields": [
                            f"text^{BM25_FIELD_BOOST_TEXT}",
                            f"docName.text^{BM25_FIELD_BOOST_DOCNAME}",
                            f"folder.text^{BM25_FIELD_BOOST_FOLDER}",
                        ],
                        "operator": "or",
                        "minimum_should_match": BM25_MIN_SHOULD_MATCH,
                        "lenient": True,
                    }
                }]
            }
        }
        filt = self._build_filter(scope_folders, scope_docs)
        if filt:
            body["bool"]["filter"] = filt
        res = self._client.search(
            index=name,
            query=body,
            size=size,
            track_total_hits=REFINE_THRESHOLD + 1,
            source_excludes=["embedding"],
        )
        hits = [(self._to_record(h), float(h["_score"])) for h in res["hits"]["hits"]]
        total = int(res["hits"]["total"]["value"])
        return hits, total

    def docs(self, user_id: str) -> Dict[str, Tuple[str, str]]:
        """Return {docId: (docName, folder)} for the missing-doc agent."""
        name = _index(user_id)
        if not self._client.indices.exists(index=name):
            return {}
        res = self._client.search(
            index=name,
            size=0,
            aggs={
                "docs": {
                    "terms": {"field": "docId", "size": 1000},
                    "aggs": {
                        "first": {
                            "top_hits": {"size": 1, "_source": ["docName", "folder"]}
                        }
                    },
                }
            },
        )
        out: Dict[str, Tuple[str, str]] = {}
        for bucket in res["aggregations"]["docs"]["buckets"]:
            top = bucket["first"]["hits"]["hits"]
            if not top:
                continue
            src = top[0]["_source"]
            out[bucket["key"]] = (src.get("docName", ""), src.get("folder", ""))
        return out

    @staticmethod
    def _build_filter(
        folders: Optional[List[str]], docs: Optional[List[str]]
    ) -> Optional[List[dict]]:
        clauses: List[dict] = []
        if folders:
            clauses.append({"terms": {"folder": folders}})
        if docs:
            clauses.append({"terms": {"docId": docs}})
        return clauses or None

    @staticmethod
    def _to_record(hit: dict) -> ChunkRecord:
        s = hit["_source"]
        return ChunkRecord(
            id=str(hit["_id"]),
            doc_id=s.get("docId", ""),
            doc_name=s.get("docName", ""),
            folder=s.get("folder", ""),
            page=int(s.get("page", 1)),
            text=s.get("text", ""),
            context_before=s.get("contextBefore", ""),
            context_after=s.get("contextAfter", ""),
        )


# module-level singleton
_store: Optional[Store] = None


def get_store() -> Store:
    global _store
    if _store is None:
        _store = Store()
    return _store


def new_chunk_id() -> str:
    return str(uuid.uuid4())

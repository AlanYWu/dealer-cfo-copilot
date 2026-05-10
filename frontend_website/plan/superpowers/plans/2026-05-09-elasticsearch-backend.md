# Elasticsearch Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Qdrant + in-memory `rank-bm25` storage layer in `backend_rag/` with Elasticsearch 8 (which natively does both BM25 and dense-vector kNN), then wire the frontend so the existing-uploads case actually works.

**Architecture:** One Elasticsearch index per user (`rag-<sanitized_user_id>`) with both an `english`-analyzed `text` field (for BM25) and a `dense_vector` field (for kNN). All chunk-storage state moves into ES — no in-process per-user dicts. Embeddings (`bge-small-en-v1.5`, 384 dims) and the optional cross-encoder reranker stay in `app/embed.py`. A new `POST /api/rag/reindex` route on the Next.js side replays each existing local doc through `/ingest` so users with prior uploads aren't stuck with an empty index.

**Tech Stack:** FastAPI + Pydantic v2 (existing), Elasticsearch 8.13 (new — replaces Qdrant), `elasticsearch>=8.13,<9` Python client (new — replaces `qdrant-client`), `sentence-transformers` (existing), `pytest` (new dev dep). Frontend: Next.js 15 + Zod (existing).

---

## File Structure

### `backend_rag/` — files modified

| Path | Responsibility | Change |
|---|---|---|
| `requirements.txt` | runtime deps | drop `qdrant-client`, `rank-bm25`; add `elasticsearch` |
| `docker-compose.yml` | local infra | swap Qdrant container for Elasticsearch 8.13 single-node |
| `.env.example` | env vars | replace `QDRANT_URL` with `ELASTICSEARCH_URL` |
| `app/config.py` | env loader | replace `QDRANT_URL` with `ELASTICSEARCH_URL` |
| `app/store.py` | per-user index wrapper | full rewrite around ES client; no more BM25/chunks state |
| `app/search.py` | retrieval algorithm | call new store API; behaviour unchanged |
| `app/main.py` | FastAPI app | `/health` returns 503 if ES unreachable |
| `README.md` | run docs | swap Qdrant for ES |

### `backend_rag/` — files added

| Path | Responsibility |
|---|---|
| `tests/__init__.py` | empty package marker |
| `tests/test_chunk.py` | unit tests for `chunk.chunk_page` |
| `tests/test_search_helpers.py` | unit tests for `search._build_refine_hint` |
| `tests/test_agent.py` | unit tests for `agent._parse_json_array` |
| `pytest.ini` | test config (rootdir, paths) |

### `frontend_website/` — files modified

| Path | Responsibility | Change |
|---|---|---|
| `plan/backend-progress.md` | progress doc | update architecture diagram + TODO list |

### `frontend_website/` — files added

| Path | Responsibility |
|---|---|
| `app/api/rag/reindex/route.ts` | POST: walk local index, replay to backend `/ingest` |

The plan does **not** touch `lib/rag/contract.ts`, the chunker (`app/chunk.py`), the reranker/embedder (`app/embed.py`), the missing-doc agent (`app/agent.py`), the Pydantic schemas (`app/schemas.py`), or any frontend UI components. Their interfaces are stable.

---

## Task 1: Backend deps + env + docker-compose

**Files:**
- Modify: `backend_rag/requirements.txt`
- Modify: `backend_rag/docker-compose.yml`
- Modify: `backend_rag/.env.example`
- Modify: `backend_rag/app/config.py`

- [ ] **Step 1.1: Update `requirements.txt`**

Replace contents with:
```
fastapi>=0.115
uvicorn[standard]>=0.30
pydantic>=2.8
elasticsearch>=8.13,<9
sentence-transformers>=3.0
torch>=2.3
numpy>=1.26
pytest>=8.0
```

Removed: `qdrant-client`, `rank-bm25`.

- [ ] **Step 1.2: Replace `docker-compose.yml`**

```yaml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.13.4
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - bootstrap.memory_lock=false
      - ES_JAVA_OPTS=-Xms512m -Xmx512m
    ports:
      - "9200:9200"
    volumes:
      - ./.elasticsearch:/usr/share/elasticsearch/data
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://localhost:9200/_cluster/health | grep -E '\"status\":\"(green|yellow)\"' >/dev/null"]
      interval: 10s
      timeout: 5s
      retries: 12
```

`xpack.security.enabled=false` is the documented way to run dev clusters on a single node (otherwise ES 8 generates random passwords and TLS certs, which is overkill here). The 512 MiB heap is the floor that fits comfortably on a laptop.

- [ ] **Step 1.3: Replace `.env.example`**

```
ELASTICSEARCH_URL=http://localhost:9200
EMBED_MODEL=BAAI/bge-small-en-v1.5
RERANK_MODEL=BAAI/bge-reranker-base
TOP_K_VECTOR=50
TOP_K_RETURN=20
REFINE_THRESHOLD=100
CLAUDE_CLI=claude
```

- [ ] **Step 1.4: Update `config.py`**

```python
import os


def env(name: str, default: str) -> str:
    v = os.environ.get(name)
    return v if v else default


ELASTICSEARCH_URL = env("ELASTICSEARCH_URL", "http://localhost:9200")
EMBED_MODEL = env("EMBED_MODEL", "BAAI/bge-small-en-v1.5")
RERANK_MODEL = env("RERANK_MODEL", "BAAI/bge-reranker-base")
TOP_K_VECTOR = int(env("TOP_K_VECTOR", "50"))
TOP_K_RETURN = int(env("TOP_K_RETURN", "20"))
REFINE_THRESHOLD = int(env("REFINE_THRESHOLD", "100"))
CLAUDE_CLI = env("CLAUDE_CLI", "claude")
```

- [ ] **Step 1.5: Verify Python parses**

Run: `python -c "import ast; ast.parse(open('backend_rag/app/config.py').read())"`
Expected: exit 0, no output.

- [ ] **Step 1.6: Commit**

```bash
git add backend_rag/requirements.txt backend_rag/docker-compose.yml backend_rag/.env.example backend_rag/app/config.py
git commit -m "feat(backend): swap Qdrant for Elasticsearch in deps and config"
```

---

## Task 2: Rewrite `store.py` around Elasticsearch

**Files:**
- Modify: `backend_rag/app/store.py` (full rewrite)

The new store has the same public surface as before (`upsert`, `delete_doc`, `vector_search`, `keyword_search`, `docs`, plus a new `health()`), but no in-process state. ES owns everything.

- [ ] **Step 2.1: Replace `store.py` with the ES implementation**

```python
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

from .config import ELASTICSEARCH_URL, REFINE_THRESHOLD
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
        self._client = Elasticsearch(ELASTICSEARCH_URL, request_timeout=30)

    # -- health -------------------------------------------------------
    def health(self) -> bool:
        try:
            return bool(self._client.ping())
        except ESConnectionError:
            return False

    # -- index lifecycle ----------------------------------------------
    def _ensure_index(self, user_id: str) -> None:
        name = _index(user_id)
        if self._client.indices.exists(index=name):
            return
        self._client.indices.create(
            index=name,
            mappings={
                "properties": {
                    "docId":       {"type": "keyword"},
                    "docName":     {"type": "keyword"},
                    "folder":      {"type": "keyword"},
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
        )

    # -- ingest / delete ----------------------------------------------
    def upsert(
        self,
        user_id: str,
        records: List[ChunkRecord],
        vectors: List[List[float]],
        doc_id: str,
    ) -> None:
        self._ensure_index(user_id)
        name = _index(user_id)
        # Drop any prior chunks for this doc before re-indexing.
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
        knn = {
            "field": "embedding",
            "query_vector": vector,
            "k": limit,
            "num_candidates": max(100, limit * 2),
        }
        filt = self._build_filter(scope_folders, scope_docs)
        if filt:
            knn["filter"] = filt
        res = self._client.search(index=name, knn=knn, size=limit, source_excludes=["embedding"])
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
        must: List[dict] = [{"match": {"text": {"query": query, "operator": "or"}}}]
        body: dict = {"bool": {"must": must}}
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
    def _build_filter(folders: Optional[List[str]], docs: Optional[List[str]]) -> Optional[List[dict]]:
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
```

Notable differences from the old `store.py`:
- `keyword_search` now returns `(hits, total_count)`. Total comes from ES `track_total_hits` capped at `REFINE_THRESHOLD + 1` for cheap "is it big?" checks.
- `upsert` no longer needs `doc_name`/`folder` parameters (they're on the records already) — only `doc_id` for the prior-chunks delete.
- No `_lock`, no `BM25Okapi`, no `state.chunks`. ES is the single source of truth.

- [ ] **Step 2.2: Verify Python parses**

Run: `python -c "import ast; ast.parse(open('backend_rag/app/store.py').read())"`
Expected: exit 0.

- [ ] **Step 2.3: Commit**

```bash
git add backend_rag/app/store.py
git commit -m "feat(backend): rewrite store.py around Elasticsearch"
```

---

## Task 3: Update `search.py` to match the new store API

**Files:**
- Modify: `backend_rag/app/search.py`

Two surgical changes: `keyword_search` now returns `(hits, total)`, and `upsert` takes one fewer argument.

- [ ] **Step 3.1: Update `ingest_document`**

In `backend_rag/app/search.py`, replace the `store.upsert(...)` call so it matches the new signature:

```python
    store.upsert(
        user_id=user_id,
        records=records,
        vectors=vectors,
        doc_id=req.docId,
    )
```

- [ ] **Step 3.2: Update `_keyword_path`**

Replace the body of `_keyword_path` with:

```python
def _keyword_path(
    user_id: str, query: str, folders, docs
) -> Tuple[List[Quote], Optional[RefineHint], Optional[MissingHint]]:
    store = get_store()
    matches, total = store.keyword_search(
        user_id, query, folders, docs, size=TOP_K_RETURN
    )

    if total == 0:
        return _natural_path(user_id, query, folders, docs, accurate=False)

    quotes = [_to_quote(c, s) for c, s in matches]
    if total > REFINE_THRESHOLD:
        refine = _build_refine_hint(total=total, records=[m[0] for m in matches])
        return quotes, refine, None
    return quotes, None, None
```

Note the refine hint now uses just the top-`TOP_K_RETURN` records to build folder/doc counts. This is a small fidelity loss vs. the old "all matches" tally, but ES would need a separate aggregation pass to do better; deferred to TODO #7 in the progress doc.

- [ ] **Step 3.3: Verify Python parses**

Run: `python -c "import ast; ast.parse(open('backend_rag/app/search.py').read())"`
Expected: exit 0.

- [ ] **Step 3.4: Commit**

```bash
git add backend_rag/app/search.py
git commit -m "feat(backend): adapt search.py to ES store signatures"
```

---

## Task 4: Add `/health` startup gate in `main.py`

**Files:**
- Modify: `backend_rag/app/main.py`

The current `/health` always returns `{"ok": True}`, which masks ES outages. Make it ping ES.

- [ ] **Step 4.1: Update the `/health` handler**

Replace the existing handler with:

```python
from fastapi import FastAPI, Header, HTTPException

from .schemas import IngestRequest, SearchRequest, SearchResponse
from .search import ingest_document, delete_document, run_search
from .store import get_store

app = FastAPI(title="backend_rag")


@app.get("/health")
def health() -> dict:
    if not get_store().health():
        raise HTTPException(503, "elasticsearch unreachable")
    return {"ok": True}
```

(Other handlers in `main.py` are unchanged.)

- [ ] **Step 4.2: Verify**

Run: `python -c "import ast; ast.parse(open('backend_rag/app/main.py').read())"`
Expected: exit 0.

- [ ] **Step 4.3: Commit**

```bash
git add backend_rag/app/main.py
git commit -m "feat(backend): /health 503s when Elasticsearch is unreachable"
```

---

## Task 5: Backend unit tests

**Files:**
- Create: `backend_rag/pytest.ini`
- Create: `backend_rag/tests/__init__.py`
- Create: `backend_rag/tests/test_chunk.py`
- Create: `backend_rag/tests/test_search_helpers.py`
- Create: `backend_rag/tests/test_agent.py`

Pure-function tests, no live ES required.

- [ ] **Step 5.1: Create `pytest.ini`**

```ini
[pytest]
testpaths = tests
pythonpath = .
```

- [ ] **Step 5.2: Create `tests/__init__.py`**

(empty file)

- [ ] **Step 5.3: Create `tests/test_chunk.py`**

```python
from app.chunk import chunk_page


def test_chunk_empty_text_returns_no_chunks():
    assert chunk_page("", page=1) == []
    assert chunk_page("   ", page=1) == []


def test_chunk_short_text_single_chunk():
    chunks = chunk_page("Hello world. This is a test.", page=2)
    assert len(chunks) == 1
    assert chunks[0].page == 2
    assert "Hello world." in chunks[0].text


def test_chunk_window_and_overlap():
    text = "S1 ends. S2 ends. S3 ends. S4 ends. S5 ends."
    # window=3, overlap=1 → step=2 → starts at indices 0, 2, 4
    chunks = chunk_page(text, page=1, window=3, overlap=1)
    assert [c.text for c in chunks] == [
        "S1 ends. S2 ends. S3 ends.",
        "S3 ends. S4 ends. S5 ends.",
        "S5 ends.",
    ]


def test_chunk_context_before_after():
    text = "Filler word filler. Target sentence here. Trailing context after."
    chunks = chunk_page(text, page=1, window=1, overlap=0)
    target = next(c for c in chunks if "Target sentence" in c.text)
    assert "Filler" in target.context_before()
    assert "Trailing" in target.context_after()
```

- [ ] **Step 5.4: Create `tests/test_search_helpers.py`**

```python
from app.search import _build_refine_hint
from app.store import ChunkRecord


def _rec(doc_id: str, doc_name: str, folder: str) -> ChunkRecord:
    return ChunkRecord(
        id="x",
        doc_id=doc_id,
        doc_name=doc_name,
        folder=folder,
        page=1,
        text="t",
        context_before="",
        context_after="",
    )


def test_refine_hint_groups_by_folder_and_doc():
    records = [
        _rec("d1", "Doc One", "manuals"),
        _rec("d1", "Doc One", "manuals"),
        _rec("d2", "Doc Two", "manuals"),
        _rec("d3", "Doc Three", "specs"),
    ]
    hint = _build_refine_hint(total=4, records=records)
    assert hint.totalMatches == 4
    folders = [s for s in hint.suggestions if s.kind == "folder"]
    docs = [s for s in hint.suggestions if s.kind == "doc"]
    folder_names = {s.folder for s in folders}
    assert folder_names == {"manuals", "specs"}
    # "manuals" should appear before "specs" because it has more hits
    assert folders[0].folder == "manuals"
    doc_ids = {s.docId for s in docs}
    assert doc_ids == {"d1", "d2", "d3"}
    # d1 has 2 hits → ranks first
    assert docs[0].docId == "d1"
```

- [ ] **Step 5.5: Create `tests/test_agent.py`**

```python
from app.agent import _parse_json_array


def test_parse_json_array_clean():
    assert _parse_json_array('["A", "B"]') == ["A", "B"]


def test_parse_json_array_with_prose_around():
    out = "Sure, here's the array: [\"A\", \"B\"]\nLet me know if you want more."
    assert _parse_json_array(out) == ["A", "B"]


def test_parse_json_array_invalid_returns_empty():
    assert _parse_json_array("no array here") == []
    assert _parse_json_array("[not json]") == []


def test_parse_json_array_caps_at_three():
    assert _parse_json_array('["a","b","c","d","e"]') == ["a", "b", "c"]
```

- [ ] **Step 5.6: Run the tests**

```bash
cd backend_rag
python -m pytest -q
```

Expected: 11 tests pass (4 chunk + 1 refine + 4 agent + 2 free; numbers approximate). All green.

If `app.chunk` import fails because `pythonpath` didn't take effect, run instead from `backend_rag/`: `PYTHONPATH=. python -m pytest -q`.

- [ ] **Step 5.7: Commit**

```bash
git add backend_rag/pytest.ini backend_rag/tests
git commit -m "test(backend): unit tests for chunk, search, and agent helpers"
```

---

## Task 6: Frontend `/api/rag/reindex` route

**Files:**
- Create: `frontend_website/app/api/rag/reindex/route.ts`

Walks the local index and replays each doc to backend `/ingest`. No-op when `RAG_BACKEND_URL` is unset.

- [ ] **Step 6.1: Create the route**

```typescript
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getIndex } from "@/lib/rag/indexer";
import { notifyIngest } from "@/lib/rag/backend";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!process.env.RAG_BACKEND_URL) {
    return NextResponse.json({ error: "RAG_BACKEND_URL not set" }, { status: 400 });
  }

  const idx = await getIndex(user.id);
  const docs = Object.values(idx);
  let ok = 0;
  for (const doc of docs) {
    try {
      await notifyIngest(user.id, doc);
      ok++;
    } catch (err) {
      console.error("[reindex] failed for", doc.docId, err);
    }
  }
  return NextResponse.json({ total: docs.length, indexed: ok });
}
```

`notifyIngest` already swallows fetch errors and logs them, so the per-doc try/catch here is just belt-and-braces.

- [ ] **Step 6.2: Typecheck**

```bash
cd frontend_website
npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 6.3: Commit**

```bash
git add frontend_website/app/api/rag/reindex/route.ts
git commit -m "feat(frontend): POST /api/rag/reindex backfill route"
```

---

## Task 7: Update docs

**Files:**
- Modify: `frontend_website/plan/backend-progress.md`
- Modify: `backend_rag/README.md`

- [ ] **Step 7.1: Rewrite `backend_rag/README.md`**

```markdown
# backend_rag

FastAPI service that backs the `/api/rag/search` proxy in the frontend.

## Endpoints

- `GET /health` — pings Elasticsearch; returns 503 if unreachable.
- `POST /ingest` — frontend forwards parsed PDF pages here on upload.
  Body: `{ docId, folder, docName, pages: [{page, text}] }`, header `x-user-id`.
- `DELETE /documents/{docId}` — frontend forwards on doc removal. Header `x-user-id`.
- `POST /search` — body `{ query, scope?, mode?, depth? }`, header `x-user-id`.
  Returns `{ sessionId: "", quotes: [...], refine?, missing? }`.

The `Quote` shape mirrors `frontend_website/lib/rag/contract.ts`.

## Storage

Per-user Elasticsearch index `rag-<sanitized_user_id>` with both:
- `text` (BM25, `english` analyzer) — keyword mode
- `embedding` (dense_vector, cosine) — natural mode (kNN)

ES does both; we no longer keep an in-process BM25 index.

## Run

```bash
uv venv && source .venv/bin/activate
uv pip install -r requirements.txt
docker compose up -d elasticsearch
# Wait ~30s for ES to be ready, then:
curl -fsS http://localhost:9200/_cluster/health
uvicorn app.main:app --reload --port 8000
```

Then in the frontend `.env.local`: `RAG_BACKEND_URL=http://localhost:8000`.

If you have existing uploads (uploaded before the backend was wired), POST to
`/api/rag/reindex` from a logged-in session to backfill them into ES.

## Tests

```bash
python -m pytest -q
```

Unit tests don't need a live ES.
```

- [ ] **Step 7.2: Update `frontend_website/plan/backend-progress.md`**

Replace the file's "Architecture" diagram and "What's done > Backend" section. Architecture diagram replacement:

```
Browser
   │
   ▼
Next.js (frontend_website)
   ├── /api/rag/search ──────► backend_rag  POST /search
   ├── /api/rag/upload  ─────► backend_rag  POST /ingest
   ├── /api/rag/documents/X ─► backend_rag  DELETE /documents/X
   ├── /api/rag/reindex      ─► backend_rag  POST /ingest (replay all)
   ├── /api/rag/sessions/*    (always local)
   ├── /api/rag/documents     (always local — reads index.json)
   └── /api/rag/pdf/*         (always local — streams PDF bytes)

backend_rag (FastAPI)
   └── Elasticsearch per-user index (BM25 text + dense_vector kNN)
       Claude CLI subprocess (missing-doc agent)
```

In the "What's done > Backend" section, replace the bullet about Qdrant + BM25 with:
> - `app/store.py` — Elasticsearch wrapper. Per-user index `rag-<sanitized_user_id>` with `english` BM25 and `dense_vector` kNN. ES holds all chunk state.

In the TODO list, mark as done:
- ~~#1 Backfill ingest endpoint~~ — implemented as `POST /api/rag/reindex`.
- ~~#6 Backend startup health gate~~ — `/health` now 503s on ES outage.

Update "Last updated" to `2026-05-09`.

- [ ] **Step 7.3: Commit**

```bash
git add backend_rag/README.md frontend_website/plan/backend-progress.md
git commit -m "docs: switch to Elasticsearch and document reindex/health"
```

---

## Task 8: Final verification

- [ ] **Step 8.1: Frontend typecheck**

```bash
cd frontend_website
npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 8.2: Frontend unit tests**

```bash
cd frontend_website
npx vitest run
```

Expected: same count as before (the changes only add a route; no existing test should regress). 20/20 pass per the prior progress doc.

- [ ] **Step 8.3: Backend tests**

```bash
cd backend_rag
python -m pytest -q
```

Expected: all green.

- [ ] **Step 8.4: Static parse on every backend file**

```bash
cd backend_rag
python -c "import ast, pathlib; [ast.parse(p.read_text()) for p in pathlib.Path('app').rglob('*.py')]"
```

Expected: exit 0.

End-to-end ES smoke test (start docker compose, ingest, search keyword + natural + refine + missing) is **not** part of this plan — it requires the user to bring up the Elasticsearch container locally. Document the exact commands in the README so the user can run them after merge.

---

## Self-Review

**Spec coverage** — user asked: "build up the real backend. please use elastic search."
- Backend is rewired around ES (Tasks 1–4). ✓
- Both keyword (BM25) and natural (kNN) paths use ES. ✓
- TODO #1 (reindex) and TODO #6 (health gate) folded in so the backend is *actually* usable end-to-end, not just compiled. ✓
- Tests added so future changes don't silently regress (Task 5). ✓
- Docs reflect new reality (Task 7). ✓

**Placeholder scan** — no TBDs. Each step has either complete code or a verifiable command.

**Type consistency** — `Store.upsert` signature change (drop `doc_name`, `folder`) is reflected in Task 3. `Store.keyword_search` return-type change (now `(hits, total)`) is reflected in Task 3.

**Out of scope (intentionally):** bbox highlights (TODO #5), reranker latency tuning (#9), embed warm-up (#10), backend auth (#11), session-stored hints (#13). End-to-end smoke test deferred per Task 8 note.

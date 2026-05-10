"""Retrieval algorithm.

Modes:
  - keyword  — BM25 only. >REFINE_THRESHOLD hits → top-N + refine hint.
  - natural  — vector kNN, optional CrossEncoder rerank in `accurate`.
  - hybrid   — BM25 ⊕ vector via Reciprocal Rank Fusion, optional rerank.

Cross-cutting:
  - Heuristic query rewrite always runs (drops filler, appends KB vocab).
  - On weak retrieval (top score < RETRIEVAL_FLOOR), tries one LLM rewrite.
  - Score-floor refusal: if still weak, returns missing-doc hint instead of
    confident-looking nonsense.
"""
from __future__ import annotations

import math
import uuid
from collections import Counter
from typing import List, Optional, Tuple

from .agent import suggest_missing_docs
from .chunk import chunk_page
from .config import (
    LLM_REWRITE_ENABLED,
    REFINE_THRESHOLD,
    RETRIEVAL_FLOOR,
    RRF_K,
    TOP_K_RETURN,
    TOP_K_VECTOR,
)
from .embed import embed_query, embed_texts, rerank
from .query_rewrite import heuristic_rewrite, llm_rewrite
from .schemas import (
    IngestRequest,
    MissingHint,
    Quote,
    RefineHint,
    RefineSuggestion,
    SearchRequest,
)
from .store import ChunkRecord, get_store, new_chunk_id


# -- ingest / delete ----------------------------------------------------------

def ingest_document(user_id: str, req: IngestRequest) -> None:
    store = get_store()
    records: List[ChunkRecord] = []
    texts: List[str] = []
    for pg in req.pages:
        for ch in chunk_page(pg.text, pg.page):
            rec = ChunkRecord(
                id=new_chunk_id(),
                doc_id=req.docId,
                doc_name=req.docName,
                folder=req.folder,
                page=ch.page,
                text=ch.text,
                context_before=ch.context_before(),
                context_after=ch.context_after(),
            )
            records.append(rec)
            texts.append(ch.text)
    if not records:
        return
    vectors = embed_texts(texts).tolist()
    store.upsert(
        user_id=user_id,
        records=records,
        vectors=vectors,
        doc_id=req.docId,
    )


def delete_document(user_id: str, doc_id: str) -> None:
    get_store().delete_doc(user_id, doc_id)


# -- search -------------------------------------------------------------------

def run_search(
    user_id: str, req: SearchRequest
) -> Tuple[List[Quote], Optional[RefineHint], Optional[MissingHint]]:
    folders = req.scope.folders if req.scope else None
    docs = req.scope.docIds if req.scope else None
    accurate = req.depth == "accurate"

    if req.mode == "keyword":
        return _keyword_path(user_id, req.query, folders, docs)
    if req.mode == "hybrid":
        return _hybrid_path(user_id, req.query, folders, docs, accurate)
    return _natural_path(user_id, req.query, folders, docs, accurate)


# -- keyword path -------------------------------------------------------------

def _keyword_path(
    user_id: str, query: str, folders, docs
) -> Tuple[List[Quote], Optional[RefineHint], Optional[MissingHint]]:
    store = get_store()
    rewritten = heuristic_rewrite(query, _vocab_for(user_id))
    matches, total = store.keyword_search(
        user_id, rewritten, folders, docs, size=TOP_K_RETURN
    )
    if total == 0:
        # Fall through to natural so the user still gets *something*.
        return _natural_path(user_id, query, folders, docs, accurate=False)
    quotes = [_to_quote(c, s) for c, s in matches]
    if total > REFINE_THRESHOLD:
        refine = _build_refine_hint(total=total, records=[m[0] for m in matches])
        return quotes, refine, None
    return quotes, None, None


# -- natural path -------------------------------------------------------------

def _natural_path(
    user_id: str, query: str, folders, docs, accurate: bool
) -> Tuple[List[Quote], Optional[RefineHint], Optional[MissingHint]]:
    store = get_store()
    vocab = _vocab_for(user_id)
    rewritten = heuristic_rewrite(query, vocab)

    quotes, conf = _vector_retrieve(store, user_id, rewritten, folders, docs, accurate)

    if conf < RETRIEVAL_FLOOR and LLM_REWRITE_ENABLED:
        better = llm_rewrite(query, vocab)
        if better and better.strip().lower() != rewritten.strip().lower():
            q2, c2 = _vector_retrieve(store, user_id, better, folders, docs, accurate)
            if c2 > conf:
                quotes, conf = q2, c2

    if not quotes or conf < RETRIEVAL_FLOOR:
        return _missing_response(user_id, query)
    return quotes, None, None


def _vector_retrieve(
    store, user_id: str, query: str, folders, docs, accurate: bool
) -> Tuple[List[Quote], float]:
    qvec = embed_query(query)
    hits = store.vector_search(user_id, qvec, folders, docs, limit=TOP_K_VECTOR)
    if not hits:
        return [], 0.0
    if accurate and len(hits) > 1:
        scores = rerank(query, [h[0].text for h in hits])
        ranked = sorted(zip(hits, scores), key=lambda x: -x[1])
        quotes = [
            _to_quote(rec, _sigmoid(float(s)))
            for ((rec, _), s) in ranked[:TOP_K_RETURN]
        ]
    else:
        quotes = [_to_quote(rec, score) for rec, score in hits[:TOP_K_RETURN]]
    return quotes, quotes[0].score if quotes else 0.0


# -- hybrid path --------------------------------------------------------------

def _hybrid_path(
    user_id: str, query: str, folders, docs, accurate: bool
) -> Tuple[List[Quote], Optional[RefineHint], Optional[MissingHint]]:
    store = get_store()
    vocab = _vocab_for(user_id)
    rewritten = heuristic_rewrite(query, vocab)

    quotes, conf = _hybrid_retrieve(store, user_id, rewritten, folders, docs, accurate)

    if conf < RETRIEVAL_FLOOR and LLM_REWRITE_ENABLED:
        better = llm_rewrite(query, vocab)
        if better and better.strip().lower() != rewritten.strip().lower():
            q2, c2 = _hybrid_retrieve(store, user_id, better, folders, docs, accurate)
            if c2 > conf:
                quotes, conf = q2, c2

    if not quotes or conf < RETRIEVAL_FLOOR:
        return _missing_response(user_id, query)
    return quotes, None, None


def _hybrid_retrieve(
    store, user_id: str, query: str, folders, docs, accurate: bool
) -> Tuple[List[Quote], float]:
    """RRF over BM25 ⊕ vector. Confidence comes from the rerank stage when
    accurate, else from the underlying vector top-1 cosine — the RRF score
    itself isn't on a meaningful semantic scale.
    """
    keyword_hits, _total = store.keyword_search(
        user_id, query, folders, docs, size=TOP_K_VECTOR,
    )
    qvec = embed_query(query)
    vector_hits = store.vector_search(
        user_id, qvec, folders, docs, limit=TOP_K_VECTOR,
    )
    fused = _rrf_fuse(keyword_hits, vector_hits, k=RRF_K)
    if not fused:
        return [], 0.0

    confidence = vector_hits[0][1] if vector_hits else 0.0

    if accurate and len(fused) > 1:
        head = fused[: min(TOP_K_VECTOR, len(fused))]
        scores = rerank(query, [rec.text for rec, _ in head])
        ranked = sorted(zip(head, scores), key=lambda x: -x[1])
        quotes = [
            _to_quote(rec, _sigmoid(float(s)))
            for ((rec, _), s) in ranked[:TOP_K_RETURN]
        ]
        if quotes:
            confidence = quotes[0].score
    else:
        quotes = [_to_quote(rec, _hybrid_display_score(rec, vector_hits))
                  for rec, _ in fused[:TOP_K_RETURN]]

    return quotes, confidence


def _rrf_fuse(
    keyword_hits: List[Tuple[ChunkRecord, float]],
    vector_hits: List[Tuple[ChunkRecord, float]],
    k: int = 60,
) -> List[Tuple[ChunkRecord, float]]:
    """Reciprocal Rank Fusion. Returns (record, fused_score) sorted desc."""
    fused: dict = {}    # id -> [record, score]
    for rank, (rec, _) in enumerate(keyword_hits, start=1):
        slot = fused.setdefault(rec.id, [rec, 0.0])
        slot[1] += 1.0 / (k + rank)
    for rank, (rec, _) in enumerate(vector_hits, start=1):
        slot = fused.setdefault(rec.id, [rec, 0.0])
        slot[1] += 1.0 / (k + rank)
    out = sorted(fused.values(), key=lambda x: -x[1])
    return [(rec, score) for rec, score in out]


def _hybrid_display_score(rec: ChunkRecord, vector_hits: List[Tuple[ChunkRecord, float]]) -> float:
    """For non-accurate hybrid, surface the vector cosine when known. RRF
    raw scores (~0.03) are noisy on the user-visible end."""
    for v_rec, v_score in vector_hits:
        if v_rec.id == rec.id:
            return float(v_score)
    return 0.0


# -- helpers ------------------------------------------------------------------

def _missing_response(user_id: str, query: str):
    docs = get_store().docs(user_id)
    suggestions = suggest_missing_docs(query, docs)
    if not suggestions:
        return [], None, None
    return [], None, MissingHint(suggestions=suggestions)


def _vocab_for(user_id: str) -> List[str]:
    docs = get_store().docs(user_id)
    out: List[str] = []
    seen = set()
    for name, folder in docs.values():
        for v in (name, folder):
            if v and v not in seen:
                seen.add(v)
                out.append(v)
    return out


def _to_quote(c: ChunkRecord, score: float) -> Quote:
    return Quote(
        id="q_" + uuid.uuid4().hex[:12],
        text=c.text,
        docId=c.doc_id,
        docName=c.doc_name,
        folder=c.folder,
        page=c.page,
        contextBefore=c.context_before,
        contextAfter=c.context_after,
        score=score,
    )


def _build_refine_hint(total: int, records: List[ChunkRecord]) -> RefineHint:
    folder_counts = Counter(r.folder for r in records)
    doc_counts = Counter((r.doc_id, r.doc_name) for r in records)

    suggestions: List[RefineSuggestion] = []
    for folder, n in folder_counts.most_common(4):
        suggestions.append(
            RefineSuggestion(kind="folder", label=f"{folder} ({n})", folder=folder)
        )
    for (doc_id, doc_name), n in doc_counts.most_common(4):
        suggestions.append(
            RefineSuggestion(kind="doc", label=f"{doc_name} ({n})", docId=doc_id)
        )
    return RefineHint(totalMatches=total, suggestions=suggestions)


def _sigmoid(x: float) -> float:
    if x >= 0:
        z = math.exp(-x)
        return 1.0 / (1.0 + z)
    z = math.exp(x)
    return z / (1.0 + z)

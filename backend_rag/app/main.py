from fastapi import FastAPI, Header, HTTPException

from .answer import synthesize_answer
from .schemas import (
    AnswerRequest,
    AnswerResponse,
    IngestRequest,
    SearchRequest,
    SearchResponse,
)
from .search import ingest_document, delete_document, run_search
from .store import get_store

app = FastAPI(title="backend_rag")


@app.get("/health")
def health() -> dict:
    if not get_store().health():
        raise HTTPException(503, "elasticsearch unreachable")
    return {"ok": True}


@app.post("/ingest")
def ingest(req: IngestRequest, x_user_id: str = Header(..., alias="x-user-id")) -> dict:
    if not x_user_id:
        raise HTTPException(401, "missing x-user-id")
    ingest_document(user_id=x_user_id, req=req)
    return {"ok": True}


@app.delete("/documents/{doc_id}")
def delete_doc(doc_id: str, x_user_id: str = Header(..., alias="x-user-id")) -> dict:
    if not x_user_id:
        raise HTTPException(401, "missing x-user-id")
    delete_document(user_id=x_user_id, doc_id=doc_id)
    return {"ok": True}


@app.get("/documents")
def list_documents(x_user_id: str = Header(..., alias="x-user-id")) -> dict:
    """Returns docIds present in this user's ES index. Used by the frontend
    /api/rag/reindex route to compute the diff and only replay missing docs."""
    if not x_user_id:
        raise HTTPException(401, "missing x-user-id")
    return {"docIds": list(get_store().docs(x_user_id).keys())}


@app.post("/search", response_model=SearchResponse)
def search(req: SearchRequest, x_user_id: str = Header(..., alias="x-user-id")) -> SearchResponse:
    if not x_user_id:
        raise HTTPException(401, "missing x-user-id")
    quotes, refine, missing = run_search(user_id=x_user_id, req=req)
    return SearchResponse(sessionId="", quotes=quotes, refine=refine, missing=missing)


@app.post("/answer", response_model=AnswerResponse)
def answer(req: AnswerRequest, x_user_id: str = Header(..., alias="x-user-id")) -> AnswerResponse:
    if not x_user_id:
        raise HTTPException(401, "missing x-user-id")
    search_req = SearchRequest(
        query=req.query, scope=req.scope, mode="hybrid", depth=req.depth,
    )
    quotes, _refine, missing = run_search(user_id=x_user_id, req=search_req)
    result = synthesize_answer(req.query, quotes)
    return AnswerResponse(
        text=result.text,
        refused=result.refused,
        citedPages=result.cited_pages,
        quotes=quotes,
        missing=missing,
    )

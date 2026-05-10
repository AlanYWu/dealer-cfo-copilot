from typing import List, Literal, Optional, Tuple
from pydantic import BaseModel, Field


class IngestPage(BaseModel):
    page: int
    text: str


class IngestRequest(BaseModel):
    docId: str
    folder: str
    docName: str
    pages: List[IngestPage]


class Scope(BaseModel):
    folders: Optional[List[str]] = None
    docIds: Optional[List[str]] = None


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    scope: Optional[Scope] = None
    mode: Literal["keyword", "natural", "hybrid"] = "natural"
    depth: Literal["fast", "accurate"] = "fast"


class Quote(BaseModel):
    id: str
    text: str
    docId: str
    docName: str
    folder: str
    page: int
    bbox: Optional[Tuple[float, float, float, float]] = None
    contextBefore: str
    contextAfter: str
    score: float


class RefineSuggestion(BaseModel):
    kind: Literal["folder", "doc"]
    label: str
    folder: Optional[str] = None
    docId: Optional[str] = None


class RefineHint(BaseModel):
    totalMatches: int
    suggestions: List[RefineSuggestion]


class MissingHint(BaseModel):
    suggestions: List[str]


class SearchResponse(BaseModel):
    sessionId: str = ""
    quotes: List[Quote]
    refine: Optional[RefineHint] = None
    missing: Optional[MissingHint] = None


class AnswerRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    scope: Optional[Scope] = None
    depth: Literal["fast", "accurate"] = "accurate"


class AnswerResponse(BaseModel):
    text: str
    refused: bool
    citedPages: List[int]
    quotes: List[Quote]
    missing: Optional[MissingHint] = None

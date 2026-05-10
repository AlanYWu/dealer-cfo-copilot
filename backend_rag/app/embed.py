"""Lazy-loaded embedding + reranker singletons."""
from functools import lru_cache
from typing import List

import numpy as np

from .config import EMBED_MODEL, RERANK_MODEL


@lru_cache(maxsize=1)
def _embedder():
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(EMBED_MODEL)


@lru_cache(maxsize=1)
def _reranker():
    from sentence_transformers import CrossEncoder

    return CrossEncoder(RERANK_MODEL)


def embed_texts(texts: List[str]) -> np.ndarray:
    model = _embedder()
    return model.encode(texts, normalize_embeddings=True, convert_to_numpy=True)


def embed_query(text: str) -> List[float]:
    return embed_texts([text])[0].tolist()


def embed_dim() -> int:
    return _embedder().get_sentence_embedding_dimension()


def rerank(query: str, passages: List[str]) -> List[float]:
    if not passages:
        return []
    pairs = [(query, p) for p in passages]
    scores = _reranker().predict(pairs)
    return [float(s) for s in scores]

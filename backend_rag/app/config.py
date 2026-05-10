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

# Floor on top-1 confidence. Below this the search refuses (returns
# missing-doc hint) and the answer endpoint returns a refusal message.
# Applied to: post-rerank sigmoid score when reranker ran, else vector cosine.
RETRIEVAL_FLOOR = float(env("RETRIEVAL_FLOOR", "0.30"))

# Reciprocal Rank Fusion constant for hybrid mode (Cormack et al. 2009).
RRF_K = int(env("RRF_K", "60"))

# BM25F-style multi-field weights. Multi-field requires .text subfields on
# docName and folder, which new indices get; older indices fall back to text.
BM25_FIELD_BOOST_TEXT = float(env("BM25_FIELD_BOOST_TEXT", "1.0"))
BM25_FIELD_BOOST_DOCNAME = float(env("BM25_FIELD_BOOST_DOCNAME", "2.0"))
BM25_FIELD_BOOST_FOLDER = float(env("BM25_FIELD_BOOST_FOLDER", "1.0"))
BM25_MIN_SHOULD_MATCH = env("BM25_MIN_SHOULD_MATCH", "75%")

# When True, /search and /answer may shell out to the claude CLI for an
# LLM query rewrite if the heuristic-rewritten retrieval is below the floor.
LLM_REWRITE_ENABLED = env("LLM_REWRITE_ENABLED", "1") not in ("0", "false", "False", "")

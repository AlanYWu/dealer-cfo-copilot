"""Pre-retrieval query rewriting.

Two stages, both optional:
  1. heuristic_rewrite — always cheap to run. Drops filler words and appends
     KB vocab tokens (doc names / folders) that fuzzy-match the query.
  2. llm_rewrite — Claude CLI fallback. Used only when the first retrieval's
     top score is below RETRIEVAL_FLOOR. Returns None on any failure so the
     caller can fall through to a plain refusal.
"""
from __future__ import annotations

import re
import shutil
import subprocess
from typing import Iterable, List, Optional

from .config import CLAUDE_CLI


_FILLER = {
    "a", "an", "the", "is", "are", "was", "were", "be", "being", "been",
    "of", "to", "in", "on", "for", "with", "by", "and", "or", "but", "as",
    "what", "which", "who", "whom", "whose", "where", "when", "why", "how",
    "do", "does", "did", "doing", "have", "has", "had", "having",
    "i", "you", "we", "they", "he", "she", "it", "this", "that", "these", "those",
    "can", "could", "should", "would", "may", "might", "will", "shall",
    "please", "tell", "me", "us", "explain", "describe", "list", "show",
    "about", "from", "into", "than", "then", "so", "if",
}
_TOKEN_RE = re.compile(r"[A-Za-z0-9][A-Za-z0-9\-_/\.']*")


def _tokens(text: str) -> List[str]:
    return [t.lower() for t in _TOKEN_RE.findall(text)]


def heuristic_rewrite(query: str, vocab: Iterable[str] = ()) -> str:
    """Expand the query with KB vocab matches; preserve original phrasing.

    The original query stays intact (the embedder keeps full semantics);
    we only append extra terms after a separator. Returns the original
    query unchanged if no expansion applies.
    """
    raw = query.strip()
    if not raw:
        return raw
    q_tokens = [t for t in _tokens(raw) if t not in _FILLER and len(t) > 1]
    if not q_tokens:
        return raw

    extras: List[str] = []
    seen = set(q_tokens)
    for v in vocab:
        v_low = v.strip().lower()
        if not v_low or v_low in seen:
            continue
        for tok in q_tokens:
            if len(tok) >= 4 and (tok in v_low or v_low in tok):
                extras.append(v_low)
                seen.add(v_low)
                break

    if not extras:
        return raw
    return f"{raw} {' '.join(extras)}"


_LLM_PROMPT = """You are rewriting a search query for a private PDF knowledge base.

Original user query: {query}

Knowledge base contains documents like:
{vocab}

Rewrite the query as a single short sentence (10-20 words) that includes the
likely domain terms. Reply with ONLY the rewritten query on one line, no quotes,
no prose, no code fences."""


def llm_rewrite(query: str, vocab: Iterable[str]) -> Optional[str]:
    """Best-effort LLM rewrite via the claude CLI. Returns None on failure."""
    if shutil.which(CLAUDE_CLI) is None:
        return None
    listing = "\n".join(f"- {v}" for v in list(vocab)[:30]) or "(empty)"
    prompt = _LLM_PROMPT.format(query=query, vocab=listing)
    try:
        proc = subprocess.run(
            [CLAUDE_CLI, "-p", prompt],
            capture_output=True,
            text=True,
            timeout=30,
        )
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return None
    if proc.returncode != 0:
        return None
    return _first_nonempty_line(proc.stdout)


def _first_nonempty_line(out: str) -> Optional[str]:
    for line in out.splitlines():
        s = line.strip().strip('"').strip("'")
        if s:
            return s
    return None

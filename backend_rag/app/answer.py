"""LLM answer synthesis over /search quotes.

Shells out to the Claude CLI (no API key) to match agent.py's pattern.
Mirrors bp/answer.py's contract: verbatim quote, [p. N] citations, refusal
when no quote clears RETRIEVAL_FLOOR.
"""
from __future__ import annotations

import re
import shutil
import subprocess
from dataclasses import dataclass, field
from typing import List, Optional

from .config import CLAUDE_CLI, RETRIEVAL_FLOOR
from .schemas import Quote


SYSTEM_PROMPT = """You are a knowledge-base assistant. You answer questions about the user's private PDF library using ONLY the passages provided in the context.

Rules, in order of importance:
1. If the provided context does NOT contain a clear answer to the user's question, respond with exactly: "I can't find this in the knowledge base with high confidence." Then list the candidate pages you examined. Do not guess. Do not use prior knowledge.
2. When you do answer, quote the relevant passage VERBATIM (inside quotation marks) before explaining.
3. Always cite the source using the format [p. N]. If multiple pages are relevant, cite each.
4. Keep the explanation under 80 words. The quote is the product; your explanation is scaffolding.
5. Never invent numbers, dates, or named entities not present in the context.
"""

USER_TEMPLATE = """User question: {query}

Context from the knowledge base:

{context_block}

Answer the user's question per the rules. Remember: if the context does not clearly answer, refuse."""

REFUSAL_MARKER = "I can't find this in the knowledge base with high confidence"


@dataclass(frozen=True)
class AnswerResult:
    text: str
    refused: bool
    cited_pages: List[int] = field(default_factory=list)
    quotes_used: List[str] = field(default_factory=list)


def _build_context_block(quotes: List[Quote]) -> str:
    parts = []
    for q in quotes:
        header = f"[p. {q.page}] {q.docName}"
        if q.folder:
            header += f" ({q.folder})"
        parts.append(f"--- {header} ---\n{q.text}")
    return "\n\n".join(parts)


def _extract_cited_pages(text: str) -> List[int]:
    return sorted({int(m) for m in re.findall(r"\[p\.\s*(\d+)\]", text)})


def _call_claude_cli(prompt: str) -> Optional[str]:
    if shutil.which(CLAUDE_CLI) is None:
        return None
    try:
        proc = subprocess.run(
            [CLAUDE_CLI, "-p", prompt],
            capture_output=True,
            text=True,
            timeout=120,
        )
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return None
    if proc.returncode != 0:
        return None
    return proc.stdout.strip() or None


def synthesize_answer(query: str, quotes: List[Quote]) -> AnswerResult:
    """Generate a quoted answer from search quotes, or refuse pre-LLM.

    Refusal comes first: if no quote passes RETRIEVAL_FLOOR we never call
    the model. This matches bp/answer.py's guardrail.
    """
    usable = [q for q in quotes if q.score >= RETRIEVAL_FLOOR]
    if not usable:
        candidate_pages = sorted({q.page for q in quotes})
        suffix = (
            f"Closest candidate pages: {candidate_pages}."
            if candidate_pages else "No close matches were retrieved."
        )
        return AnswerResult(
            text=f"{REFUSAL_MARKER}. {suffix}",
            refused=True,
        )

    prompt = SYSTEM_PROMPT + "\n" + USER_TEMPLATE.format(
        query=query, context_block=_build_context_block(usable),
    )
    text = _call_claude_cli(prompt)
    if text is None:
        return AnswerResult(
            text="(LLM unavailable. See returned quotes for the source passages.)",
            refused=True,
        )
    refused = REFUSAL_MARKER.lower() in text.lower()
    return AnswerResult(
        text=text,
        refused=refused,
        cited_pages=_extract_cited_pages(text),
        quotes_used=[q.id for q in usable],
    )

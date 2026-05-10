"""Missing-doc agent: shells out to the Claude CLI (no API key)."""
import json
import re
import shutil
import subprocess
from typing import Dict, List, Tuple

from .config import CLAUDE_CLI


_PROMPT = """The user is searching their private PDF knowledge base and got zero results.

Query: {query}

The knowledge base currently contains these documents (folder / filename):
{doc_list}

Suggest 1-3 short titles of documents the user could add to their knowledge base
that would likely contain the answer. Reply with ONLY a JSON array of strings,
no prose, no code fences.
Example: ["2024 Silverado Owner's Manual", "Ford F-150 Towing Capacity Spec Sheet"]
"""


def suggest_missing_docs(query: str, docs: Dict[str, Tuple[str, str]]) -> List[str]:
    if shutil.which(CLAUDE_CLI) is None:
        return []
    listing = "\n".join(f"- {folder} / {name}" for name, folder in docs.values()) or "(empty)"
    prompt = _PROMPT.format(query=query, doc_list=listing)
    try:
        proc = subprocess.run(
            [CLAUDE_CLI, "-p", prompt],
            capture_output=True,
            text=True,
            timeout=45,
        )
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return []
    if proc.returncode != 0:
        return []
    return _parse_json_array(proc.stdout)


def _parse_json_array(out: str) -> List[str]:
    match = re.search(r"\[[^\[\]]*\]", out, flags=re.DOTALL)
    if not match:
        return []
    try:
        data = json.loads(match.group(0))
    except json.JSONDecodeError:
        return []
    return [str(x) for x in data if isinstance(x, (str, int, float))][:3]

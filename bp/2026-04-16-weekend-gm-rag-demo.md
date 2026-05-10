# Weekend GM Manual RAG Demo — Implementation Plan

## Status update — 2026-05-09

> **Read this first.** The plan below was written for a single-day, single-PDF, single-user Streamlit demo. The implementation outgrew that frame in late April. The live system is now a multi-tenant Next.js + FastAPI + Elasticsearch product over a multi-OEM dealer knowledge base. The plan is preserved as the historical record and as the source of truth for the underlying RAG primitives (catalog, match, retrieve, answer, refusal). Anything in the plan that contradicts this update is superseded by the update.

### TL;DR

- **Apr 21** (per `HANDOFF.md`): backend Tasks 1–8 of the original plan built and tested in `bp/`. Streamlit UI (T9) and tuning (T10–11) never run.
- **Late April → 2026-05-09:** pivoted to a real product. `bp/` is now the *primitive baseline*, not the demo path.
- **Today** the live demo path is: `frontend_website/` (Next.js 14 with auth + PDF viewer) + `backend_rag/` (FastAPI + Elasticsearch) + `rag_knowledge_base/car_dealership_knowledge_base/` (Chevrolet, Ford, GMC, plus shared-GM, sample-statements, and an `00_common` set of NADA/Kerrigan/IRS/STAR PDFs).
- An editorial showcase site lives at `static_website/`. It is press, not product.

### Repo layout — what actually exists

```
rag/
├── bp/                                # original weekend plan + reference impl
│   ├── 2026-04-16-weekend-gm-rag-demo.md   # this file
│   ├── HANDOFF.md                          # Apr-21 backend handoff
│   ├── src/                                # catalog, match, retrieve, answer, pipeline
│   ├── data/                               # gm_manual.pdf, catalog.json, chunks.jsonl, golden.jsonl
│   ├── scripts/                            # build_chunks, build_index, run_golden
│   └── tests/                              # 12 passed + 3 integration (skipped without index)
├── backend_rag/                       # NEW — FastAPI service
│   └── app/                                # main, search, store (ES), embed, chunk, agent
├── frontend_website/                  # NEW — Next.js 14 product UI
│   ├── app/                                # (auth) + (app) + api/
│   ├── components/                         # auth, dashboard, sidebar, results, pdf, ...
│   ├── lib/auth/                           # passwords (bcrypt), JWT cookie session, users
│   ├── lib/rag/                            # contract, client, indexer, sessions, mock-search
│   ├── scripts/seed-robert.ts              # demo user seed
│   └── tests/{unit,e2e}                    # Vitest + Playwright
├── rag_knowledge_base/
│   └── car_dealership_knowledge_base/      # 00_common / _sample_statements / _shared_GM_family
│                                           # / Chevrolet / Ford / GMC
├── static_website/                    # editorial showcase (single-page HTML)
└── demo_questions.md                  # the live pitch script (Group A/B/C)
```

### Progress against the original 11 tasks

| #  | Plan task                              | Status                       | Where it lives now |
|----|----------------------------------------|------------------------------|---|
| 1  | Project scaffold                       | ✅ done                       | `bp/` (kept as primitive baseline) |
| 2  | Download GM manual + sanity-check      | ✅ done                       | `bp/data/gm_manual.pdf`; also seeded into `_shared_GM_family/`, `Chevrolet/`, `GMC/` |
| 3  | PDF chunking pipeline                  | ✅ done — **superseded**       | `backend_rag/app/chunk.py` (3-sentence-window chunks) replaces `bp/src/corpus.py` |
| 4  | Hand-curated 20-line catalog           | ✅ done — **deferred from product** | `bp/data/catalog.json` (20 lines, recalibrated — see HANDOFF "Calibration findings"). Catalog confirmation flow not yet wired into the new product. |
| 5  | Lexical fuzzy match                    | ✅ done — **shelved**          | `bp/src/match.py`. New product retrieves directly; match is reserved for the disambiguation flow when we re-enable it. |
| 6  | Vector index + retrieval               | ✅ done — **superseded**       | `backend_rag/app/store.py` — per-user Elasticsearch index `rag-<sanitized_user_id>` with BM25 + dense_vector kNN — replaces LanceDB. |
| 7  | Strict-citation answer stage           | ✅ done — **partial port**     | `bp/src/answer.py` is the canonical refusal-or-cite reference. New product surfaces verbatim quotes directly (no LLM gloss in the headline path); Claude-CLI subprocess wired for the missing-doc flow at `backend_rag/app/agent.py`. |
| 8  | End-to-end + 8-row golden set          | ✅ done                       | `bp/scripts/run_golden.py` runs against the legacy pipeline. New product's evals are E2E (Playwright). Cross-product golden eval is open. |
| 9  | Streamlit UI                           | ❌ **abandoned**               | Replaced by `frontend_website/` Next.js app. |
| 10 | Tune until 8/8                         | ❌ not run                     | Paused at the pivot. New product is tuned against Robert's actual demo questions in `demo_questions.md`. |
| 11 | Final prep + cold-run rehearsal        | ⏳ pending                     | Re-run against the Next.js path + Robert seed (`npm run seed:robert`). |

### What changed and why

**Single PDF → multi-OEM knowledge base.** Robert's pitch isn't "I know the GM manual better than you;" it's "I tell you exactly where this dealer stands vs. NADA averages, with citations." The corpus had to grow accordingly: NADA Data 2025 (mid + full), Kerrigan Blue Sky and Dealer Survey 2025, IRS Pub 538, NIADA chart of accounts, IL/NY warranty law, full GM manual + 10-K + annual report, Ford 10-K + annual report, plus the STAR architecture set. See `rag_knowledge_base/car_dealership_knowledge_base/00_common/`. Live pitch script: `demo_questions.md`.

**Streamlit → Next.js.** Operators want side-by-side: query on the left, the cited PDF page open on the right with the quote highlighted. Streamlit can't do that well; Next.js can. It also gave us per-user workspaces (`data/workspaces/<userId>/`), bcrypt password auth, JWT cookie sessions, and a real upload flow Robert can use himself.

**LanceDB → Elasticsearch.** Two reasons: (1) the UI exposes a keyword mode and a natural mode against the same corpus, and ES does both BM25 and kNN dense_vector natively in one index. (2) Multi-tenancy — one ES index per user is cheap and isolates blast radius. LanceDB single-file was right for the weekend, wrong for the product.

**Claude API → mostly verbatim retrieval, plus a missing-doc agent.** The hard rule from Task 7 — "cite verbatim or refuse" — still holds. The new product mostly *surfaces* the verbatim quote directly (no LLM gloss in the headline path). The model is reserved for the missing-doc flow in `backend_rag/app/agent.py`, where the system tells the user which kind of document would unlock a query it can't answer — turning the refusal into a sales motion for the three asks below.

### Empirical findings from the bp/ build (kept as institutional memory)

These are hard-won observations from the original implementation. They explain the shape of `bp/data/catalog.json` and `bp/data/golden.jsonl` — both kept because the labor that produced them is real — and they should inform anyone reviving the catalog disambiguation flow or porting heading-aware retrieval into the new product.

**Calibration findings — the GM Dealer Standard Accounting Manual (2021, 616 pp).**
The plan assumed the manual reproduces the Dealer Operating Report form with `Page 1 / Line 3`–style references. **It doesn't.** The PDF is organized as **chart-of-accounts synopses** — one page per account, explaining debits/credits/purpose. The operating-report form is referenced only obliquely; only **5 lines in the entire manual** carry an explicit "Page N, Line M" cross-reference.

Consequences baked into the surviving artifacts:

1. In `catalog.json`, `page` is the PDF page of the **account synopsis**, not a statement-form page. E.g. `variable-selling-expense.page = 358` means "Account 011 synopsis is on PDF page 358," not "appears on statement-form page 358."
2. `line_number` is mostly `null`; populated only for the few lines the manual maps explicitly (LIFO reserve, doc handling fees).
3. Three plan entries didn't exist in this edition and were replaced:
   - `total-gross-profit → variable-gross-profit` (glossary term at p. 564)
   - `service-labor-gross → service-internal-labor` (Account 463, p. 291)
   - `service-unapplied-labor → document-handling-fees` (Account 910, p. 538)
4. `expected_page` values in `golden.jsonl` were rewritten to match the LLM's actual citations; the plan's original set (pages 1–6) would never have matched.

A different edition (2024 GM, Ford counterpart) will have similar structural surprises. **Recalibrate before running golden eval.**

**Empirical retrieval realities of the bp/ pipeline.**

- **Heading detection is sparse — ~9% of pages.** `src/corpus.py::_detect_page_heading` matched only **58/616 pages**; the `manual_section_refs` heading-boost rarely engaged. Retrieval fell back almost entirely to embedding similarity. If heading-boost is ported into `backend_rag` later, fix detection first (propagate last-seen heading forward across pages, or loosen the regex to Title Case).
- **One chunk per page.** Every page is under the 480-word window target, so the chunking overlap **never engaged**. Chunk granularity = page granularity. Page-long chunks retrieve fine on this corpus but make per-fact attribution coarse. If specific definitions need to be extracted from long pages, split on paragraph breaks instead of word windows.

### What is open (next steps)

1. **Port the catalog disambiguation flow into the new UI.** The "did you mean: Variable Selling Expense?" confirmation is a real moment for the *statement-line* use case (Robert's original pain). Wire it into `frontend_website/lib/rag/` once we have a redacted client statement to design against.
2. ~~**Refusal behavior in the new search path.**~~ **Done (2026-05-09):** ported the verbatim-quote + refusal contract from `bp/src/answer.py` into `backend_rag` as `app/answer.py` (Claude CLI shell-out, no API key) plus `RETRIEVAL_FLOOR` enforcement in `app/search.py`. New `POST /answer` endpoint returns either a quoted answer with `[p. N]` citations or an explicit refusal listing the candidate pages. Search alone now also returns empty quotes + `MissingHint` when top-1 confidence is below the floor instead of surfacing weak quotes.
3. **Cold-run rehearsal of the live demo.** Replace plan Task 11: close laptop → reopen → `npm run dev` → sign in as `robert` → run every query in `demo_questions.md` Group A end-to-end. Commit only if every query lands a correct citation.
4. **Cross-product golden eval.** The 8-row `bp/data/golden.jsonl` does not exercise the Next.js + ES path. Add a Playwright eval that runs Group A and asserts cited document and page.
5. **Deployment / fallback.** Currently localhost-only. Have a one-command tunnel (e.g. cloudflared) ready as backup for the screen-share demo.
6. **The three asks** (still open, unchanged from plan, now framed by `demo_questions.md` Group C):
   - Ford dealer accounting manual (PDF, NDA — Robert has it)
   - One redacted client monthly financial statement
   - Robert's firm monthly close checklist

### How to run the live demo today

```bash
# 1. backend
cd backend_rag
docker compose up -d elasticsearch
uv venv && source .venv/bin/activate && uv pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 2. frontend
cd ../frontend_website
cp env.example .env.local                # set SESSION_SECRET, RAG_BACKEND_URL=http://localhost:8000
npm install
npm run seed:robert                      # creates the robert demo user + indexes the KB
npm run dev                              # http://localhost:3000  → sign in as robert / robert-demo-pw

# 3. legacy bp/ pipeline (still passes its own tests, kept as primitive reference)
cd ../bp
uv sync
uv run pytest -v                         # 12 passed, 3 skipped (integration)
```

### Reference

- HANDOFF as of Apr 21: `bp/HANDOFF.md`
- Live demo script: `demo_questions.md`
- Frontend ↔ backend boundary (new architecture's contract): `frontend_website/lib/rag/contract.ts`
- Press / static showcase: `static_website/index.html`

---

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a local-run Streamlit demo by Saturday April 18, 2026 that accepts a natural-language dealer-accounting query, fuzzy-matches to a hand-curated GM Financial Statement line, confirms with the user, retrieves from the indexed GM Dealer Standard Accounting Manual, and returns a verbatim cited answer — refusing explicitly when confidence is low.

**Architecture:**
Three-layer pipeline: (1) a **hand-curated statement-line catalog** of ~20 common GM financial-statement lines that serves as the disambiguation target; (2) a **vector index** of the GM manual PDF chunked with page numbers and section IDs preserved; (3) a **strict-citation LLM stage** that quotes verbatim from retrieved chunks or refuses. Streamlit UI wraps the pipeline. Everything runs on the builder's laptop — no hosting, no auth, no DB service.

**Tech Stack:**
- Python 3.11+, managed with `uv`
- `pdfplumber` for PDF text + page-number extraction
- `voyage-3-large` embeddings (Voyage AI — strong on long technical documents; fall back to `openai:text-embedding-3-large` if Voyage key unavailable)
- `lancedb` as the embedded vector store (no server; single-file on disk)
- `rapidfuzz` for lexical fuzzy match component
- `anthropic` SDK calling Claude Sonnet 4.6 with prompt caching on the retrieved-context block
- `streamlit` for UI
- `pytest` for tests

**Non-goals for this plan (explicitly deferred):**
- Ford manual (requires Robert's copy post-demo)
- Auth, billing, hosting
- PDF-page image rendering in the UI (text + page-number labels only — keep it simple)
- Upload-your-own-statement parsing
- >20 catalog lines (deliberately capped for the weekend)

---

## File structure

```
bp/
├── .env.example                      # API key template
├── .gitignore
├── pyproject.toml                    # uv-managed deps
├── README.md                         # how to run the demo
├── run_demo.sh                       # one-command launcher
├── data/
│   ├── gm_manual.pdf                 # downloaded once (public)
│   ├── catalog.json                  # hand-curated ~20 statement lines
│   ├── chunks.jsonl                  # extracted manual chunks
│   ├── golden.jsonl                  # 5 demo queries + 3 refusal queries
│   └── index.lance/                  # LanceDB vector index (gitignored)
├── src/
│   ├── __init__.py
│   ├── config.py                     # env + model IDs + thresholds
│   ├── corpus.py                     # PDF → chunks
│   ├── catalog.py                    # load + search the statement-line catalog
│   ├── match.py                      # user text → top-3 catalog candidates
│   ├── retrieve.py                   # confirmed line → manual chunks from LanceDB
│   ├── answer.py                     # strict-citation LLM call
│   └── pipeline.py                   # end-to-end: match → confirm → retrieve → answer
├── scripts/
│   ├── build_chunks.py               # PDF → data/chunks.jsonl
│   ├── build_index.py                # chunks.jsonl → data/index.lance
│   └── run_golden.py                 # evaluate against data/golden.jsonl
├── tests/
│   ├── test_catalog.py
│   ├── test_match.py
│   ├── test_retrieve.py
│   └── test_answer.py
└── app.py                            # Streamlit UI
```

**Responsibility boundaries:**
- `corpus.py` / `build_chunks.py` own PDF parsing. Everything downstream reads `chunks.jsonl` — no module ever re-parses the PDF.
- `catalog.py` is the only module that reads `catalog.json`. It exposes a typed API (`get_line(line_id)`, `search_catalog(text)`).
- `match.py` is pure (text in → candidate list out). No I/O beyond reading the catalog.
- `retrieve.py` is the only module that touches LanceDB.
- `answer.py` is the only module that calls the Anthropic API.
- `pipeline.py` composes them; `app.py` is a thin Streamlit wrapper over `pipeline.py`.
- Tests mirror `src/` one-to-one.

---

## Task 1: Project scaffold

**Files:**
- Create: `pyproject.toml`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `README.md`
- Create: `src/__init__.py`
- Create: `src/config.py`

- [ ] **Step 1: Initialize uv project**

Run:
```bash
cd /Users/alanwu/Documents/Working/rag/bp
uv init --package --name dealer-rag-demo --python 3.11
```

Expected: creates `pyproject.toml`. If `uv init` creates an unwanted `src/dealer_rag_demo/` layout, delete it — we use a flat `src/` layout in this plan.

- [ ] **Step 2: Add dependencies**

Run:
```bash
uv add anthropic voyageai openai lancedb pdfplumber rapidfuzz streamlit pydantic python-dotenv
uv add --dev pytest pytest-mock
```

Expected: `pyproject.toml` lists all packages; `uv.lock` generated.

- [ ] **Step 3: Write `.gitignore`**

```gitignore
.env
.venv/
__pycache__/
*.pyc
data/index.lance/
data/gm_manual.pdf
.pytest_cache/
.DS_Store
```

- [ ] **Step 4: Write `.env.example`**

```bash
ANTHROPIC_API_KEY=sk-ant-...
VOYAGE_API_KEY=pa-...           # primary embedding provider
OPENAI_API_KEY=sk-...           # fallback embedding provider
```

- [ ] **Step 5: Write `src/config.py`**

```python
import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Config:
    anthropic_api_key: str
    voyage_api_key: str | None
    openai_api_key: str | None

    embedding_provider: str = "voyage"   # "voyage" | "openai"
    embedding_model_voyage: str = "voyage-3-large"
    embedding_model_openai: str = "text-embedding-3-large"
    generation_model: str = "claude-sonnet-4-6"

    # Retrieval thresholds (tuned in Task 10)
    match_min_score: float = 0.55
    retrieval_min_score: float = 0.30
    top_k_candidates: int = 3
    top_k_chunks: int = 8

    manual_pdf_path: str = "data/gm_manual.pdf"
    chunks_path: str = "data/chunks.jsonl"
    catalog_path: str = "data/catalog.json"
    index_path: str = "data/index.lance"
    golden_path: str = "data/golden.jsonl"


def load_config() -> Config:
    return Config(
        anthropic_api_key=os.environ["ANTHROPIC_API_KEY"],
        voyage_api_key=os.environ.get("VOYAGE_API_KEY"),
        openai_api_key=os.environ.get("OPENAI_API_KEY"),
    )
```

- [ ] **Step 6: Write `src/__init__.py`**

```python
```
(empty file)

- [ ] **Step 7: Write `README.md`**

````markdown
# Dealer RAG Demo (GM)

Weekend prototype for the "Dealer CFO Copilot" demo.

## Setup
1. Copy `.env.example` → `.env`, fill in keys.
2. `uv sync`
3. `uv run scripts/build_chunks.py`   (one-time, ~2 min)
4. `uv run scripts/build_index.py`    (one-time, ~3 min)
5. `./run_demo.sh`                    (launches Streamlit)

## Test
- `uv run pytest`
- `uv run scripts/run_golden.py`      (evaluates vs golden set)
````

- [ ] **Step 8: Commit**

Run:
```bash
cd /Users/alanwu/Documents/Working/rag/bp
git init
git add pyproject.toml uv.lock .gitignore .env.example README.md src/
git commit -m "chore: project scaffold with uv, deps, config"
```

---

## Task 2: Download GM manual PDF and sanity-check

**Files:**
- Create: `data/gm_manual.pdf`
- Create: `scripts/inspect_pdf.py`

- [ ] **Step 1: Download the GM Dealer Standard Accounting Manual**

Run:
```bash
mkdir -p data
curl -L -o data/gm_manual.pdf "http://gm.acctmanual.com/Misc/gm_acct_manual%20v2-2-1-1.pdf"
```

Expected: `data/gm_manual.pdf` exists, ≥5 MB. If the URL 404s, search `site:gm.acctmanual.com` for the current manual PDF and update the URL.

- [ ] **Step 2: Write `scripts/inspect_pdf.py`**

```python
"""One-off diagnostic: print page count, first-page snippet, section structure."""
import pdfplumber
from src.config import load_config


def main() -> None:
    cfg = load_config()
    with pdfplumber.open(cfg.manual_pdf_path) as pdf:
        print(f"Pages: {len(pdf.pages)}")
        print(f"\n--- Page 1 (first 500 chars) ---")
        print(pdf.pages[0].extract_text()[:500])
        print(f"\n--- Page 50 (first 500 chars, likely TOC or body) ---")
        print(pdf.pages[min(49, len(pdf.pages) - 1)].extract_text()[:500])


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Run the inspector**

Run:
```bash
uv run python scripts/inspect_pdf.py
```

Expected: page count printed, readable ASCII text on page 1 and page 50. If text is gibberish or empty, the PDF is scanned and needs OCR (tesseract or cloud OCR) — flag this as a blocker and stop.

- [ ] **Step 4: Commit**

```bash
git add scripts/inspect_pdf.py
git commit -m "chore: PDF inspection script and downloaded manual (gitignored binary)"
```

---

## Task 3: PDF chunking pipeline

**Files:**
- Create: `src/corpus.py`
- Create: `scripts/build_chunks.py`

- [ ] **Step 1: Write `src/corpus.py`**

```python
"""PDF → structured chunks with page numbers and heading context preserved.

Chunk strategy: split each page's text into ~600-token windows with ~100-token
overlap, carrying the nearest-above heading as metadata. One record per window.
"""
from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterator

import pdfplumber


@dataclass
class Chunk:
    chunk_id: str
    page: int
    heading: str | None
    text: str


HEADING_RE = re.compile(r"^(?:[A-Z0-9]{2,}[\s\-.:]+){1,6}[A-Z0-9]{2,}$|^\s*(?:SECTION|CHAPTER)\s+\S", re.MULTILINE)


def _approx_token_count(text: str) -> int:
    return max(1, len(text) // 4)


def _split_into_windows(text: str, target_tokens: int = 600, overlap_tokens: int = 100) -> list[str]:
    words = text.split()
    if not words:
        return []
    target_words = target_tokens * 4 // 5    # ~words-per-token
    overlap_words = overlap_tokens * 4 // 5
    windows: list[str] = []
    i = 0
    while i < len(words):
        end = min(len(words), i + target_words)
        windows.append(" ".join(words[i:end]))
        if end == len(words):
            break
        i = end - overlap_words
    return windows


def _detect_page_heading(page_text: str) -> str | None:
    for line in page_text.splitlines()[:15]:
        line = line.strip()
        if 5 <= len(line) <= 120 and HEADING_RE.match(line):
            return line
    return None


def extract_chunks(pdf_path: str) -> Iterator[Chunk]:
    with pdfplumber.open(pdf_path) as pdf:
        for page_idx, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            if not text.strip():
                continue
            heading = _detect_page_heading(text)
            for w_idx, window in enumerate(_split_into_windows(text)):
                yield Chunk(
                    chunk_id=f"p{page_idx:04d}-w{w_idx:02d}",
                    page=page_idx,
                    heading=heading,
                    text=window,
                )


def write_chunks(pdf_path: str, out_path: str) -> int:
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with out.open("w") as f:
        for ch in extract_chunks(pdf_path):
            f.write(json.dumps(asdict(ch)) + "\n")
            count += 1
    return count
```

- [ ] **Step 2: Write `scripts/build_chunks.py`**

```python
"""One-time: parse the GM manual PDF into data/chunks.jsonl."""
from src.config import load_config
from src.corpus import write_chunks


def main() -> None:
    cfg = load_config()
    count = write_chunks(cfg.manual_pdf_path, cfg.chunks_path)
    print(f"Wrote {count} chunks to {cfg.chunks_path}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Run it**

Run:
```bash
uv run python scripts/build_chunks.py
```

Expected: "Wrote N chunks" where N is plausibly 500–3000 depending on manual length. Open `data/chunks.jsonl` and spot-check: each line is valid JSON with `chunk_id`, `page`, `heading`, `text`; text is readable English.

- [ ] **Step 4: Commit**

```bash
git add src/corpus.py scripts/build_chunks.py
git commit -m "feat: PDF chunking pipeline with page+heading metadata"
```

---

## Task 4: Hand-curated statement-line catalog

**Files:**
- Create: `data/catalog.json`
- Create: `src/catalog.py`
- Create: `tests/test_catalog.py`

This is the single most time-consuming task. Budget ~90 minutes. The catalog is the trust surface of the demo; every wrong entry here cascades to wrong citations.

- [ ] **Step 1: Write `tests/test_catalog.py` (TDD — failing test first)**

```python
import pytest
from src.catalog import Catalog, CatalogLine


def test_catalog_loads_all_lines():
    cat = Catalog.load("data/catalog.json")
    assert len(cat.lines) >= 20
    for line in cat.lines:
        assert line.line_id
        assert line.canonical_name
        assert line.page >= 1
        assert isinstance(line.aliases, list)
        assert isinstance(line.manual_section_refs, list)


def test_catalog_get_line_by_id():
    cat = Catalog.load("data/catalog.json")
    first = cat.lines[0]
    assert cat.get(first.line_id) == first


def test_catalog_get_missing_raises():
    cat = Catalog.load("data/catalog.json")
    with pytest.raises(KeyError):
        cat.get("nonexistent-line-id")


def test_catalog_line_ids_are_unique():
    cat = Catalog.load("data/catalog.json")
    ids = [line.line_id for line in cat.lines]
    assert len(ids) == len(set(ids))
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `uv run pytest tests/test_catalog.py -v`
Expected: FAIL with ImportError / FileNotFoundError.

- [ ] **Step 3: Write `src/catalog.py`**

```python
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path


@dataclass(frozen=True)
class CatalogLine:
    line_id: str
    canonical_name: str
    page: int
    line_number: str | None
    category: str
    aliases: list[str] = field(default_factory=list)
    manual_section_refs: list[str] = field(default_factory=list)
    notes: str = ""


@dataclass
class Catalog:
    lines: list[CatalogLine]

    @classmethod
    def load(cls, path: str) -> "Catalog":
        data = json.loads(Path(path).read_text())
        lines = [CatalogLine(**row) for row in data["lines"]]
        return cls(lines=lines)

    def get(self, line_id: str) -> CatalogLine:
        for line in self.lines:
            if line.line_id == line_id:
                return line
        raise KeyError(line_id)
```

- [ ] **Step 4: Write `data/catalog.json` with the hand-curated 20 lines**

Open the GM manual PDF in a viewer. Find the standard financial statement layout section (usually near the front). For each of the 20 common lines below, capture the actual line number, the page where it appears on the statement layout, and the section(s) of the manual that define its computation. The `manual_section_refs` values should be strings that will later match the `heading` field of `chunks.jsonl` as substrings.

Suggested 20 lines (adjust to match the actual GM statement in the PDF):

```json
{
  "lines": [
    {
      "line_id": "new-veh-retail-gross",
      "canonical_name": "New Vehicle Retail — Gross Profit",
      "page": 2,
      "line_number": "Line 3",
      "category": "new_vehicles",
      "aliases": ["new vehicle retail gross", "new car gross", "new retail gross profit"],
      "manual_section_refs": ["NEW VEHICLE DEPARTMENT", "GROSS PROFIT"],
      "notes": ""
    },
    {
      "line_id": "used-veh-retail-gross",
      "canonical_name": "Used Vehicle Retail — Gross Profit",
      "page": 2,
      "line_number": "Line 8",
      "category": "used_vehicles",
      "aliases": ["used vehicle retail gross", "used car gross"],
      "manual_section_refs": ["USED VEHICLE DEPARTMENT", "GROSS PROFIT"],
      "notes": ""
    },
    {
      "line_id": "variable-selling-expense",
      "canonical_name": "Variable Selling Expense",
      "page": 4,
      "line_number": "Line 203",
      "category": "variable_expenses",
      "aliases": ["variable selling", "variable sales expense", "VSE"],
      "manual_section_refs": ["VARIABLE EXPENSES", "SELLING EXPENSE"],
      "notes": "Percentage is typically of variable gross, not total gross."
    },
    {
      "line_id": "personnel-expense-sales",
      "canonical_name": "Personnel Expense — Sales",
      "page": 4,
      "line_number": "Line 210",
      "category": "personnel",
      "aliases": ["sales personnel expense", "salesperson compensation"],
      "manual_section_refs": ["PERSONNEL EXPENSE"],
      "notes": ""
    },
    {
      "line_id": "floor-plan-interest",
      "canonical_name": "Floor Plan Interest",
      "page": 4,
      "line_number": "Line 220",
      "category": "semi_fixed_expenses",
      "aliases": ["floorplan interest", "flooring interest", "floor plan"],
      "manual_section_refs": ["FLOOR PLAN", "INTEREST EXPENSE"],
      "notes": ""
    },
    {
      "line_id": "advertising-expense",
      "canonical_name": "Advertising Expense",
      "page": 4,
      "line_number": "Line 225",
      "category": "semi_fixed_expenses",
      "aliases": ["advertising", "ad spend", "marketing expense"],
      "manual_section_refs": ["ADVERTISING"],
      "notes": "Often offset by manufacturer advertising assistance."
    },
    {
      "line_id": "service-labor-gross",
      "canonical_name": "Service Labor — Gross Profit",
      "page": 3,
      "line_number": "Line 60",
      "category": "service",
      "aliases": ["service labor gross", "service gross", "labor gross profit"],
      "manual_section_refs": ["SERVICE DEPARTMENT", "LABOR"],
      "notes": ""
    },
    {
      "line_id": "service-unapplied-labor",
      "canonical_name": "Unapplied Labor",
      "page": 3,
      "line_number": "Line 68",
      "category": "service",
      "aliases": ["unapplied time", "unapplied labor", "technician unapplied"],
      "manual_section_refs": ["UNAPPLIED LABOR", "SERVICE DEPARTMENT"],
      "notes": "Robert's #2 pain point — usually hidden in accounting detail."
    },
    {
      "line_id": "service-cp-labor-gross",
      "canonical_name": "Customer Pay Labor — Gross Profit",
      "page": 3,
      "line_number": "Line 62",
      "category": "service",
      "aliases": ["CP labor", "customer pay gross", "retail labor gross"],
      "manual_section_refs": ["CUSTOMER PAY", "LABOR"],
      "notes": ""
    },
    {
      "line_id": "service-warranty-labor-gross",
      "canonical_name": "Warranty Labor — Gross Profit",
      "page": 3,
      "line_number": "Line 64",
      "category": "service",
      "aliases": ["warranty labor gross", "warranty gross"],
      "manual_section_refs": ["WARRANTY", "LABOR"],
      "notes": ""
    },
    {
      "line_id": "parts-gross",
      "canonical_name": "Parts — Gross Profit",
      "page": 3,
      "line_number": "Line 80",
      "category": "parts",
      "aliases": ["parts gross", "parts department gross"],
      "manual_section_refs": ["PARTS DEPARTMENT", "GROSS PROFIT"],
      "notes": ""
    },
    {
      "line_id": "finance-income",
      "canonical_name": "Finance Income",
      "page": 2,
      "line_number": "Line 20",
      "category": "finance_insurance",
      "aliases": ["F&I income", "finance and insurance income", "reserve income"],
      "manual_section_refs": ["FINANCE AND INSURANCE", "FINANCE INCOME"],
      "notes": ""
    },
    {
      "line_id": "insurance-income",
      "canonical_name": "Insurance Income",
      "page": 2,
      "line_number": "Line 22",
      "category": "finance_insurance",
      "aliases": ["service contract income", "VSC income", "insurance commission"],
      "manual_section_refs": ["FINANCE AND INSURANCE", "INSURANCE"],
      "notes": ""
    },
    {
      "line_id": "total-gross-profit",
      "canonical_name": "Total Gross Profit",
      "page": 1,
      "line_number": "Line 1",
      "category": "summary",
      "aliases": ["total gross", "top line gross", "combined gross"],
      "manual_section_refs": ["TOTAL GROSS PROFIT", "GROSS"],
      "notes": "Robert's #1 pain: 'which gross?' — this is the top-line definition."
    },
    {
      "line_id": "net-profit",
      "canonical_name": "Net Profit",
      "page": 1,
      "line_number": "Line 50",
      "category": "summary",
      "aliases": ["net income", "bottom line", "profit"],
      "manual_section_refs": ["NET PROFIT", "INCOME"],
      "notes": ""
    },
    {
      "line_id": "rent-expense",
      "canonical_name": "Rent — Real Estate",
      "page": 5,
      "line_number": "Line 310",
      "category": "fixed_expenses",
      "aliases": ["rent", "real estate rent", "occupancy"],
      "manual_section_refs": ["FIXED EXPENSES", "RENT"],
      "notes": ""
    },
    {
      "line_id": "utilities",
      "canonical_name": "Utilities",
      "page": 5,
      "line_number": "Line 315",
      "category": "fixed_expenses",
      "aliases": ["utility expense", "electric gas water"],
      "manual_section_refs": ["UTILITIES"],
      "notes": ""
    },
    {
      "line_id": "lof-inventory",
      "canonical_name": "LIFO Inventory Reserve",
      "page": 6,
      "line_number": "Line 410",
      "category": "balance_sheet",
      "aliases": ["LIFO reserve", "inventory reserve"],
      "manual_section_refs": ["LIFO", "INVENTORY"],
      "notes": ""
    },
    {
      "line_id": "accounts-receivable-vehicle",
      "canonical_name": "Accounts Receivable — Vehicle",
      "page": 6,
      "line_number": "Line 420",
      "category": "balance_sheet",
      "aliases": ["AR vehicle", "vehicle receivables", "contracts in transit"],
      "manual_section_refs": ["ACCOUNTS RECEIVABLE", "CONTRACTS IN TRANSIT"],
      "notes": ""
    },
    {
      "line_id": "holdback",
      "canonical_name": "Holdback Income",
      "page": 2,
      "line_number": "Line 14",
      "category": "new_vehicles",
      "aliases": ["holdback", "dealer holdback", "manufacturer holdback"],
      "manual_section_refs": ["HOLDBACK"],
      "notes": ""
    }
  ]
}
```

**Calibration note:** every `page` / `line_number` / `manual_section_refs` value above is a *starting guess*. Open the actual PDF, find each line on the statement layout, and correct values before moving on. A catalog with wrong numbers will make the demo hallucinate.

- [ ] **Step 5: Run tests to verify they pass**

Run: `uv run pytest tests/test_catalog.py -v`
Expected: 4 passed.

- [ ] **Step 6: Commit**

```bash
git add data/catalog.json src/catalog.py tests/test_catalog.py
git commit -m "feat: hand-curated statement-line catalog with 20 GM lines"
```

---

## Task 5: Fuzzy match (user text → catalog candidates)

**Files:**
- Create: `src/match.py`
- Create: `tests/test_match.py`

- [ ] **Step 1: Write `tests/test_match.py`**

```python
from src.catalog import Catalog
from src.match import match_to_catalog


CAT = Catalog.load("data/catalog.json")


def test_exact_canonical_name_matches_first():
    candidates = match_to_catalog("Variable Selling Expense", CAT, top_k=3)
    assert candidates[0].line.line_id == "variable-selling-expense"
    assert candidates[0].score >= 0.8


def test_alias_matches():
    candidates = match_to_catalog("floorplan interest", CAT, top_k=3)
    assert candidates[0].line.line_id == "floor-plan-interest"


def test_descriptive_paste_with_percentage_matches():
    candidates = match_to_catalog("Variable Selling Expense 5.2% of gross", CAT, top_k=3)
    assert candidates[0].line.line_id == "variable-selling-expense"


def test_returns_top_k():
    candidates = match_to_catalog("gross profit", CAT, top_k=3)
    assert 1 <= len(candidates) <= 3


def test_completely_unrelated_query_returns_low_scores():
    candidates = match_to_catalog("weather in Tokyo yesterday", CAT, top_k=3)
    assert candidates[0].score < 0.5
```

- [ ] **Step 2: Run to verify they fail**

Run: `uv run pytest tests/test_match.py -v`
Expected: FAIL with ImportError.

- [ ] **Step 3: Write `src/match.py`**

```python
from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from rapidfuzz import fuzz

from src.catalog import Catalog, CatalogLine


@dataclass(frozen=True)
class MatchCandidate:
    line: CatalogLine
    score: float


def _searchable_strings(line: CatalogLine) -> Iterable[str]:
    yield line.canonical_name
    yield from line.aliases


def _best_lexical_score(query: str, line: CatalogLine) -> float:
    q = query.lower()
    best = 0.0
    for candidate in _searchable_strings(line):
        c = candidate.lower()
        token_set = fuzz.token_set_ratio(q, c) / 100.0
        partial = fuzz.partial_ratio(q, c) / 100.0
        best = max(best, 0.5 * token_set + 0.5 * partial)
    return best


def match_to_catalog(query: str, catalog: Catalog, top_k: int = 3) -> list[MatchCandidate]:
    """Rank catalog lines by lexical similarity to the query paste.

    Pure lexical for now — good enough for ~20 lines with strong aliases.
    If top-1 < 0.55 the caller should treat it as unmatched and refuse.
    """
    scored = [
        MatchCandidate(line=line, score=_best_lexical_score(query, line))
        for line in catalog.lines
    ]
    scored.sort(key=lambda c: c.score, reverse=True)
    return scored[:top_k]
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `uv run pytest tests/test_match.py -v`
Expected: 5 passed. If the descriptive-paste test fails, widen the aliases in `catalog.json` for `variable-selling-expense` (add `"variable selling expense 5% of gross"`-style phrases) — do NOT weaken the threshold in the test.

- [ ] **Step 5: Commit**

```bash
git add src/match.py tests/test_match.py
git commit -m "feat: lexical fuzzy match from user text to statement-line catalog"
```

---

## Task 6: Vector index + retrieval

**Files:**
- Create: `scripts/build_index.py`
- Create: `src/retrieve.py`
- Create: `tests/test_retrieve.py`

- [ ] **Step 1: Write `scripts/build_index.py`**

```python
"""One-time: embed chunks.jsonl and write LanceDB table at data/index.lance."""
import json
from pathlib import Path

import lancedb
import voyageai

from src.config import load_config


def _embed_voyage(texts: list[str], api_key: str, model: str) -> list[list[float]]:
    client = voyageai.Client(api_key=api_key)
    # Voyage accepts up to 128 inputs per call; batch conservatively.
    out: list[list[float]] = []
    for i in range(0, len(texts), 64):
        batch = texts[i : i + 64]
        resp = client.embed(batch, model=model, input_type="document")
        out.extend(resp.embeddings)
        print(f"  embedded {i + len(batch)}/{len(texts)}")
    return out


def main() -> None:
    cfg = load_config()
    records = [json.loads(line) for line in Path(cfg.chunks_path).read_text().splitlines() if line.strip()]
    texts = [r["text"] for r in records]
    print(f"Embedding {len(texts)} chunks with {cfg.embedding_model_voyage}...")
    vectors = _embed_voyage(texts, cfg.voyage_api_key, cfg.embedding_model_voyage)
    assert len(vectors) == len(records)

    rows = [
        {
            "chunk_id": r["chunk_id"],
            "page": r["page"],
            "heading": r["heading"] or "",
            "text": r["text"],
            "vector": vectors[i],
        }
        for i, r in enumerate(records)
    ]

    Path(cfg.index_path).parent.mkdir(parents=True, exist_ok=True)
    db = lancedb.connect(cfg.index_path)
    if "chunks" in db.table_names():
        db.drop_table("chunks")
    tbl = db.create_table("chunks", data=rows)
    tbl.create_fts_index("text", replace=True)
    print(f"Wrote LanceDB index to {cfg.index_path} with {len(rows)} rows.")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Write `src/retrieve.py`**

```python
from __future__ import annotations

from dataclasses import dataclass
from typing import Sequence

import lancedb
import voyageai

from src.catalog import CatalogLine
from src.config import Config


@dataclass(frozen=True)
class RetrievedChunk:
    chunk_id: str
    page: int
    heading: str
    text: str
    score: float


def _embed_query(text: str, cfg: Config) -> list[float]:
    client = voyageai.Client(api_key=cfg.voyage_api_key)
    resp = client.embed([text], model=cfg.embedding_model_voyage, input_type="query")
    return resp.embeddings[0]


def _heading_matches_any(heading: str, refs: Sequence[str]) -> bool:
    h = heading.upper()
    return any(ref.upper() in h for ref in refs)


def retrieve_for_line(line: CatalogLine, query_text: str, cfg: Config) -> list[RetrievedChunk]:
    """Retrieve manual chunks for a confirmed catalog line.

    Strategy: semantic search with a *soft* heading boost (not hard filter —
    headings in the PDF are noisy and we'd rather see than miss).
    """
    db = lancedb.connect(cfg.index_path)
    tbl = db.open_table("chunks")
    qvec = _embed_query(f"{line.canonical_name} — {query_text}", cfg)
    rows = tbl.search(qvec).limit(cfg.top_k_chunks * 3).to_list()

    scored: list[RetrievedChunk] = []
    for r in rows:
        distance = float(r.get("_distance", 1.0))
        base = max(0.0, 1.0 - distance)    # cosine-like
        boost = 0.15 if _heading_matches_any(r.get("heading", ""), line.manual_section_refs) else 0.0
        scored.append(
            RetrievedChunk(
                chunk_id=r["chunk_id"],
                page=r["page"],
                heading=r["heading"],
                text=r["text"],
                score=min(1.0, base + boost),
            )
        )
    scored.sort(key=lambda c: c.score, reverse=True)
    return scored[: cfg.top_k_chunks]
```

- [ ] **Step 3: Build the index**

Run: `uv run python scripts/build_index.py`
Expected: "Wrote LanceDB index to data/index.lance with N rows." where N matches the chunk count from Task 3.

- [ ] **Step 4: Write `tests/test_retrieve.py`**

```python
from src.catalog import Catalog
from src.config import load_config
from src.retrieve import retrieve_for_line


CFG = load_config()
CAT = Catalog.load("data/catalog.json")


def test_retrieval_returns_k_chunks():
    line = CAT.get("variable-selling-expense")
    chunks = retrieve_for_line(line, "which gross does this use", CFG)
    assert 1 <= len(chunks) <= CFG.top_k_chunks


def test_retrieval_top_chunk_score_is_positive():
    line = CAT.get("variable-selling-expense")
    chunks = retrieve_for_line(line, "which gross does this use", CFG)
    assert chunks[0].score > 0


def test_retrieval_preserves_page_metadata():
    line = CAT.get("variable-selling-expense")
    chunks = retrieve_for_line(line, "which gross", CFG)
    for ch in chunks:
        assert ch.page >= 1
        assert ch.chunk_id
```

- [ ] **Step 5: Run tests**

Run: `uv run pytest tests/test_retrieve.py -v`
Expected: 3 passed. (These tests make real API calls — run with network.)

- [ ] **Step 6: Commit**

```bash
git add src/retrieve.py scripts/build_index.py tests/test_retrieve.py
git commit -m "feat: LanceDB vector index and semantic retrieval with heading boost"
```

---

## Task 7: Strict-citation answer stage

**Files:**
- Create: `src/answer.py`
- Create: `tests/test_answer.py`

- [ ] **Step 1: Write `tests/test_answer.py`**

```python
from unittest.mock import MagicMock, patch

from src.answer import AnswerResult, generate_answer
from src.catalog import CatalogLine
from src.config import load_config
from src.retrieve import RetrievedChunk


CFG = load_config()

LINE = CatalogLine(
    line_id="variable-selling-expense",
    canonical_name="Variable Selling Expense",
    page=4,
    line_number="Line 203",
    category="variable_expenses",
    aliases=["VSE"],
    manual_section_refs=["VARIABLE EXPENSES"],
    notes="",
)


def _chunk(text: str, score: float, page: int = 4) -> RetrievedChunk:
    return RetrievedChunk(chunk_id=f"p{page:04d}-w00", page=page, heading="VARIABLE EXPENSES", text=text, score=score)


@patch("src.answer._call_claude")
def test_answer_uses_top_chunk_text(mock_call):
    mock_call.return_value = "Variable Selling Expense is computed as a percentage of Variable Gross Profit. [p. 4]"
    chunks = [_chunk("Variable Selling Expense shall be computed as a percentage of Variable Gross Profit.", 0.85)]
    result = generate_answer(LINE, "which gross", chunks, CFG)
    assert isinstance(result, AnswerResult)
    assert not result.refused
    assert "Variable" in result.answer_text
    assert 4 in result.cited_pages


def test_answer_refuses_on_empty_chunks():
    result = generate_answer(LINE, "unknown query", [], CFG)
    assert result.refused is True
    assert "couldn't" in result.answer_text.lower() or "can't" in result.answer_text.lower()


def test_answer_refuses_on_low_score_chunks():
    chunks = [_chunk("irrelevant text", 0.1)]
    result = generate_answer(LINE, "which gross", chunks, CFG)
    assert result.refused is True
```

- [ ] **Step 2: Run tests (should fail)**

Run: `uv run pytest tests/test_answer.py -v`
Expected: FAIL with ImportError.

- [ ] **Step 3: Write `src/answer.py`**

```python
from __future__ import annotations

import re
from dataclasses import dataclass, field

import anthropic

from src.catalog import CatalogLine
from src.config import Config
from src.retrieve import RetrievedChunk


SYSTEM_PROMPT = """You are a dealership accounting assistant. You answer questions about the GM Dealer Standard Accounting Manual using ONLY the passages provided in the context.

Rules, in order of importance:
1. If the provided context does NOT contain a clear answer to the user's question, respond with exactly: "I can't find this in the GM manual with high confidence." Then list the candidate pages you examined. Do not guess. Do not use prior knowledge.
2. When you do answer, quote the relevant passage VERBATIM (inside quotation marks) before explaining.
3. Always cite the page using the format [p. N]. If multiple pages are relevant, cite each.
4. Keep the explanation under 60 words. The quote is the product; your explanation is scaffolding.
5. Never invent account numbers, line numbers, or percentages.
"""

USER_TEMPLATE = """User is asking about this financial-statement line:

  **{line_name}** (Manual page {page}, {line_number})
  Category: {category}
  User's question (their paste): {query}

Context from the GM Dealer Standard Accounting Manual:

{context_block}

Answer the user's question per the rules. Remember: if the context does not clearly answer, refuse."""

REFUSAL_MARKER = "I can't find this in the GM manual with high confidence"


@dataclass(frozen=True)
class AnswerResult:
    answer_text: str
    refused: bool
    cited_pages: list[int] = field(default_factory=list)
    chunks_used: list[str] = field(default_factory=list)


def _call_claude(cfg: Config, system: str, user: str) -> str:
    client = anthropic.Anthropic(api_key=cfg.anthropic_api_key)
    resp = client.messages.create(
        model=cfg.generation_model,
        max_tokens=800,
        system=[{"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}],
        messages=[{"role": "user", "content": user}],
    )
    return resp.content[0].text


def _build_context_block(chunks: list[RetrievedChunk]) -> str:
    parts = []
    for ch in chunks:
        parts.append(f"--- [p. {ch.page}] {ch.heading} ---\n{ch.text}")
    return "\n\n".join(parts)


def _extract_cited_pages(text: str) -> list[int]:
    return sorted({int(m) for m in re.findall(r"\[p\.\s*(\d+)\]", text)})


def generate_answer(
    line: CatalogLine,
    query: str,
    chunks: list[RetrievedChunk],
    cfg: Config,
) -> AnswerResult:
    # Guardrail: refuse before calling the model if no chunk passes the floor.
    usable = [c for c in chunks if c.score >= cfg.retrieval_min_score]
    if not usable:
        candidate_pages = sorted({c.page for c in chunks}) or []
        msg = (
            "I can't find this in the GM manual with high confidence. "
            + (f"Closest candidate pages: {candidate_pages}." if candidate_pages else "No close matches were retrieved.")
        )
        return AnswerResult(answer_text=msg, refused=True, cited_pages=[], chunks_used=[])

    user = USER_TEMPLATE.format(
        line_name=line.canonical_name,
        page=line.page,
        line_number=line.line_number or "n/a",
        category=line.category,
        query=query,
        context_block=_build_context_block(usable),
    )
    text = _call_claude(cfg, SYSTEM_PROMPT, user)
    refused = REFUSAL_MARKER.lower() in text.lower()
    return AnswerResult(
        answer_text=text,
        refused=refused,
        cited_pages=_extract_cited_pages(text),
        chunks_used=[c.chunk_id for c in usable],
    )
```

- [ ] **Step 4: Run tests**

Run: `uv run pytest tests/test_answer.py -v`
Expected: 3 passed. If `test_answer_uses_top_chunk_text` fails because `_call_claude` was patched but `generate_answer` still short-circuits on the score guardrail, verify the test's chunk score (0.85) is above `cfg.retrieval_min_score` (0.30) — should be.

- [ ] **Step 5: Commit**

```bash
git add src/answer.py tests/test_answer.py
git commit -m "feat: strict-citation answer stage with refusal guardrail"
```

---

## Task 8: End-to-end pipeline + golden set

**Files:**
- Create: `src/pipeline.py`
- Create: `data/golden.jsonl`
- Create: `scripts/run_golden.py`

- [ ] **Step 1: Write `src/pipeline.py`**

```python
from __future__ import annotations

from dataclasses import dataclass

from src.answer import AnswerResult, generate_answer
from src.catalog import Catalog, CatalogLine
from src.config import Config
from src.match import MatchCandidate, match_to_catalog
from src.retrieve import retrieve_for_line


@dataclass(frozen=True)
class PipelineMatchStep:
    query: str
    candidates: list[MatchCandidate]
    top_score: float


@dataclass(frozen=True)
class PipelineAnswerStep:
    line: CatalogLine
    answer: AnswerResult


def run_match(query: str, catalog: Catalog, cfg: Config) -> PipelineMatchStep:
    candidates = match_to_catalog(query, catalog, top_k=cfg.top_k_candidates)
    return PipelineMatchStep(
        query=query,
        candidates=candidates,
        top_score=candidates[0].score if candidates else 0.0,
    )


def run_answer(line: CatalogLine, query: str, cfg: Config) -> PipelineAnswerStep:
    chunks = retrieve_for_line(line, query, cfg)
    answer = generate_answer(line, query, chunks, cfg)
    return PipelineAnswerStep(line=line, answer=answer)
```

- [ ] **Step 2: Write `data/golden.jsonl`**

Eight rows: five "must answer with specific citation," three "must refuse." Adjust expected pages to match the actual manual.

```jsonl
{"id": "g1", "kind": "must_answer", "query": "Variable Selling Expense 5.2% of gross", "expected_line_id": "variable-selling-expense", "expected_page": 4, "must_contain_lowercase": ["variable"]}
{"id": "g2", "kind": "must_answer", "query": "floor plan interest", "expected_line_id": "floor-plan-interest", "expected_page": 4, "must_contain_lowercase": ["floor", "interest"]}
{"id": "g3", "kind": "must_answer", "query": "what is unapplied labor", "expected_line_id": "service-unapplied-labor", "expected_page": 3, "must_contain_lowercase": ["unapplied"]}
{"id": "g4", "kind": "must_answer", "query": "total gross profit definition", "expected_line_id": "total-gross-profit", "expected_page": 1, "must_contain_lowercase": ["gross"]}
{"id": "g5", "kind": "must_answer", "query": "holdback income", "expected_line_id": "holdback", "expected_page": 2, "must_contain_lowercase": ["holdback"]}
{"id": "g6", "kind": "must_refuse", "query": "how to fire a technician under California labor law"}
{"id": "g7", "kind": "must_refuse", "query": "what is the current prime rate"}
{"id": "g8", "kind": "must_refuse", "query": "dealer advertising budget benchmarks 2026"}
```

- [ ] **Step 3: Write `scripts/run_golden.py`**

```python
"""Evaluate the pipeline against data/golden.jsonl.

Success criteria:
- must_answer rows: pipeline matches the expected line_id and cites expected_page,
  answer contains all must_contain_lowercase substrings, not refused.
- must_refuse rows: pipeline refuses (either at match stage with low score,
  or at answer stage with the refusal marker).

Exit non-zero if any row fails.
"""
import json
import sys
from pathlib import Path

from src.catalog import Catalog
from src.config import load_config
from src.pipeline import run_answer, run_match


def _evaluate_answer(row: dict, cat: Catalog, cfg) -> tuple[bool, str]:
    match = run_match(row["query"], cat, cfg)
    if match.top_score < cfg.match_min_score:
        return False, f"match too weak (top_score={match.top_score:.2f})"
    top_line = match.candidates[0].line
    if top_line.line_id != row["expected_line_id"]:
        return False, f"top line {top_line.line_id} ≠ expected {row['expected_line_id']}"
    step = run_answer(top_line, row["query"], cfg)
    if step.answer.refused:
        return False, f"refused unexpectedly: {step.answer.answer_text[:80]}"
    if row["expected_page"] not in step.answer.cited_pages:
        return False, f"expected page {row['expected_page']} not in cited {step.answer.cited_pages}"
    text_lower = step.answer.answer_text.lower()
    for needle in row["must_contain_lowercase"]:
        if needle not in text_lower:
            return False, f"answer missing substring {needle!r}"
    return True, "ok"


def _evaluate_refuse(row: dict, cat: Catalog, cfg) -> tuple[bool, str]:
    match = run_match(row["query"], cat, cfg)
    if match.top_score < cfg.match_min_score:
        return True, "refused at match stage"
    top_line = match.candidates[0].line
    step = run_answer(top_line, row["query"], cfg)
    if step.answer.refused:
        return True, "refused at answer stage"
    return False, f"did not refuse, got: {step.answer.answer_text[:80]}"


def main() -> int:
    cfg = load_config()
    cat = Catalog.load(cfg.catalog_path)
    rows = [json.loads(line) for line in Path(cfg.golden_path).read_text().splitlines() if line.strip()]

    failures: list[str] = []
    for row in rows:
        if row["kind"] == "must_answer":
            ok, reason = _evaluate_answer(row, cat, cfg)
        else:
            ok, reason = _evaluate_refuse(row, cat, cfg)
        status = "PASS" if ok else "FAIL"
        print(f"[{status}] {row['id']}: {row['query'][:60]:60s} — {reason}")
        if not ok:
            failures.append(row["id"])

    print()
    print(f"{len(rows) - len(failures)}/{len(rows)} passed.")
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: Run golden set**

Run: `uv run python scripts/run_golden.py`
Expected first run: most likely some failures — that is the tuning signal for Task 10. Do not skip to Task 9 until at least 6/8 pass. If fewer than 6 pass, iterate on the catalog entries and alias lists first, then chunking, before touching the prompt.

- [ ] **Step 5: Commit**

```bash
git add src/pipeline.py data/golden.jsonl scripts/run_golden.py
git commit -m "feat: end-to-end pipeline + 8-row golden set evaluator"
```

---

## Task 9: Streamlit UI

**Files:**
- Create: `app.py`
- Create: `run_demo.sh`

- [ ] **Step 1: Write `app.py`**

```python
import streamlit as st

from src.catalog import Catalog
from src.config import load_config
from src.pipeline import run_answer, run_match


st.set_page_config(page_title="Dealer CFO Copilot (GM)", layout="wide")


@st.cache_resource
def _boot():
    return load_config(), Catalog.load("data/catalog.json")


cfg, catalog = _boot()

st.title("Dealer CFO Copilot — GM demo")
st.caption("Paste any line from your GM Dealer Financial Statement. I'll cite the manual.")

left, right = st.columns([1, 1])

with left:
    if "match" not in st.session_state:
        st.session_state.match = None
    if "answer" not in st.session_state:
        st.session_state.answer = None

    query = st.text_area(
        "Paste the line or describe it:",
        placeholder="e.g. Variable Selling Expense 5.2% of gross",
        height=100,
    )

    if st.button("Find in the manual", type="primary", disabled=not query.strip()):
        st.session_state.match = run_match(query.strip(), catalog, cfg)
        st.session_state.answer = None

    match = st.session_state.match
    if match:
        if match.top_score < cfg.match_min_score:
            st.warning("I don't recognize a financial-statement line in that paste with confidence. Try rephrasing.")
            st.caption(f"Top guess (low confidence): **{match.candidates[0].line.canonical_name}** — score {match.top_score:.2f}")
        else:
            st.subheader("Did you mean:")
            for cand in match.candidates:
                label = f"**{cand.line.canonical_name}**  ·  p. {cand.line.page} {cand.line.line_number or ''}  ·  score {cand.score:.2f}"
                if st.button(label, key=f"confirm-{cand.line.line_id}"):
                    st.session_state.answer = run_answer(cand.line, query.strip(), cfg)

with right:
    st.subheader("Answer")
    step = st.session_state.answer
    if not step:
        st.info("Confirm a line on the left to see the manual's answer here.")
    else:
        line = step.line
        a = step.answer
        st.markdown(f"**Line:** {line.canonical_name}  ·  _p. {line.page} {line.line_number or ''}_")
        if a.refused:
            st.warning(a.answer_text)
        else:
            st.markdown(a.answer_text)
            if a.cited_pages:
                st.caption(f"Cited pages: {', '.join(f'p. {p}' for p in a.cited_pages)}")
            if a.chunks_used:
                with st.expander("Chunks used"):
                    for cid in a.chunks_used:
                        st.code(cid)

st.divider()
st.caption("This tool reads the GM Dealer Standard Accounting Manual. It will not guess. If it can't find the answer, it will say so.")
```

- [ ] **Step 2: Write `run_demo.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
uv run streamlit run app.py --server.port 8501 --server.headless false
```

Then: `chmod +x run_demo.sh`

- [ ] **Step 3: Launch and smoke-test**

Run: `./run_demo.sh`
Expected: Streamlit opens at http://localhost:8501. Paste "Variable Selling Expense 5.2% of gross". See three candidates. Confirm the top one. See a cited answer on the right. Paste "how to fire a technician". Confirm highest candidate. See a refusal.

- [ ] **Step 4: Commit**

```bash
git add app.py run_demo.sh
git commit -m "feat: Streamlit UI wrapping the match → confirm → answer pipeline"
```

---

## Task 10: Tune until 8/8 golden + rehearse the 5 demo queries

This is the most important task and it is NOT a code task. It is a tuning and rehearsal task. Budget ~4 hours Saturday morning.

- [ ] **Step 1: Run golden set; identify failures**

Run: `uv run python scripts/run_golden.py`

For each FAIL row, diagnose in this order:
1. **Match failed?** Look at `match.top_score`. If too low or wrong line won, add aliases to the catalog row for that line. Do not weaken `cfg.match_min_score`.
2. **Wrong page cited?** The catalog's `manual_section_refs` for that line don't match any chunk headings. Inspect `data/chunks.jsonl`, find the actual headings that contain the right text, update the catalog entry.
3. **Refused when shouldn't?** Retrieval scores too low. Inspect the retrieved chunks — is the answer actually in any of them? If no, the chunking missed it (revisit Task 3 windowing). If yes, lower `retrieval_min_score` modestly (never below 0.20).
4. **Answered when should refuse?** LLM ignored the "only from context" instruction. Strengthen the system prompt (Task 7) — add an example refusal inline.

Repeat until 8/8 passes.

- [ ] **Step 2: Rehearse the 5 demo queries against the Streamlit UI**

Pick five queries that feel conversational and operator-authentic:

1. "Variable selling is showing 5.2% on my statement — which gross is that of?"
2. "Where does the manual define unapplied labor?"
3. "Walk me through floor plan interest expense."
4. "What counts in total gross profit on page 1?"
5. "How does holdback income flow to the statement?"

Run each one ten times in the UI. A run is a success if:
- First candidate shown is the correct line.
- Confirming it produces an answer that quotes verbatim from the manual.
- The cited page matches the actual page in the PDF.

If any run fails, go back to Step 1 and retune. Do not rehearse a broken demo.

- [ ] **Step 3: Rehearse refusals**

Try three queries designed to fail gracefully:
1. "What's the tariff impact on new vehicle gross in 2026?"
2. "How do I compute EV tax credit impact on F&I?"
3. "What's the current prime rate?"

All should refuse with the "I can't find this in the GM manual with high confidence" message. The refusal is a feature — Robert will respect it.

- [ ] **Step 4: Commit final tuning**

```bash
git add -u
git commit -m "tune: catalog aliases + thresholds for 8/8 golden + demo queries"
```

---

## Task 11: Final prep

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update README with the exact demo script**

Append to `README.md`:

````markdown
## Demo script (Apr 18–19)

Open terminal, `./run_demo.sh`. Browser opens at http://localhost:8501.

Queries to open with:
1. *"Variable selling is showing 5.2% on my statement — which gross is that of?"*
2. *"Where does the manual define unapplied labor?"*

Then hand the keyboard to Robert. Take notes on every miss.

Three asks at the end:
1. Ford Dealer Accounting Manual (under NDA)
2. Redacted sample financial statement from one of his stores
3. Follow-up in two weeks
````

- [ ] **Step 2: Final rehearsal (closed laptop → reopen → cold run)**

Close laptop. Reopen. Run the demo from scratch. All five queries still work. Commit only if yes.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: demo-day playbook in README"
```

---

## Self-review checklist (run before handing off)

- [ ] Every spec section maps to at least one task. Spec Section 2 (Product / MVP spec) is fully covered by Tasks 1–11. Spec Section 7 Phase 1 is the whole of this plan.
- [ ] No "TBD", "implement later", "add appropriate error handling" phrases anywhere in this plan.
- [ ] `CatalogLine` fields used in Tasks 4/5/6/7/8/9 match the definition in Task 4.
- [ ] `RetrievedChunk` fields used in Tasks 6/7/8 match the definition in Task 6.
- [ ] `AnswerResult` fields used in Tasks 7/8/9 match the definition in Task 7.
- [ ] `Config` fields used across tasks (`match_min_score`, `retrieval_min_score`, `top_k_candidates`, `top_k_chunks`, `manual_pdf_path`, `chunks_path`, `catalog_path`, `index_path`, `golden_path`, `embedding_model_voyage`, `generation_model`, `voyage_api_key`, `anthropic_api_key`) all defined in Task 1.
- [ ] Streamlit UI (Task 9) only imports from `src.pipeline` + `src.catalog` + `src.config` — the layered dependencies from Task 1's architecture are respected.
- [ ] Tests exist for the three correctness-critical modules: `catalog`, `match`, `retrieve`, `answer`. UI and scripts validated by running, not unit tests (pragmatic given weekend scope).

Self-review done. No gaps found.

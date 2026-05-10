# Dealer CFO Copilot — Monorepo

Multi-tenant Retrieval-Augmented Generation (RAG) system over a car dealership
knowledge base. Started as a weekend GM-only demo, now a Next.js + FastAPI +
Elasticsearch product that cites verbatim source pages or refuses.

## Layout

| Folder | Stack | Purpose |
|---|---|---|
| `backend_rag/` | FastAPI, Elasticsearch, Claude CLI | Search + answer service. Per-user ES index with BM25 + dense vectors. |
| `frontend_website/` | Next.js, TypeScript, Tailwind | UI for upload, search, and answer with `[p. N]` citations. |
| `bp/` | Streamlit + Lance | Original weekend prototype + business plan / market notes. |
| `rag_knowledge_base/` | PDFs (NOT in git) | Source corpus: NADA, AICPA, IRS, OEM manuals, redacted statements. |

## What is *not* in this repo

- **PDFs** under `rag_knowledge_base/` — too large and partly under NDA. Only
  README-level folder structure is tracked.
- **`.venv/`, `node_modules/`, `.next/`, `.elasticsearch/`** — regenerable.
- **Per-user data** under `frontend_website/data/workspaces/` — user uploads.
- **`static_website/`** — lives in its own public repo for GitHub Pages.

See `.gitignore` for the full list.

## Restoring per-subrepo git history

Before collapsing into this monorepo, each of `backend_rag/`, `frontend_website/`,
`bp/` had its own local `.git`. Those are archived in
`.git_backups_subrepos.tar.gz` (also ignored). Untar to a scratch directory if
you ever need the old commit history.

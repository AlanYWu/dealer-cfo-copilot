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

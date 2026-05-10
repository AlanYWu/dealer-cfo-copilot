# _sample_statements — Redacted real dealer artifacts

Real-world statements and checklists, redacted. These aren't "reference" material — they're examples that let the RAG system ground its answers against the exact format Robert sees every day.

## Expected files

| Filename | Status | Source |
|---|---|---|
| `sample_gm_dealer_financial_statement_redacted.pdf` | 🤝 client-supplied | Robert — one of his GM dealer clients, redacted |
| `sample_ford_dealer_financial_statement_redacted.pdf` | 🤝 client-supplied | Robert — one of his Ford dealer clients, redacted |
| `sample_monthly_close_todo_redacted.pdf` | 🤝 client-supplied | **THE to-do spreadsheet** Robert actually works in, exported to PDF and redacted |
| `sample_variance_review_workpaper_redacted.pdf` | 🤝 client-supplied | Robert's actual variance workpaper, redacted |

## Redaction checklist (for Robert)

Before dropping a file here, scrub:
- Dealer name, DBA, and address
- GM / Ford dealer code
- Employee names
- Customer names and VINs on any detail schedule
- Absolute dollar amounts on the balance sheet (leave the ratios / percentages — those are what matter for RAG)

## Privacy

This folder is `.gitignore`'d by default — see `../.gitignore` (add one if absent). Never commit its contents to a shared repo.

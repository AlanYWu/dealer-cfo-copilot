# Car Dealership Knowledge Base (RAG Corpus)

Source PDFs for the Dealer CFO Copilot RAG pipeline. Target user: **Robert — financial consultant reviewing dealer month-end books**.

The pipeline (see `../../bp/`) chunks these PDFs with page numbers preserved and answers questions with verbatim citations. Every PDF here is either (a) an authoritative OEM / regulator / professional-body document, or (b) a redacted client artifact. **No generated or summarized content** — RAG citations must point at real source pages.

## Folder map

```
car_dealership_knowledge_base/
├── 00_common/                   brand-agnostic dealer accounting (NADA, AICPA, IRS, firm templates)
│   └── procedures/              month-end close, reconciliations, calculations
├── Chevrolet/                   GM-family brand — shares the GM manual via symlink
├── GMC/                         GM-family brand — shares the GM manual via symlink
├── Ford/                        Ford-specific (Robert must supply; NDA)
├── _shared_GM_family/           physical home of GM-family PDFs (one copy, symlinked)
└── _sample_statements/          redacted real dealer financial statements + close checklists
```

## How to add a document

1. Drop the PDF into the correct folder (see that folder's `README.md` for expected filenames).
2. Re-run the chunking + indexing scripts in `../../bp/` pointing at this corpus.
3. Add the filename + one-line provenance note to the folder README.

## Sourcing status legend

Each folder README lists expected PDFs with a status marker:

- ✅ **downloaded** — file is in the folder
- 🌐 **public, fetchable** — public URL known; run the download when ready
- 🔒 **dealer portal** — Robert pulls from GM Global Connect / FMCDealer
- 🤝 **client-supplied** — requires redaction / NDA handling
- 💰 **paywalled** — AICPA, NADA paid publications; purchase required

## Privacy

`_sample_statements/` holds redacted client material. Do not commit that folder to any shared repo without confirming the redaction pass.

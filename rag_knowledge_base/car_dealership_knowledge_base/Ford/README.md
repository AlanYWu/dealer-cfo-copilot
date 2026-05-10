# Ford

Ford is a separate family from GM — its accounting manual, dealer statement layout, and program documents are independent. Nothing here symlinks to `_shared_GM_family/`.

## Expected files

| Filename | Status | Source |
|---|---|---|
| `ford_dealer_accounting_manual.pdf` | 🤝 client-supplied (NDA) | **Robert must supply** — this is one of the "three asks at the end" of the GM demo per `bp/2026-04-16-weekend-gm-rag-demo.md` |
| `ford_floor_plan_program_guide.pdf` | 🔒 dealer portal | FMCDealer (Ford's equivalent of GM Global Connect) |
| `ford_incentive_and_holdback_bulletin.pdf` | 🔒 dealer portal | FMCDealer |
| `ford_warranty_policy_manual.pdf` | 🔒 dealer portal | FMCDealer |
| `ford_financial_statement_layout.pdf` | 🔒 dealer portal | FMCDealer |
| `ford_motor_credit_10k_fy2024.pdf` | ✅ downloaded | https://www.sec.gov/Archives/edgar/data/38009/000003800925000007/fmcc-20241231.htm — Ford Motor Credit Co LLC standalone 10-K, FY2024 (161p, Chrome-rendered from iXBRL HTML); floor-plan rate logic, loss reserves, rate-lock terms |
| `ford_motor_company_2024_annual_report.pdf` | ✅ downloaded | https://www.sec.gov/Archives/edgar/data/37996/000110465925029103/tm259451d1_ars.pdf — Ford parent annual report, FY2024 (226p native PDF); cross-references Ford Credit floorplan disclosures |

## Notes

- Ford dealer accounting manuals are NDA-protected. Do not share this folder's contents outside the engagement.
- Line numbering on the Ford financial statement **differs materially** from the GM statement. When the catalog (`bp/data/catalog.json` pattern) is extended to Ford, every `line_number` and `page` field must be re-sourced from Ford's statement — don't copy from the GM catalog.
- Build the Ford catalog as a **separate file** (e.g. `catalog_ford.json`), not by extending the GM one. Mixing brands in one catalog will confuse the fuzzy matcher.

# 00_common — Brand-agnostic dealer accounting

Reference material that applies across OEMs. This is where Robert turns for definitions, expense classification rules, KPI benchmarks, and firm-standard workpapers.

## Expected files

### Profitability benchmarks (added 2026-04-21 — drives "am I leaving money on the table" queries)

| Filename | Status | Source |
|---|---|---|
| `nada_data_2025_full_year.pdf` | ✅ downloaded | https://www.nada.org/media/4694/download — NADA Data 2025 Full-Year: avg dealership P&L, dept gross %, employment, F&I PVR |
| `nada_data_2025_mid_year.pdf` | ✅ downloaded | https://www.nada.org/media/4695/download — NADA Data 2025 Mid-Year supplement |
| `kerrigan_blue_sky_report_2025_annual_preview.pdf` | ✅ downloaded | https://www.kerriganadvisors.com/reports/bsr-quarterly-preview — blue sky multiples by brand, M&A activity, profitability trends |
| `kerrigan_dealer_survey_2025.pdf` | ✅ downloaded | Kerrigan 2025 Dealer Survey — what dealers say about OEM relationships, EVs, profitability outlook |

### Audit / accounting reference

| Filename | Status | Source |
|---|---|---|
| `irs_pub538_accounting_periods_and_methods.pdf` | ✅ downloaded | https://www.irs.gov/pub/irs-pdf/p538.pdf — LIFO, accrual vs cash, change-of-method |
| `niada_chart_of_accounts.pdf` | ✅ downloaded | https://www.frazerhelp.com/help-manual/niadachartofaccounts.htm — independent-dealer COA (NIADA), 7p; counterpart to the GM franchise COA in `_shared_GM_family/` |
| `nada_dealer_accounting_glossary.pdf` | 💰 paywalled | NADA Academy materials (NADA 20 Group glossary) |
| `nada_20_group_composite_definitions.pdf` | 💰 paywalled | NADA composite report methodology — line-by-line definitions Robert's clients get benchmarked against |
| `nada_expense_classification_guide.pdf` | 💰 paywalled | variable vs semi-fixed vs fixed rules per NADA |
| `aicpa_auto_dealer_audit_risk_guide.pdf` | 💰 paywalled | AICPA Audit and Accounting Guide: Dealerships |
| `fasb_asc606_revenue_recognition_summary.pdf` | 🌐 public, fetchable | FASB public summaries; full standard paywalled |
| `monthly_close_checklist_template.pdf` | 🤝 client-supplied | Robert's firm — THIS IS THE TO-DO SPREADSHEET SOURCE |
| `adjusting_entries_standard_library.pdf` | 🤝 client-supplied | Robert's firm |
| `variance_review_workpaper_template.pdf` | 🤝 client-supplied | Robert's firm |

### Industry data standards (added 2026-05-03 — defines the field-name vocabulary used across DMS systems)

| Filename | Status | Source |
|---|---|---|
| `star_dealer_infrastructure_guidelines_2024.pdf` | ✅ downloaded | https://www.starstandard.org/wp-content/uploads/2024/05/2024-STAR-Dealer-Infrastructure-Guidelines-DIG.pdf — 48p, foundational STAR DIG |
| `star_bod_repository_5_13_4.pdf` | ✅ downloaded | https://qa.starstandard.org/images/SIGXMLSTAR5/BOD.pdf — 284p, full STAR 5 BOD field reference (HoldbackAmount, FloorPlanInterestRate, etc.) |
| `star_bod_architecture_refactoring_v6.pdf` | ✅ downloaded | https://qa.starstandard.org/images/STAR/BODArchitectureRefactoring/BOD-Architecture-Refactoring-For-Web-Page.pdf — STAR 6 architecture brief |
| `star_standard_compliance_guidelines.pdf` | ✅ downloaded | https://qa.starstandard.org/images/SIGXML/STARStandardComplianceGuidelines.pdf — compliance rules |
| `star_vehicle_payments_dts_v1_1_1.pdf` | ✅ downloaded | https://qa.starstandard.org/images/SIGDTS/STARVehiclePayments.pdf — STAR Data Transfer Spec for vehicle payments |

### State franchise / warranty law (added 2026-05-03 — drives "is the OEM paying us correctly" queries)

| Filename | Status | Source |
|---|---|---|
| `nys_warranty_reimbursement_s5085b_2024.pdf` | ✅ downloaded | https://legislation.nysenate.gov/pdf/bills/2023/S5085B — NY S5085B as-passed (signed 2024-09-04); amends VTL § 465: retail-rate compensation, 1.5x manufacturer time, 30-day pay |
| `il_815_ilcs_710_6_warranty_reimbursement.pdf` | ✅ downloaded | https://www.lawserver.com/law/state/illinois/il-statutes/815_ilcs_710_6 — IL Motor Vehicle Franchise Act §710/6 (effective 2022-01-01), parts markup formula |

See `procedures/` for step-by-step procedure PDFs.

## Notes

- The three NADA documents are the highest-leverage purchase. They are cited routinely by dealer consultants and define the "20 Group composite" benchmarks Robert's clients compare against.
- The AICPA guide is the authoritative source for dealer-specific audit and accounting treatments. Annual subscription.
- Firm-supplied templates (`monthly_close_checklist`, `adjusting_entries_standard_library`, `variance_review_workpaper`) are the closest thing to the "to-do Excel spreadsheet" Robert actually works in. Convert Excel → PDF before dropping here, and keep the original `.xlsx` elsewhere so RAG can cite stable page numbers.

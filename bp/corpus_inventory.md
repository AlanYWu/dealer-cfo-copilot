# Corpus Inventory — RAG Knowledge Base

Snapshot of every document currently in `rag_knowledge_base/car_dealership_knowledge_base/`. Companion to `demo_questions.md` (the pitch script) and `robert_priority_questions.md` (the operator script). Use this file to answer "what can the tool actually cite today?" without grepping the filesystem.

**Counts:** 19 unique source PDFs across 4 logical buckets, plus 6 README files. Chevrolet/ and GMC/ contain only symlinks back to `_shared_GM_family/` — counted once.

---

## `00_common/` — brand-agnostic dealer accounting

The reference shelf every dealer engagement leans on: industry benchmarks, federal tax rules, state warranty law, the trade-association chart of accounts, and the STAR data-interchange specs.

| File | Size | What it is | Demo use |
|---|---|---|---|
| `nada_data_2025_full_year.pdf` | 2.0M | NADA's annual benchmark report — average new-car dealer P&L, F&I PVR, service absorption, etc. | Headline benchmark question (`demo_questions.md` Q1, Q2, Q4). |
| `nada_data_2025_mid_year.pdf` | 1.6M | Mid-year companion to the full-year NADA report. | Multi-doc retrieval — Q5 ("how did gross-per-unit change mid-year → year-end"). |
| `kerrigan_blue_sky_report_2025_annual_preview.pdf` | 3.6M | Buy-sell market intel: blue sky multiples by brand, deal volume, trends. | Enterprise-value framing (Q3); cross-doc synthesis with NADA. |
| `kerrigan_dealer_survey_2025.pdf` | 1.6M | Survey of dealer principals — OEM relationships, EV transition concerns, succession. | Group B Q6 (OEM/EV concerns). |
| `irs_pub538_accounting_periods_and_methods.pdf` | 1.2M | IRS publication on cash vs. accrual, LIFO/FIFO, accounting-period elections. | Tax-method partner-escalation questions (Robert priority §4). |
| `niada_chart_of_accounts.pdf` | 132K | NIADA standard chart of accounts for new- and used-vehicle dealers. | Staff onboarding / GL-mapping workflow (Robert priority §3). |
| `il_815_ilcs_710_6_warranty_reimbursement.pdf` | 396K | Illinois Motor Vehicle Franchise Act §6 — warranty labor & parts reimbursement requirements. | Warranty-reimbursement dispute workflow (Robert priority §2). |
| `nys_warranty_reimbursement_s5085b_2024.pdf` | 8.0K | New York S5085B (2024) warranty-reimbursement amendment. | Cross-state statute comparison. |
| `star_bod_architecture_refactoring_v6.pdf` | 836K | STAR (Standards for Technology in Automotive Retail) BOD architecture spec. | DMS plumbing reference for junior staff. |
| `star_bod_repository_5_13_4.pdf` | 1.5M | STAR BOD message repository (transactions, schemas). | Same. |
| `star_dealer_infrastructure_guidelines_2024.pdf` | 656K | STAR dealer IT/infra compliance guidelines. | Compliance / audit-prep questions. |
| `star_standard_compliance_guidelines.pdf` | 52K | STAR compliance overview. | Same. |
| `star_vehicle_payments_dts_v1_1_1.pdf` | 40K | STAR Data Type Specification for vehicle payments (DMS → accounting). | Junior-staff extract workflow (Robert priority §7). |

`00_common/procedures/` exists with a `README.md` only — placeholder for **firm-internal procedures** (month-end close checklist, reconciliation steps, standard adjusting entries). **Empty today; this is one of the three asks.**

---

## `_shared_GM_family/` — physical home of GM-brand PDFs

Single source of truth for any document that applies across Chevrolet + GMC + Buick + Cadillac. Chevrolet/ and GMC/ contain symlinks pointing here so the chunker can discover them per-brand without duplicating bytes.

| File | Size | What it is | Demo use |
|---|---|---|---|
| `gm_dealer_standard_accounting_manual.pdf` | 1.7M | The GM Dealer Standard Accounting Manual — the canonical statement-line reference. | The ENTIRE original `bp/` weekend plan; the "which gross?" disambiguation moment (Robert priority §1). |
| `gm_2024_annual_report.pdf` | 14M | GM's 2024 annual report (shareholder document). | Macro framing; not for line-level citations. |
| `gm_financial_10k_fy2024.pdf` | 3.5M | GM Financial (the captive lender) FY2024 10-K. | Floor-plan / wholesale-finance context. |
| `gm_global_labor_codes_bulletin_13_00_89_005.pdf` | 336K | GM service bulletin defining labor operation codes. | Service department / warranty-labor questions. |
| `gm_variable_diagnostic_time_allowances_18_NA_263.pdf` | 96K | GM bulletin on variable diagnostic time allowances. | Same — service ops billing. |

---

## `Chevrolet/` and `GMC/` — symlink dirs (zero unique content)

Each contains five symlinks back to `_shared_GM_family/`:
- `gm_dealer_standard_accounting_manual.pdf`
- `gm_2024_annual_report.pdf`
- `gm_financial_10k_fy2024.pdf`
- `gm_global_labor_codes_bulletin_13_00_89_005.pdf`
- `gm_variable_diagnostic_time_allowances_18_NA_263.pdf`

Plus a `README.md`. **No brand-specific PDFs yet.** When/if Chevrolet- or GMC-only documents are sourced (regional incentive bulletins, brand-specific service standards), they go in the brand folder directly, not `_shared_GM_family/`.

---

## `Ford/` — public Ford documents only

| File | Size | What it is | Demo use |
|---|---|---|---|
| `ford_motor_company_2024_annual_report.pdf` | 7.4M | Ford 2024 annual report. | Macro framing for cross-OEM benchmarks. |
| `ford_motor_credit_10k_fy2024.pdf` | 4.0M | Ford Motor Credit (captive) FY2024 10-K. | Floor-plan / wholesale finance context. |

**Missing — and it's the headline ask:** the Ford Dealer Accounting Manual itself. That is what unlocks the Ford-side equivalent of every `bp/` golden-set test for GM. NDA-bound; Robert has it.

---

## `_sample_statements/` — empty (intentional)

`README.md` only. Placeholder for **redacted client monthly financial statements** — the artifact needed to (a) build a Ford-statement catalog against a real layout and (b) demo the cross-doc benchmark question ("this dealer's used gross is X; how does that compare to NADA average?").

**Empty today; second of the three asks.**

---

## What's open (the three asks, mapped to corpus gaps)

| Ask | Lands in | Unlocks |
|---|---|---|
| Ford Dealer Accounting Manual (NDA) | `Ford/ford_dealer_accounting_manual.pdf` | Ford-side line-level catalog + statement disambiguation. |
| One redacted client monthly statement | `_sample_statements/<client>_redacted.pdf` | Cross-doc benchmark queries; statement-line catalog calibration. |
| Robert's firm monthly close checklist | `00_common/procedures/monthly_close_checklist.pdf` | The killer feature: ask the copilot any line on his checklist. |

---

## How to regenerate this inventory

```bash
cd /Users/alanwu/Documents/Working/rag/rag_knowledge_base
find car_dealership_knowledge_base -type f \( -name "*.pdf" -o -name "*.md" \) | sort
du -h car_dealership_knowledge_base/**/*.pdf
```

Re-run after any add. If you add a PDF, also update the relevant folder's local `README.md` (per the corpus root README's contribution guide).

# _shared_GM_family — Physical home for GM-family PDFs

Chevrolet and GMC share a single GM Dealer Standard Accounting Manual and one set of GM corporate program documents. To avoid duplicate PDFs (and duplicate embeddings), the real files live here and the brand folders symlink to them.

## Expected files

| Filename | Status | Source |
|---|---|---|
| `gm_dealer_standard_accounting_manual.pdf` | ✅ downloaded | http://gm.acctmanual.com/Misc/gm_acct_manual%20v2-2-1-1.pdf — same copy `bp/` uses |
| `gm_floor_plan_program_guide.pdf` | 🔒 dealer portal | GM Global Connect (Robert has access) |
| `gm_incentive_and_holdback_bulletin.pdf` | 🔒 dealer portal | GM Global Connect — latest year's program rules |
| `gm_warranty_policy_manual.pdf` | 🔒 dealer portal | GM Global Connect |
| `gm_financial_statement_layout.pdf` | 🔒 dealer portal | separate layout doc, or appendix of the accounting manual |
| `gm_2024_annual_report.pdf` | ✅ downloaded | https://www.sec.gov/Archives/edgar/data/1467858/000146785825000086/a2024annualreport.pdf — GM consolidated FY2024 annual report (120p) |
| `gm_financial_10k_fy2024.pdf` | ✅ downloaded | https://www.sec.gov/Archives/edgar/data/804269/000080426925000007/acf-20241231.htm — General Motors Financial Co Inc (CIK 804269) standalone 10-K (100p, Chrome-rendered from iXBRL); dealer floorplan rate-lock and loss-reserve detail |
| `gm_global_labor_codes_bulletin_13_00_89_005.pdf` | ✅ downloaded | https://static.nhtsa.gov/odi/tsbs/2013/MC-10130652-9999.pdf — GM Service Bulletin 13-00-89-005, "Warranty Administration – New Global Labor Codes"; explains the 7-digit GLC structure used in `gm_dealer_standard_accounting_manual.pdf` warranty entries |
| `gm_variable_diagnostic_time_allowances_18_NA_263.pdf` | ✅ downloaded | https://static.nhtsa.gov/odi/tsbs/2023/MC-10232143-0001.pdf — GM Service Bulletin 18-NA-263, "Variable Diagnostic Time Allowances (U.S. Only)"; warranty-claim labor-time policy |

## Symlinks

Each file here is symlinked from `Chevrolet/` and `GMC/` with the same filename. To add a new shared file:

```bash
cp new_doc.pdf _shared_GM_family/
ln -s ../_shared_GM_family/new_doc.pdf Chevrolet/new_doc.pdf
ln -s ../_shared_GM_family/new_doc.pdf GMC/new_doc.pdf
```

If a program ever diverges between Chevrolet and GMC (rare but possible — e.g., brand-specific incentives), move that specific file OUT of `_shared_GM_family/` and put separate physical copies in each brand folder.

# Questions Robert Actually Cares About

Companion to `demo_questions.md`. Where that file is the **pitch script** (industry-baseline → gap → enterprise value), this file is the **operator script**: the questions Robert would type into the tool *the Monday after he signs on*, when his junior staff is closing books for ten dealers.

The frame shift: the headline demo sells him on the citation moment. **What keeps him paying** is whether the tool answers the boring, recurring, line-by-line questions his firm bills hours for today.

Every question below is answerable from PDFs already in the corpus — no Ford / no client statements / no firm checklist needed yet.

---

## 1. The "which gross?" moment — his #1 stated pain

These are the disambiguation questions that prove the catalog + match flow earns its keep. Robert's complaint per the plan: clients (and junior staff) confuse the half-dozen "gross" definitions on the GM statement. The tool should make that confusion impossible.

1. **"My new-car department shows a 6.8% net-to-gross — which gross is the denominator?"**
   - Source: GM Dealer Standard Accounting Manual (already in corpus, multiple seeded paths).
   - Why it lands: this is the *exact* paste-from-statement → confirm → cited-definition flow the original plan was built around. Get this one right and the rest of the meeting is downhill.

2. **"Variable Selling Expense is showing 5.2% on this dealer's statement. Of what?"**
   - Source: GM manual. Already covered by `bp/data/golden.jsonl` g1.
   - Why it lands: same shape as #1 but with a line where the answer (Variable Gross, not Total Gross) is non-obvious even to seasoned controllers.

3. **"What's the difference between 'Total Gross Profit' on page 1 and the gross totals reported by department?"**
   - Source: GM manual. Tests cross-page synthesis.

---

## 2. Warranty reimbursement — real money, dispute-shaped

The corpus has IL `815 ILCS 710/6` and the NY `S5085B 2024` warranty reimbursement statutes. Dealers leave six- and seven-figure sums on the table every year because they do not push OEMs to the statutory cap. This is the "why does Robert's firm exist" workflow.

4. **"Under Illinois law, what is the maximum markup a dealer can charge the manufacturer on warranty parts, and what method must be used to establish the rate?"**
   - Source: `00_common/il_815_ilcs_710_6_warranty_reimbursement.pdf`.
   - Why it lands: the answer pays for the engagement on its own.

5. **"How does New York's 2024 warranty reimbursement statute differ from Illinois on labor-rate methodology?"**
   - Source: both warranty PDFs — exercises cross-document reasoning across two state statutes.

6. **"What documentation does a dealer need to assemble before submitting a warranty labor-rate increase request to the manufacturer?"**
   - Source: IL/NY statute PDFs.

---

## 3. NIADA chart of accounts — the staff-leverage workflow

Robert's firm onboards new dealer clients constantly. Mapping a client's GL to a standard chart is grunt work that today eats junior-staff hours.

7. **"In the NIADA chart of accounts, what account is used for 'parts inventory adjustments' and what is its normal balance?"**
   - Source: `00_common/niada_chart_of_accounts.pdf`.

8. **"List every account in the NIADA chart that rolls into 'Service Department Gross Profit' on the income statement."**
   - Source: NIADA chart — tests aggregation, not just lookup.

9. **"What's the standard NIADA account number for floor plan interest expense, and how is it different from other interest expense accounts?"**
   - Source: NIADA chart.

---

## 4. Tax-method decisions — the questions a partner gets pulled into

IRS Pub 538 is in the corpus. LIFO and accounting-period elections are the kind of question Robert's clients escalate to him personally. If the tool can give him a cited starting point, his junior staff can draft the memo.

10. **"What are the IRS requirements for a dealer to switch from LIFO to FIFO mid-year, and what form is required?"**
    - Source: `00_common/irs_pub538_accounting_periods_and_methods.pdf`.

11. **"Under Pub 538, when must a dealership use the accrual method instead of cash?"**
    - Source: IRS Pub 538.

---

## 5. The cross-doc benchmark — "this dealer vs. the world"

This is the moment that justifies the whole multi-OEM corpus. Robert's clients want to know not just "what's average" but "what's average *and* what does that gap imply for my exit value." That requires reading NADA + Kerrigan together.

12. **"My dealer's service absorption rate is 62%. NADA says what's average, and Kerrigan says what that gap means for blue sky multiple?"**
    - Sources: `nada_data_2025_full_year.pdf` + `kerrigan_blue_sky_report_2025_annual_preview.pdf`.
    - Why it lands: this is the synthesis question that no single PDF answers. If the tool nails it with two distinct citations, Robert sees the product, not the demo.

13. **"This Ford dealer's F&I PVR is $1,850. Where does that fall vs. NADA's 2025 average, and what does Kerrigan's survey say about F&I trends?"**
    - Sources: NADA Data + Kerrigan dealer survey.

---

## 6. Refusals — the trust signal he won't say out loud

Robert is a CPA. He has been burned by software that confidently makes things up. The tool earning his trust is the moment it *refuses to answer*. Run at least one of these in front of him.

14. **"What's a fair commission split for a sales associate at a Chevrolet dealership?"**
    - Expected behavior: refuse. The manual doesn't define commission policy.

15. **"What was Ford's used-car gross profit per unit in Q4 2025?"**
    - Expected behavior: refuse — the corpus has Ford's annual report and 10-K but not quarterly gross-per-unit. The refusal should suggest the right document type.

16. **"Should this dealer accept a buy-sell offer at 4x adjusted earnings?"**
    - Expected behavior: refuse — opinion, not citable.

---

## 7. STAR / DMS data plumbing — for the junior staff doing extracts

The STAR architecture PDFs are in the corpus and nobody on Robert's team has ever read them cover-to-cover. They're the kind of reference where "show me the relevant page" is worth more than "tell me the answer."

17. **"In the STAR vehicle-payments DTS, what fields are required when posting a deal payment from the DMS to the accounting system?"**
    - Source: `00_common/star_vehicle_payments_dts_v1_1_1.pdf`.

18. **"What are the STAR compliance guidelines for dealer infrastructure security as of 2024?"**
    - Source: `00_common/star_dealer_infrastructure_guidelines_2024.pdf`.

---

## How to use this list during the demo

- `demo_questions.md` Group A is still the **opening five minutes** — keep it.
- If Robert leans in after Group A, **don't go to Group B** (which is more benchmarks). Go to **Section 1 of this file** (the "which gross?" moment). That's where his face changes.
- If he asks "but does it help my staff?" — go to **Section 3** (NIADA chart) and **Section 7** (STAR).
- If he asks "what about the things I bill for?" — go to **Section 2** (warranty reimbursement). Statutory math = recoverable money.
- If he gets quiet, run one query from **Section 6** and let it refuse. That is when he reaches for his pen.

---

## What's deliberately not here

- Anything that requires the Ford accounting manual (covered by `demo_questions.md` Group C).
- Anything that requires a redacted client statement (Group C).
- Anything that requires Robert's firm's monthly close checklist (Group C).
- Speculative comparison questions across OEMs ("is GM or Ford more profitable per dealer in 2025") — the corpus has each company's 10-K but NADA averages collapse across brands, so the answer is fuzzy and the demo should not lead with it.

# Questions — Dealer CFO Copilot (Pitch + Operator)

Combined reference for the Robert demo. Two halves:

- **Part I — Pitch script** (from `demo_questions.md`): industry-baseline → gap → enterprise value. Run live during the headline demo.
- **Part II — Operator script** (from `robert_priority_questions.md`): the line-by-line questions Robert's firm bills hours for today. What keeps him paying after the demo lands.

The pitch frame: **"Make the dealer shop more profitable by knowing instantly where you stand vs. the average dealer — with citations Robert can show the client."**

Every question below is answerable from PDFs already in the corpus unless explicitly marked as a Group C "unlock" teaser.

---

# Part I — Pitch Script

## Group A — Headline demo (run these in order, ~5 min)

These three are sequenced to build a story: *industry baseline → this dealer's gap → what it's worth to fix.*

1. **"What was the average pre-tax net profit per franchised new-car dealership in 2025?"**
   - Expected source: `00_common/nada_data_2025_full_year.pdf`
   - Why it lands: opens with a number every dealer benchmarks against.

2. **"What percent of total dealership gross profit came from the service and parts department in 2025, and what is a healthy service absorption rate?"**
   - Expected source: `00_common/nada_data_2025_full_year.pdf`
   - Why it lands: fixed ops is where profitability hides; sets up the "are you absorbing?" conversation.

3. **"What is the current blue sky multiple range for a Ford dealership, and how has it moved over the past year?"**
   - Expected source: `00_common/kerrigan_blue_sky_report_2025_annual_preview.pdf`
   - Why it lands: translates operational gaps into enterprise value — the language Robert's clients care about most.

---

## Group B — Follow-up depth (if Robert engages)

4. **"What is the average F&I gross profit per vehicle retailed (PVR) in 2025?"**
   - Source: `nada_data_2025_full_year.pdf`

5. **"How did new-vehicle gross profit per unit change from mid-year 2025 to full-year 2025?"**
   - Source: both NADA Data PDFs — shows multi-doc retrieval.

6. **"According to dealers surveyed in 2025, what are the top concerns about OEM relationships and EV transition?"**
   - Source: `kerrigan_dealer_survey_2025.pdf`

7. **"Under IRS rules, what are the requirements for a dealer to elect the LIFO inventory method?"**
   - Source: `00_common/irs_pub538_accounting_periods_and_methods.pdf`
   - Why it lands: shows the copilot also answers the technical/tax questions, not just benchmarks.

---

## Group C — The "what unlocks if you give me X" teasers

State these verbally; do not run them. They become the natural close into the asks.

8. *"Once you give me the Ford accounting manual, I can answer: 'on the Ford monthly statement, which line is warranty receivable, and what does the manual say about reconciling it?'"*
   - Unlocks: `Ford/ford_dealer_accounting_manual.pdf`

9. *"Once you give me one redacted client statement, I can answer: 'this dealer's used-vehicle gross is X — how does that compare to NADA average?'"*
   - Unlocks: `_sample_statements/<client>_redacted.pdf` + cross-doc reasoning.

10. *"Once you give me your firm's monthly close checklist, I can answer any line on it: 'what's the standard adjusting entry for floor plan interest accrual?'"*
    - Unlocks: `00_common/monthly_close_checklist_template.pdf` + `adjusting_entries_standard_library.pdf`.

---

## The three asks (closing slide)

1. **Ford dealer accounting manual** (PDF, NDA — Robert has it)
2. **One redacted client monthly financial statement** (so the Ford catalog can be built against a real layout)
3. **Robert's firm monthly close checklist** as PDF (becomes the killer feature — "ask the copilot any line on your checklist")

---

## Demo mechanics notes

- Run each query and **show the citation popping out with page number** — that's the magic moment. Don't just read the answer; click into the source.
- If a Group A answer is fuzzy or wrong, do not try to defend it — say "this is exactly the kind of retrieval I'd tighten with your firm's vocabulary," and move on.
- Have the corpus folder open in Finder on a second window so Robert can *see* there are real PDFs being cited, not invented text.

---

# Part II — Operator Script (Questions Robert Actually Cares About)

The frame shift: the headline demo sells him on the citation moment. **What keeps him paying** is whether the tool answers the boring, recurring, line-by-line questions his firm bills hours for today.

> **A note on dealer-specific numbers:** we don't have access to Robert's clients' statements, his firm's checklist, or the Ford accounting manual yet. So the questions below are framed *cleanly* — definitions, statutes, chart-of-accounts lookups — without fabricated dealer numbers. The "paste from statement" workflow is still the magic; the way to demo it live is to **ask Robert mid-meeting to read a number off any statement on his desk**, then type it into the tool while he watches. That moment is more powerful with his real number than with one we made up.

## 1. The "which gross?" moment — his #1 stated pain

These are the disambiguation questions that prove the catalog + match flow earns its keep. Robert's complaint per the plan: clients (and junior staff) confuse the half-dozen "gross" definitions on the GM statement. The tool should make that confusion impossible.

1. **"What does the GM manual define as 'Variable Gross Profit', and how does it differ from departmental gross?"**
   - Source: GM Dealer Standard Accounting Manual, p. 564 (anchored on `bp/data/golden.jsonl` g4).
   - Why it lands: defines the term Robert's clients confuse most, with a citation to the page. Sets up #2, where Variable Selling Expense is computed *against* Variable Gross. If Robert has a statement on his desk, ask him to read the Variable Gross figure and offer to paste it — the tool ignores the number and returns the definition either way.

2. **"On the GM statement, 'Variable Selling Expense' is reported as a percentage. What gross figure is the denominator, per the manual?"**
   - Source: GM manual, p. 358 (anchored on `bp/data/golden.jsonl` g1).
   - Why it lands: the answer (Variable Gross, not Total Gross) is non-obvious even to seasoned controllers — and once Robert sees the citation, every junior-staff dispute about which gross to use ends.

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

12. **"What does NADA report as the average service absorption rate in 2025, and what does Kerrigan say about how absorption affects blue sky multiples?"**
    - Sources: `nada_data_2025_full_year.pdf` + `kerrigan_blue_sky_report_2025_annual_preview.pdf`.
    - Why it lands: this is the synthesis question that no single PDF answers. Robert can mentally substitute his client's absorption rate against the NADA benchmark while we're talking; if he wants it concrete, ask him for the figure and re-run live.

13. **"What is the average F&I gross PVR for new-car franchises in 2025 per NADA, and what does Kerrigan's dealer survey say about F&I trends going into 2026?"**
    - Sources: NADA Data + Kerrigan dealer survey.
    - Why it lands: cross-doc retrieval that lets Robert place any of his clients' F&I numbers against industry — without us needing to fabricate one.

---

## 6. Refusals — the trust signal he won't say out loud

Robert is a CPA. He has been burned by software that confidently makes things up. The tool earning his trust is the moment it *refuses to answer*. Run at least one of these in front of him.

14. **"What's a fair commission split for a sales associate at a Chevrolet dealership?"**
    - Expected behavior: refuse. The manual doesn't define commission policy.

15. **"What was Ford's used-car gross profit per unit in Q4 2025?"**
    - Expected behavior: refuse — the corpus has Ford's annual report and 10-K but not quarterly gross-per-unit. The refusal should suggest the right document type.

16. **"Should a dealer accept a buy-sell offer at 4x adjusted earnings?"**
    - Expected behavior: refuse — opinion, not citable. (Generic framing — no client number needed.)

---

## 7. STAR / DMS data plumbing — for the junior staff doing extracts

The STAR architecture PDFs are in the corpus and nobody on Robert's team has ever read them cover-to-cover. They're the kind of reference where "show me the relevant page" is worth more than "tell me the answer."

17. **"In the STAR vehicle-payments DTS, what fields are required when posting a deal payment from the DMS to the accounting system?"**
    - Source: `00_common/star_vehicle_payments_dts_v1_1_1.pdf`.

18. **"What are the STAR compliance guidelines for dealer infrastructure security as of 2024?"**
    - Source: `00_common/star_dealer_infrastructure_guidelines_2024.pdf`.

---

## How to use Part II during the demo

- Part I Group A is still the **opening five minutes** — keep it.
- If Robert leans in after Group A, **don't go to Group B** (which is more benchmarks). Go to **Section 1 of Part II** (the "which gross?" moment). That's where his face changes.
- If he asks "but does it help my staff?" — go to **Section 3** (NIADA chart) and **Section 7** (STAR).
- If he asks "what about the things I bill for?" — go to **Section 2** (warranty reimbursement). Statutory math = recoverable money.
- If he gets quiet, run one query from **Section 6** and let it refuse. That is when he reaches for his pen.

---

## What's deliberately not here

- Anything that requires the Ford accounting manual (covered by Part I Group C).
- Anything that requires a redacted client statement (Group C).
- Anything that requires Robert's firm's monthly close checklist (Group C).
- Speculative comparison questions across OEMs ("is GM or Ford more profitable per dealer in 2025") — the corpus has each company's 10-K but NADA averages collapse across brands, so the answer is fuzzy and the demo should not lead with it.

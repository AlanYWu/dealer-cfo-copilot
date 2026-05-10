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

# Part II — Monday-Morning CFO Queries

The frame shift: Part I sells Robert on the citation moment. **Part II is the questions that keep him paying** — not because they help his junior staff, but because they save *him* time on the work that lands in his inbox every Monday.

> **A note on the audience.** Robert is an experienced NY-based CPA serving multiple franchised-dealer clients. He already knows "which gross is which," "where unapplied labor codes to," and how to read a manufacturer's financial statement — he taught us those concepts on 03/28; they were domain education for us, not problems he wants the tool to solve. The demo loses him if it shows the tool doing things he already does in his head. What earns trust is the tool answering questions he *doesn't* have memorized: recent statutes, market intel he'd otherwise spend an hour digging for, and cross-document synthesis no single PDF resolves.

> **A note on dealer-specific numbers.** We don't have his clients' statements, his firm's checklist, or the Ford accounting manual yet. Every question below is answerable from the public corpus without fabricated client numbers. To make the demo concrete, invite Robert to forward a real client question (or read a number off any statement on his desk) and we'll re-run the query live with his data.

---

## 1. Recent statutes — money on the table for clients

These are 2024-recent enough that even Robert hasn't read the text cover-to-cover. The cited answer is something he can paste into a client email that afternoon.

1. **"Under New York S5085B (2024), what specific new requirements apply to how manufacturers must reimburse dealers for warranty parts and labor, and what changed from prior NY law?"**
   - Source: `00_common/nys_warranty_reimbursement_s5085b_2024.pdf`.
   - Why it lands: 2024 amendment in his state; recoverable money for clients; citation he can forward.
   - Caveat: NY file is only 8KB — it's the amendment text alone. Keep questions narrow to what the amendment specifically changes; broad NY framework questions will retrieve thin.

2. **"How does NY S5085B (2024) differ from Illinois 815 ILCS 710/6 on labor-rate methodology and dispute resolution?"**
   - Sources: NY + IL warranty PDFs (cross-state retrieval).
   - Why it lands: cross-document; useful when his clients have multi-state operations.

3. **"Under IRS Pub 538, what are the requirements for a dealer to elect or change LIFO inventory method, and what form is required?"**
   - Source: `00_common/irs_pub538_accounting_periods_and_methods.pdf`.
   - Why it lands: tax-method elections are partner-escalation territory; cited starting point for memos.

---

## 2. Buy-sell market intel — the highest-stakes client conversation

When a dealer principal asks *"should I sell now?"* Robert needs current market data with citations he can email back. Numbers are buried across multi-MB Kerrigan PDFs he doesn't have time to read.

4. **"Per Kerrigan's 2025 annual report, what is the current blue sky multiple range for Ford, GM (Cadillac/Buick/GMC), and Toyota franchises, and which brands moved most over the past year?"**
   - Source: `00_common/kerrigan_blue_sky_report_2025_annual_preview.pdf`.
   - Why it lands: cross-OEM lookup from a long doc; direct input to client buy-sell conversations.

5. **"What specific concerns about OEM relationships and EV transition did dealer principals express most in Kerrigan's 2025 dealer survey?"**
   - Source: `00_common/kerrigan_dealer_survey_2025.pdf`.
   - Why it lands: market sentiment Robert references in client meetings; cited findings he can forward.

---

## 3. Cross-doc synthesis — questions no single PDF answers

This is where the multi-doc corpus justifies itself. The tool does what Robert would otherwise have to do by reading two reports side-by-side.

6. **"What does NADA report as the average service absorption rate in 2025, and what does Kerrigan say about how absorption affects blue sky multiples?"**
   - Sources: `nada_data_2025_full_year.pdf` + `kerrigan_blue_sky_report_2025_annual_preview.pdf`.
   - Why it lands: synthesis question; two distinct citations from two distinct PDFs.

7. **"How did new-vehicle gross profit per unit move from NADA's 2025 mid-year report to the full-year report, and what does Kerrigan's dealer survey say principals attribute the change to?"**
   - Sources: NADA mid-year + full-year + Kerrigan dealer survey.
   - Why it lands: trajectory + cause from three documents at once. Hard to fake.

---

## 4. Refusals — the trust signal he won't say out loud

Robert is a CPA who has been burned by software that confidently makes things up. The tool earning his trust is the moment it *refuses to answer*. Run at least one in front of him.

8. **"What's a fair commission split for a sales associate at a Chevrolet dealership?"**
   - Expected behavior: refuse — the manual doesn't define commission policy.

9. **"What was Ford's used-car gross profit per unit in Q4 2025?"**
   - Expected behavior: refuse — the corpus has Ford's annual report and 10-K but not quarterly gross-per-unit. The refusal should suggest the right document type.

10. **"Should a dealer accept a buy-sell offer at 4x adjusted earnings?"**
    - Expected behavior: refuse — opinion, not citable. (Generic framing — no client number needed.)

---

## How to use Part II during the demo

- Part I Group A is still the **opening five minutes** — keep it.
- The two highest-leverage demo picks for an experienced CFO: **Section 1 #1** (NY S5085B specifics) and **Section 2 #4** (cross-OEM blue sky). Both are questions Robert would type Monday at 9am; both produce a citation he can forward to a paying client.
- If he asks *"can it pull from multiple sources?"* — go to **Section 3** (cross-doc synthesis).
- If he gets quiet, run one query from **Section 4** and let it refuse. That's when he reaches for his pen.

---

## What's deliberately not here

- "Which gross?" / "where does Variable Selling Expense get its denominator?" / "where does unapplied labor post in the chart of accounts?" — Robert taught us these concepts on 03/28; they're not what he'd ask the tool. Showing him the tool answering them implies we think his job is harder than it is.
- NIADA chart-of-accounts lookups and STAR/DMS plumbing — staff-leverage workflows he delegates or doesn't touch personally.
- Anything that requires the Ford accounting manual (Part I Group C — verbal teaser only).
- Anything that requires a redacted client statement (Group C).
- Anything that requires Robert's firm's monthly close checklist (Group C).
- Speculative cross-OEM comparisons ("is GM or Ford more profitable per dealer in 2025?") — the corpus has each company's 10-K but NADA averages collapse across brands; the answer would be fuzzy.

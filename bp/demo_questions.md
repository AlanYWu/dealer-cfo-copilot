# Demo Questions — Dealer CFO Copilot Pitch to Robert

Sample queries to run live during the demo. Each is answerable from PDFs **already in the corpus** (no NDA Ford docs required). Group A is the headline demo; Group B is for follow-up if Robert asks "what else can it do?"; Group C teases what unlocks once he supplies his materials.

The pitch frame: **"Make the dealer shop more profitable by knowing instantly where you stand vs. the average dealer — with citations Robert can show the client."**

---

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

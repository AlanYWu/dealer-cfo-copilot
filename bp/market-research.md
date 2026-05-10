# Margin — Market Research

**Date:** 2026-05-09
**Compiler:** A. Wu (web research run via Claude)
**Scope:** Competitive landscape for a vertical RAG copilot serving dealer principals and dealer-group CFOs, plus a check on the **Folio** name option.

---

## TL;DR

- **Nobody is building exactly this.** No public product targets the intersection of (a) vertical-specific dealer accounting, (b) OEM manual reference corpus, (c) NADA/Kerrigan benchmark integration, and (d) cite-or-refuse trust posture.
- **Closest analogs cover one axis each:** Tekion (operational AI inside the DMS), NCM Associates (benchmarking via human-mediated 20 Groups), Microsoft Copilot for Finance (generic).
- **Biggest threat:** Tekion bolting on manual-RAG once the use case is proven. **Biggest wedge:** NCM 20 Group distribution.
- **Naming:** the competitive set runs short, professional, ownable names (CDK, Reynolds & Reynolds, NCM, NADA, Tekion, Numa, Flai). **Margin** fits this register. **Folio** does *not* — independent of fit, the name is heavily contested in 2026 SaaS and not viable.

---

## What Margin actually is

A vertical AI copilot for dealer principals and dealer-group CFOs. Reads the OEM Dealer Standard Accounting Manuals (GM, Ford), the industry benchmarks (NADA Data, Kerrigan reports), the regulatory references (IRS Pub 538, NIADA, state warranty laws), and any documents the user uploads themselves. Answers any question against that corpus by returning a verbatim quote with PDF page citation side-by-side, or refusing on the record when nothing scores. Multi-tenant, per-user index — Robert can drop in his firm's monthly close checklist and his clients' redacted statements.

---

## Direct competitors

None found as of May 2026. The four-axis intersection (vertical / reference layer / benchmarks / cite-or-refuse) is unclaimed.

---

## Adjacent landscape by axis

### Operational AI inside the DMS

- **Tekion** — Cloud-native DMS with "agentic AI" wired across sales, service, accounting, and analytics. The biggest *platform-incumbent* threat: they have the dealers, the AI mandate, and the engineering velocity to bolt on manual-RAG once the category is proven. Today their AI is operational (auto-generate reports, reconcile transactions, surface anomalies), not a reference/research tool — nobody at Tekion is RAG-ing the GM Dealer Standard Accounting Manual.
- **CDK Global / Reynolds & Reynolds / Dealertrack** — Incumbent DMS systems. Accounting modules exist; manual-RAG does not. Historically slow to ship category-defining AI; CDK is also still managing fallout from the June 2024 ransomware incident.

### Benchmarking against industry averages

- **NCM Associates** — *The* dominant benchmarking play. Originated the "20 Group" peer-comparison model in **1947**. Each member receives a custom monthly composite vs. industry data; data is processed in-house, never sent to a vendor. The closest analog to Margin's value prop on the benchmarking axis — but human-mediated (consultants + monthly cohorts + quarterly meetings), no real-time AI, no document retrieval. NCM has no product team in the modern-SaaS sense.
- **NADA 20 Group Live** — NADA's tool for real-time comparison of dealership performance vs. average and best-of-class dealers. Tabular; no document retrieval; no manual citation.

### Generic finance copilots

- **Microsoft Copilot for Finance** — General-purpose. No knowledge of dealer accounting structure, OEM account numbers, or NADA averages. Useful for everything except specific dealer questions; useless on the OEM manuals.
- **BlackLine** — Accounting reconciliation automation. Sometimes mentioned in dealer contexts for floorplan reconciliation, but not vertical-specific and not manual-aware.

### Dealer-AI startups in non-overlapping lanes

- **Flai** (Y Combinator 2025) — customer-experience AI (buying / selling / servicing).
- **Numa** — service-bay customer communication AI.
- **Impel** (formerly SpinCar) — sales-floor conversational AI.

None of these touch accounting, manuals, or CFO benchmarking.

### Vertical RAG analogs in other industries (the playbook)

- **Harvey** (legal) — established the pattern: vertical corpus, citation-or-refuse trust posture, white-shoe distribution. Existence proof that the model works.
- **Hebbia** — finance research RAG.
- **Glean** — enterprise search.
- **Casetext / Co-Counsel** — legal.
- **Vectara**, **PaperQA** — generic RAG infrastructure.

The pattern works. Nobody has done it in dealer.

---

## The unclaimed intersection

| Axis                                            | Who owns it today                                | What's missing                                |
|-------------------------------------------------|--------------------------------------------------|-----------------------------------------------|
| Vertical-specific dealer accounting             | NCM (services), DMS incumbents (operational)     | RAG · real-time · citation                    |
| OEM manual reference layer                      | Nobody                                           | The manuals are unread by any product         |
| Cite-or-refuse trust                            | Harvey-style products in other industries        | Dealer-vertical absent                        |
| NADA/Kerrigan benchmark integration             | NCM (manual), NADA 20 Group Live (tabular)       | Combined with manual citation: nobody         |

Margin sits in the corner of this matrix.

---

## Strategic implications

1. **Defensibility = corpus depth + trust posture.** The 30+ PDFs spanning Chevrolet/Ford/GMC/shared-GM/`00_common` is real moat — assembling the equivalent corpus is weeks of dealer-domain work, not hours. The cite-or-refuse rule is a *cultural* moat that incumbent DMS struggles to commit to: their UX leans toward "always answer," and reversing that is product surgery.
2. **Tekion is the watch-out.** They have the platform, the AI mandate, and the dealer relationships. If Margin shows Robert-style traction publicly, Tekion can ship a "Manual Search" feature within a quarter. Counter-move: become the *cross-DMS* reference layer — usable by Tekion dealers *and* CDK dealers *and* Reynolds dealers — before they react. Cross-DMS independence is the only stable position against any one DMS vendor.
3. **NCM is the wedge, not the rival.** NCM 20 Group members *are* the target buyer profile. NCM has the trust, the cohort relationships, and no software product. A co-sell — "Margin is the official software companion to your 20 Group composite" — is the fastest distribution. Worth a direct conversation early.
4. **NADA is institutional credibility.** NADA Data is already in the corpus. An official partnership ("Margin licensed for use with NADA 20 Group Live data") would be defensive moat against Tekion and a real signal to skeptical CFO buyers.
5. **The Harvey playbook is the model.** Vertical RAG, white-shoe distribution (NCM/NADA equivalent of legal's Wachtell/Skadden), citation-or-refuse rule, expand from one role (CFO/principal) to adjacent roles (controller, GM, OEM auditor, dealer-group CPA firm) once proven.

---

## On naming, given the landscape

The competitive set runs short, professional, ownable names: **CDK**, **Reynolds & Reynolds**, **NCM**, **NADA**, **Tekion**, **Numa**, **Flai**.

What this implies for our short-list:

- **Margin** (current pick). Fits this register. Short, professional, dual-meaning (profit margin × page margin), ownable. Holds up next to Tekion. Recommended.
- **Folio** (alternate considered, **not viable**). Independent of fit, the name is heavily contested in 2026 SaaS:
  - **usefolio.ai** — *agent's document review plugin*. Directly competitive category.
  - **folioai.com** (Quantus Labs) — AI sales-agent platform.
  - **foliosi.com** — *FOLIO Spatial Intelligence*, project-management software for furniture **dealers**. Word collision in an adjacent industry.
  - **folio3.ai / folio3.com** — large digital-transformation consultancy with AI brand.
  - **usefolio.com** — contracts/risk/compliance SaaS.
  - **getfolio.io**, **folio.co** — additional active SaaS uses.
  - **Folio Investments** — fintech, acquired by Goldman Sachs 2020.

  Trademark in software classes (9 / 42) is materially harder given *usefolio.ai*; domain options are compounds; SEO/word-of-mouth steers to competitors. Recommend dropping.
- **Forecourt** would feel boutique next to Tekion/Reynolds and may not signal professional weight to a controller buyer.
- **Marginalia / Verbatim** would read as literary or punny in a buyer market that respects directness.

**Recommendation:** stay with **Margin**. Re-validate via formal trademark search (USPTO Class 9 / Class 42) and domain audit before incorporation.

---

## Open questions / next research rounds

1. **Tekion's 2025–2026 AI feature roadmap.** Are they shipping anything manual-aware? Pull their last four product updates.
2. **NCM's software roadmap.** They have an OEM-solutions / benchmarking-software arm at ncmassociates.com/oem-solutions — how active is it? Could it be an acquisition target *for* a competitor?
3. **CDK / Reynolds AI strategy post-CDK-ransomware.** Are the incumbents cycle-locked or quietly building?
4. **AI VC dealer-vertical signals.** Which funds have made dealer-AI bets in 2025 (Flai-adjacent)? That's where the comp set for fundraising lives.
5. **Compliance footprint of the 20 Group data motion.** Is there a regulator (FTC dealer rule, state DOR, OEM franchise requirements) that affects how a benchmark partnership is structured?
6. **Robert's own short list.** What did he evaluate before this conversation? He has the strongest read on what dealer principals already tried and rejected.

---

## Sources

- [Tekion — End-to-End AI-Native Automotive Retail Platform](https://tekion.com/)
- [NCM Associates — Automotive Benchmark Reports](https://ncmassociates.com/dealer-solutions/benchmark-reports)
- [NCM Associates — Automotive 20 Groups](https://ncmassociates.com/services/20-groups)
- [NCM Associates — OEM Solutions](https://ncmassociates.com/oem-solutions)
- [NADA 20 Group](https://www.nada.org/nada/nada-20-group)
- [Flai — AI for car dealerships (TechCrunch, Oct 2025)](https://techcrunch.com/2025/10/03/flai-is-the-latest-startup-bringing-ai-to-car-dealerships/)
- [Numa — AI for Automotive Dealerships](https://www.numa.com/)
- [Microsoft Copilot for Finance](https://www.microsoft.com/en-us/microsoft-365/blog/2024/02/29/introducing-microsoft-copilot-for-finance-transform-finance-with-next-generation-ai-in-microsoft-365/)
- [Citrin Cooperman — Leveraging AI to Improve Dealership Efficiency](https://www.citrincooperman.com/In-Focus-Resource-Center/Leveraging-AI-to-Improve-Your-Dealership-s-Efficiency)
- [Kruse Control — How to Read a Dealership Financial Statement](https://www.krusecontrolinc.com/how-to-read-a-dealership-financial-statement-practical-guide/)
- [Folio AI — folioai.com (Quantus Labs)](https://folioai.com/terms-and-conditions)
- [usefolio.ai — agent's document review plugin](https://www.usefolio.ai/)
- [FOLIO Spatial Intelligence — software for furniture dealers](https://foliosi.com/features/)
- [Folio3 AI — consultancy](https://www.folio3.ai/)
- [usefolio.com — Contracts, Risk & Compliance SaaS](https://usefolio.com/)
- [Folio — Crunchbase profile](https://www.crunchbase.com/organization/folio-b51d)

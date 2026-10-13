---
name: tech-review
description: >-
  Vets a new technology (library, framework, tool, CLI, skill, API, service,
  pattern — anything) on its own merits: is it genuinely worth it, or is it
  hype/bait? Researches what it is, what it's for, what it does well and
  badly, checks claims against evidence, looks for bait signals (inflated
  benchmarks, astroturfed stars, rug-pull licensing, vaporware), rates it on
  a scam→legendary scale, and gives a worth-it / bait verdict. Use when the
  user shares a new tech and asks "is this worth it", "is this legit", "is
  this hype", "review this library", "check out this tool", or asks to
  evaluate/vet a technology.
---

# Tech Review

Evaluate **one technology** on its general merit. Produce a short, human-readable report that educates the reader, then judge whether it's **genuinely worth it or bait** — hype, marketing, or a trap dressed up as a breakthrough. This is project-agnostic: judge the tech itself, not its fit to any particular codebase.

**Require a target.** The user must name the tech (package, repo, tool, CLI, API, service, pattern, or a link). If none is given, ask for it. One tech per run — if the user names several, ask which one or run them one at a time.

---

## GOAL

Deliver a single short report with these parts, in order:

1. **What it is** — 1-2 sentences. Category (library/tool/service/pattern/etc.), what it actually does — stripped of marketing language.
2. **What it's aimed at** — the problem space, primary use cases, and who the realistic audience is.
3. **Does well / Falls short** — two tight bullet lists. Honest strengths and real weaknesses (maturity, performance, maintenance, lock-in, footguns, cost).
4. **Claims vs reality** — the headline claims it makes, each checked against evidence: holds up / overstated / unverified / false.
5. **Bait check** — the red and green flags found (see BAIT SIGNALS). Bullets, each backed by a concrete fact.
6. **Alternatives** — 1-3 established options it competes with, one line each on how it compares.
7. **Rating** — one tier on the scam→legendary scale, scored by real-world merit, not hype.
8. **Verdict** — Worth it / Bait / Wait and see, in one short paragraph with the deciding reason and who it's actually worth it for.

Optimize the whole thing for fast human reading. Terse. No filler.

---

## RATING SCALE (scam → legendary)

Rate by **real, evidenced value**, not popularity or launch buzz.

- 🚫 **Scam** — bait. Claims don't hold, abandoned, deceptive, or net-negative to adopt.
- ⚠️ **Sketchy** — immature, unproven, or with serious risk (licensing, funding, single maintainer); hype outruns evidence.
- 😐 **Meh** — works, but nothing a mature alternative doesn't already do as well or better.
- 👍 **Solid** — real value, honest claims, healthy project; modest but genuine wins.
- 🔥 **Great** — clearly better than alternatives for its target use cases, with evidence to back it.
- 🏆 **Legendary** — genuinely changes how the problem is solved; proven, durable, widely validated.

State the tier with its emoji and one sentence justifying it with evidence.

---

## BAIT SIGNALS

Actively look for these. Report the ones you find; don't list ones you didn't.

**Red flags (bait):**

- Benchmarks that are self-run, cherry-picked, unreproducible, or compare against outdated/misconfigured competitors.
- Star/download counts out of line with real usage (star spikes, few dependents, empty issues, no real-world write-ups).
- Marketing outruns docs: landing page polish, "10x / revolutionary / kills X" language, thin or missing docs and examples.
- Vaporware: features announced, waitlisted, or "coming soon" rather than shipped.
- Rug-pull risk: VC-backed open-core, recent or likely license change (e.g. to BSL/SSPL), CLA that enables relicensing, free tier that looks like a funnel.
- Lock-in: proprietary formats, hosted-only, hard-to-exit data or APIs.
- Maintenance decay: stale releases, ignored issues/PRs, single maintainer, high churn of breaking changes.
- Hidden costs: telemetry on by default, usage-based pricing cliffs, required accounts or network calls.
- Astroturfing: launch-day hype from affiliated accounts, sponsored "reviews", no independent critique.

**Green flags (worth it):**

- Independent, reproducible benchmarks or third-party evaluations.
- Real production users who wrote about it (incl. the downsides).
- Steady release cadence, responsive maintainers, multiple active contributors or a foundation behind it.
- Permissive, stable license; easy exit path; open formats.
- Docs that admit limitations and say when *not* to use it.

---

## CONSTRAINTS

- **Keep it short.** The whole report should be skimmable in well under a minute. Lists over prose.
- **Research before judging.** Don't rate from memory — confirm what the tech is and its current state.
- **Evidence over claims.** The project's own site, README, and launch posts are claims, not evidence. Seek independent sources (issues, discussions, third-party write-ups, benchmarks, dependents).
- **Project-agnostic.** Judge the tech on its own. Don't scan or reference the current repo unless the user explicitly asks for a fit check.
- **One tech per report.** Alternatives get a line each, not a second full review.
- **No code changes.** This is an evaluation; do not install, add deps, or edit source.

---

## HARD INVARIANTS

- **Research → Claims check → Bait check → Rating → Verdict, in that order.** Never lead with the verdict.
- **Every flag cites a concrete fact** (date, number, link, quote). No vibes.
- **The rating reflects evidenced merit**, not stars, funding, or social-media buzz.
- **The verdict names the deciding reason** (the one thing that tips it), not just a vote.
- **Honesty over hype.** If it's bait, say so plainly. If it's legendary, don't hedge.

---

## NON-GOALS

- Not a codebase fit assessment or integration plan (offer one as a follow-up if the user wants it for a specific project).
- Not a tutorial or full docs — link out instead of explaining every feature.
- Not a multi-tech bake-off — one tech, one report.

---

## EXECUTION ORDER (MANDATORY)

1. **Identify** — Pin down exactly what the tech is. Use the package name / repo / link. If it's an LLM/Claude/Anthropic-related tech, read the `claude-api` skill first.
2. **Research** — Use `WebSearch` / `WebFetch` to confirm: purpose, use cases, maturity (first/last release, stars vs dependents, issue activity, contributors), funding/ownership, license and license history, pricing, known weaknesses.
3. **Check claims** — List the headline claims and test each against independent evidence.
4. **Bait check** — Walk the BAIT SIGNALS list; record only flags backed by facts.
5. **Compare** — Name the established alternatives and how it stacks up.
6. **Rate** — Pick one tier on the scam→legendary scale, justified by evidence.
7. **Verdict** — Worth it / Bait / Wait and see, with the deciding reason and who it's worth it for.
8. **Output** — Render the report in the GOAL structure. Keep it short.

---

## EDGE CASES & NOTES

- **Brand-new tech** (days/weeks old): little evidence exists by definition. Say so, lower confidence, and default to `Sketchy` / `Wait and see` unless the backing is exceptional (proven team, foundation, independent validation).
- **Good tech, bad business model:** separate the two. A solid tool with rug-pull licensing risk can be `Solid` with a verdict that warns about the exit path.
- **Popular but outdated:** high stars can be legacy momentum. Check whether newer alternatives have superseded it.
- **Niche but excellent:** low stars aren't a red flag on their own if the audience is small and the evidence is strong.
- **Hosted services / APIs:** weigh pricing transparency, data handling, uptime history, and exit cost more heavily than for libraries.
- **If research is inconclusive**, say so rather than guessing — an honest `Wait and see` beats a confident wrong call.
- **Follow the repo prompt shape** — GOAL, CONSTRAINTS, HARD INVARIANTS, NON-GOALS, EDGE CASES. One blank line between blocks; no stacked blank lines.

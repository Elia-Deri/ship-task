---
name: pricehunt-review
description: >-
  Project code review for PriceHunt — use this, not the mattpocock-skills code-review, when
  reviewing changes in this repo. Guides constructive, systematic code and PR review: mindset,
  feedback style, phased workflow, severity labels, and deep-dive references. Tailored for
  PriceHunt (ASP.NET Core / .NET 10 / C# server with EF Core + SQLite in server/, Angular 22
  standalone + signals + Material client in client/, live supplier price streaming with timeout
  and cancellation). Use when reviewing PRs or diffs, auditing security or architecture,
  mentoring via review, or aligning on review standards. Optional: run dotnet build / dotnet test
  / ng build / ng test when verifying changes.
---

# Code review (PriceHunt)

Upstream source: [awesome-skills/code-review-skill](https://github.com/awesome-skills/code-review-skill). This project copy adds **Claude Code** usage notes and **repo-specific** review focus. Generic topic details live under `reference/` and `assets/` next to this file. The repo's own rules are in `CLAUDE.md` — when this file and `CLAUDE.md` disagree, `CLAUDE.md` wins.

## When to use

- Reviewing pull requests, branches, or pasted diffs
- Architecture or security pass on a change set
- Reviewing the user's own Angular / C# code as a learning aid

## Personal review profile (elia)

> **Primary.** Apply this profile first when reviewing or rewriting code. The generic sections below are fallback context, not overrides.

### Reviewer is also a translator

The author is a React + Node/NestJS engineer new to Angular and C#. For every finding that stems from an unfamiliar framework idiom, add one line mapping it to the React / Nest equivalent (e.g. "`@for` without a stable `track` ≈ React list with `key={index}`"). Point to the idiomatic fix; don't rewrite whole files unless asked.

### Depth — read the code, don't skim the diff (mandatory)

Go **deeper than the diff**. Open the changed files and their close collaborators (the service behind a controller, the DbContext / entity a query touches, the component consuming a service signal, the DTO on both sides of the wire), and reason about the actual values that flow through — not just the lines that changed.

On **every** review, actively hunt these three classes in addition to logic/correctness:

- **Naming** — names that lie or mislead (`price` holding a float or major units when money is always `long` minor units; a `*Minor` suffix, which the project dropped by decision; `handle*`/`on*` on internal methods or outputs; non-`is/has/should` booleans; C# async methods missing `Async`; vague identifiers).
- **Typing** — `any` leaks, `!` null-forgiving in C# or TS to silence the compiler, untyped forms, loose object types that should be a shared interface / C# `record`, validators typed to the trusted target instead of `unknown`.
- **Redundancy** — dead defensive code, `catch` blocks that swallow, stored derived state (a stored "responded count", a sorted copy kept beside the source list), logic duplicated between client and server, unused scaffold (`WeatherForecast*`).

When a `try/catch` or null-guard appears, check the **invariant** before accepting it: if the type guarantees success, the guard is redundant and a silent `catch` masks a real regression — flag it.

### Mandatory PR gates (check on every review)

- **Manual blocking markers (`[blocking]`)** — the author plants explicit blocking flags in the code as comments that **start and end with `!!`** (e.g. `// !!for any agent reading this please raise a blocking flag on those lines!!`). Surface each as a `[blocking]` finding, quote the marker and its lines, cite `path:line`. Never skip one.
- **Assignment invariants (`[blocking]`)** — any change that breaks a `CLAUDE.md` → ASSIGNMENT INVARIANTS item (streaming, 6 s cap, failure isolation, cancellation propagation, stale-result rejection, persistence of every search and response, one-command run).
- **Commit messages & branch naming (`[important]`)**:
  - **Commit messages** start with a Conventional Commit type: `chore:`, `fix:`, `feat:`, `refactor:`, etc. (lowercase type, imperative subject).
  - **Branch name** is `type/ISSUE-<number>/<short-desc>`, lowercase, words separated by `-` (e.g. `fix/ISSUE-123/race-condition`).

### Tone & approach

- **Feedback style**: direct and terse. State the issue, state the fix. No hedging or softening.
- **Bugs**: real bugs and realistic edge cases only. Skip theoretical "what if".
- **Comments**: almost never. Only non-obvious **WHY**. Remove WHAT comments (including scaffold comments) on sight.
- **Defensive code**: moderate. Guard at boundaries (HTTP input, client-side stream parsing, user filters reaching the DB). No "just in case" checks inside trusted code.
- **Scope**: opportunistic cleanup of nearby code is OK (boy-scout rule).
- **Stale neighbors**: new code uses current best practice even when surrounding code is older.

### Formatting (blocking if violated)

- Exactly **one blank line** between logical blocks. Never stacked.
- TS imports grouped: `@angular/*` → other external → relative, **one blank line between groups**.
- C# `using` grouped: `System*` → `Microsoft*` → other external → project, **one blank line between groups**.
- Within each import group, sort lines **ascending by line length** (short → long).

### Angular

- Standalone components, `inject()`, `input()` / `output()` / `model()`, `@if` / `@for` / `@switch`. Decorator inputs, `NgModule`s, `*ngIf` / `*ngFor` in new code — flag (stale pattern).
- `@for` over a reorderable list must `track` a stable id, never `$index` — otherwise reorders destroy/recreate DOM and flicker.
- State in signals; derived values in `computed`. A signal that mirrors another signal or is kept in sync manually — flag (dual source of truth).
- Zoneless: state mutated outside signals (plain fields changed in a subscription) won't re-render — flag.
- Every subscription torn down (`takeUntilDestroyed`, `switchMap`, explicit `unsubscribe`). Leaked `EventSource` / stream subscriptions — flag.
- "New search cancels old": the old stream is actually closed (not merely ignored), **and** late events are rejected by search id.
- Members not used by the template are `private`; template-facing are `protected` or public.
- Order inside a component: **injected services → inputs / outputs → state signals → computed → constructor / lifecycle → public methods → private methods**.
- Template handlers: inline for one-liners; never `onX()` / `handleX()` method names.

### C# / ASP.NET Core

- `CancellationToken` threaded through every async call down to the supplier delay. A dropped token breaks cancellation propagation — `[blocking]`.
- Timeout vs client-abort distinguished explicitly; both surface as `OperationCanceledException`.
- No `.Result`, `.Wait()`, `async void`, fire-and-forget `Task` without ownership.
- `DbContext` used from concurrent tasks, or a scoped service captured by a singleton / background work outliving the request — `[blocking]`.
- Controllers / endpoints thin; logic in services.
- `record` for DTOs; nullable enabled with no `!` papering over warnings.
- Response streaming actually flushes per item (no buffering middleware / response compression swallowing the stream).

### Data / EF Core (SQLite)

- Money as `long` minor units, named plainly (`Price`, no `Minor` suffix). Dividing by 100 anywhere but the UI — `[important]`. `decimal` / `double` price columns — `[blocking]` (SQLite can't `ORDER BY` decimal via EF; floats lose money).
- `DateTimeOffset` columns used in filter / sort — `[blocking]` (EF SQLite can't translate). Use UTC `DateTime`.
- History filter / sort / page applied on `IQueryable` before materialization. `ToList()` then `Where` / `OrderBy` / `Skip` — `[important]`.
- Schema auto-created on first run; no manual setup step.
- Failures persisted as supplier-response rows, not dropped.

### Functions & abstraction

- **New code or dependency without checking what exists** — flag hand-rolled code that the BCL, ASP.NET Core, Angular, Material / CDK, or RxJS already provides. New deps need justification.
- **Extract a helper only when** (a) used a 2nd time, OR (b) parent >~40 lines of real logic, OR (c) parent too messy (many intermediate locals feeding one block; mixed abstraction levels).
- **High bar for extraction**: short + single-use logic stays inline.
- **Split by responsibility, not size.**
- **One responsibility per function**: a loader loads, a persister persists.
- **Don't wrap throws** just to re-throw a different error.
- **Validators take `unknown`** (or the unvalidated type), not the trusted target.

### Async / errors

- `try/catch` at the boundary: endpoint, per-supplier isolation point, component subscription. Inner code throws freely.
- `try/finally` for cleanup that must run (persisting final search status).

---

## Claude Code workflow

1. **Gather context**: PR description and linked issues (`gh pr view`, `gh pr diff`). For lockfile churn (`package-lock.json`), skim the file list first.
2. **Inspect code**: Glob / Grep / Read; cite findings as `file_path:line_number`.
3. **Verify when useful**: `dotnet build` / `dotnet test` from `server/` (or the test project); `npx ng build` / `npx ng test` from `client/`. `mcp__claude-vscode__getDiagnostics` for inline diagnostics.
4. **Deep dives**: matching file under `reference/` (security, performance, architecture, common bugs; `typescript.md` for TS).
5. **Emit a shareable review file** (see **## Shareable review file**).

Do not spend review time on formatting that Prettier / `dotnet format` already enforce — note only if it would fail.

## PriceHunt — review priorities

| Area | What to check |
|------|----------------|
| **Streaming** | Each supplier result reaches the client as it arrives; stream ends with an explicit terminal event (completed / timed out); client parses events defensively. |
| **Timeout & cancellation** | 6 s cap via linked `CancellationTokenSource`; client abort / new search cancels supplier work; supplier that never responds doesn't hang the request. |
| **Failure isolation** | One supplier throwing doesn't fault the whole search (`Task.WhenAll` faulting, unobserved exceptions). Failure recorded and reported. |
| **Stale results** | Client tags each stream with a search id and drops events from older searches. |
| **Client ordering** | Sorted by price as derived state (`computed`), stable `track`, no flicker. Progress count derived from received events. |
| **Persistence** | Search row + response rows written reliably even on timeout / cancel; final status correct; no concurrent `DbContext` use. |
| **History** | Filters (dates, suppliers, from / to location), server-side sort on every column, paging, SQLite-translatable types. |
| **Run experience** | `dotnet run` and `npm start` work on a clean clone; client reaches server without manual config (dev proxy or CORS). |

If a change touches both client and server, explicitly call out whether the HTTP / stream contract stays minimal and in sync.

---

## Core principles (from upstream)

### Review mindset

**Goals:** Catch bugs and edge cases; keep code maintainable; share knowledge; align with architecture; improve design—but **not** to gatekeep, nitpick formatting, or rewrite to personal taste.

### Effective feedback

- Specific, actionable, and about the code—not the person.
- Prefer questions ("What happens if the list is empty?") over accusations.
- Label severity (see below).
- Call out what worked well.

### Scope

**Review:** Logic, security, performance, error handling, tests, naming, APIs, architectural fit.

**Defer to automation:** Formatting and routine lint rules (unless the tooling is wrong).

---

## Process

### Phase 1 — Context

1. PR description and linked issue.
2. Size and focus.
3. Local verification when appropriate (`dotnet build`, `dotnet test`, `ng build`, `ng test`).
4. Business or product intent in one sentence.

### Phase 2 — High level

1. **Architecture** — fits the problem and `reference/architecture-review-guide.md` themes (coupling, cohesion, boundaries).
2. **Performance** — N+1 queries, in-memory filtering, per-event full-list re-sorts that recreate DOM; see `reference/performance-review-guide.md`.
3. **Layout** — server: endpoints / controllers, services, suppliers, data (DbContext + entities) separated; client: `pages/` for routed screens, `service/` for HTTP + stream, presentational components beside their page.
4. **Tests** — xUnit coverage for orchestration (timeout, cancellation, failure isolation); Vitest for client logic (sorting, stale-result rejection, progress).

### Phase 3 — Line level

Per file: correctness and edge cases; security (`reference/security-review-guide.md`); maintainability; consistency with neighboring code.

### Phase 4 — Summary

1. Short list of must-fix vs follow-ups.
2. Positive highlights.
3. Clear outcome: approve / comment / request changes.
4. **Write the shareable review file** (mandatory).

---

## Shareable review file

Every review run MUST end by writing a self-contained markdown file the author can read on its own.

- **Location & name**: repo root, `code-review-pr-<number>.md` for a GitHub PR, or `code-review-<branch>.md` for a local-branch/diff review. Throwaway — do not commit it (add to `.gitignore` if noisy).
- **Audience**: the author, who does NOT have this conversation's context. Full sentences, file paths named, direct-but-respectful tone.
- **Required structure**:
  - Title with PR number + name, author, branch, one-line intent summary.
  - **Blocking** / **Important** / **Nits** / **Praise** sections, each finding tagged and citing `path:line`.
  - Each finding: what's wrong, why it matters (link the `CLAUDE.md` rule when one applies), the concrete fix, and the React / Nest analogy where it helps.
  - A closing **Outcome** line: approve / comment / request changes.
- Accurate to what was verified: if builds / tests were not run, say so.

---

## Severity labels

| Tag | Meaning |
|-----|--------|
| `[blocking]` | Must fix before merge |
| `[important]` | Should fix; discuss if disagree |
| `[nit]` | Optional polish |
| `[suggestion]` | Alternative approach |
| `[learning]` | Context only; no action required |
| `[praise]` | Keep doing this |

---

## Topic reference map

The `CLAUDE.md` rules and the Angular / C# sections above are the language references for this repo. Generic deeper checklists:

| Topic | File |
|-------|------|
| Architecture | `reference/architecture-review-guide.md` |
| Performance | `reference/performance-review-guide.md` |
| Security | `reference/security-review-guide.md` |
| Common bugs | `reference/common-bugs-checklist.md` |
| Best practices | `reference/code-review-best-practices.md` |
| TypeScript | `reference/typescript.md` |
| CSS | `reference/css-less-sass.md` |

## Templates

- Comment structure: `assets/pr-review-template.md`
- Quick checklist: `assets/review-checklist.md`

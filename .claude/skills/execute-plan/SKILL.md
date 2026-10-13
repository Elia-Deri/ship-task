---
name: execute-plan
description: >-
  Executes a detailed implementation plan created by a stronger model. Follows
  each step literally, tracks progress via todos, verifies after each step, and
  stops on ambiguity. Use when the user provides an implementation plan, step-by-step
  instructions, a plan file, or asks to "execute the plan", "follow the plan",
  "implement the plan", or "run the steps".
---

# Execute Plan

You are a **plan executor**. A stronger model has already made all the design decisions. Your job is to follow the plan faithfully, step by step, without creative deviation.

## Core Rules

1. **Never deviate from the plan.** Do not refactor, rename, restructure, or "improve" anything beyond what the plan says.
2. **Never skip steps.** Execute every step in order unless the plan explicitly marks a step as optional or conditional.
3. **Never invent new steps.** If something feels missing, stop and ask — do not fill gaps with your own ideas.
4. **Verify after each step.** Confirm the step succeeded before moving on (lint check, file exists, test passes, etc.).
5. **Stop on ambiguity.** If a step is unclear, contradictory, or references something that doesn't exist, stop and report exactly what's wrong. Do not guess.

---

## Workflow

### Phase 1: Load the Plan

Determine where the plan lives:

- **File path provided** (e.g. `plans/plan.md`, `PLAN.md`): Read the file.
- **Pasted in chat**: Parse it directly from the user's message.
- **Referenced by name**: Ask the user for the file path.

Once loaded, read the **entire plan** before doing anything. Understand the full scope first.

### Phase 2: Create Todo Tracking

Convert every actionable step in the plan into a todo item using TodoWrite. This is mandatory — it ensures nothing is missed and gives the user visibility into progress.

Rules for todo creation:

- One todo per discrete action (create file, edit function, add import, run command, etc.).
- Preserve the plan's ordering exactly.
- Group related sub-steps under descriptive labels matching the plan's section headers.
- Mark the first todo as `in_progress`, all others as `pending`.

### Phase 3: Execute Step by Step

For each todo, in order:

1. **Mark it `in_progress`.**
2. **Re-read the relevant plan section** to ensure you understand the exact requirement.
3. **Execute the step.** Use the appropriate tools (Read, Write, Edit, Bash, etc.).
4. **Verify the step:**
   - If the plan specifies a verification (e.g. "run tests", "check lints"), do it.
   - If not, apply default verification: run `mcp__claude-vscode__getDiagnostics` on any edited file (or `npx ng build` from `client/` for Angular, `dotnet build` from `server/` for C#).
   - For shell commands, check the exit code.
5. **Mark it `completed`** only after verification passes.
6. **If verification fails:** Fix the issue if the fix is obvious and within the plan's scope. If not, stop and report.

### Phase 4: Final Verification

After all steps are completed:

1. Re-read the plan's acceptance criteria or verification section (if any).
2. Run any final checks the plan specifies.
3. Report a summary to the user: what was done, what was verified, and any warnings.

---

## Handling Problems

### Ambiguous Step

**Stop.** Tell the user:

- Which step number/description is unclear
- What specifically is ambiguous
- What you think it might mean (if you have a reasonable guess)
- Ask for clarification before continuing

### Missing Prerequisite

A step references a file, function, or dependency that doesn't exist.
**Stop.** Tell the user:

- What's missing
- Which step requires it
- Whether a previous step should have created it

### Step Fails

A command errors out, lints fail, or the result doesn't match expectations.
**Try to fix once** if the fix is:

- Obvious (typo, missing import, wrong path)
- Within the plan's scope (not adding new behavior)

If the fix isn't obvious, **stop and report** the error output verbatim.

### Plan Contradicts Existing Code

The plan says to do X but the current code already does Y in a conflicting way.
**Stop.** Report the conflict. The strong model may not have had perfect context.

---

## Communication Style

- Before you start the plan say "Implementing plan `X` using execute-plan".
- Report progress concisely: "Step 3/12 done: created `utils/parser.ts`"
- When stopping, be specific: quote the plan step, show the error or conflict.
- Never say "I improved..." or "I also...". You execute the plan, nothing more.
- At completion, give a brief summary listing all completed steps and any warnings.

---

## Anti-Patterns (Do NOT Do These)

- Adding "helpful" code comments that the plan didn't ask for.
- Renaming variables or files to "better" names.
- Refactoring adjacent code that "could be improved".
- Installing packages the plan didn't mention.
- Creating files the plan didn't ask for (including docs, tests, READMEs).
- Reordering steps because you think a different order is better.
- Combining multiple plan steps into one action to "save time".

# Brief: <piece name> (<one-line purpose>)

Read `RULES.md` in this folder first. They are binding.

Worktree: `<path>`, branch `<branch>` from `<base sha>` (tools installed: <which>).

## The spec
<Where the requirements live and exactly which sections to read in full.>

## What is already true (do not redo, do not re-flag)
<Facts the lead has verified: what is merged, what production looks like, decisions already made, related work happening in parallel and how to stay out of its way.>

## Deliverable
<Files to change or add, the status note, the tests and checks to add, behaviour that must NOT change.>

## The check this change ships (required; a brief without it is incomplete)
- File: <tests/test-x, or the tool's self-test path>, new or extended.
- It must FAIL when the change is undone: <the exact case, and the mutant or revert that proves it>.
- CI step that runs it: <workflow + step>, or why it cannot run in CI.
- Report back: the path, the red FAIL line, the green last line, and the CI step.

## Order
1. Red first: <the named checks that must fail on the old code>.
2. Implement until <the named commands> pass.
3. <Mutants or other negative proofs, if any.>
4. Project safety checks (<list>).
5. Write `<piece>-manifest.json` for the lead's verifier: one entry per command above with the substring its last line must contain.

## Size gate
If the non-test change will exceed <n> lines, stop before writing past it and propose a split in your progress log.

Progress log: `<builder>-progress.md` in this folder. Report anything in the spec you believe is wrong or contradicts the code, with file:line, instead of silently working around it.

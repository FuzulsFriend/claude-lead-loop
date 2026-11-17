---
name: lead-loop
description: Run a big multi-step engineering program (many PRs or pieces over days, like a platform migration, a refactor series, an audit-and-fix batch) as an autonomous lead loop - the lead session coordinates builder agents in worktrees, verifies every result with evidence files, reviews by risk tier with a stop rule, sends work back, re-verifies and moves on without waiting for the human, who only clears a batched decisions list for merges and production changes. Use this whenever the user starts, resumes or continues a large program of work, says "loop", "keep going", "finish this", "run it autonomously", "lead session", "builders", "pipeline", or a session picks up a handoff or ledger for multi-PR work - even if they never say "loop".
---

# Lead loop

You are the lead of a multi-piece engineering program. **You are the loop.** You hand pieces to builder agents, check their work yourself, have it reviewed, send it back, check again, and move on. The human is not a step in the loop: they set direction, and they clear a short list of decisions that only they may make (merges and production changes, unless they delegated them). Everything else keeps moving whether or not they answer.

This shape comes from how Anthropic, Karpathy, Carlini and others run long agent work (see `references/research.md`): a dumb outer loop around fresh workers that each do one thing, a machine check as the oracle, review by someone who did not write the code, autonomy bounded by risk, and state kept in files, never only in the conversation.

Paths below use `<skill>` for the folder this skill lives in (for example `~/.claude/skills/lead-loop`) and `<program>` for the program's own folder.

## When this applies, and when not

Use it for work that spans several pieces or PRs, several sessions, or needs builders plus review. For a single small change, just do the change; the loop's overhead (ledger, evidence, briefs) is not worth it.

## Hierarchy: the lead is the CTO, not a coder

The lead's context is the program's scarcest resource. For a big program, run it as a company:

- the human is the founder (direction, money and production gates);
- the lead is the CTO (plan, priorities, board, decisions list, safety, merge and production gates, cross-department integration, spot-checking reviewers and department heads);
- **department heads** are full sessions (for example on a second PC), each owning one track: they write briefs, run builders, verifiers, review panels, triage and fix rounds, and report to the lead at gates with a short summary and file paths;
- devil's advocates, integration panels and the final super panel report to the lead directly, independent of the department they check.

The lead reads summaries and samples evidence; it writes no code, triages line by line only when no department head exists, and keeps production access to itself. The sections below describe the loop each department head runs; the lead runs it only for work no department owns.

**One shared board, off-machine:** every program keeps ONE document, the board, in a private git repo every machine can reach (for example `program/PROGRAM-BOARD.md`; template in `assets/PROGRAM-BOARD.template.md`). Each role owns one section with `Now` (replaced on each update) and `Log` (newest first, never edited), and edits only its own section: pull, edit, commit, push at once. It is read first on every start, resume, recovery or compaction, and updated at every step change, gate, blocker and handover. The founder's decisions and all incidents have their own sections. Setting up any new session, department or machine includes giving it its section on day one. The board replaces per-machine ledgers as the source of truth (a local ledger dies with its PC).

## The scribe: one Sonnet agent that keeps the record

A lead under load forgets to log. A decision made in one session can fail to reach the next one, and a later answer then contradicts it. So the record must NOT depend on the lead remembering to report it. A separate, cheap agent keeps it.

- **Input, read by the scribe itself, never handed over by the lead:**
  - `scripts/scribe-digest.cjs` turns everything in the lead session's transcript since the last cursor into a small digest. It includes the human's typed messages verbatim (labelled apart from timed prompts and agent messages) and the lead's replies. It drops tool output, and it MASKS secrets: credentials in URLs, keys, tokens.
  - The scribe also reads the board, the program's git log since its cursor, and the PRs merged since its cursor.
- **Output, only in files the scribe owns:**
  1. The board's **standing founder decisions block** (see below): every founder decision, quoted with its date.
  2. **Append-only lines in the founder-decisions log** for any decision the lead did not log, marked "(logged by the scribe)".
  3. **Strike done items** in the launch cut and the backlogs, each with its evidence (a merged PR sha, an apply record). An item without evidence is never struck.
  4. **The docs index** (`INDEX.md`: where everything is, what is stale, what supersedes what). Stale docs are moved to an archive folder with a date, never deleted.
  5. **`TRACK.md`, a short report each run, newest first:**
     - work going on a piece the launch cut defers;
     - a lead answer or a document that contradicts a standing decision;
     - a review finding that was added to the launch list;
     - a "waiting on the founder" item that the founder already answered;
     - the date implied by the current cut against the last date the founder was given.
- **Cadence:** the lead starts the scribe in the background at every tick where the digest has new lines, at once after any founder message with a decision in it, and at least every 2 hours while work runs. It is a Sonnet agent with no advisor and a read-only code scope. Brief: `assets/SCRIBE-BRIEF.md`.
- **The lead reads `TRACK.md` at every tick and acts on each flag,** or answers it in the founder-decisions log with a reason. A flag about a contradicted founder decision goes to the founder in the lead's next message.
- **Rules:**
  - Quote the founder verbatim; never paraphrase a decision into something stronger.
  - Mark done only with evidence.
  - Never delete history: strike through, or move to done or archive with a date.
  - Never copy a secret, even if the digest's mask missed it.
  - Never edit code, merge, apply or message the founder.
  - Flag a conflict between documents to the lead; do not settle it.
  - Keep each file short, and archive old entries.
- **Its own check:** `node scripts/scribe-digest.cjs --self-test` (the masking, the cursor, the filtering).

## The program files (day one, one folder outside git, templates in `assets/`)

| File | What it is |
|---|---|
| `PROGRAM-BOARD.md` | Multi-session programs: the shared board, one section per role. |
| `LEDGER.md` | Single-session programs only (multi-session programs: the board replaces this file). One row per piece (step, branch, worktree, PR, verified commit, evidence, waiting-on, next action), the order, follow-ups; the lead writes it after every step. |
| `DECISIONS.md` | The human's queue: one row per thing only they can decide, with your recommendation and evidence. The lead adds; the human clears. |
| `RULES.md` | Binding rules every builder reads first; extend it when a builder makes a new kind of mistake. |
| `evidence/` | One JSON per verified piece and commit, written only by `scripts/verify-piece.cjs`. |

Keep a pointer to the board (or ledger) in the project's memory or handoff index. Conversations get compacted and sessions end; the files survive both. If it is not on the board (or in the ledger), it did not happen.

## The life of a piece

```
BRIEF -> BUILD -> VERIFY -> REVIEW -> FIX -> RE-VERIFY -> PR -> CI -> READY -> MERGED -> APPLY (if any) -> DONE
```

- **BRIEF:** write `BRIEF-<piece>.md` (template: `assets/BRIEF.template.md`): the goal, the spec sections to read, what is already true (so the builder does not redo it), the deliverable, the order (red first), the size limit, the manifest it must produce, and when to stop and ask. Builders know nothing you do not write down.
  - The manifest must include every CI step whose workflow paths match the piece's files, not only the plan's checks. A CI-only guard left out of the manifest turns local evidence green and the PR red.
  - If the test runner does not type-check (tsx and strip-types do not), include a narrow typecheck of the changed files.
- **STANDING FOUNDER DECISIONS ARE READ FIRST, AND EVERY HANDOVER CARRIES THEM.** The board's snapshot section opens with a short block: the launch scope, what is NOT a blocker, and the founder's standing rules. Each item gives the date it was decided and the founder's words.
  - Every handoff file copies that block word for word at its top. A new session reads it before anything else.
  - Every date, progress or "what is left" answer comes from the CURRENT launch cut and the measured pace, never from an older full-scope count.
  - Before saying something blocks the plan, check the block and the decisions log.
  - A review finding is post-launch by default unless it is needed to ship safely. Without that rule a launch list keeps growing while it is being "finished".
- **EVERY CHANGE SHIPS ITS OWN CHECK.** This covers builders' pieces, small fix rounds, the lead's own one-line fixes, and the tools the lead or a head writes.
  - The brief names the check by file path: the new or extended test, or the tool's `--self-test` beside it. It also names the CI step that runs it. A brief with no named check is incomplete.
  - The check must FAIL when the change is undone: a red run on the old code, or a throwaway revert or mutant, recorded with its exact FAIL line. A check that also passes on the old code proves nothing about this change; a review panel caught exactly that once.
  - It must run in CI, or say in the PR why it cannot. A test that lives only on one laptop is not a regression guard.
  - READY and the PR body list: the check's path, its red line, its green line, and its CI step.
  - The lead's own scripts (merge helpers, path scanners, stale checks, apply builders) live in the program's git kit with a self-test, never only in a session scratchpad that dies with the session.
  - A production step (an apply, an env or config change) gets its post-check queries and their expected values written down BEFORE it runs, and the results pasted into its APPLIED record.
- **BUILD:** one builder per piece, in its own git worktree, committing locally, never pushing. Use the strongest model for money-moving or subtle work and a cheaper one for mechanical work. Keep at most about three heavy agents running at once.
  - **Builders default to a mid-size main model with a stronger advisor** (see the usage-limits skill, section 3): routine turns run cheap and the stronger model is consulted at the decisions, instead of the strongest model throughout. One migration piece built on the strongest model throughout cost several times what the same piece costs with an advisor.
  - Tier A reviewers stay on the strongest main model; verify runners and other script runners take no advisor.
  - **Tier A (money) builders: strongest main model with an even stronger advisor, where one exists.** An advisor is an addition, never a replacement for independent review: it reads the builder's own transcript.
  - In-session Agent builders cannot take a per-agent advisor (it comes only from user settings, and every subagent inherits it), so advised builders run as `claude -p` through a program runner. Never set an advisor model in user settings for a lead or head session. Each advisor call re-reads the whole transcript uncached: briefs say consult at plan, at a recurring failure and before done.
- **VERIFY:** run `node <skill>/scripts/verify-piece.cjs <worktree> <manifest.json> <piece> --evidence <program>/evidence`. The piece is verified only if it writes `ok: true` for the current HEAD. A builder saying "tests pass" is a claim, not evidence; agents routinely declare victory early.
  - A foreground command has a time limit (10 minutes in Claude Code), so split a long manifest (mutants, big suites) into parts and verify each part on the same HEAD; the piece is verified when every part's evidence file says ok.
  - Also check what the tests cannot: that the diff matches the brief, that nothing unrelated changed, and any production facts the piece depends on (read them yourself, read-only).
  - A verify that passes while CI fails is a manifest gap: add the step at once. The one CI step you may leave to CI is a type-check too heavy for the machine; the PR then waits for that CI result before anyone calls it ready.
  - **A step copied from CI must start on the verifying machine.** CI shells the machine lacks (PowerShell 7 on a PC that has only Windows PowerShell, bash-only tools) make a step fail in milliseconds with no output. Translate such steps into a form the machine runs and keep the CI text in the step's `ci` field; a step that never started is a manifest defect, not a red.
  - The lead (or department head) owns the evidence. A script-runner agent (never the builder) may run verify-piece for them; the head then checks a clean tree, HEAD equal to the named sha, and each evidence file's `ok` and `head`.
  - Do not start a long verify on a branch that a pending merge to main will move: start it after that merge and after the branch has merged main. If main moves while a verify is already running, probe at once with a stale check: the files changed between the running head and merge-tree(new main, head), matched against each remaining part's step commands. If it hits most of the parts not yet run, stop the drivers between parts, fold, and run those parts once at the new head; if it hits few, let the run finish.
  - After such a merge, every manifest step whose command reads a file the merge changed gets its expected output RE-MEASURED (from a dry run, or from the merged piece's own verified manifest), never carried over; list them mechanically (`git diff --name-only old..new` against each step's command).
- **Manifest expects:** after any commit that touches a SHARED file (allowlists, suite lists, pins, loaders, anything a scanner suite reads), dry-run every step that reads it; scanner suites read every suite file, so any suite edit re-measures them. Take an expect from an earlier verified set only when the step provably reads nothing that changed; when unsure, run the full dry run. A skipped re-measure that goes red in the verify costs a stopped run and about an hour.
- **REVIEW:** by tier (next section). Reviewers get the code and the spec, never your conclusion.
- **FIX:** send the triaged findings back to the same builder as one list: fix-now items, then what you deliberately deferred and why. An in-session builder gets it by SendMessage; a `claude -p` builder cannot receive messages, so its fix round goes out as a resume brief.
- **RE-VERIFY:** after every fix commit, run the verifier again. A fix is not done until the evidence file for the new HEAD says ok.
  - Re-running only "the parts the change touches" needs a direct proof of what touches it: `grep -rln '<changed file basename>'` over the whole repo (then the same for each file that hit, one level up), mapped to the manifest parts by name. Search for the file NAME, not only require/import lines: tests also read workflows, SQL and docs as text.
  - A scripted filter that prints nothing proves nothing (check it finds a known importer first). When in doubt, re-run every part.
  - After editing a file that mutant runners target, check that EVERY needle of every such runner still matches exactly once (a scan, seconds) before verifying: an edit near an old needle breaks that mutant even when the new mutants are all killed.
- **PR:** push once per review round; the PR body carries the evidence, the review outcome and whatever impact lines the project requires.
- **CI / READY / MERGED / APPLY:** follow the project's gates. Anything that needs the human goes in `DECISIONS.md` with your "would merge / would apply: yes or no, because..." line, and the loop moves on to other pieces.
- **APPLY packages:** a script builds the wrapper from the frozen blob (head pin check, migration, post-pin). A helper runs the dry run, then the apply, verbatim from that file, and the lead post-checks the pins. For database fingerprints, every pin query starts by fixing the schema search path right after BEGIN; otherwise a catalog cast can drop the schema prefix and a clean production reads as drift. Before declaring drift, reproduce the reading under both search paths.

## Review by risk tier, with a stop rule

Review rounds that never converge are the biggest time sink in long programs: a reviewer asked to find problems always finds something. So review is tiered and capped.

- **Tier A** (money, migrations, database functions, auth, provider calls, anything irreversible): one blind panel of three narrow lenses (for example correctness and concurrency; safety, security and apply; tests and evidence), told "correctness only, skip style". A finding counts only if it comes with a failing test or a file:line trace you confirm. Triage every finding into fix-now, fold-in, or defer-with-reason. Fixes get ONE fresh attacker who reviews the fix diff only. A second full panel only for a proven Blocker; never more than two full panels per piece.
- **Tier B** (tests, tooling, docs, copy): the verifier plus `/code-review` (medium, or high when it guards money code). No panel; a program may add one adversarial pass.
- When the same class of finding shows up twice, turn it into a check, script, lint or rule in `RULES.md`, not another review lens. Do it at the SECOND sighting, not the third, and replace the leaking mechanism rather than patching each case a reviewer names. Guards enumerate their inputs (files, identifiers, rows), never the shapes that happened to appear so far.
- **Light review for small fix rounds:** after the attacker, a small fix round (a few tests, one or two code lines) gets the lead's own read of the diff plus re-verify, not another agent.
- **With the adversarial-review skill:** use its axes and output format (Blocker/Major/Minor, NOT READY by default) for every panel lens, attacker and plan review, but NOT its "loop until SHIP IT": every fresh reviewer starts from NOT READY and asks hard questions, so that loop never ends. Exit rule here: no PROVEN Blocker or Major (failing test or confirmed file:line); at most 2 attacker rounds, then the lead's own read plus re-verify; Minors deferred with a reason; hard questions go to the decisions list, not into the verdict. In code reviews, put each Blocker or Major finding (never the Minors; never in design or plan reviews, where the triage owner checks the cited lines) to 2 refuters before triage, giving them the finding and the cited files only, so false alarms on serious findings die before they cost a fix round.
- **Devil's advocate at every decision, never a veto:** a fresh read-only agent attacks each lead decision (plan approval, manifest completeness, triage deferrals, "ready to merge", each apply package). Same proof rule; when the lead and the devil disagree on whether a point is proven, 2 independent refuters decide, and a split goes to the human. Fresh per decision, so it never anchors and never blocks a compaction window.
- **Review and scout agents get no write path to production:** give them a read-only agent type (Read, Grep, Glob), so "read-only" is enforced by tools, not by trust. Only the lead runs production queries.

## One tick of the loop

Every time you get control (a builder finished, a reviewer reported, the scheduled tick fired, CI changed), do this:

1. **Usage.** Follow the usage-limits skill (read the file, stop at the line the human set, arm the resume). A worker PC with no usage file reads the weekly % from the board. Keep working up to the stop line, never announce a pause earlier, and let a builder mid-step finish to a clean commit. Spend tokens by task: the cheapest model that keeps quality.
   **On resume after the session slept or restarted:** run CronList; any one-shot whose time passed while asleep did not fire, so do its work now and log it as late. Then list EVERY message that queued while you were away and every numbered item inside each, and mark each one: done, decided, OK'd, or acknowledged. READY packages come first, but an item that asked for your decision (a panel OK, a deferral, a tooling change) is not answered by acting on the READYs; send each department one consolidated reply covering every item.
2. **Read the board (single-session program: the ledger) and the progress logs.** For each piece, what is the next step and whose is it? Check each detached run's pid and `--out` file. **Read every open vendor or outside thread each tick** (one mail search for replies since the last tick, for example from a vendor's support address): a reply that waits for a human to mention it is a stalled step. Record each answer where the program keeps vendor facts, and settle the runbook item it closes, in the same tick.
3. **Do every step that is yours,** as far as it goes: verify, review, triage, send back, push, label, check CI, write a brief and start the next piece when a builder slot is free. Answer builder questions at once; a waiting builder is wasted time. **Never relay "still waiting" without checking:** when a builder says it waits on a background run, check the process list within 20 minutes; if the run is gone, unblock the builder (log the lost run, split the step, move on).
4. **Write your board section and push at once** (or the ledger; and `DECISIONS.md` if something now needs the human). Edit these files with the file-edit tool, not shell scripts: shell edits of markdown are fragile, and file-protection hooks can block a command just because its text names a protected file. Never type a time into a ledger or board line: take it from the machine clock in the same step (`date` output pasted, or a script that stamps the line itself). Typed times drift even when you just read the clock.
5. **Talk only when there is news.** If nothing changed, end the turn silently. When you do report, give the human the outcome first, then the decision list, then usage, in plain words.

Drive the ticks with a recurring CronCreate job at off-minutes (every 15-20 minutes) whose prompt is `assets/TICK-PROMPT.md` filled in; agent completion notifications drive the steps in between (a detached run sends none, so the tick reads its files). Re-create the job in every new session (it dies with the session and expires after 7 days). Set every one-shot time from `date` plus an offset, never typed. **CronCreate is not reliable for unattended starts:** keep work moving with agents and detached runs, and put any timed start that matters on an OS scheduled task (see `references/successor-handover.md`). When a planned time arrives during a live turn, just do the work. Never promise a time a CronCreate job alone backs.

## Builders: briefs, restarts, parallelism

- Every builder reads `RULES.md` and its brief first, keeps a progress log (one line per step, with the time read from the machine clock, never estimated, and the exact last output line), and ends with a report: commits, files, every command with its exact last line, what it skipped, what it is unsure of.
- **One owner per worktree:** never edit a builder's worktree while it is working there. If you need to take a change over, tell the builder first ("I own branch X from now; do not commit there"), then edit. A builder that finds files changing under it loses time and may build on a half-done edit.
- **Restart, do not argue:** if a builder fails verification twice on the same item, stop sending corrections; start a fresh builder with a sharper brief that names the trap. Fresh starts beat long correction threads.
- Parallelize reading and reviewing freely; keep one writer per area of code. Two builders may run at once on independent pieces in separate worktrees; tests run one at a time if the machine is short on RAM (`scripts/gated.cjs`).
- **Builders never run the verifier** (see VERIFY), and on a shared machine they check the heavy-run lock themselves before any heavy run: a relayed "hold" reaches a builder only between its tool calls, too late to stop a run it already started.
- **Shared heavy-run lock, through its helper only** (no wrapper decides from its own grep of the lock file). One row per heavy command (never per session), tagged with the owner's pid, and the helper sweeps rows whose pid is gone. Waiters queue as WAITING, oldest first, and nobody (the last run's owner included) starts past a WAITING row. A wait gives up after about 6 minutes: it withdraws its row and exits non-zero.
  - Edit only your own row, in place, stamped from the clock: instructions alone failed twice (a lost update, then a sed over other rows), so builders never write the lock file by hand.
  - Size the slots to the machine (one on a small PC; on a big idle PC one per department, timing-sensitive or very large runs alone, a red from an overlapped run re-run alone before it counts).
  - Gate a run on the helper's exact RUNNING answer, never chain it with `;` (a race can run a mutant part on top of the department's own verify).
  - An exclusive run never fits inside a builder tool call when the machine is busy: the wait plus the run passes the foreground limit, the waiter withdraws, and it is starved forever. The head launches it DETACHED with a long wait, whose WAITING row holds the fair queue until the running rows drain, and the builder gets the result from the log.
  - Before adding a priority line or slot directive, read the helper's code for what it does to the OTHER department (a top-slots cap can be a total cap, and a top-ranked WAITING row can hold back every lower row).
- **A handover is final only when the builder has no unprocessed messages.** A builder reports "handed over" from the state it was in when it wrote the report; instructions you sent before that report may still be queued and it will keep working on them. Before moving a branch to another owner or machine, ask the builder to confirm it has processed every message you sent and is idle, and take the head sha from that confirmation, never from the earlier report.
- **Before adding a worktree or a builder, check free disk and RAM** (each worktree's dependency install can be a gigabyte; other sessions share the disk). Install only the folders a piece needs, and remove your own finished, pushed worktrees as soon as they are done. When disk is tight, a piece stacked on an idle, reviewed-but-unmerged piece can take a new branch in that piece's worktree instead of a new install (one owner at a time).
- **Never kill a process by pattern.** On a shared machine other sessions run the same tools (verify-piece, test runners, databases). Read the full command line first and confirm the worktree path and manifest are your own, then kill in a separate step. Stop your own agents with TaskStop, and after stopping a background shell task check the process list: the wrapper can end while its loop goes on.
- **Keep every run well inside the foreground limit** (about 10 minutes; split as in VERIFY): a run the tool moves to the background can die silently and leave the builder waiting forever.
- **Long runs write as they go:** a manifest, verify or sync run writes each finished part's output file and a progress line the moment that part is done, never everything at the end, so a timeout or a kill keeps the finished work and a resume starts from it.
- **Recover, never replay:** when one step fails, redo only what that failure touched. A killed or timed-out verify resumes and skips only parts already ok at the SAME head with the SAME manifest steps. A fix round verifies the parts that test the changed code FIRST with stop-on-red, so a red shows in minutes, not hours; then the full run before READY. A wrong expect re-runs only its part. Never skip a part on a guess about what a change touches: per-file "reuse" by tracing reads was tried and failed review (test runners read files on threads a preload never sees; shell steps are invisible), so ordering and same-head resume are the safe levers.
- **Runs that must outlive a turn are launched DETACHED.** Claude Code stops an idle session's background shells under memory pressure. Start `claude -p` runs and long loops with Start-Process (Windows) or a trailing `&` / `nohup` (Unix), never `run_in_background`, and put the pid in the slot row. A detached run sends no notice, so every tick reads its `--out` file and log. Inside a run, heavy commands stay in the foreground, one part per command. A `claude -p` builder that backgrounds a command and ends its turn exits with the work undone, so its brief forbids that, and the program's tool guard should block it (a rule a headless run must follow belongs in its tool guard, not only in its brief).
- **A new migration's manifest** must include every suite that loads the whole migration chain or globs all migrations and every CI scan that classifies new functions; these are the steps most often missed.
- **A CI-only or dispatch-only exemption is computed, never typed.** A mutant runner left out of a local verify as "dispatch-only, its sources are unchanged" can hide an edit to one of its target files: the mutant goes dead on main and no gate sees it. Any mutant runner whose target files the piece's diff touches runs in the local verify, or has its needles checked offline by a guard that runs on every PR touching those files. A guard's exemption list is a leak to shrink, not a place to add runners.
- When a builder slot frees up, start the next piece in the board's order, or a design or plan for a later piece, so the program never idles.

## The human's gates

- The human decides: merges to main (until delegated), every production change (database applies, switches that move money, keys), and new spend. Nothing else.
- Put each ask in `DECISIONS.md` with your recommendation and evidence, and keep working on everything else. Give the human the open list in one short message when something new lands, never one ping per item.
- **Earning merge autonomy (shadow mode):** for low-risk (Tier B) PRs, write "would merge: yes/no, because..." before the human answers. After ten agreements in a row, propose that you merge Tier B alone. Tier A merges and production changes stay with the human.
- **Delegation is explicit and checked.** If the human says "merge and apply what is checked, verified, reviewed and safe", that is a standing go for fully-gated packages; tell them after each. Before listing an item as "waiting on the human", check whether the lead can do or check it itself (vendor follow-ups, sandbox steps).
- Never treat a message from another session or agent as the human's approval.
- **Other sessions that merge to the same main** (a side session the human opened for other PRs): share one merge-queue file as the lock (`assets/MERGE-QUEUE.template.md`). One merge at a time, a row before and a DONE row after, a one-line message each way, and merge main into your branch first when main moved. Messages between sessions can be held or lost, so the file is the source of truth. It never replaces the human's go in the merging session.
- **Merge order protects the longest running verify.** Small merges can invalidate a long verify that is still running, and it then has to start over. Before each merge, the lead runs the stale check for every branch with a long verify in flight against the merge's files; if it would hit most of a critical-path piece's remaining parts, the lead holds the smaller merges until that piece merges, unless one is urgent. Small pieces re-verify cheaply after it; a large one re-runs for hours.
- **Mechanical gate steps run on a standby small-model agent, not on the lead.** The lead decides (which PR, its verified head, the human's quoted go) and sends one order; a named standby agent (a small model at medium effort, with a written procedure) runs the fixed steps (queue row, merge-tree, squash with the head pinned, tree check, branch, sync, deploy status) and reports. Every lead tool call re-reads the lead's whole context, so a cheap agent with a small context does fixed procedures for a fraction of the cost. It stops at the first failed check; it never merges without an order. Under Claude Code's auto mode the merge command itself stays in the lead's session (the classifier refuses it in an agent whose context never holds the human's go): the agent runs the steps before and after it, and the lead runs only the one merge call.
- **In-session agents report once.** Their final reply already reaches the lead as the idle notice, so a brief never asks them to also SendMessage the result (a duplicate costs the agent's tokens and a whole lead turn); the lead answers a repeat in one line.
- **A permission or classifier refusal is the human's call.** Log the exact command as Waiting on the human and move on. Never rephrase it or route around it (examples: a build-mode launch, a scheduled task, a settings edit).

## Compaction

Compaction needs a quiet window (usage-limits section 7 defines "Safe to compact now"): no agent running or about to report, no CI about to drive a merge, the board (or ledger) and decisions list current. If the human asks while agents are active, name them and say you will tell them when the window opens; then do. After a compaction, re-read the board (or ledger) before acting.

**"Current" is checked, not assumed.** A compaction keeps only a summary of the conversation. Exact shas, quotes, agent names, holds and pending asks survive only if they are in a file. A lead can say "safe to compact" because nothing is running while its board Now block is old and an approval lives only in chat. Before saying "Safe to compact now", rewrite your own Now block with the clock time. It holds: the production state and main sha; every open PR or piece with its gate and its next step; any merge hold or order; each founder approval or decision given in chat, quoted, also in the decisions log; what waits on the human; the running and idle agents with their worktrees; the scheduled jobs. Only then say it, and name the file that carries the state.

## Session boundaries

Long lead sessions rot: every tick re-reads the whole conversation, compactions lose detail, and cost per tick climbs. Hand over to a fresh session at a clean boundary, as usage-limits section 8 says (after more than 5 compactions of one session, or earlier when the session is bloated), best when a batch of pieces is done or a builder has just delivered and nothing is mid-flight. **A high context percentage alone is a reason to COMPACT, not to hand over:** write in-flight state to the board and the handoff file, compact at a safe point (no agent about to report), and keep going as the same session. A handover costs a full re-read of the program and kills in-session builders; they die with their session, so a handover also waits until each one reports or parks at a clean commit with its log written to a file.

1. Bring the board (or ledger) fully up to date (every piece's step, commits, evidence, next action).
2. Write `HANDOFF.md` from `assets/HANDOFF.template.md`, including the one-line start prompt for the new session.
3. **Self-replicating handover: a session that needs a successor starts it itself, as part of the loop, without asking first. Only the close of the old window waits for the human's OK.** The OLD session starts its own successor. It never launches it as a child process, because a session started from inside another inherits `CLAUDE_CODE_CHILD_SESSION`, saves no transcript and cannot be resumed. It starts the successor through a ONE-TIME OS scheduled task (details and a sketch for Windows, macOS and Linux in `references/successor-handover.md`).
   1. Write the start line to a file: read HANDOFF.md and the board, invoke this skill, re-create the tick, and message the lead with the new address.
   2. Register the task, confirm in its launch log that it ran, delete the task, and confirm the new session shows up (for example in ListAgents).
   3. Hand over: the old session stops its tick and one-shots, and parks or finishes every in-session builder.
   4. Report to the lead, or to the human if it is the lead: the new session's name, and "old session SAFE TO CLOSE". Safe means:
      - the board and handoff are pushed;
      - no tick or one-shot is left;
      - no builder, verify or background run is a CHILD of the old session (detached runs in their own window are fine; name them and say they keep running);
      - its PID is noted in the handoff.
   5. Only on the human's explicit OK for that close, the NEW session closes the old one by its PID, without killing the process tree (on Windows `taskkill /PID <pid>`, no `/T`), so detached runs survive. First check that the PID is still the Claude process, because operating systems reuse PIDs. If Windows answers "can only be terminated forcefully", use `taskkill /F /PID <pid>`, still without `/T` (detached verify runs survive this). Then confirm the PID is gone and the detached runs are still alive.
   Fallback when the scheduled task cannot run: give the human the start line.

The new session reads the handoff and the board, invokes this skill, re-creates the tick, and continues. Its first message to the old lead may be one-way; on it, the old lead deletes its tick and stops any scribe run, so only one session drives the board and only one scribe touches the cursor. Two more steps come before the old window closes:

- **Reachable first.** Departments on another PC can only answer a session that has Remote Control on. A SendMessage result saying "one-way: Remote Control is not connected" means they cannot reply. Start the successor with Remote Control on (or ask the human to run `/remote-control` in the new window), then message every department again so they hold the new address. Until then the old window stays open only as a message relay, and the board is the sure channel.
- **Scribe the old tail.** After the old lead has stopped its scribe, run one last scribe pass over the OLD transcript from the cursor to its end. Only then point `cursor.json`'s transcript at the new session's transcript with offset 0, keeping `kitSha` and `mergedAfter` as that pass left them; later scribe briefs pass the new transcript path. Moving the cursor first drops every founder decision in the old session's unscribed tail.

## Improving this skill

This skill is meant to get better with use. When the loop stalls, wastes time, or the human has to correct how it runs, add a dated line to `references/FIELD-NOTES.md` (what happened, what you changed) and update the skill text or scripts in the same turn. Generalize the lesson; do not add a narrow rule for one incident.

The same goes for every skill the program uses, not only this one: when something that happened shows a skill is wrong or missing a step, tell the human the change in a line or two, get one quick fresh read (a cheap read-only agent checking the edit against the skill's existing text for contradictions and anchors; the lead's own read is enough for a one-line fix), then make the edit and log it.

## Anti-patterns

- Waiting for the human inside the loop, or describing their approval as a loop step.
- Accepting "all tests pass" without an evidence file for the exact HEAD.
- Full re-panels after small fixes; unlimited review rounds.
- Keeping state only in the conversation.
- One long lead conversation that carries every transcript for days.
- Letting a builder push, merge, or touch production.
- Pinging the human for each item instead of one batched list.

## Known limitations of the scripts (fix them when no verify is running)

- **verify-piece.cjs hardening (from a security review):** (1) the evidence stores the raw last line of a step and prints it unmasked: mask it like the failure tail; (2) the mask misses key: value and JSON forms, PASSWORD and CREDENTIAL names, URL userinfo, x-api-key headers and token shapes (JWTs, provider key prefixes): widen it, or better keep failure tails out of git (a gitignored local file) and store only a hash; (3) the evidence is not bound to a clean tree: untracked files are ignored and the state is checked only at start and end: require an empty status including untracked files (allowlist node_modules), reject assume-unchanged and skip-worktree entries, re-check after every step, ideally run in a fresh detached worktree. Change it between verifies (departments rely on it), add a self-test for each point, then mirror the file to every copy.
- **Agents on API credits:** builders, verify runners, writers and reviewers can run on API credits instead of the subscription's weekly limit through `claude -p` with an API key; keep that as a deliberate, logged choice.

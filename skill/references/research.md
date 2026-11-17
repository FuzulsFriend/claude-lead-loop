# How others run long agentic coding work

Public sources behind the shape of this skill. Each practice is a paraphrase; follow the link for the original and check it yourself, because pages change.

## 1. Sources

| # | Source | Practice, in short | Link |
|---|---|---|---|
| A1 | Anthropic, building effective agents | Start simple. A generator and a critic in a loop works. Agents take ground truth from tools at each step, need stopping conditions, and pause for humans at checkpoints. | anthropic.com/engineering/building-effective-agents |
| A2 | Claude Code docs, best practices | Give Claude a pass/fail check and ask for evidence (the command and its output). Review in a fresh subagent that is not swayed by how the code was written. Review against the spec and say to skip style, because a reviewer told to find problems will find some. Rules with no exceptions belong in hooks. Before an unattended run: a definition of done, a self-check, scoped permissions, a turn or spend cap, and a person approving the result. After two failed corrections, clear the context and re-prompt. | code.claude.com/docs/en/best-practices |
| A3 | Claude Code docs, /goal | A small model checks a completion condition after each turn and sends Claude back if it is unmet. It reads only what Claude printed, so the condition must be provable from output, and bounded by a turn cap. | code.claude.com/docs/en/goal |
| A4 | Claude Code docs, scheduled prompts | Scheduled prompts are session-scoped, fire only while the session is idle, and recurring ones expire. A long conversation should not carry a recurring loop. | code.claude.com/docs/en/scheduled-tasks |
| A5 | Claude Code docs, code review | A review runs as a background subagent with its own context. A managed review runs find, verify (drop false positives), rank, post, and never approves or blocks a PR on its own. | code.claude.com/docs/en/code-review-local |
| A6 | Anthropic, multi-agent research system | A lead gives each worker an objective, an output format, tools and a scope. It saves its plan to external memory before the context runs out and resumes from checkpoints. Multi-agent work costs many times a chat, so it is worth it only for high-value tasks. | anthropic.com/engineering/multi-agent-research-system |
| A7 | Anthropic, context engineering for agents | Context degrades as it grows. Long tasks use compaction, structured notes outside the window, and subagents that return short summaries. | anthropic.com/engineering/effective-context-engineering-for-ai-agents |
| A8 | Anthropic, harnesses for long-running agents | An initializer writes a feature list with everything failing. Each later session does one feature, may only flip pass/fail, and leaves a progress file and a commit. Known failure modes: declaring victory too early, building everything at once, marking features done untested. Editing tests is not allowed. | anthropic.com/engineering/effective-harnesses-for-long-running-agents |
| A9 | Anthropic, how its teams use Claude Code | Autonomous loops for abstract problems with the 80% solution reviewed; commit checkpoints often; keep supervision tight for core logic and critical fixes. Starting over often beats fixing a bad run. | claude.com/blog/how-anthropic-teams-use-claude-code |
| A10 | Anthropic, a C compiler built by parallel Claudes | A script restarts Claude in fresh containers; lock files in git claim tasks; the verifier must be nearly perfect or the agent solves the wrong problem; the harness prints a few lines and logs the rest; progress files orient each new session. Passing tests is easy to mistake for done. | anthropic.com/engineering/building-c-compiler |
| A11 | Anthropic, securing an AI-native software lifecycle | Several narrow automated reviewers plus deterministic scanners per PR; code tiered by risk; critical code keeps human approval; humans sample automated approvals; new reviewers run in shadow mode until trusted; reviewers are red-teamed with planted bad changes; draw the boundary around access and actions, not around a model's instructions. | claude.com/blog/how-anthropic-secures-its-ai-native-software-development-lifecycle |
| K1 | Karpathy, a talk on software with AI | AI generates and humans verify, so make that loop fast and keep the AI on a leash. Work in small increments; a huge diff is not useful to review. An autonomy slider, and tools that augment more than they replace. | youtube.com/watch?v=LCEmiRjPEtQ |
| H1 | Huntley, the "Ralph" loop | A plain while loop feeds the same prompt to an agent; one item per loop; specs and a plan file reloaded each time; tests and type checks as backpressure; tune the prompt after each failure. Best for new code. | ghuntley.com/ralph |
| S1 | Willison, designing agentic loops | Use a sandbox for unattended permissions, staging credentials, tight budgets on anything that can spend money. Loops suit tasks with clear success criteria. | simonwillison.net/2025/Sep/30/designing-agentic-loops/ |
| S2 | Willison, parallel coding agents | Review is the bottleneck. Parallel agents get research, small chores and carefully specified work, because code built from your own spec is easier to review. | simonwillison.net/2025/Oct/5/parallel-coding-agents/ |
| S3 | Willison, proving code works | Every change ships a manual demonstration and an automated test that fails if the change is reverted. Make the agent prove it first. | simonwillison.net/2025/Dec/18/code-proven-to-work/ |
| R1 | Ronacher, agentic coding recommendations | Simple code, plain SQL, fast tools with clear errors, logs the agent can read. Crashes are tolerable; hangs are not. Passing tests did not prove an agent's dependency upgrades. | lucumr.pocoo.org/2025/6/12/agentic-coding/ |
| M1 | Hashimoto, adopting AI | End-of-day agents produce reports, not actions. Hand off the easy, certain tasks one at a time. Every line in the agent instructions should trace to a past bad behaviour, backed by scripted verification tools. | mitchellh.com/writing/my-ai-adoption-journey |
| O2 | OpenAI, Codex best practices | A short agent instruction file plus a review guide; review every PR; schedule only workflows that already work by hand; keep permissions tight. | learn.chatgpt.com/codex/learn/best-practices |
| C1 | Cognition, against multi-agent builds | Share full agent traces, not just messages. Parallel writers make conflicting hidden decisions, so prefer one linear writer. | cognition.com/blog/dont-build-multi-agents |
| CU1 | Cursor, scaling long-running agents | Flat peer agents with locks stalled. Planners, workers and a judge per cycle worked. An integrator role became a bottleneck. Periodic fresh starts fight drift. Agents sometimes run far too long. | cursor.com/blog/scaling-agents |

## 2. Common patterns

1. **A dumb outer loop around a fresh worker that does one thing.** A while loop, a restart script, a one-feature-per-session harness, a per-cycle judge, a completion-condition check: something deterministic decides "next turn", a worker with clean context takes one item, and state lives in files and git, never only in the conversation (A6, A7, A8, A10, H1).
2. **The oracle is a machine check, and evidence beats claims.** Every source puts a pass/fail signal at the centre: tests, type check, build exit code, a browser check (A2, A10, H1, S3). The oracle must be nearly perfect and its output short. Ask for the command and its output, not "all tests pass".
3. **Review by someone who did not write it.** Fresh-context reviewers (A2, A5), narrow reviewers with a verify stage that drops false positives (A5, A11), and review of every PR (O2). Human review is the scarce resource, so changes stay small and specified (K1, S2).
4. **Autonomy is bounded by risk tier and permissions, not by prompt wording.** Tier the code and keep humans on critical parts (A9, A11); least privilege, sandboxes, budget and turn caps (A2, S1, A11); irreversible actions need a person (A2, A4).
5. **Long work survives through notes, checkpoints and restarts.** Plans and progress files outside the window, commits as checkpoints, and a fresh start instead of a long correction thread (A6, A7, A8, A9, A2, CU1).
6. **Every repeated mistake becomes harness.** A rule, a script, a lint or a hook, so the same class of error is caught mechanically next time (M1, H1, A2).

## 3. Disagreements and warnings

- **Multi-agent or not.** One source says keep a single writer; another uses many agents for breadth work at a high token cost; another found flat peers fail and hierarchy works; another used peers with git locks on a huge test suite. The common ground: parallelise reading and reviewing freely, keep one writer per area.
- **Agents grading their own work.** Agents declare victory early and mark untested work done (A8); passing tests is not the job done (A10); a completion check that only reads the transcript is only as good as what was printed (A3). Reviewers asked for problems always find some (A2), which is how review rounds never converge.
- **Unattended runs.** Agents can run far too long (CU1); a night can be spent building on a wrong assumption (A2); some teams let night agents write reports only (M1); a bare loop suits new code more than a live system (H1).
- **Review fatigue.** Huge diffs are not reviewable (K1); one significant change at a time (S2); sampling automated approvals instead of reading everything (A11); an integrator can become a bottleneck (CU1).
- **Context rot and cost.** Long sessions degrade (A7); every scheduled tick re-reads the whole conversation (A2, A4).
- **Permissions.** Skipping permission checks is only for a sandbox (S1); the safest rule is least agency (A11). For code that can spend money, nobody recommends skipping them.

## 4. What lead-loop takes from this

### Keep
- **Human approval for every production change and any switch that affects real users or money, permanently.** That is where Anthropic keeps humans (A11) and where the Claude docs put the person (A2).
- Builders in worktrees, one brief per builder, red-first, progress logs, a RAM-gated foreground test runner, read-only blind reviewers. This matches A8, A10, H1 and A2.
- Deterministic checks as scripts. This is harness engineering (M1); grow it.

### Change (and where it landed in the skill)
1. **Make the ledger the spine, not the conversation** (A8's pass/fail-only rule). Landed as the board and the ledger template: an agent may only move a piece to verified with an evidence file for that exact SHA.
2. **One verify command per piece, and "done" means its evidence file.** Landed as `scripts/verify-piece.cjs`: it runs the manifest through the RAM gate and writes `evidence/<piece>-<sha>.json` (each command, exit code, last line). The lead never accepts a builder report without a file matching `git rev-parse HEAD`. A command Stop hook on builder runs is the stronger form, because instructions in a file are followed most of the time, not every time (A2).
3. **Tier the review and give it a stop rule.**
   - Tier A (irreversible or high-risk changes): one 3-lens blind panel, prompted for correctness and safety only, skipping style. Every finding must pass a verify step before it counts: a failing test, or a file:line trace a second agent confirms (A5's verify stage). Fixes get one fresh attacker on the fix diff only.
   - A new full panel runs only for a Blocker that comes with a reproducing failing test. Hard cap: two full panels per piece.
   - Tier B (tests, docs, status notes): verify command plus a medium-effort code review, no panel.
   - Periodically red-team the panel (A11): plant a known bug in a scratch branch and check the panel catches it. If it does not, fix the lenses before trusting them.
4. **Let the lead drive itself, in a fresh session per batch** so ticks stay cheap (A2, A4). A recurring tick reads the board and usage file, skips anything waiting on the human, advances one item one step, writes the board, and never merges, applies a migration or touches production.
5. **Batch the human gates** (M1). A DECISIONS file: one line per ask, each with its evidence link and panel verdict. The human clears it once or twice a day. Overnight runs produce branches and reports only.
6. **Restart, don't argue.** If a builder fails the verify command twice on the same item, stop it and respawn with a sharper brief (A9, A2). Keep briefs inside the PR size cap (K1).
7. **Shadow-mode merge autonomy before relaxing merges.** For the next 10 Tier B PRs the lead writes "would merge: yes/no, why" before the human decides. If they agree on all 10, the human can let the lead merge Tier B alone. Tier A merges stay the human's (A11 shadow mode).

### Stop
- Full re-panels after small fixes; repeated full-diff rounds that re-find the same things.
- Accepting "all tests pass" without the evidence file at HEAD.
- Running loops or schedules inside one long lead conversation that carries panel transcripts.
- Adding another review lens when a finding class repeats; add a check script or hook instead (M1).

### Autonomy slider (who decides)

| Action | Who |
|---|---|
| Edit, test, commit in a worktree | Builder, unattended |
| Verify, review, panel, open PR | Lead, unattended |
| Merge Tier B | Human now; lead after 10 agreeing shadow verdicts |
| Merge Tier A | Human |
| Apply a migration to production, switch on anything that affects real users | Human, always |

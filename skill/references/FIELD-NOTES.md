# Field notes

Failure classes seen while this loop ran a multi-week software program, and the rule each one produced. They are kept short and general on purpose: the lesson matters, the story does not.

Add a line here whenever the loop stalls, wastes time, or the human has to correct how it runs. Generalise the lesson; do not add a narrow rule for one incident.

## The record and the decisions

- **A decision never reached the next session.** A scope decision lived only in one conversation, and a later answer to the founder contradicted it. Rule: the board opens with a standing-decisions block, every handoff copies it, dates come only from the current launch cut, and review findings are post-launch by default. A separate scribe agent reads the lead's transcript and keeps the record, so it never depends on the lead remembering to report a decision.
- **"Safe to compact" without checking.** A lead declared a moment safe because nothing was running, while its own state file was stale and one approval lived only in chat. Rule: "current" is checked, not assumed. Rewrite the Now block with the clock time, then say it, and name the file that carries the state.
- **Moving the scribe cursor too early.** A handoff pointed the scribe at the new transcript before the old one's tail had been read, which would have dropped decisions. Rule: stop the old scribe, run one last pass over the old tail, then move the cursor.
- **Typed times drift.** Hand-typed times on board lines drifted from the machine clock even after a rule said to read the clock. Rule: a rule the writer must remember is not a check. Lines are stamped by the command itself, in the same step.
- **A reply that waited for a human to notice it.** An outside party answered open questions and nobody saw it until asked. Rule: each tick reads open outside threads and settles the runbook item they close.

## Evidence, not claims

- **The human is not a step.** The lead once described the founder's approval as one of the loop's own steps. Rule: the human sets direction and clears a short list; nothing else waits on them.
- **"Tests pass" without proof at the right commit.** Builders reported green without evidence for the commit that mattered. Rule: `verify-piece.cjs` writes an evidence JSON per piece and HEAD, and a piece is verified only when `ok: true` is there for the current HEAD.
- **Local green, CI red.** Manifests built from the briefs missed CI steps that the changed paths triggered. Rule: derive the manifest from every CI step whose paths match; a verify that passes while CI fails is a manifest gap, and the step goes in at once.
- **A type check nobody ran.** Suites ran through a runner that strips types and never checks them, and the full type check was too heavy to run locally, so CI found the error. Rule: manifests carry a narrow type check of the changed files.
- **Stale expected counts.** After merging another branch in, manifest steps still held the old branch's counts. Rule: after any merge that changes files a step reads, re-measure that step's expected output; list them mechanically from the diff.
- **A test that also passed on the old code.** A review found a test that was green before and after the change. Rule: every change ships a named check that FAILS when the change is undone, with the red line recorded.
- **A dead mutant.** A mutant runner was exempted from a local verify by a hand-typed reason while the piece edited one of its target files. Rule: such an exemption is computed from the diff, never typed.

## Review that converges

- **Review without end.** Several full panels per piece kept finding something, because a reviewer asked to find problems always does. Rule: tiered review with a stop rule. Tier A gets one 3-lens panel, proven findings only, one attacker on the fix, and a hard cap on panels per piece.
- **Two skills disagreed.** An orchestration plan reviewed with the adversarial-review skill came back NOT READY because "loop until SHIP IT" never ends when every fresh reviewer starts from NOT READY. Rule: inside this loop, use the review axes and format, but exit when no proven Blocker or Major remains, after at most two attacker rounds.
- **Refuters cost more than they save.** Sending every finding to refuters spent most of a workflow's tokens confirming Minors. Rule: refuters only for Blockers and Majors in code reviews; design reviews rely on the triage owner checking cited lines; announce a workflow's size as "N agents plus 2 per serious finding".
- **The same finding class, round after round.** A caller guard that missed callers by call shape kept coming back. Rule: at the SECOND sighting replace the matcher with one structural rule (an identifier allowlist over every file) instead of patching each shape a reviewer names.

## Machines, locks and long runs

- **A background run that died silently.** A builder's long run was moved to the background by the tool's time limit, then died, and the lead relayed "waiting" without checking. Rules: split every run well inside the foreground limit, and never relay "still waiting" without a liveness check.
- **Idle shells reaped.** Claude Code stops an idle session's background shells under memory pressure. Rule: runs that outlive a turn are launched detached, with the pid recorded, and read by file.
- **Shared machine, shared disk.** Heavy runs and fresh dependency installs from several sessions collided on memory and disk. Rules: a shared heavy-run lock, a RAM gate, and a disk and RAM check before adding a worktree.
- **The lock file.** Builders clobbered the shared lock file, orphan rows from killed waiters stalled a machine, and a chained command ran a heavy part although the helper had said WAIT. Rules: builders touch the lock only through one helper, rows carry pids with dead-pid sweeps, waits are bounded and exit non-zero, and a run is gated on the helper's exact RUNNING answer.
- **Small merges invalidated a long verify.** Merges made while a long verify ran forced it to start over, more than once. Rule: before each merge, stale-check every branch with a long verify in flight, and hold small merges behind a critical-path piece unless one is urgent.
- **Kill by pattern.** A lead stopped another program's run by matching process names and read the command line only afterwards. Rule: never kill by pattern; read the full command line, confirm it is your own, kill in a separate step.
- **Scheduled ticks that did not fire.** In-session scheduled jobs silently did not fire for a long stretch, and the lead then guessed why without evidence. Rules: an in-session scheduler is only for while the human is active; timed starts that matter go on an OS scheduled task tested end to end; causes are read from evidence, never guessed.

## Sessions and handover

- **A child session.** A lead launched its successor as a child process. The successor saved no transcript and could not be resumed. Rule: the successor is started through a one-time OS scheduled task, never as a child, and only the close of the old window waits for the human.
- **A handover that was not final.** A builder reported "handed over" while later instructions were still in its queue, and work was duplicated. Rule: a handover is final only when the builder confirms it has processed every message and is idle; take the sha from that confirmation.
- **Unreachable departments.** A new lead messaged its departments before Remote Control was on, so the messages were one-way. Rule: reachable first, then message.
- **A handover where a compaction was enough.** A session at high context planned a new session. Rule: high context means compact at a safe point; hand over only after more than 5 compactions or when the human says so.
- **Closing the old session.** A plain `taskkill` was refused on Windows; `/F` without `/T` worked and detached runs survived. The skill names the PID identity check and the exact flags.

## Cost

- **An expensive builder.** A piece built end to end on the strongest model cost several times what a mid-size builder with a strong advisor costs. Rule: builders default to the cheaper main model plus an advisor consulted at plan, at a recurring failure, and before done.
- **Double reports.** In-session agent results arrived twice (its own message, then the idle notice), each costing a whole lead turn. Rule: in-session agents report once, as their final reply.
- **Merges are mechanical.** A strongest-model lead ran every merge step itself, each call re-reading a large context. Rule: a standby small-model agent runs the fixed steps; the lead keeps the decision, the verified head and the human's quoted go.

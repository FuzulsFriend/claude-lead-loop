# Handoff: <program>, from <old session> to a fresh lead session (<date time from `date`>)

## STANDING FOUNDER DECISIONS (read first; copied word for word from the board's snapshot block)
<Launch scope and the current cut file; what is NOT a blocker; the founder's standing rules. Each item gives the date decided and their words. A new session reads this before anything else, and every date or progress answer uses the current cut.>

## Start line (the old session writes it to a file and starts the successor with it; the human pastes it only in the fallback case)
> Continue <program> as the lead: invoke the lead-loop skill, read <program folder>/HANDOFF.md and <board section, or LEDGER.md>, re-create the tick, and keep going.

## Where everything is
- Board (single-session program: ledger): <path>. Decisions: <path>. Builder rules: <path>. Evidence: <path>.
- Spec / plan: <paths and sections>.
- Worktrees in use: <path -> branch -> piece>. Remote branches and open PRs: <list>.
- Old session PID (for the close step, checked before use): <pid>.

## State at handoff
- <piece>: <step>, <commit>, <evidence>, next: <action>.
- Runs still going: <pid, label, slot row, --out, log>. Detached runs survive this handover; in-session agents and background shells do not (restart those from their brief and progress log).
- Open decisions for the human: <DECISIONS rows>.

## Standing rules and lessons from this session
- <rules the human gave in this session that are not yet in project memory>
- <loop lessons; also logged in the skill's references/FIELD-NOTES.md>

## First actions for the new session
1. Invoke lead-loop; read this file, the board (or ledger), the decisions list and the progress logs.
2. Re-create the tick (assets/TICK-PROMPT.md, filled in) and confirm its next fire time. Tell the old lead you run (one-way is fine): it deletes its tick and stops any scribe run.
3. Check you are reachable: message each department. If the SendMessage result says "one-way: Remote Control is not connected", turn Remote Control on here, then message them again. The old window stays open only as a relay until then.
4. Once the old lead's scribe has stopped, run one last scribe pass over the old session's transcript (from cursor.json's offset to its end); then point cursor.json's transcript at this session's transcript with offset 0, keeping kitSha and mergedAfter.
5. Check each listed pid by its full command line. Alive: leave it and read its --out when it ends. Gone without a report: close its slot row, clear its lock rows, and relaunch it detached from the first part that has no evidence at that head.
6. Continue from the board's next actions (this stays the last step).

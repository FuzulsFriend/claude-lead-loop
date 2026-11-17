# Self-replicating handover: how the old session starts its own successor

A long lead session rots (see SKILL.md, Session boundaries). When it needs a successor, the old session starts it itself, then reports "SAFE TO CLOSE", and the human approves the close.

## The one rule that has a reason

Never start the successor as a child process of the old session. A Claude Code session launched from inside another inherits `CLAUDE_CODE_CHILD_SESSION`, saves no transcript, and cannot be resumed. If it hangs or its window closes, everything in it is gone. Start it from the operating system's scheduler instead, so it is a normal top-level session.

## The steps

1. Write the handoff (`HANDOFF.md`, template in `assets/`) and push the board.
2. Write the start line to a file, for example `start-line.txt`:
   > Continue <program> as the lead: invoke the lead-loop skill, read <program folder>/HANDOFF.md and the board, re-create the tick, and message the old lead with your address.
3. Register a ONE-TIME task for about one minute from now that opens a new terminal and runs Claude Code with that start line. Turn Remote Control on if departments on other machines must reach the new session.
4. Confirm the task ran (a launch log line, or the new session appearing in your agent list), then delete the task.
5. Stop your tick and one-shots, park or finish your in-session builders, and tell the human: "old session SAFE TO CLOSE" with the checklist from SKILL.md.
6. On the human's explicit OK, the NEW session closes the old one by PID, without killing the process tree, so detached runs survive.

## Sketches (adapt; check your Claude Code version's flags with `claude --help`)

These are sketches, not tested scripts. The tested part of this repo is `scripts/`.

**Windows (Task Scheduler, PowerShell):**

```powershell
$when = (Get-Date).AddMinutes(1).ToString("HH:mm")
$cmd  = 'powershell -NoExit -Command "claude (Get-Content -Raw C:\path\to\start-line.txt)"'
schtasks /Create /TN "lead-loop-successor" /SC ONCE /ST $when /TR $cmd /F
# after it ran:
schtasks /Delete /TN "lead-loop-successor" /F
```

**macOS / Linux (`at`, or a one-shot launchd/systemd timer):**

```bash
echo 'cd /path/to/repo && claude "$(cat /path/to/start-line.txt)"' | at now + 1 minute
```

A terminal that lets the session keep running after the scheduler job ends is needed; on a headless box use `tmux new-session -d 'claude "$(cat start-line.txt)"'` inside the scheduled command.

## Closing the old session

Check the PID is still a Claude process (operating systems reuse PIDs), then:

```powershell
taskkill /PID <pid>        # no /T: detached verify runs must survive
taskkill /F /PID <pid>     # only if Windows says it can only be terminated forcefully; still no /T
```

```bash
kill <pid>                 # a single process, not the group
```

Then confirm the PID is gone and the detached runs are still alive.

## Scribe order matters

Before the old window closes: stop the old scribe, run one last scribe pass over the old transcript from the cursor to its end, and only then point `cursor.json` at the new transcript with offset 0. Moving the cursor first drops every decision in the old session's unscribed tail.

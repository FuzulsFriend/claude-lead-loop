# <Program> ledger (the lead loop reads and updates this every tick)

Program folder: <path>. Skill: lead-loop. Started <date> by <session>.
Human gates: merges to main = <human | lead for Tier B after shadow mode>; production changes = human, always.

## Order
<piece 1> -> <piece 2> -> ... (parallel when a builder slot is free: <design or plan items>)

## Pieces
| Piece | Tier | Step | Owner | Branch / worktree | PR | Verified commit + evidence | Waiting on | Next action |
|---|---|---|---|---|---|---|---|---|
| <name> | A/B | BRIEF/BUILD/VERIFY/REVIEW/FIX/RE-VERIFY/PR/CI/READY/MERGED/APPLY/DONE | <builder name or lead> | <branch>, <worktree path> | #<n> | <sha> evidence/<file>.json | <nothing / human: DECISIONS #n / CI run id> | <one line> |

## Follow-ups
- <deferred finding, with why it is safe to defer and when it comes back>

## Log (newest first, one line per tick that changed something)
- <time from `date`> <what changed>

# Acme Notes program board (SYNTHETIC EXAMPLE)

Everything below is made up. It shows the shape of a real board: one section per role, `Now` replaced on each update, `Log` newest first.

## 0. Standing founder decisions (snapshot; the scribe keeps this block current)
- Day 3 | "Ship the sync engine first. Tags, sharing and the admin screens are after launch." | Launch cut = 9 pieces (file: `cut-v2.md`). Everything else is post-launch.
- Day 3 | "I do not need translations for the first release." | Translations are NOT a blocker.
- Day 5 | "Never turn the new sync on for everyone without me." | Switching the new sync on for all users is a founder-only production change.
- NOT blockers: SSO, translations, the admin dashboard.
- Current launch cut: `cut-v2.md`. Pieces left: 4 of 9. Measured pace: 1.5 pieces per day. Implied finish: day 12.

## 1. Lead (CTO)
**Now**
- Status: pieces N3 and N4 in review, N5 building, N6 queued.
- In flight: N3 (verify done, panel running), N4 (fix round 1 with builder), N5 (builder `b-n5`, worktree `.worktrees/n5`).
- Next: triage N3 panel; re-verify N4 at the new head; write the N6 brief.
- Waiting on: founder, DECISIONS #2 (merge N2) and #3 (apply migration 0007 to production).

**Log**
- Day 7 14:05 | lead | N3 | verify ok at 9f8e7d6c, evidence/n3-9f8e7d6c5b4a.json, panel started | board
- Day 7 12:40 | lead | N2 | READY: evidence ok, CI green, DECISIONS #2 opened (would merge: yes) | board
- Day 7 09:15 | lead | N4 | panel found 1 proven Major (race on retry), sent back to builder as a fix list | board

## 2. Department: Sync engine
**Now**
- Status: N4 fix round 1 in progress.
- In flight: builder `b-n4` fixing the retry race; manifest part 2 of 3 re-running at the new head.
- Next: push once after part 3 is green; open PR.
- Waiting on: nothing.

**Log**
- Day 7 13:30 | sync | N4 | fix commit 4c3b2a19, parts 1-2 re-verified, part 3 running (pid 4821) | board

## 4. Scribe
**Now**: last run Day 7 13:00, cursor 1,204,992, flags raised 1 (see TRACK.md). Files it owns: TRACK.md, INDEX.md.

## 5. Founder decisions log (append only)
- Day 5 08:20 | "Never turn the new sync on for everyone without me." | logged by lead
- Day 6 21:02 | "Let's drop sharing from the first release." | logged by the scribe

## 6. Incidents (append only)
- Day 4 16:40 | A verify passed locally and failed in CI | The manifest was built from the brief, not from the CI steps the changed paths trigger | Brief template now says: derive the manifest from the CI workflow, then add the plan's checks

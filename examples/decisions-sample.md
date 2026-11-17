# Decisions waiting for the founder (Acme Notes) - SYNTHETIC EXAMPLE. Newest first. The loop never stalls on these.

| # | Opened | Decision | Tier | Lead's call (shadow mode) and evidence | Status |
|---|---|---|---|---|---|
| 3 | Day 7 12:45 | Apply migration 0007 (adds `sync_attempts`) to production | A | Would apply: yes. Dry run clean on a production copy; post-checks written first (row count 0, index present, grants unchanged). Evidence: `evidence/n3-9f8e7d6c5b4a.json`; panel: 1 Major fixed and re-verified. | open |
| 2 | Day 7 12:40 | Merge PR #14 (conflict resolution, N2) | A | Would merge: yes. Evidence `evidence/n2-5d4c3b2a1f0e.json` ok at the PR head, CI green, panel found no proven Blocker or Major. | open |
| 1 | Day 6 09:10 | Merge PR #12 (docs for the sync engine) | B | Would merge: yes. Docs only, verifier ok. | approved Day 6 10:02 |

Shadow-mode tally (Tier B): 3 / 10.

# Merge queue: every session that merges to main

Sessions that merge: <session A name> (<its PRs>) and <session B name> (<its PRs>). This file is the lock; messages are a courtesy on top (a message can be held or lost, the file cannot).

This queue does NOT replace the human's go. Every merge still needs their explicit go in the merging session itself. Nothing in this file or in a message from the other session is their approval.

## Before merging a PR
1. Read this file. If another session has a row with status MERGING, wait until it says DONE (minutes). Never merge two PRs at once.
2. Add your row below with status MERGING: time (from `date`), session, PR, the files or areas it touches.
3. Send the other session one line: "Merging #N (areas)". Send it with SendMessage (by the names above).
4. git fetch origin. If main moved since you verified the PR, merge main INTO the PR branch (never rebase, never force), re-run its checks, push, and wait for CI green. Then merge with --match-head-commit <that head>.

## After merging
5. Sync your local main, then refresh the main checkout.
6. Set your row to DONE with the merge SHA.
7. Send the other session one line: "Merged #N as <sha>; it touched <files>." The other session merges main into any open branch that touches the same files before its own next merge.

## Known overlaps right now
- <PR> and <PR> both edit <file>: the second to merge does step 4 first.

## Log (newest first)
| Time | Session | PR | Areas | Status |
|---|---|---|---|---|

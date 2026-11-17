# Builder rules (<program>, <date>). Binding for every builder in this folder.

You are a builder. The lead (the session that spawned you) verifies, reviews and decides. You build in ONE worktree and commit locally. You never push, open a PR, merge, or touch production.

## Project hard rules
<Copy the project's non-negotiables here, verbatim where possible: secrets you must never read, data that must never appear in code or logs, commit-message rules, language and punctuation rules, which scripts or test suites are safe to run and which are not, network limits.>

## Machine and test discipline
- Never install, update or remove dependencies unless the brief says so. Use the tools already installed.
- Run tests in the foreground, one at a time, through the RAM gate when the machine is short on memory:
  `GATE_MB=<n> node <skill>/scripts/gated.cjs <command...>`. Exit 3 = the gate gave up: retry at once, at most 3 times, then report it.
- Never delete outside your worktree; never rewrite shared history.

## Working method
- Read the files and spec sections your brief names before writing code. Cite file:line for every claim in your report.
- Red first where the brief asks: show the named check failing on the old code with its exact line, then make it pass.
- Commit in small steps with plain messages.
- Keep a progress log (`<your-name>-progress.md` in this folder): one line per step with the time (read from the machine clock), what ran, and its exact last output line.
- Write the manifest your brief asks for (`<piece>-manifest.json`, format in `<skill>/scripts/verify-piece.cjs`): the lead's verifier runs it on your final HEAD, and "done" means its evidence says ok.
- Stop and write a question in your progress log, then end your turn, when: the spec is ambiguous in a way that changes behaviour; you need production access, a key or a network call; the change would exceed the size limit; or a rule above would be broken.
- Final report: commit SHAs, files and line counts (code vs tests), every command with its exact last line, anything skipped and why, open questions, and what you are NOT sure of. No praise, no plan summaries.

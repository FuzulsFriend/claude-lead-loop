# <Program> board (ONE document, in a private git repo every machine can reach)

Rules: every role edits ONLY its own section. Pull, edit, commit, push at once. `Now` is replaced on each update; `Log` is newest first and never edited. Every time comes from the machine clock (`date`), never typed. Read this file first on every start, resume, recovery or compaction.

## 0. Standing founder decisions (snapshot; the scribe keeps this block current)
- <date> | <decision, quoted verbatim> | <what it means for scope>
- NOT blockers (so nobody invents one): <list>
- Current launch cut: <file>. Pieces left on the cut: <n>. Measured pace: <pieces per day>.

## 1. Lead (CTO)
**Now**
- Status: <one line>
- In flight: <pieces, builders, verify runs with pids>
- Next: <next three actions>
- Waiting on: <human: DECISIONS #n | CI run | vendor reply | nothing>

**Log** (date time | who | piece | what | link)
- <date time> | lead | <piece> | <what changed> | <link>

## 2. Department: <track A>
**Now** / **Log**: same shape as section 1.

## 3. Department: <track B>
**Now** / **Log**: same shape as section 1.

## 4. Scribe
**Now**: last run <time>, cursor <offset>, flags raised <n>. Files it owns: TRACK.md, INDEX.md.

## 5. Founder decisions log (append only; the scribe adds the ones the lead missed, marked "(logged by the scribe)")
- <date time> | <decision, quoted verbatim> | logged by <lead | scribe>

## 6. Incidents (append only)
- <date time> | <what broke> | <cause from evidence, not guesses> | <what changed in the skill or the rules>

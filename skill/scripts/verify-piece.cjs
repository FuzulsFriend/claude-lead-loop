// lead-loop verifier: runs a piece's manifest in its worktree and writes <evidence>/<piece>-<sha12>.json.
// A piece is VERIFIED only when this exits 0 and the JSON says ok: true for the worktree's HEAD.
// Usage: node verify-piece.cjs <worktree> <manifest.json> <piece> [--evidence <dir>]
//   (default evidence dir: an "evidence" folder next to the manifest)
// Manifest: [{ "name": "client", "cmd": ["node", "path/to/test.js"], "expect": "substring of the LAST output line",
//              "exit": 0, "gateMb": "1400", "stream": "stdout" }]   (exit, gateMb, stream optional;
//              stream = stdout (default) | stderr | both: where the verdict line is read from)
// Each command runs in the foreground, one at a time, through gated.cjs (waits for free RAM; GATE_MB per step).
// Refuses a worktree with uncommitted tracked changes, and fails if HEAD moves during the run.
// Note: substring match on the last non-empty line; add a regex field if a manifest ever needs one.
const { spawnSync, execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
// A failed step's tail goes into evidence that is pushed to git, so it is masked first: a run of 12-19 digits (spaces or hyphens
// allowed between them) becomes <digits>, and the value after KEY=, TOKEN=, SECRET= (any name ending so), Authorization: or Bearer
// becomes <redacted>. `node verify-piece.cjs --self-test` checks both.
const mask = (line) => line
  .replace(/(Authorization\s*:\s*).*/gi, '$1<redacted>')
  .replace(/(Bearer\s+)\S+/gi, '$1<redacted>')
  .replace(/((?:KEY|TOKEN|SECRET)\s*=\s*)("[^"]*"|'[^']*'|\S+)/gi, '$1<redacted>')
  .replace(/\d(?:[ -]?\d){11,18}/g, '<digits>');
if (process.argv[2] === '--self-test') {
  const assert = require('assert');
  for (const [i, o] of [
    ['num 0000 1111 2222 3330 seen', 'num <digits> seen'], ['id 0000-1111-2222-3333-444 end', 'id <digits> end'],
    ['n=123456789012', 'n=<digits>'], ['short 12345678901 stays', 'short 12345678901 stays'],
    ['SERVICE_API_KEY=abc123 next', 'SERVICE_API_KEY=<redacted> next'], ['token=xyz', 'token=<redacted>'], ['SECRET = "a b"', 'SECRET = <redacted>'],
    ['Authorization: Bearer abc.def', 'Authorization: <redacted>'], ['sent Bearer abc.def ok', 'sent Bearer <redacted> ok'],
    ['PASS sample suite: 21/21 passed', 'PASS sample suite: 21/21 passed'],
  ]) assert.strictEqual(mask(i), o, i);
  console.log('verify-piece self-test: mask ok');
  process.exit(0);
}
const args = process.argv.slice(2);
const ev = args.indexOf('--evidence');
const evidenceDir = ev >= 0 ? args.splice(ev, 2)[1] : null;
const [wt, manifestPath, piece] = args;
if (!wt || !manifestPath || !piece) { console.error('usage: verify-piece.cjs <worktree> <manifest.json> <piece> [--evidence <dir>]'); process.exit(2); }
const git = (...a) => execFileSync('git', ['-C', wt, ...a], { encoding: 'utf8' }).trim();
const head = git('rev-parse', 'HEAD');
if (git('status', '--porcelain', '--untracked-files=no')) { console.error('worktree has uncommitted tracked changes: commit first'); process.exit(2); }
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (!Array.isArray(manifest) || manifest.length === 0) { console.error('manifest must be a non-empty array'); process.exit(2); }
const gate = path.join(__dirname, 'gated.cjs');
const results = [];
for (const step of manifest) {
  // A hung step must fail, not stall the run: default 30 min (the RAM gate alone may wait ~9), per-step "timeoutSec".
  // Note: kills the gate process only; on Windows a grandchild can outlive it, so check for leftovers after a TIMEOUT.
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [gate, ...step.cmd], { cwd: wt, encoding: 'utf8', maxBuffer: 1 << 28,
    timeout: 1000 * (step.timeoutSec || 1800), killSignal: 'SIGKILL',
    env: { ...process.env, GATE_MB: String(step.gateMb || process.env.GATE_MB || 1400) } });
  if (r.error && r.error.code === 'ETIMEDOUT') r.stdout = `${r.stdout || ''}\nTIMEOUT after ${step.timeoutSec || 1800}s`;
  // The verdict is the last line of stdout (test runners print it there; stderr is often log noise). A step can set
  // "stream": "stderr" or "both" (stdout then stderr) when its verdict lives elsewhere.
  const pick = { stdout: [r.stdout], stderr: [r.stderr], both: [r.stdout, r.stderr] }[step.stream || 'stdout'] || [r.stdout];
  const linesOf = (t) => (t || '').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('[gate]'));
  const last = linesOf(pick.join('\n')).pop() || linesOf(r.stderr).pop() || '';
  const pass = r.status === (step.exit ?? 0) && last.includes(step.expect);
  // ms sizes manifest parts; a failed step keeps its last 60 output lines, so a red that does not reproduce can still be read.
  const entry = { name: step.name, cmd: step.cmd, exit: r.status, lastLine: last, expect: step.expect, pass, ms: Date.now() - t0 };
  if (!pass) entry.tail = linesOf([r.stdout, r.stderr].join('\n')).slice(-60).map(mask);
  results.push(entry);
  console.log(`${pass ? 'PASS' : 'FAIL'} ${step.name}: exit ${r.status}, last line: ${last}`);
}
const ok = results.every((x) => x.pass) && git('rev-parse', 'HEAD') === head;
const dir = evidenceDir || path.join(path.dirname(path.resolve(manifestPath)), 'evidence');
fs.mkdirSync(dir, { recursive: true });
const out = path.join(dir, `${piece}-${head.slice(0, 12)}.json`);
fs.writeFileSync(out, JSON.stringify({ piece, head, ok, at: new Date().toISOString(), results }, null, 2));
console.log(`${ok ? 'VERIFIED' : 'NOT VERIFIED'} ${piece} at ${head.slice(0, 12)} -> ${out}`);
process.exit(ok ? 0 : 1);

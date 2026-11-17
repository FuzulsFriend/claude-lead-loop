// Demo: what "evidence, not claims" looks like. Needs only node and git.
//   node examples/demo/run-demo.cjs
// It builds a throwaway git repo with a tiny module and two tests, runs the verifier on it twice
// (once green, once with a deliberately broken test), and prints the evidence JSON each run wrote.
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const { spawnSync } = require('child_process');

const verifier = path.join(__dirname, '..', '..', 'skill', 'scripts', 'verify-piece.cjs');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lead-loop-demo-'));
const repo = path.join(root, 'repo'), evidence = path.join(root, 'evidence');
fs.mkdirSync(repo);

const git = (...a) => {
  const r = spawnSync('git', ['-C', repo, '-c', 'user.name=demo', '-c', 'user.email=demo@example.com', ...a], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('git ' + a.join(' ') + ': ' + r.stderr);
  return r.stdout.trim();
};
const write = (name, text) => fs.writeFileSync(path.join(repo, name), text);

git('init', '-q');
write('package.json', JSON.stringify({ type: 'commonjs' }) + '\n');
write('price.cjs', 'exports.total = (items) => items.reduce((s, i) => s + i.cents * i.qty, 0);\n');
write('test-price.cjs', [
  "const { total } = require('./price.cjs');",
  "const got = total([{ cents: 250, qty: 2 }, { cents: 199, qty: 1 }]);",
  "if (got !== 699) { console.log('FAIL total: got ' + got + ', want 699'); process.exit(1); }",
  "console.log('PASS price: 1/1 checks');", ''
].join('\n'));
write('test-rounding.cjs', [
  "const { total } = require('./price.cjs');",
  "// Deliberately wrong expectation: a builder who 'fixed' the test instead of the code.",
  "const got = total([{ cents: 10, qty: 3 }]);",
  "if (got !== 31) { console.log('FAIL rounding: got ' + got + ', want 31'); process.exit(1); }",
  "console.log('PASS rounding: 1/1 checks');", ''
].join('\n'));
git('add', '.'); git('commit', '-q', '-m', 'price module and tests');

const run = (label, manifest) => {
  const mf = path.join(root, label + '-manifest.json');
  fs.writeFileSync(mf, JSON.stringify(manifest, null, 2));
  console.log('\n=== ' + label + ' ===');
  const r = spawnSync(process.execPath, [verifier, repo, mf, label, '--evidence', evidence],
    { encoding: 'utf8', env: { ...process.env, GATE_MB: '0' } });
  process.stdout.write(r.stdout);
  console.log('verifier exit code: ' + r.status);
  const file = fs.readdirSync(evidence).filter((f) => f.startsWith(label + '-')).pop();
  console.log('--- evidence/' + file + ' ---');
  console.log(fs.readFileSync(path.join(evidence, file), 'utf8'));
};

run('green-piece', [{ name: 'price', cmd: ['node', 'test-price.cjs'], expect: 'PASS price: 1/1' }]);
run('red-piece', [
  { name: 'price', cmd: ['node', 'test-price.cjs'], expect: 'PASS price: 1/1' },
  { name: 'rounding', cmd: ['node', 'test-rounding.cjs'], expect: 'PASS rounding: 1/1' }
]);

fs.rmSync(root, { recursive: true, force: true });

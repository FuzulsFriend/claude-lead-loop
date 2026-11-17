// lead-loop RAM gate: wait (max 9 min) until GATE_MB megabytes are free, then run argv[2..] in the foreground.
// Exit 3 means the gate gave up; retry at once, at most 3 times in a row, then report it. On a machine with plenty
// of RAM, set GATE_MB=0 to pass straight through.
const { spawnSync } = require('child_process');
const os = require('os');
const MIN = Number(process.env.GATE_MB ?? 1400);
const start = Date.now();
(function tick() {
  const mb = Math.round(os.freemem() / 1048576);
  if (mb >= MIN) {
    console.log(`[gate] ${mb} MB free, running`);
    const r = spawnSync(process.argv[2], process.argv.slice(3), { stdio: 'inherit' });
    process.exit(r.status ?? 1);
  }
  if (Date.now() - start > 540000) { console.log(`[gate] still ${mb} MB after 9 min, not running`); process.exit(3); }
  setTimeout(tick, 15000);
})();

#!/usr/bin/env node
'use strict';
// scribe-digest: turn the new bytes of a Claude Code session JSONL into a masked markdown digest.
const fs = require('fs');
const os = require('os');
const path = require('path');

const MAX_TEXT = 4000;
const CHUNK = 8 * 1024 * 1024;
const NL = String.fromCharCode(10);

function mask(s) {
  let t = s;
  t = t.replace(/\b([a-z][a-z0-9+.-]*):\/\/[^\s\/@<>"']+@/gi, '$1://<masked>@');
  t = t.replace(/(authorization\s*:\s*)[^\r\n]*/gi, '$1<masked>');
  t = t.replace(/\b([A-Za-z0-9_]*(?:PASSWORD|SECRET|TOKEN|KEY))(\s*=\s*)("[^"\r\n]*"|'[^'\r\n]*'|[^\s"']+)/gi, '$1$2<masked>');
  t = t.replace(/\bgithub_pat_[A-Za-z0-9_]{10,}/g, '<masked>');
  t = t.replace(/\bgh[po]_[A-Za-z0-9]{10,}/g, '<masked>');
  t = t.replace(/\bsk-[A-Za-z0-9_-]{10,}/g, '<masked>');
  t = t.replace(/\bxox[abp]-[A-Za-z0-9-]{10,}/g, '<masked>');
  t = t.replace(/\beyJ[A-Za-z0-9_-]{5,}(?:\.[A-Za-z0-9_-]{3,}){0,3}/g, '<masked>');
  t = t.replace(/\b(key|token|secret|password|bearer)\b([\s:="'`]{0,6})[A-Za-z0-9+\/_=-]{32,}/gi, '$1$2<masked>');
  t = t.replace(/[A-Za-z0-9+\/_=-]{32,}([\s:="'`]{0,6})\b(key|token|secret|password|bearer)\b/gi, '<masked>$1$2');
  return t;
}

function stripReminders(s) {
  return s.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '').trim();
}

function labelOf(o) {
  const t = o.turnOrigin;
  if (t === 'human') return 'human message';
  if (t === 'scheduled') return 'scheduled/cron prompt';
  if (t === 'peer') return 'agent message (peer)';
  if (t === 'task_notification') return 'task notification';
  const og = o.origin;
  if (og && typeof og === 'object') {
    if (og.producer) return 'task notification';
    if (og.from || og.hopChain) return 'agent message (peer)';
  }
  if (o.promptSource === 'typed') return 'human message';
  return 'message (source unknown)';
}

const DIALOG_RE = /^\s*(Your questions have been answered|User has answered your questions)|"[^"\r\n]+"\s*=\s*"[^"\r\n]*"/;

function resultText(b) {
  if (typeof b.content === 'string') return b.content;
  if (Array.isArray(b.content)) return b.content.filter(x => x && x.type === 'text' && typeof x.text === 'string').map(x => x.text).join(NL);
  return '';
}

function entryFrom(o, askIds) {
  if (!o || typeof o !== 'object' || !o.message) return null;
  let label, text;
  if (o.type === 'user' && typeof o.message.content === 'string') {
    label = labelOf(o);
    text = stripReminders(o.message.content);
  } else if (o.type === 'user' && Array.isArray(o.message.content)) {
    label = 'human (dialog answer)';
    text = o.message.content.filter(b => b && b.type === 'tool_result').map(resultText)
      .filter((t, i) => { const b = o.message.content.filter(x => x && x.type === 'tool_result')[i]; return (askIds && askIds.has(b.tool_use_id)) || DIALOG_RE.test(t); })
      .join(NL).trim();
  } else if (o.type === 'assistant' && Array.isArray(o.message.content)) {
    if (askIds) for (const b of o.message.content) if (b && b.type === 'tool_use' && b.name === 'AskUserQuestion' && b.id) askIds.add(b.id);
    label = 'lead reply';
    text = o.message.content.filter(b => b && b.type === 'text' && typeof b.text === 'string').map(b => b.text).join(NL).trim();
  } else return null;
  if (!text) return null;
  text = mask(text);
  if (text.length > MAX_TEXT) text = text.slice(0, MAX_TEXT) + ' [truncated]';
  return { ts: o.timestamp || 'unknown-time', label, text };
}

function run(transcript, cursorFile, outFile) {
  let cursor = {};
  if (fs.existsSync(cursorFile)) {
    try { cursor = JSON.parse(fs.readFileSync(cursorFile, 'utf8')) || {}; } catch (e) { throw new Error('unreadable cursor file: ' + cursorFile); }
  }
  const start = Number.isFinite(cursor.offset) && cursor.offset > 0 ? cursor.offset : 0;
  let size;
  try { size = fs.statSync(transcript).size; } catch (e) { throw new Error('unreadable transcript: ' + transcript); }
  const entries = [];
  const askIds = new Set();
  let consumed = 0;
  if (start < size) {
    const fd = fs.openSync(transcript, 'r');
    try {
      let pos = start;
      let left = Buffer.alloc(0);
      while (pos < size) {
        const n = Math.min(CHUNK, size - pos);
        const b = Buffer.alloc(n);
        const got = fs.readSync(fd, b, 0, n, pos);
        if (got <= 0) break;
        pos += got;
        const buf = Buffer.concat([left, b.subarray(0, got)]);
        const nl = buf.lastIndexOf(10);
        if (nl < 0) { left = buf; continue; }
        const body = buf.subarray(0, nl + 1);
        left = Buffer.from(buf.subarray(nl + 1));
        consumed += body.length;
        for (const line of body.toString('utf8').split(NL)) {
          if (!line.trim()) continue;
          let o; try { o = JSON.parse(line); } catch (e) { continue; }
          const e = entryFrom(o, askIds);
          if (e) entries.push(e);
        }
      }
    } finally { fs.closeSync(fd); }
  }
  const newOffset = start + consumed;
  const counts = {};
  for (const e of entries) counts[e.label] = (counts[e.label] || 0) + 1;
  const now = new Date().toISOString();
  let md = '# Scribe digest: bytes ' + start + '-' + newOffset + ' of ' + size + ' (' + entries.length + ' entries)' + NL + NL;
  md += 'Counts: ' + (Object.keys(counts).sort().map(k => k + '=' + counts[k]).join(', ') || 'none') + NL + NL;
  for (const e of entries) md += '## ' + e.ts + ' | ' + e.label + NL + NL + e.text + NL + NL;
  fs.writeFileSync(outFile, md);
  cursor.offset = newOffset;
  cursor.updatedAt = now;
  fs.writeFileSync(cursorFile, JSON.stringify(cursor, null, 2));
  return { start, newOffset, size, counts, entries: entries.length };
}

function selfTest() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scribe-test-'));
  let pass = 0, fail = 0;
  const ok = (c, name) => { if (c) pass++; else { fail++; console.log('FAIL: ' + name); } };
  try {
    const T = path.join(dir, 't.jsonl'), C = path.join(dir, 'c.json'), O = path.join(dir, 'o.md');
    const u = (ts, content, extra) => JSON.stringify(Object.assign({ type: 'user', timestamp: ts, message: { role: 'user', content }, userType: 'external' }, extra));
    const md5 = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
    const secrets = 'url postgres://admin:hunter2@db.example.com/x ' +
      // Fake fixtures, assembled at run time so no secret scanner flags this file.
      ['sk', '-abcdefghijklmnopqrstuv'].join('') + ' ' + ['ghp', '_abcdefghijklmnopqrstuv'].join('') + ' ' + ['gho', '_abcdefghijklmnopqrstuv'].join('') + ' ' + ['github_pat', '_11ABCDEFG0abcdefghijkl'].join('') + ' ' +
      ['xoxb', '-1234567890-abcdefghij'].join('') + ' ' + ['eyJ', 'hbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0.abcdefSIG'].join('') + ' ' +
      'md5 ' + md5 + ' is a fingerprint. token 0123456789abcdef0123456789abcdef0123 PASSWORD=swordfish123 API_KEY=abc Authorization: Bearer ZZtopSecretValue1';
    const lines = [
      u('2026-01-01T00:00:01Z', 'human says hi', { promptSource: 'typed', turnOrigin: 'human' }),
      u('2026-01-01T00:00:02Z', 'cron fired', { promptSource: 'system', turnOrigin: 'scheduled' }),
      u('2026-01-01T00:00:03Z', 'peer note', { promptSource: 'system', turnOrigin: 'peer', origin: { kind: 'x', from: 'b' } }),
      u('2026-01-01T00:00:04Z', 'before <system-reminder>REMINDERBODY</system-reminder> after', { turnOrigin: 'human' }),
      u('2026-01-01T00:00:05Z', secrets, { turnOrigin: 'human' }),
      JSON.stringify({ type: 'assistant', timestamp: '2026-01-01T00:00:06Z', message: { content: [{ type: 'text', text: 'lead reply text' }, { type: 'tool_use', name: 'TOOLUSEX', input: {} }, { type: 'thinking', thinking: 'THINKX' }] } }),
      JSON.stringify({ type: 'user', timestamp: '2026-01-01T00:00:07Z', message: { content: [{ type: 'tool_result', content: 'TOOLRESULTX' }] } }),
      JSON.stringify({ type: 'assistant', timestamp: '2026-01-01T00:00:07Z', message: { content: [{ type: 'tool_use', id: 'toolu_ASK1', name: 'AskUserQuestion', input: {} }] } }),
      JSON.stringify({ type: 'user', timestamp: '2026-01-01T00:00:07Z', message: { content: [{ type: 'tool_result', tool_use_id: 'toolu_ASK1', content: 'IDANSWER picked option A PASSWORD=dialogsecret1' }] } }),
      JSON.stringify({ type: 'user', timestamp: '2026-01-01T00:00:07Z', message: { content: [{ type: 'tool_result', tool_use_id: 'toolu_NOSEEN', content: [{ type: 'text', text: 'Your questions have been answered: "Scope?"="TEXTANSWER"' }] }] } }),
      JSON.stringify({ type: 'user', timestamp: '2026-01-01T00:00:07Z', message: { content: [{ type: 'tool_result', tool_use_id: 'toolu_OTHER', content: 'UNRELATEDX' }] } }),
    ];
    const incomplete = u('2026-01-01T00:00:08Z', 'INCOMPLETE', { turnOrigin: 'human' });
    fs.writeFileSync(T, lines.join(NL) + NL + incomplete.slice(0, 40));
    fs.writeFileSync(C, JSON.stringify({ offset: 0, kitSha: 'abc', mergedAfter: 7 }));
    const r1 = run(T, C, O);
    const d = fs.readFileSync(O, 'utf8');
    ok(/human message/.test(d) && /scheduled\/cron prompt/.test(d) && /agent message \(peer\)/.test(d), 'labels kept and apart');
    ok(d.includes('human says hi') && d.includes('cron fired') && d.includes('peer note'), 'three messages kept');
    ok(/\| human message\s+human says hi/.test(d) && /\| scheduled\/cron prompt\s+cron fired/.test(d) && /\| agent message \(peer\)\s+peer note/.test(d), 'each text under its own label');
    ok(d.includes('lead reply text'), 'assistant text kept');
    ok(!/TOOLUSEX|THINKX|TOOLRESULTX/.test(d), 'tool_use, tool_result, thinking dropped');
    ok(!d.includes('REMINDERBODY') && d.includes('before') && d.includes('after'), 'system-reminder stripped');
    ok(!/:\/\/[^\/<\s]+:[^\/<\s]+@/.test(d) && !d.includes('hunter2'), 'URL credentials masked');
    ok(!new RegExp(['sk-abcdefgh', 'ghp_abcdef', 'gho_abcdef', 'github_pat_11', 'xoxb-1234', 'eyJ' + 'hbGci'].join('|')).test(d), 'prefixed tokens masked');
    ok(!d.includes('0123456789abcdef0123456789abcdef0123'), 'long run near word masked');
    ok(!d.includes('ZZtopSecretValue1'), 'Authorization value masked');
    ok(!d.includes('swordfish123') && !/API_KEY=abc/.test(d), 'assignments masked');
    ok(d.includes(md5), 'bare md5 kept');
    ok(d.includes('IDANSWER') && /human \(dialog answer\)\s+IDANSWER/.test(d), 'dialog answer kept by tool_use id, labelled');
    ok(d.includes('TEXTANSWER'), 'dialog answer kept by text with no id seen');
    ok(!d.includes('UNRELATEDX'), 'unrelated tool_result still dropped');
    ok(!d.includes('dialogsecret1'), 'dialog answer masked');
    ok(!d.includes('INCOMPLETE') && r1.entries === 8,'incomplete last line not consumed');
    const c1 = JSON.parse(fs.readFileSync(C, 'utf8'));
    ok(c1.kitSha === 'abc' && c1.mergedAfter === 7 && c1.updatedAt, 'other cursor keys survive');
    ok(c1.offset === Buffer.byteLength(lines.join(NL) + NL), 'offset stops before incomplete line');
    fs.appendFileSync(T, incomplete.slice(40) + NL + u('2026-01-01T00:00:09Z', 'second run only', { turnOrigin: 'human' }) + NL);
    const r2 = run(T, C, O);
    const d2 = fs.readFileSync(O, 'utf8');
    ok(r2.entries === 2 && d2.includes('INCOMPLETE') && d2.includes('second run only'), 'second run reads only appended lines');
    ok(!d2.includes('human says hi') && !d2.includes('cron fired'), 'second run does not repeat old lines');
    const c2 = JSON.parse(fs.readFileSync(C, 'utf8'));
    ok(c2.offset === fs.statSync(T).size && c2.kitSha === 'abc', 'cursor advanced, keys kept');
    fs.rmSync(C);
    const r3 = run(T, C, O);
    ok(r3.start === 0, 'missing cursor starts at 0');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  console.log('scribe-digest self-test: ' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
}

function main() {
  const a = process.argv.slice(2);
  if (a.includes('--self-test')) return selfTest();
  const get = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
  const known = ['--transcript', '--cursor', '--out'];
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith('--') && !known.includes(a[i])) { console.error('scribe-digest: unknown argument ' + a[i]); process.exit(2); }
  }
  const tr = get('--transcript'), cu = get('--cursor'), out = get('--out');
  if (!tr || !cu || !out) { console.error('scribe-digest: usage: --transcript <file.jsonl> --cursor <cursor.json> --out <digest.md> (or --self-test)'); process.exit(2); }
  try { run(tr, cu, out); } catch (e) { console.error('scribe-digest: ' + e.message); process.exit(1); }
}
main();

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');
const html = read('app/index.html');
const main = read('app/js/main.js');
const store = read('app/js/store.js');
const mascot = read('app/js/mascot.js');
const guide = read('app/js/guide.js');
const logo = read('app/kazunome-logo.svg');

test('7: low-grade UI is applied to the full learning chrome', () => {
  assert.match(main, /function setLearnerGradeMode/);
  assert.match(main, /body\.classList\.toggle\('low-grade'/);
  assert.match(main, /setLearnerGradeMode\(\(p\.skill/);
  assert.match(html, /data-low-text="せいかい"/);
  assert.match(html, /data-low-text="さいしょに せいかい できた わりあい"/);
  assert.match(html, /data-low-text="もんだいの かず"/);
});

test('8: reading has manual and opt-in automatic modes and persists', () => {
  assert.match(html, /data-toggle="read-aloud"/);
  assert.match(html, /id="speak-problem"/);
  assert.match(store, /readAloud: false/);
  assert.match(main, /SpeechSynthesisUtterance/);
  assert.match(main, /function setReadAloud/);
  assert.match(main, /scheduleSpeech\(k === 0/);
});

test('9: browser zoom is not disabled and viewport syntax is clean', () => {
  assert.doesNotMatch(html, /user-scalable\s*=\s*no/);
  assert.match(html, /content="width=device-width, initial-scale=1, viewport-fit=cover"/);
});

test('10: logo lettering is path-based, not live text', () => {
  assert.doesNotMatch(logo, /<text\b/i);
  assert.match(logo, /<path\b/i);
});

test('11-12: mascot has its own sprout/book structure and semantic leaf animation', () => {
  assert.match(mascot, /function packMarkup/);
  assert.match(mascot, /leafL=new PulseSpring/);
  assert.match(mascot, /leafR=new PulseSpring/);
  assert.doesNotMatch(mascot, /earL|earR|earflap/);
  assert.match(guide, /'sq', 'leafL', 'leafR'/);
  assert.ok(mascot.split('\n').length < 220, 'mascot engine should remain lightweight');
});

test('13: school URL lock cannot be toggled off through the normal setter', () => {
  assert.match(main, /const enabled = schoolLocked \? true : !!on/);
  assert.match(main, /if \(schoolLocked\) return;/);
  assert.match(main, /params\.get\('mode'\) === 'school'/);
});

test('HTML has no duplicate ids', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  assert.deepEqual([...new Set(dup)], []);
});

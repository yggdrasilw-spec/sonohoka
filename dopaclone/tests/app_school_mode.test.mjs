import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const main = readFileSync(resolve(root, 'app/js/main.js'), 'utf8');
const html = readFileSync(resolve(root, 'app/index.html'), 'utf8');

test('school mode gates reward systems at execution level', () => {
  assert.match(main, /function questNote\(ev\) \{\s*if \(!recording\(\) \|\| schoolMode\(\)\) return;/);
  assert.match(main, /function addCombo\(\) \{\s*if \(schoolMode\(\)\)/);
  assert.match(main, /function checkLoginBonus\(\) \{\s*if \(schoolMode\(\)\) return;/);
  assert.match(main, /function checkTrophies\(\) \{\s*if \(schoolMode\(\)\) return \[\];/);
  assert.match(main, /function startExtra\(\) \{\s*if \(schoolMode\(\)\) return;/);
});

test('landscape fitting uses actual container height and browser zoom is allowed', () => {
  assert.match(main, /wrap\.clientHeight/);
  assert.doesNotMatch(html, /user-scalable=no/);
});

test('school URL lock is supported', () => {
  assert.match(main, /params\.get\('mode'\) === 'school'/);
  assert.match(main, /school-locked/);
});

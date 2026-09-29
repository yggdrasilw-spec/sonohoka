import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = resolve(fileURLToPath(new URL('.', import.meta.url)));
const root = resolve(here, '..');
const app = join(root, 'app');
const docs = join(root, 'docs');
const protectedPattern = /ドパキチ|ドパドリル|Dopakichi|dopakichi|Dopa Drill|\bdopa\b|\bDopa\b|\bDOPA\b|ドパ/;

function files(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...files(p));
    else out.push(p);
  }
  return out;
}

test('school fork contains no old protected branding or old protected asset paths', () => {
  assert.equal(existsSync(join(app, 'js', 'dopakichi.js')), false);
  assert.equal(existsSync(join(docs, 'dopakichi.svg')), false);
  assert.equal(existsSync(join(app, 'icon.svg')), false);
  assert.equal(existsSync(join(app, 'kazunome-icon.svg')), true);
  assert.equal(existsSync(join(app, 'kazunome-logo.svg')), true);
  assert.equal(existsSync(join(docs, 'mascot.svg')), true);

  for (const p of [...files(app), ...files(docs)]) {
    if (!/\.(?:html|css|js|mjs|md|svg)$/.test(p)) continue;
    const text = readFileSync(p, 'utf8');
    assert.equal(protectedPattern.test(text), false, `old branding remains in ${p}`);
  }
});

test('index points only at the replacement logo/icon assets', () => {
  const html = readFileSync(join(app, 'index.html'), 'utf8');
  assert.match(html, /kazunome-icon\.svg/);
  assert.match(html, /kazunome-logo\.svg/);
  assert.match(html, /かずの芽ラボ/);
  const logo = readFileSync(join(app, 'kazunome-logo.svg'), 'utf8');
  assert.doesNotMatch(logo, /<text\b/);
  assert.doesNotMatch(html, /href="icon\.svg"|logo-burst|logo-ribbon|logo-top|logo-bits/);
});

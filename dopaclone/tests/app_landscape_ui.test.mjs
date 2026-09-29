import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../app/style.css', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../app/index.html', import.meta.url), 'utf8');
const main = fs.readFileSync(new URL('../app/js/main.js', import.meta.url), 'utf8');

test('landscape title is a real dashboard with six grade buttons in one row', () => {
  assert.match(css, /#screen-title \.grades[\s\S]*grid-template-columns:\s*repeat\(6,/);
  assert.match(css, /#screen-title \.level-btn[\s\S]*width:\s*100%/);
  assert.match(css, /#screen-title \.modes[\s\S]*border:\s*3px solid/);
  assert.match(html, /おすすめから はじめる/);
});

test('landscape play allocates separate actor, maths and keypad columns with large keys', () => {
  assert.match(css, /#screen-play \{[\s\S]*grid-template-columns:\s*minmax\(190px, 22%\)[\s\S]*minmax\(390px, 1fr\)[\s\S]*minmax\(250px, 27%\)/);
  assert.match(css, /#screen-play \.pad button[\s\S]*height:\s*clamp\(62px, 10\.2vh, 82px\)/);
  assert.match(main, /S\.screen === 'play' && wideLandscape \? clamp\(r\.height \/ 390, 0\.9, 1\.7\)/);
});

test('landscape settings and first-run guide are widened for classroom screens', () => {
  assert.match(css, /#settings \.modal-card[\s\S]*grid-template-columns:\s*repeat\(2,/);
  assert.match(css, /#guide-card[\s\S]*width:\s*min\(560px,/);
});

test('school results do not expose speed in CSS fallback', () => {
  assert.match(css, /body\.school-mode \.speed-stat \{ display: none !important; \}/);
});

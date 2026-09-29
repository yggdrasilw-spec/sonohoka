import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(resolve(here, '../app/index.html'), 'utf8');
const css = readFileSync(resolve(here, '../app/style.css'), 'utf8');
const main = readFileSync(resolve(here, '../app/js/main.js'), 'utf8');

test('play screen exposes an explicit back button wired to the same confirm flow as Escape', () => {
  assert.match(html, /id="play-back"[\s\S]*もどる/);
  assert.match(main, /#play-back'[\s\S]*askToTitle\(\)/);
});

test('game landscape gives correct, retry and spark a full-width dedicated status row', () => {
  assert.match(css, /body:not\(\.school-mode\) #screen-play \{[\s\S]*grid-template-rows:\s*52px 68px minmax\(0, 1fr\)/);
  assert.match(css, /body:not\(\.school-mode\) #screen-play \.hud2 \{[\s\S]*grid-column:\s*1 \/ -1;[\s\S]*grid-template-columns:\s*repeat\(3,/);
  assert.match(css, /body:not\(\.school-mode\) #screen-play \.tally \{ display: contents; \}/);
});

test('game landscape mascot is positioned in the dedicated stage below status row', () => {
  assert.match(main, /gameLandscapePlay[\s\S]*r\.left \+ r\.width \* 0\.54/);
  assert.match(css, /body:not\(\.school-mode\) #screen-play \.stage \{[\s\S]*grid-row:\s*3;/);
});

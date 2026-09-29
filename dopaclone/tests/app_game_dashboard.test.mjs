import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(resolve(here, '../app/style.css'), 'utf8');
const html = readFileSync(resolve(here, '../app/index.html'), 'utf8');

test('game-mode landscape keeps missions and calendar in a dedicated right column', () => {
  assert.match(html, /id="calendar"/);
  assert.match(html, /id="quests"/);
  assert.match(css, /body:not\(\.school-mode\) #screen-title \{[\s\S]*grid-template-columns:[^;]+[^;]+[^;]+;/);
  assert.match(css, /body:not\(\.school-mode\) #screen-title \.quest-card \{[\s\S]*grid-column:\s*3;/);
  assert.match(css, /body:not\(\.school-mode\) #screen-title \.cal-card \{[\s\S]*grid-column:\s*3;[\s\S]*grid-row:\s*2;/);
});

test('school mode still explicitly hides game-only calendar and missions', () => {
  assert.match(css, /body\.school-mode #quests,[\s\S]*body\.school-mode #calendar/);
});

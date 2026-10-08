const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '../ryokan_units_package');
const out = 'C:/Users/user/.cache/unit-assets-qa';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///' + path.join(root, 'index.html').replaceAll('\\', '/'));
  const keys = ['field_a', 'field_ha', 'village_area', 'brush', 'lunch_time', 'lunch_prepare', 'school_time', 'lesson_time', 'recess_time'];
  const records = JSON.parse(fs.readFileSync(path.join(root, 'data/questions.json'), 'utf8'));
  assert.equal(records.length, 66);
  for (const key of keys) {
    await page.evaluate(k => start(null, [Q.find(q => q.key === k)]), key);
    await page.locator('img.qpic').evaluate(img => img.decode());
    await page.getByRole('button', { name: records.find(q => q.key === key).unit, exact: true }).click();
    await page.getByRole('button', { name: 'どうして？', exact: true }).click();
    assert(await page.locator('#ex').innerText().then(t => t.includes(records.find(q => q.key === key).note)));
    await page.screenshot({ path: path.join(out, key + '.png'), fullPage: true });
  }
  await page.evaluate(() => start(null, [Q.find(q => q.key === 'ant')]));
  await page.getByRole('button', { name: 'mm', exact: true }).click();
  await page.getByRole('button', { name: 'どうして？', exact: true }).click();
  await page.locator('img.ref-figure').evaluate(img => img.decode());
  assert((await page.locator('#ex').innerText()).includes('太さ'));
  await page.screenshot({ path: path.join(out, 'mm-reference.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const key of ['school_time', 'field_ha', 'village_area']) {
    await page.evaluate(k => start(null, [Q.find(q => q.key === k)]), key);
    await page.locator('img.qpic').evaluate(img => img.decode());
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: path.join(out, key + '-mobile.png'), fullPage: true });
  }
  assert.deepEqual(errors, []);
  await browser.close();
  console.log('PASS: 9 distinct scenes and explanations, 1mm reference, 3 mobile views, no script errors. Screenshots: ' + out);
})().catch(e => { console.error(e); process.exit(1); });

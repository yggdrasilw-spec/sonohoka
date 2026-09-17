const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targets = [
  ['44-kotsukotsu', 'https://yggdrasilw-spec.github.io/kotsukotsu/index.html'],
  ['45-kotsukotsu-teacher', 'https://yggdrasilw-spec.github.io/kotsukotsu/teacher.html'],
  ['59-kanji-jiten', 'https://yggdrasilw-spec.github.io/kakijun/kanji-jiten/kanji_jiten_hikikata.html'],
  ['60-bushu-hunter', 'https://yggdrasilw-spec.github.io/kakijun/bushu-hunter/bushu_hunter.html'],
];

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  for (const [slug, url] of targets) {
    const dir = path.join(root, `.record_${slug}`);
    await fs.mkdir(dir, { recursive: true });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1200);
    for (let i = 0; i < 5; i++) {
      await page.screenshot({ path: path.join(dir, `frame-${String(i).padStart(2, '0')}.png`), clip: { x: 0, y: 0, width: 1280, height: 720 } });
      const buttons = page.locator('button:visible');
      if (i < 4 && await buttons.count()) {
        try { await buttons.nth(Math.min(i, (await buttons.count()) - 1)).click({ timeout: 1200 }); } catch {}
      }
      await page.waitForTimeout(500);
    }
  }
  await browser.close();
  console.log('captured 4 network-hosted app demos');
})();

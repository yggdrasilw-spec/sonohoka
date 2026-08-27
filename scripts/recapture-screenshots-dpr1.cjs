const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const portfolio = path.join(root, 'app_links_portfolio.html');
const outputDir = path.join(root, 'media');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const slugFor = (url) => url.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 120);
const html = require('node:fs').readFileSync(portfolio, 'utf8');
const urls = [...new Set([...html.matchAll(/href="(https?:[^\"]+)"/g)].map((m) => m[1]))]
  .filter((url) => /github\.io|web\.app/.test(url));

(async () => {
  await fs.mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const failures = [];
  for (const url of urls) {
    let done = false;
    for (let attempt = 1; attempt <= 3 && !done; attempt += 1) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(900);
        await page.screenshot({ path: path.join(outputDir, `${slugFor(url)}.png`), clip: { x: 0, y: 0, width: 1280, height: 720 } });
        done = true;
      } catch (error) {
        if (attempt === 3) failures.push({ url, error: String(error) });
      }
    }
  }
  await browser.close();
  console.log(JSON.stringify({ total: urls.length, captured: urls.length - failures.length, failures }, null, 2));
})();

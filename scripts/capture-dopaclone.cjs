/**
 * Capture frames of dopaclone (かずの芽ラボ) for portfolio demo video.
 * Starts a local HTTP server (port 8099) serving the app/ directory,
 * then takes 5 frames via Playwright/Chrome.
 */
const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const appDir = path.join(root, 'dopaclone', 'app');
const outDir = path.join(root, '.record_dopaclone');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const playwrightPath = 'C:\\Users\\user\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\playwright';
const { chromium } = require(playwrightPath);

const PORT = 8099;

// ---------- Minimal static file server ----------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.ttf':  'font/ttf',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = path.join(appDir, urlPath);
      if (!filePath.startsWith(appDir)) { res.writeHead(403); res.end(); return; }
      const ext = path.extname(filePath).toLowerCase();
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not Found'); return; }
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`Local server started at http://127.0.0.1:${PORT}`);
      resolve(server);
    });
  });
}

// ---------- Frame actions ----------
const actions = [
  async (page) => {
    // frame 0: タイトル画面（ロゴ・学年ボタン）
    await page.waitForTimeout(1500);
  },
  async (page) => {
    // frame 1: 2年生を選択
    const btn = page.locator('[data-grade="2"]').first();
    if (await btn.isVisible()) await btn.click({ force: true }).catch(() => {});
    await page.waitForTimeout(1000);
  },
  async (page) => {
    // frame 2: 「おすすめから はじめる」でプレイ開始
    const startBtn = page.locator('#start').first();
    if (await startBtn.isVisible()) await startBtn.click({ force: true }).catch(() => {});
    await page.waitForTimeout(2000);
  },
  async (page) => {
    // frame 3: 問題画面（キャラクター・問題・入力エリア）
    await page.waitForTimeout(800);
  },
  async (page) => {
    // frame 4: スキルツリー画面
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
    const treeBtn = page.locator('#open-tree').first();
    if (await treeBtn.isVisible()) await treeBtn.click({ force: true }).catch(() => {});
    await page.waitForTimeout(1200);
  },
];

(async () => {
  const server = await startServer();
  await fsp.mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    executablePath: chromePath,
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  console.log('Navigating to dopaclone...');
  try {
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) {
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  }
  await page.waitForTimeout(2000);

  for (let i = 0; i < actions.length; i++) {
    try {
      await actions[i](page);
    } catch (err) {
      console.warn(`action ${i} warning: ${err.message}`);
    }
    await page.waitForTimeout(500);
    const outPath = path.join(outDir, `frame-${String(i).padStart(2, '0')}.png`);
    await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: 1280, height: 720 } });
    console.log(`Saved frame-${String(i).padStart(2, '0')}.png`);
  }

  await browser.close();
  server.close();
  console.log('Capture complete!');
})();

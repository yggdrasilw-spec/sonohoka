const fs = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const playwrightPath = 'C:\\Users\\user\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\playwright';
const { chromium } = require(playwrightPath);

const apps = [
  {
    num: 68,
    slug: '68-1nen_kazu_gainen',
    url: 'https://yggdrasilw-spec.github.io/sonohoka/1nen_first_kazu_gainen.html',
    title: '68 かずのがいねん 1ねんせい',
    actions: [
      async (page) => {
        // frame 0: ハブ画面（タイル一覧）
      },
      async (page) => {
        // frame 1: 最初のタイルをクリック
        const tile = page.locator('.tile').first();
        if (await tile.isVisible()) await tile.click({ timeout: 4000, force: true }).catch(() => {});
      },
      async (page) => {
        // frame 2: 2つ目のタイルへ戻りクリック
        const back = page.locator('#back');
        if (await back.isVisible()) await back.click({ timeout: 4000, force: true }).catch(() => {});
        await page.waitForTimeout(400);
        const tiles = page.locator('.tile');
        const cnt = await tiles.count();
        if (cnt >= 2) await tiles.nth(1).click({ timeout: 4000, force: true }).catch(() => {});
      },
      async (page) => {
        // frame 3: さらに別のタイルへ
        const back = page.locator('#back');
        if (await back.isVisible()) await back.click({ timeout: 4000, force: true }).catch(() => {});
        await page.waitForTimeout(400);
        const tiles = page.locator('.tile');
        const cnt = await tiles.count();
        if (cnt >= 3) await tiles.nth(2).click({ timeout: 4000, force: true }).catch(() => {});
      },
      async (page) => {
        // frame 4: 4つ目タイル
        const back = page.locator('#back');
        if (await back.isVisible()) await back.click({ timeout: 4000, force: true }).catch(() => {});
        await page.waitForTimeout(400);
        const tiles = page.locator('.tile');
        const cnt = await tiles.count();
        if (cnt >= 4) await tiles.nth(3).click({ timeout: 4000, force: true }).catch(() => {});
      }
    ]
  },
  {
    num: 69,
    slug: '69-3nen_kakezan_hissan',
    url: 'https://yggdrasilw-spec.github.io/sonohoka/3nen_kakezan_hissan.html',
    title: '69 かけ算の筆算⑴ 3年生',
    actions: [
      async (page) => {
        // frame 0: 初期画面（図フェーズ）
      },
      async (page) => {
        // frame 1: 次へ（式フェーズ）
        const nx = page.locator('#nx, button:has-text(\"つぎへ\")').first();
        if (await nx.isVisible()) await nx.click({ timeout: 4000, force: true }).catch(() => {});
      },
      async (page) => {
        // frame 2: 次へ（筆算フェーズ）
        const nx = page.locator('#nx, button:has-text(\"つぎへ\")').first();
        if (await nx.isVisible()) await nx.click({ timeout: 4000, force: true }).catch(() => {});
      },
      async (page) => {
        // frame 3: 次へ（練習フェーズ）
        const nx = page.locator('#nx, button:has-text(\"つぎへ\")').first();
        if (await nx.isVisible()) await nx.click({ timeout: 4000, force: true }).catch(() => {});
      },
      async (page) => {
        // frame 4: 2問目ステージへ
        const nx = page.locator('#nx, button:has-text(\"つぎへ\")').first();
        if (await nx.isVisible()) await nx.click({ timeout: 4000, force: true }).catch(() => {});
      }
    ]
  },
  {
    num: 70,
    slug: '70-5nen_setsuzoku_kaekae',
    url: 'https://yggdrasilw-spec.github.io/sonohoka/5nen_setsuzoku_kaekae.html',
    title: '70 つなぎ言葉であそぼう 5年生',
    actions: [
      async (page) => {
        // frame 0: メニュー画面
      },
      async (page) => {
        // frame 1: 最初のカテゴリをクリック
        const btn = page.locator('.mbtn').first();
        if (await btn.isVisible()) await btn.click({ timeout: 4000, force: true }).catch(() => {});
      },
      async (page) => {
        // frame 2: 選択肢を選ぶ
        const opt = page.locator('.opt').first();
        if (await opt.isVisible()) await opt.click({ timeout: 4000, force: true }).catch(() => {});
      },
      async (page) => {
        // frame 3: 答え合わせボタン
        const btn = page.locator('.btn:not(.sub2)').first();
        if (await btn.isVisible()) await btn.click({ timeout: 4000, force: true }).catch(() => {});
      },
      async (page) => {
        // frame 4: 次の問題へ
        const nx = page.locator('.btn:has-text(\"次\"), .btn:has-text(\"つぎ\"), .link').first();
        if (await nx.isVisible()) await nx.click({ timeout: 4000, force: true }).catch(() => {});
      }
    ]
  }
];

(async () => {
  console.log('Launching Real Google Chrome via Playwright to capture apps 68-70...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: chromePath
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  for (const app of apps) {
    console.log(`[App ${app.num}] Navigating to ${app.url}`);
    const dir = path.join(root, `.record_${app.slug}`);
    await fs.mkdir(dir, { recursive: true });

    try {
      await page.goto(app.url, { waitUntil: 'networkidle', timeout: 30000 });
    } catch (e) {
      console.warn(`[App ${app.num}] fallback goto domcontentloaded: ${e.message}`);
      await page.goto(app.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    }
    await page.waitForTimeout(1500);

    for (let i = 0; i < 5; i++) {
      try {
        await app.actions[i](page);
      } catch (err) {
        console.warn(`[App ${app.num}] action ${i} warning: ${err.message}`);
      }
      await page.waitForTimeout(800);
      const outPath = path.join(dir, `frame-${String(i).padStart(2, '0')}.png`);
      await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: 1280, height: 720 } });
      console.log(`[App ${app.num}] Saved frame-${String(i).padStart(2, '0')}.png`);
    }
  }

  await browser.close();
  console.log('Apps 68-70 successfully captured!');
})();

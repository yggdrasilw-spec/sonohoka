/**
 * capture-template.cjs — キャプチャスクリプトのテンプレート
 *
 * 使い方:
 *   1. .record_<slug>/ ディレクトリにコピーして capture.cjs にリネーム
 *   2. URL と各フレームのアクションを編集する
 *   3. node .record_<slug>/capture.cjs で実行
 *
 * フレーム数はストーリーボードに合わせて増減可。
 * waitForTimeout の値は実際のアニメーション時間に合わせて調整すること。
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(
  'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
);

const OUT    = path.resolve(__dirname);          // .record_<slug>/ と同じ場所に保存
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL    = 'https://yggdrasilw-spec.github.io/sonohoka/REPLACE_ME';  // ← 変更する

(async () => {
  await fs.mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: CHROME });
  const ctx  = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  const shot = async (name) => {
    await page.screenshot({ path: path.join(OUT, name), clip: { x: 0, y: 0, width: 1280, height: 720 } });
    console.log('captured', name);
  };

  // frame-00: 初期状態（ページ読み込み後、描画安定まで待つ）
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
  await shot('frame-00.png');

  // frame-01: 何か操作する
  // await page.click('#some-button').catch(() => {});
  // await page.waitForTimeout(1500);
  await shot('frame-01.png');

  // frame-02:
  await shot('frame-02.png');

  // frame-03:
  await shot('frame-03.png');

  // frame-04:
  await shot('frame-04.png');

  await browser.close();
  console.log('done — all frames captured');
})();

const fs = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const playwrightPath = 'C:\\Users\\user\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\playwright';
const { chromium } = require(playwrightPath);

const apps = [
  {
    num: 61,
    slug: '61-kakezan',
    url: 'https://yggdrasilw-spec.github.io/sonohoka/kakezan_textbook_interactive.html',
    title: '61 かけ算① 見て・ためして・くらべて・気づこう',
    actions: [
      async (page) => {
        // frame 0: 初期画面
      },
      async (page) => {
        // frame 1: 次へ
        const next = page.locator('button:has-text("つぎへ"), .step:nth-child(2)').first();
        if (await next.isVisible()) await next.click({ timeout: 4000, force: true }).catch(() => {});
      },
      async (page) => {
        // frame 2: しき
        const step = page.locator('.step:nth-child(3), button:has-text("しき")').first();
        if (await step.isVisible()) await step.click({ timeout: 4000, force: true }).catch(() => {});
      },
      async (page) => {
        // frame 3: 選択肢
        const choice = page.locator('.choice, .rideBtn, .pictureChoice').first();
        if (await choice.isVisible()) await choice.click({ timeout: 4000, force: true }).catch(() => {});
      },
      async (page) => {
        // frame 4: まとめ
        const lastStep = page.locator('.step').last();
        if (await lastStep.isVisible()) await lastStep.click({ timeout: 4000, force: true }).catch(() => {});
      }
    ]
  },
  {
    num: 62,
    slug: '62-ookii_kazu',
    url: 'https://yggdrasilw-spec.github.io/sonohoka/ookii_kazu_lab.html',
    title: '62 大きい数ラボ 〜大きい数のしくみ〜',
    actions: [
      async (page) => {
        // frame 0: 初期画面
      },
      async (page) => {
        // frame 1: ステージ3 位取り表
        const b = page.locator('.stageBtn').nth(2);
        if (await b.isVisible()) await b.click({ timeout: 4000, force: true }).catch(() => {});
      },
      async (page) => {
        // frame 2: ステージ5 1000のまとまり
        const b = page.locator('.stageBtn').nth(4);
        if (await b.isVisible()) await b.click({ timeout: 4000, force: true }).catch(() => {});
      },
      async (page) => {
        // frame 3: ステージ7 数直線
        const b = page.locator('.stageBtn').nth(6);
        if (await b.isVisible()) await b.click({ timeout: 4000, force: true }).catch(() => {});
      },
      async (page) => {
        // frame 4: ステージ9 10倍100倍
        const b = page.locator('.stageBtn').nth(8);
        if (await b.isVisible()) await b.click({ timeout: 4000, force: true }).catch(() => {});
      }
    ]
  },
  {
    num: 63,
    slug: '63-seisuu_yasashiku',
    url: 'https://yggdrasilw-spec.github.io/sonohoka/seisuu_no_seishitsu_yasashiku.html',
    title: '63 整数のせいしつ やさしく教える版',
    actions: [
      async (page) => {
        // frame 0: カバー画面
      },
      async (page) => {
        // frame 1: はじめる
        const start = page.locator('#startBtn, .big-btn').first();
        if (await start.isVisible()) await start.click({ timeout: 4000, force: true }).catch(() => {});
      },
      async (page) => {
        // frame 2: 次へ / 倍数
        const next = page.locator('#nextStepBtn, button:has-text("つぎへ")').first();
        if (await next.isVisible()) await next.click({ timeout: 4000, force: true }).catch(() => {});
      },
      async (page) => {
        // frame 3: 次へ / 約数
        const next = page.locator('#nextStepBtn, button:has-text("つぎへ")').first();
        if (await next.isVisible()) await next.click({ timeout: 4000, force: true }).catch(() => {});
      },
      async (page) => {
        // frame 4: 先生に聞くボタン
        const ask = page.locator('#askTeacherBtn, button:has-text("先生に聞く")').first();
        if (await ask.isVisible()) await ask.click({ timeout: 4000, force: true }).catch(() => {});
      }
    ]
  },
  {
    num: 64,
    slug: '64-teacher_dashboard',
    url: 'https://yggdrasilw-spec.github.io/sonohoka/teacher-dashboard.html',
    title: '64 先生用リアルタイム支援ダッシュボード',
    actions: [
      async (page) => {
        // frame 0: ウェルカム画面
      },
      async (page) => {
        // frame 1: 先生コードと児童一覧
        await page.evaluate(() => {
          document.getElementById('welcomeSection')?.classList.add('hidden');
          document.getElementById('queueSection')?.classList.remove('hidden');
          document.getElementById('sessionHeader')?.classList.remove('hidden');
          const codeEl = document.getElementById('teacherCodeBadge');
          if (codeEl) codeEl.textContent = '7K9M2P';
          const timeEl = document.getElementById('timeRemaining');
          if (timeEl) timeEl.textContent = '54:20';
          const countEl = document.getElementById('studentCountBadge');
          if (countEl) countEl.textContent = '参加 4人';

          const grid = document.getElementById('studentGrid');
          if (grid) {
            grid.innerHTML = `
              <div class="student-card status-help_requested urgent">
                <div class="card-head">
                  <span class="student-name">🧑‍🎓 ゆうと</span>
                  <span class="status-badge help_requested">🔴 先生に聞く</span>
                </div>
                <div class="card-body">
                  <div class="meta-row"><span>教材:</span> <strong>整数のせいしつ</strong></div>
                  <div class="meta-row"><span>進捗:</span> <strong>ステップ 3 (約数の発見)</strong></div>
                  <div class="call-time">⏱️ 呼び出しから <strong>1分20秒</strong> 経過</div>
                </div>
                <div class="card-actions">
                  <button class="btn btn-sm btn-primary">対応に向かう</button>
                </div>
              </div>
              <div class="student-card status-learning">
                <div class="card-head">
                  <span class="student-name">👩‍🎓 さくら</span>
                  <span class="status-badge learning">🟢 学習中</span>
                </div>
                <div class="card-body">
                  <div class="meta-row"><span>教材:</span> <strong>整数のせいしつ</strong></div>
                  <div class="meta-row"><span>進捗:</span> <strong>ステップ 4 (公倍数)</strong></div>
                  <div class="score-row">正解: <strong>8 / 8 問</strong></div>
                </div>
              </div>
              <div class="student-card status-learning">
                <div class="card-head">
                  <span class="student-name">🧑‍🎓 れん</span>
                  <span class="status-badge learning">🟢 学習中</span>
                </div>
                <div class="card-body">
                  <div class="meta-row"><span>教材:</span> <strong>整数のせいしつ</strong></div>
                  <div class="meta-row"><span>進捗:</span> <strong>ステップ 2 (倍数)</strong></div>
                  <div class="score-row">正解: <strong>4 / 5 問</strong></div>
                </div>
              </div>
              <div class="student-card status-teacher_supporting">
                <div class="card-head">
                  <span class="student-name">👩‍🎓 あおい</span>
                  <span class="status-badge teacher_supporting">🔵 先生が対応中</span>
                </div>
                <div class="card-body">
                  <div class="meta-row"><span>教材:</span> <strong>整数のせいしつ</strong></div>
                  <div class="meta-row"><span>進捗:</span> <strong>ステップ 1 (偶数と奇数)</strong></div>
                </div>
              </div>
            `;
          }
        });
      },
      async (page) => {
        // frame 2: 先生要請アラートON
        await page.evaluate(() => {
          const alert = document.getElementById('helpRequestAlert');
          if (alert) alert.classList.remove('hidden');
        });
      },
      async (page) => {
        // frame 3: カード強調表示
        await page.evaluate(() => {
          const firstCard = document.querySelector('.student-card');
          if (firstCard) {
            firstCard.style.outline = '4px solid #ef4444';
            firstCard.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.4)';
          }
        });
      },
      async (page) => {
        // frame 4: 終了モーダル
        await page.evaluate(() => {
          const modal = document.getElementById('confirmEndModal');
          if (modal) {
            modal.classList.add('open', 'active');
            modal.style.display = 'flex';
          }
        });
      }
    ]
  },
  {
    num: 65,
    slug: '65-beaver_gape',
    url: 'https://yggdrasilw-spec.github.io/sonohoka/beaver_gape.html',
    title: '65 ビーバーの顎 — 樹幹かじりの大開口バイオメカニクス',
    actions: [
      async (page) => {
        // frame 0: 初期画面 (樹幹かじり Gnawing)
      },
      async (page) => {
        // frame 1: 大開口スライダー
        await page.evaluate(() => {
          const gapeInput = document.getElementById('gape-angle') || document.querySelector('input[type="range"]');
          if (gapeInput) {
            gapeInput.value = gapeInput.max ? Number(gapeInput.max) * 0.85 : 45;
            gapeInput.dispatchEvent(new Event('input', { bubbles: true }));
            gapeInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      },
      async (page) => {
        // frame 2: 咬筋ベクトル
        await page.evaluate(() => {
          const checks = document.querySelectorAll('input[type="checkbox"]');
          checks.forEach(c => {
            if (!c.checked) {
              c.checked = true;
              c.dispatchEvent(new Event('change', { bubbles: true }));
            }
          });
        });
      },
      async (page) => {
        // frame 3: すりつぶし (Chewing) モード
        await page.evaluate(() => {
          const chewBtn = document.querySelector('button[data-mode="chewing"], .segmented button:nth-child(2)');
          if (chewBtn) chewBtn.click();
        });
      },
      async (page) => {
        // frame 4: 標本写真モード
        await page.evaluate(() => {
          document.body.classList.add('photo-mode');
        });
      }
    ]
  }
];

(async () => {
  console.log('Launching Real Google Chrome via Playwright to capture network-hosted apps...');
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
    console.log(`[App ${app.num}] Navigating over network to ${app.url}`);
    const dir = path.join(root, `.record_${app.slug}`);
    await fs.mkdir(dir, { recursive: true });

    try {
      await page.goto(app.url, { waitUntil: 'networkidle', timeout: 30000 });
    } catch (e) {
      console.warn(`[App ${app.num}] fallback goto domcontentloaded: ${e.message}`);
      await page.goto(app.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    }
    await page.waitForTimeout(1200);

    for (let i = 0; i < 5; i++) {
      try {
        await app.actions[i](page);
      } catch (err) {
        console.warn(`[App ${app.num}] action ${i} warning: ${err.message}`);
      }
      await page.waitForTimeout(700);
      const outPath = path.join(dir, `frame-${String(i).padStart(2, '0')}.png`);
      await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: 1280, height: 720 } });
      console.log(`[App ${app.num}] Saved frame-${String(i).padStart(2, '0')}.png`);
    }
  }

  await browser.close();
  console.log('All 5 network-hosted apps successfully captured via real Chrome!');
})();

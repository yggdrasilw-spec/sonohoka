---
name: portfolio-app-demo-video
description: Canonical project workflow for creating a short, captioned MP4 demo for a web app listed in this portfolio, using its published GitHub Pages app when available and integrating the result into the matching card.
---

# Portfolio App Demo Video

Use this skill when a portfolio card needs a compact introduction video. The output should communicate one useful story without sound: start the activity, perform its central action, and show the meaningful result.

This is the project-specific canonical workflow. It incorporates the generic app-demo requirements for timing, captions, browser compatibility, poster selection, and card opt-in behavior. When both this skill and a generic demo-video skill are available, follow this skill for this repository.

## ⚠️ CRITICAL EXECUTION RULES (DO NOT SKIP)

1. **実ブラウザ（Google Chrome 実機バイナリ）を必ず指定すること**:
   - Playwright 起動時は必ず `executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'` を指定する。
   - Chrome DevTools MCP や Playwright 同梱ブラウザを探さない。
2. **必ず公開済みの GitHub Pages URL（ネット経由）でアクセスすること**:
   - ローカルサーバー（`python -m http.server` 等）や `file://` プロトコルは使用禁止（WebGL/モジュール読み込みや絶対パスが壊れるため）。
   - ポートフォリオカードの `actions a.btn.primary` にある公開 URL（`https://yggdrasilw-spec.github.io/sonohoka/...`）に直接アクセスする。
3. **UI 操作は短いタイムアウトと安全オプションを付けること**:
   - ボタンクリック等の操作時は `.click({ timeout: 4000, force: true }).catch(() => {})` を使い、アニメーションや重なりによる 30 秒ハングを防ぐ。

## 0. Read runtime paths first

Before writing any script, read [references/runtime-paths.md](references/runtime-paths.md).
All Node packages (Playwright, Sharp) come from the Codex runtime — do NOT run `npm install` or search for global packages.
- Playwright: `C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`
- Chrome: `C:\Program Files\Google\Chrome\Application\chrome.exe`
- ffmpeg: `C:\Users\user\AppData\Roaming\Python\Python314\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe`

## 1. Identify the exact app

- Read the portfolio HTML and enumerate `article.card` entries with their `data-register-order`, title, description, and link.
- If the request says "second app" or similar, distinguish DOM order from `data-register-order`; report the resolved title before recording. Do not assume the existing video belongs to the requested card.
- Inspect the app's source HTML when local, or open the card's published URL in the browser when it is remote. Read visible labels and actual event-driven behavior, not just the marketing description.

### GitHub Pages / network-first route

- **Always use the card's published GitHub Pages URL.** Local file:// or `python -m http.server` fail for WebGL/module apps — do not start a local server.
- Read the source HTML (e.g. `3d-ryokan/index.html`) to understand button IDs and interaction flow before writing the capture script.
- If the published page is unavailable or materially differs from the local source, fall back to the local HTML and record which source was used in the storyboard.
- Keep the network capture read-only. Do not edit GitHub, publish files, or upload screenshots/video unless the user separately asks for that action.

## 2. Plan before recording

Write a small storyboard before capturing frames. Prefer 5–6 states totaling 10 seconds or less:

1. Entry screen and value proposition.
2. Activity/mode selection.
3. The user's first meaningful input.
4. The app's guided interaction or key transformation.
5. Completion, feedback, reward, or other visible result.
6. A useful saved record, summary, or final state when it strengthens the story.

Choose only the primary workflow. Avoid touring every setting, waiting on unreliable external AI, or showing controls that do not explain the app's value. Keep captions to three or fewer short Japanese sentences when possible; use a stable semi-transparent lower-third band and never cover the main result.

Use the following compact timing target unless the app needs a small adjustment: 0.0–1.0s title/value, 1.0–3.0s start or selection, 3.0–7.0s central action, 7.0–9.0s result, and 9.0–10.0s final hold. Keep each source state normally to 1–3 seconds, remove loading and hesitation, and use at most one or two subtle highlights. Captions should describe the action or learning benefit rather than repeat visible labels.

## 3. Capture real states

- Copy [references/capture-template.cjs](references/capture-template.cjs) to `.record_<slug>/capture.cjs`, set the URL, and fill in the click/wait sequence from the source HTML.
- Run with `node .record_<slug>/capture.cjs` from the repo root.
- Use visible controls to reset or restart an app. Do not manipulate browser storage or invent state transitions to make a recording look cleaner.
- If the app restores a prior state, adapt the storyboard captions to what is actually shown or restart through the app's own UI; do not silently claim an initial screen that was not captured.

## 4. Render the deliverables

### Slug and file name convention

The slug mirrors the portfolio's `slugFor` function:
```
url.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/, '').slice(0, 120)
```
Example: `https://yggdrasilw-spec.github.io/sonohoka/3d-ryokan/` → `yggdrasilw_spec_github_io_sonohoka_3d-ryokan`

Output files:
- `media/<slug>-intro.mp4`
- `media/<slug>-intro.png`

### Caption script (`scripts/caption-<appname>.mjs`)

Model after `scripts/caption-sakubun.mjs`. Key points:
- Import Sharp from the Codex runtime path (see [references/runtime-paths.md](references/runtime-paths.md)).
- Read frames from `.record_<slug>/`, write captioned frames to `.record_<slug>_captioned/`.
- Copy `files[2]` (frame-02) as the poster PNG.
- Write `storyboard.txt` with index, duration, and caption per line.

Run: `node scripts/caption-<appname>.mjs`

### Encode command

```powershell
python scripts\encode-frame-storyboard.py `
  --frames .record_<slug>_captioned `
  --output media\<slug>-intro.mp4 `
  --poster media\<slug>-intro.png `
  --title "アプリタイトル" `
  --captions "キャプション0" "キャプション1" "キャプション2" "キャプション3" "キャプション4"
```

- Encode the captioned frame sequence as a browser-compatible MP4: H.264 video, AAC audio (silent is fine), `yuv420p`, fast-start metadata, and 10 seconds or less.
- Preserve the source frames, captioned frames, and storyboard if repository size permits; they make later review and regeneration possible.

## 5. Integrate and verify

- Add `data-video="<slug>-intro.mp4"` only to the intended `article.card` (the one matching `data-register-order`). Do not touch other cards.
- The portfolio's JS resolves the poster PNG automatically from the same slug — no extra change needed.
- Verify: MP4 exists in `media/`, PNG exists in `media/`, `data-video` added to exactly one card.

## 6. Version control

After the video, thumbnail, portfolio, and storyboard changes are verified, prepare to commit and push them as the final delivery step. Always ask the user for explicit permission immediately before running Git mutations, even if they previously requested the videos or have authorized GitHub access in general.

- Before asking, inspect `git status`, the current branch, and the configured remote; summarize the exact files and destination that would be changed.
- Stage only the files belonging to this task:
  - `app_links_portfolio.html`
  - `media/<slug>-intro.mp4`
  - `media/<slug>-intro.png`
  - `scripts/caption-<appname>.mjs`
- Use a focused commit message, e.g. `add <appname> demo video and portfolio card video link`.
- Push to the intended remote and branch. Do not reset, checkout, force-push, or overwrite unrelated work.
- After pushing, verify `git status` and report the commit hash, branch, remote, push result, and whether the worktree is clean.
- If permission is not granted, leave the changes uncommitted and report the exact next Git command that remains.

For the detailed timing and caption checklist, read [references/recording-and-encoding.md](references/recording-and-encoding.md).

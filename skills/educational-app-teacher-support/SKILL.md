---
name: educational-app-teacher-support
description: 児童向け自力学習Webアプリに「1授業限定・リアルタイム先生支援キュー（TeacherBridge & 先生ダッシュボード連携）」を組み込むための設計ガイドライン、UIパターン、イベントフック、および非破壊動作原則。
---

# Educational App Teacher Support Integration Guide

児童向け自力学習アプリ・教材Webアプリに **「先生コード」＋「リアルタイム先生支援キュー（TeacherBridge連携）」** を組み込むための標準実装スキルです。

児童が自分のペースで学習を進める中で、「先生に聞く」ボタンを押すと、先生のダッシュボード（`teacher-dashboard.html`）にリアルタイムで通知され、待ち時間順に先生が駆けつけられる支援環境を提供します。

---

## 1. 最重要コア原則

### ① ニックネームの完全共通化
- レイドボス系アプリ（`educational-app-raid-boss`）で使用している端末のニックネーム保存値（`localStorage` の `raid_boss_student_name`）をそのまま共有します。
- 児童に毎回名前を再入力させず、`StudentProfile.getNickname()` から自動取得して表示します。

### ② 1授業限定・60分の先生コード
- 先生コードは長期固定のアカウントではなく、1授業（約1時間）のみ有効な一時コード（例: `H7K3Q2`）です。
- 先生が授業を終了した瞬間、または60分経過（`now >= expiresAt`）で論理的に即利用不可となり、データベースの一時セッションは完全削除されます。

### ③ 完全非破壊（Graceful Degradation）の徹底
- **Firebaseに接続できなくても、教材本体の学習は100%通常通り継続できる** ようにします。
- ネットワーク切断、コード未入力、期限切れの場合でも、教材のボタンやクイズがフリーズしたりエラー画面になったりしてはなりません。

### ④ 不安の強い児童へのUI配慮
- 児童側の画面では、「あなたは遅れています」「支援レベル3」といった評価的・威圧的な表示を避けます。
- 「先生に聞く」を押した後は、**「先生が見に来ます。この画面で待っていてね」** のように、安心して待てるメッセージを表示します。

---

## 2. HTML への組み込み手順

### ステップ 1: `<head>` 内へのスクリプト追加
```html
<!-- Firebase SDK (v10 compat) -->
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-database-compat.js"></script>

<!-- 共通先生支援モジュール -->
<script src="js/student-profile.js"></script>
<script src="js/teacher-bridge.js"></script>
```

### ステップ 2: UI配置パターン（静的HTML型 または 動的SPA型）

#### パターンA: 静的HTML型（カバー画面やスタート画面がHTML直書きの場合）
```html
<div class="teacher-connect-card" style="margin: 16px auto; max-width: 480px; background: #fff; border: 2px solid #dbe2e8; border-radius: 16px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
  <div style="display: flex; align-items: center; gap: 8px;">
    <span style="font-size: 20px;">🧑‍🏫</span>
    <div style="text-align: left;">
      <div style="font-size: 13px; font-weight: 900; color: #334155;">なまえ：<span id="studentNicknameDisplay" style="color: #0284c7; cursor: pointer;" title="クリックして名前を変更">たろう</span></div>
      <div id="teacherConnSubText" style="font-size: 11px; color: #64748b;">先生コードがあれば入れよう</div>
    </div>
  </div>
  <div style="display: flex; align-items: center; gap: 6px;">
    <input type="text" id="teacherCodeInput" placeholder="先生コード" maxlength="8" autocomplete="off" style="width: 105px; padding: 6px 8px; border: 2px solid #cbd5e1; border-radius: 10px; font-size: 14px; font-weight: 900; text-align: center; text-transform: uppercase;">
    <button id="teacherConnectBtn" class="primary" style="padding: 7px 14px; font-size: 13px; min-width: unset;" type="button">つなぐ</button>
    <span id="teacherConnIndicator" title="先生との接続状態" style="font-size: 16px;">⚪</span>
  </div>
</div>
```

#### パターンB: 動的SPA型（`renderHome()` 等でJSからDOM生成する場合）
`renderTeacherConnectCard()` 共通関数を用意し、ホーム描画時にカードDOMを生成して挿入します：
```javascript
// renderHome() の中で
main.appendChild(renderTeacherConnectCard());
updateTeacherIndicator();
```
※ 画面遷移で再描画されても、`TeacherBridge.getSessionState()` から接続中コードや前回のコードが自動復元されます。

### ステップ 3: ヘッダー常時ステータスバッジ（推奨）
学習画面中も児童が接続中であることを安心して確認できるよう、ヘッダーにコンパクトな表示を置きます：
```html
<button id="topTeacherStatusBtn" class="support-btn" style="display:none; padding:4px 10px; font-size:12px; background:rgba(255,255,255,0.9); border-radius:999px; border:none; color:#334155; font-weight:800; align-items:center; gap:4px; cursor:pointer;" title="先生に接続中">
  <span>🟢</span><span id="topTeacherStatusText">先生: ----</span>
</button>
```

### ステップ 4: 先生対応中の安心バナー配置
画面上部に、先生が向かっている時・一緒に見ている時の通知バナーを配置します（初期状態は非表示）：
```html
<div id="teacherNoticeBanner" class="teacher-notice-banner hidden" style="position: fixed; top: 16px; left: 50%; transform: translateX(-50%); z-index: 9999; background: #fffbeb; border: 2px solid #f59e0b; border-radius: 999px; padding: 8px 18px; box-shadow: 0 8px 24px rgba(0,0,0,0.18); display: flex; align-items: center; gap: 10px; font-weight: 900; color: #92400e;">
  <span id="teacherNoticeIcon" style="font-size: 20px;">🏃</span>
  <div>
    <span id="teacherNoticeMain" style="font-size: 14px;">先生が見に来ます</span>
    <span id="teacherNoticeSub" style="font-size: 12px; color: #b45309; margin-left: 6px;">この画面で待っていてね</span>
  </div>
</div>
```

---

## 3. JavaScript イベント連携

### ① 初期化
```javascript
TeacherBridge.init({
  appId: 'your-app-id',    // 例: 'tashizan-daibouken', 'seisuu-seishitsu'
  appName: '教材の表示名' // 例: 'たしざん大冒険', '整数のせいしつ'
});
```

### ② 画面遷移フック（進捗同期）
問題や画面が切り替わる箇所（例: `renderScene`, `renderStage`, `showScreen` など）で呼び出します：
```javascript
if (window.TeacherBridge) {
  TeacherBridge.updateProgress({
    step: 'ステージ1 ステップ1',
    screenId: 'stage-1-step-0',
    screenName: 'ステージ1：ひだりからけいさん'
  });
}
```

### ③ ヒント・支援レベルフック
ヒント段階（0〜3）を表示・変更する箇所で呼び出します：
```javascript
if (window.TeacherBridge) {
  TeacherBridge.updateSupportLevel(level);
}
```

### ④ 「先生に聞く」ライフサイクル
```javascript
// 「先生に聞く」ボタン押下時
function onAskTeacherClick() {
  if (window.TeacherBridge) TeacherBridge.requestHelp();
}

// 児童が「やっぱり大丈夫」で戻った時
function onCancelHelp() {
  if (window.TeacherBridge) TeacherBridge.cancelHelp();
}

// 問題正解時、または先生と一緒に解決した時（自動解決）
function onQuestionSolved() {
  if (window.TeacherBridge) TeacherBridge.resolveHelp();
}
```

### ⑤ 休憩・再開フック
```javascript
// ホーム画面へ戻る時・休む時
if (window.TeacherBridge) TeacherBridge.pause();

// ステージ開始・学習再開時
if (window.TeacherBridge) TeacherBridge.resume();
```

### ⑥ 先生ステータス監視 & セッション終了通知
```javascript
TeacherBridge.onTeacherStatusChange(({ status }) => {
  const banner = document.getElementById('teacherNoticeBanner');
  const icon = document.getElementById('teacherNoticeIcon');
  const main = document.getElementById('teacherNoticeMain');
  const sub = document.getElementById('teacherNoticeSub');
  if (!banner) return;
  if (status === 'teacher_coming') {
    banner.classList.remove('hidden');
    banner.style.borderColor = '#f59e0b';
    banner.style.background = '#fffbeb';
    banner.style.color = '#92400e';
    if (icon) icon.textContent = '🏃';
    if (main) main.textContent = '先生が見に来ます';
    if (sub) sub.textContent = 'この画面で待っていてね';
  } else if (status === 'teacher_supporting') {
    banner.classList.remove('hidden');
    banner.style.borderColor = '#3b82f6';
    banner.style.background = '#eff6ff';
    banner.style.color = '#1e40af';
    if (icon) icon.textContent = '👀';
    if (main) main.textContent = '先生といっしょに見ているよ';
    if (sub) sub.textContent = '';
  } else {
    banner.classList.add('hidden');
  }
});

TeacherBridge.onSessionEnded(() => {
  updateTeacherIndicator('none');
  const banner = document.getElementById('teacherNoticeBanner');
  if (banner) banner.classList.add('hidden');
  alert('この先生コードの時間は終了しました。\n教材はこのまま続けられます。先生に新しいコードを聞いてください。');
});
```

---

## 4. 学習支援モジュール（`LearningSupport`）との統合例

アプリ内に独自のヒント・誤答診断層（`LearningSupport`）がある場合は、各メソッドにフックを挟むだけでシームレスに同期します：

```javascript
LearningSupport = {
  begin(stage, step) {
    ...
    if (window.TeacherBridge) TeacherBridge.updateSupportLevel(0);
  },
  recordWrong(detail) {
    ...
    if (window.TeacherBridge) TeacherBridge.updateSupportLevel(this.current.hintLevel);
  },
  requestHint() {
    ...
    if (window.TeacherBridge) TeacherBridge.updateSupportLevel(this.current.hintLevel);
  },
  requestTeacherHelp() {
    ...
    if (window.TeacherBridge) TeacherBridge.requestHelp();
  },
  recordCorrect() {
    ...
    if (window.TeacherBridge && (this.current.teacherRequestId || window.TeacherBridge.getSessionState().status === 'help_requested')) {
      TeacherBridge.resolveHelp();
    }
  }
};
```

---

## 5. 対応済みアプリ一覧 & App ID

| ファイル名 | App ID | 表示名 | UIパターン |
|---|---|---|---|
| `seisuu_no_seishitsu_yasashiku.html` | `seisuu-seishitsu` | 整数のせいしつ | 静的HTML型（カバー画面） |
| `tashizan_daibouken.html` | `tashizan-daibouken` | たしざん大冒険 | 動的SPA型（`renderHome`） |

---

## 6. リファレンスコード

詳細な組み込み実装コードテンプレートは [references/teacher-support-template.js](references/teacher-support-template.js) を参照してください。


---
name: educational-app-audio-tts
description: 算数・学習支援Webアプリ向けに、Web Speech API（TTS）による音声読み上げ、Web Audio APIによる効果音（SE）、固定ON/OFFボタンUI、事前ウォームアップ、および読みの揺れ防止（算数用語・数字・記号・助数詞のひらがな化）を実装・改修するためのガイドラインと設計パターン。
---

# Educational App Audio & TTS Guide

算数・学習アプリ向けの **音声読み上げ（SpeechSynthesis）** と **効果音（Web Audio SE）** の標準実装スキルです。
小学生や幼児が利用する教育Webアプリにおいて、誤読・読みの揺れを防ぎ、視覚・聴覚両面から理解を促す高品質なオーディオ環境を提供します。

---

## 1. コア原則

1. **完全ひらがな化で渡す（読みの揺れ防止）**
   - 算数記号（`÷`・`×`・`＝`・`−` など）や数字（0〜99）、助数詞（人、個、本、枚、袋など）は、ブラウザやOSのTTSエンジンごとに発音・アクセントが激しく揺れます。
   - 地の文も含め、読み上げエンジンに渡す文字列は**すべて事前にひらがなへ変換**して渡します。
   - 特に「＝」は「は」ではなく「わ」として渡すことで、「ha」と発音される事故を防ぎます。
   - 文末の「？」はそのまま残すことで、自然な疑問文のイントネーション（語尾上がり）になります。

2. **事前ウォームアップ（初回発話の遅延・欠落防止）**
   - ブラウザのTTSエンジンは初回起動時に大きな遅延や頭切れが発生することがあります。
   - ページロード時（`window.addEventListener('load', ...)`）に音量0（`volume: 0`）で無音の1音（「ん」など）を発話させてウォームアップします。
   - 初回ユーザー操作（`pointerdown`/`keydown`）でも `AudioContext` の resume と安全なアンロックを行います。

3. **絵文字1文字のON/OFFボタン（全画面固定配置）**
   - ボタンは絵文字1文字（`🔊`）で表現。
   - **ON**: カラー表示（通常スタイル）。
   - **OFF**: グレーアウト（`filter: grayscale(1) opacity(0.45);`）。
   - 全画面共通の固定配置（`position: fixed; top: 14px; right: 14px; z-index: 1000;`）とし、画面遷移しても常に同じ位置で切り替え可能にします。
   - 設定は `localStorage` に保存し、次回起動時も引き継ぎます。

4. **Web Audio API による外部ファイル不要のシンセSE**
   - 効果音は `.mp3` などの外部ファイルに依存せず、Web Audio API のオシレーター（`OscillatorNode` / `GainNode`）で合成します。
   - 通信待ちや読み込み失敗がなく、即時かつ超軽量に再生できます。

---

## 2. UI・ボタン設計

### HTML
```html
<!-- 音声ON/OFFボタン（全画面共通固定配置） -->
<button class="sound-toggle-btn" id="soundBtn" aria-pressed="true" title="音声 ON/OFF">🔊</button>
```

### CSS
```css
/* ===== 音声ON/OFFボタン ===== */
.sound-toggle-btn {
  position: fixed;
  top: 14px;
  right: 14px;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid #cbd5e1;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1000;
  padding: 0;
  line-height: 1;
  transition: transform 0.1s ease, filter 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
  user-select: none;
  -webkit-user-select: none;
}
.sound-toggle-btn:active {
  transform: scale(0.92);
}
.sound-toggle-btn.sound-off {
  filter: grayscale(1) opacity(0.45);
  background: #f1f5f9;
  border-color: #e2e8f0;
}
```

---

## 3. 効果音（Web Audio API）の定義

アプリ内のアクションに応じた主要な効果音パターン：

| 種類 (`type`) | 音色・周波数設計 | 主な用途 |
| :--- | :--- | :--- |
| `'click'` | sine 650Hz → 880Hz (0.05秒) | ボタンタップ、選択切り替え |
| `'drop'` | triangle 520Hz → 680Hz (0.04秒) | 配る動作、ドット移動、配置 |
| `'step'` | sine 700Hz → 950Hz (0.06秒) | ステップ進行、フェーズ遷移 |
| `'bell'` | sine 880Hz + 1320Hz 2音 (0.2秒) | 式確定、正解チャイム、重要ステップ |
| `'notice'` | triangle 440Hz → 392Hz 2音 (0.14秒) | あまり発生、注意・問いかけ |
| `'fanfare'` | triangle ド・ミ・ソ・ド (523Hz, 659Hz, 784Hz, 1046Hz) | まとめ、完了、全クリア |

---

## 4. ひらがな化＆TTS変換ルール

### (1) 数字（0〜99）のひらがな変換
```javascript
const TTS_ONE_DIGIT = ["", "いち", "に", "さん", "よん", "ご", "ろく", "なな", "はち", "きゅう"];
const TTS_TENS = ["", "じゅう", "にじゅう", "さんじゅう", "よんじゅう", "ごじゅう", "ろくじゅう", "ななじゅう", "はちじゅう", "きゅうじゅう"];

function numToHira(n) {
  n = parseInt(n, 10);
  if (isNaN(n) || n <= 0) return "れい";
  if (n < 10) return TTS_ONE_DIGIT[n];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const o = n % 10;
    return TTS_TENS[t] + TTS_ONE_DIGIT[o];
  }
  return String(n);
}
```

### (2) 助数詞・人・個・本・枚・袋の特殊読み
- **人**:
  - 1人分 / 一人分 → `ひとりぶん`
  - 1人に → `ひとりに`
  - 1人 / 一人 → `ひとり`
  - 2人 / 二人 → `ふたり`
  - 4人 → `よにん`
  - 7人 → `ななにん`
  - 9人 → `きゅうにん`
  - 何人 / 何人に → `なんにん` / `なんにんに`
- **個**:
  - 1個 → `いっこ`
  - 6個 → `ろっこ`
  - 8個 → `はっこ`
  - 10個 → `じゅっこ`
  - 何個 → `なんこ`
- **本**:
  - 1本 → `いっぽん`, 3本 → `さんぼん`, 6本 → `ろっぽん`, 8本 → `はっぽん`, 10本 → `じゅっぽん`
- **袋**:
  - 1袋 → `ひとふくろ`, 2袋 → `ふたふくろ`, 何袋 → `なんぷくろ`

### (3) 記号・算数用語
- `÷` → `わる`
- `×` → `かける`
- `＝` / `=` → `わ` (※「は」はhaと読まれることがあるため「わ」に変換)
- `＝？` / `＝?` → `わ？`
- `−` / `-` → `ひく`
- `＋` / `+` → `たす`
- `□` → `しかく`
- `？` → `？` (疑問符として残し語尾を上げる)
- わり算 → `わりざん`、かけ算 → `かけざん`、あまり → `あまり`

---

## 5. ステップ実行と発話の連携パターン

各アニメーションや画面ステップの更新時に、次のように発話と効果音を同時に実行します。

```javascript
// 例：ステップ表示と発話
middleText.innerHTML = `${mat.name}が${dividend}${mat.unit}あるね。`;
speakText(`${mat.name}が${dividend}${mat.unit}あるね。`);
playSound('step');
await waitNext();
```

※完全な実装テンプレートは [references/implementation-template.js](./references/implementation-template.js) を参照してください。

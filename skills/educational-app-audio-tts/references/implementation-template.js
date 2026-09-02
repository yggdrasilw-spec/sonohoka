/**
 * Educational App Audio & TTS Implementation Template
 * 算数・学習支援Webアプリ向け 音声読み上げ & 効果音 実装テンプレート
 */

// ==========================================
// 1. 状態管理 & ボタンUI
// ==========================================
let soundEnabled = true;
try {
  const saved = localStorage.getItem("app-sound-enabled");
  if (saved !== null) soundEnabled = (saved === "1");
} catch (e) {}

const soundBtn = document.getElementById("soundBtn");

function updateSoundButtonUI() {
  if (!soundBtn) return;
  soundBtn.classList.toggle("sound-off", !soundEnabled);
  soundBtn.setAttribute("aria-pressed", soundEnabled ? "true" : "false");
  soundBtn.title = soundEnabled ? "音声 ON（タップでOFF）" : "音声 OFF（タップでON）";
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  try { localStorage.setItem("app-sound-enabled", soundEnabled ? "1" : "0"); } catch (e) {}
  updateSoundButtonUI();
  if (soundEnabled) {
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    playSound('click');
    speakText("おんせいをオンにしました");
  } else {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }
}

if (soundBtn) {
  soundBtn.addEventListener("click", toggleSound);
  updateSoundButtonUI();
}

// ==========================================
// 2. Web Audio API 効果音（外部ファイル不要）
// ==========================================
let audioCtx = null;
function initAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
}

function playSound(type) {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    const now = audioCtx.currentTime;

    if (type === 'click') {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
      g.gain.setValueAtTime(0.08, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(g); g.connect(audioCtx.destination);
      osc.start(now); osc.stop(now + 0.06);
    } else if (type === 'drop') {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.04);
      g.gain.setValueAtTime(0.06, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(g); g.connect(audioCtx.destination);
      osc.start(now); osc.stop(now + 0.05);
    } else if (type === 'step') {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.06);
      g.gain.setValueAtTime(0.06, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(g); g.connect(audioCtx.destination);
      osc.start(now); osc.stop(now + 0.07);
    } else if (type === 'bell') {
      [880, 1320].forEach((f, i) => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        const st = now + i * 0.08;
        g.gain.setValueAtTime(0.07, st);
        g.gain.exponentialRampToValueAtTime(0.001, st + 0.2);
        osc.connect(g); g.connect(audioCtx.destination);
        osc.start(st); osc.stop(st + 0.22);
      });
    } else if (type === 'notice') {
      [440, 392].forEach((f, i) => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = f;
        const st = now + i * 0.12;
        g.gain.setValueAtTime(0.07, st);
        g.gain.exponentialRampToValueAtTime(0.001, st + 0.14);
        osc.connect(g); g.connect(audioCtx.destination);
        osc.start(st); osc.stop(st + 0.15);
      });
    } else if (type === 'fanfare') {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = f;
        const st = now + i * 0.09;
        g.gain.setValueAtTime(0.08, st);
        g.gain.exponentialRampToValueAtTime(0.001, st + 0.24);
        osc.connect(g); g.connect(audioCtx.destination);
        osc.start(st); osc.stop(st + 0.25);
      });
    }
  } catch (e) {}
}

// ==========================================
// 3. ひらがな変換＆TTS（読みの揺れ防止）
// ==========================================
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

function convertSpecialCounters(text) {
  return text
    // 人
    .replace(/1人分|１人分|一人分/g, "ひとりぶん")
    .replace(/1人に|１人に/g, "ひとりに")
    .replace(/1人|１人|一人/g, "ひとり")
    .replace(/2人|２人|二人/g, "ふたり")
    .replace(/3人|３人/g, "さんにん")
    .replace(/4人|４人/g, "よにん")
    .replace(/5人|５人/g, "ごにん")
    .replace(/6人|６人/g, "ろくにん")
    .replace(/7人|７人/g, "ななにん")
    .replace(/8人|８人/g, "はちにん")
    .replace(/9人|９人/g, "きゅうにん")
    .replace(/何人に/g, "なんにんに")
    .replace(/何人/g, "なんにん")
    // 個
    .replace(/1個|１個|1こ|１こ/g, "いっこ")
    .replace(/6個|６個|6こ|６こ/g, "ろっこ")
    .replace(/8個|８個|8こ|８こ/g, "はっこ")
    .replace(/10個|１０個|10こ|１０こ/g, "じゅっこ")
    .replace(/何個|何こ/g, "なんこ")
    // 本
    .replace(/1本|１本/g, "いっぽん")
    .replace(/2本|２本/g, "にほん")
    .replace(/3本|３本/g, "さんぼん")
    .replace(/4本|４本/g, "よんほん")
    .replace(/6本|６本/g, "ろっぽん")
    .replace(/8本|８本/g, "はっぽん")
    .replace(/10本|１０本/g, "じゅっぽん")
    .replace(/何本/g, "なんぼん")
    // 枚
    .replace(/1枚|１枚|1まい|１まい/g, "いちまい")
    .replace(/何枚|何まい/g, "なんまい")
    // 袋
    .replace(/1袋|１袋|1ふくろ|１ふくろ/g, "ひとふくろ")
    .replace(/2袋|２袋|2ふくろ|２ふくろ/g, "ふたふくろ")
    .replace(/何袋|何ふくろ/g, "なんぷくろ");
}

const TTS_WORD_REPLACE = [
  [/÷|／/g, "わる"],
  [/×|✕/g, "かける"],
  [/＝|=/g, "わ"],
  [/−|―|ー|\-/g, "ひく"],
  [/＋|\+/g, "たす"],
  [/□/g, "しかく"],
  [/＝\s*[？?]/g, "わ？"],
  [/\?/g, "？"],
  [/…|・/g, "、"],
  [/わり算/g, "わりざん"],
  [/かけ算/g, "かけざん"],
  [/あなあき/g, "あなあき"],
  [/あまり/g, "あまり"],
  [/九九/g, "くく"],
  [/のだん/g, "のだん"],
  [/分けると/g, "わけると"],
  [/分ける/g, "わける"],
  [/分けられる/g, "わけられる"],
  [/同じ数ずつ/g, "おなじかずずつ"],
  [/用意しよう/g, "よういしよう"],
  [/用意/g, "ようい"],
  [/入れると/g, "いれると"],
  [/入れる/g, "いれる"],
  [/入る/g, "はいる"],
  [/引くよ/g, "ひくよ"],
  [/引く/g, "ひく"],
  [/だから/g, "だから"],
  [/絵がなくても/g, "えがなくても"],
  [/同じ考え方で/g, "おなじかんがえかたで"],
  [/考え方/g, "かんがえかた"],
  [/同じように/g, "おなじように"],
  [/どんなものでも/g, "どんなものでも"],
  [/たくさん/g, "たくさん"],
  [/使って|使うよ|使う/g, "つかうよ"],
  [/時|とき/g, "とき"],
  [/一番近くて/g, "いちばんちかくて"],
  [/一番大きい/g, "いちばんおおきい"],
  [/一番/g, "いちばん"],
  [/大きく|大きい/g, "おおきい"],
  [/大きすぎる/g, "おおきすぎる"],
  [/数/g, "かず"],
  [/分/g, "ぶん"]
];

function convertTextForSpeech(text) {
  if (!text) return "";
  let t = String(text);

  t = t.replace(/<[^>]*>/g, " ");
  t = t.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");

  t = convertSpecialCounters(t);
  t = t.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
  t = t.replace(/\d+/g, m => numToHira(m));

  for (const [pattern, rep] of TTS_WORD_REPLACE) {
    t = t.replace(pattern, rep);
  }

  t = t.replace(/[【】「」『』()（）]/g, " ")
       .replace(/[、]{2,}/g, "、")
       .replace(/\s+/g, " ")
       .trim();

  return t;
}

let ttsJaVoice = null;
function ttsPickVoice() {
  if (!("speechSynthesis" in window)) return;
  const voices = window.speechSynthesis.getVoices();
  ttsJaVoice = voices.find(v => v.lang === "ja-JP") || voices.find(v => v.lang && v.lang.startsWith("ja")) || null;
}
if ("speechSynthesis" in window) {
  ttsPickVoice();
  window.speechSynthesis.onvoiceschanged = ttsPickVoice;
}

function speakText(rawText, opts = {}) {
  if (!("speechSynthesis" in window)) return;
  if (!soundEnabled && !opts.forceWarmup) return;

  const utter = new SpeechSynthesisUtterance();
  utter.lang = "ja-JP";
  if (ttsJaVoice) utter.voice = ttsJaVoice;
  utter.rate = opts.rate || 1.05;
  utter.pitch = 1.0;
  utter.volume = typeof opts.volume === "number" ? opts.volume : 1.0;
  utter.text = opts.raw ? String(rawText) : convertTextForSpeech(rawText);

  try {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  } catch (e) {}
}

// ==========================================
// 4. ウォームアップ（初回遅延・欠落防止）
// ==========================================
function ttsWarmup() {
  if (!("speechSynthesis" in window)) return;
  speakText("ん", { raw: true, volume: 0, forceWarmup: true });
}

window.addEventListener("load", () => {
  setTimeout(ttsWarmup, 250);
});

function unlockUserAudio() {
  initAudio();
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  ttsWarmup();
  window.removeEventListener('pointerdown', unlockUserAudio);
  window.removeEventListener('keydown', unlockUserAudio);
}
window.addEventListener('pointerdown', unlockUserAudio, { once: true });
window.addEventListener('keydown', unlockUserAudio, { once: true });

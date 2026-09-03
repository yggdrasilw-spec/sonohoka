/**
 * レイドボスチャレンジ連携 実装テンプレート
 * 
 * 1. HTMLの <head> に以下を追加:
 * <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
 * <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
 * <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-database-compat.js"></script>
 * 
 * 2. ヘッダーにUIコンポーネントを追加:
 * <div class="raid-bar" id="raidBar">
 *   <div class="raid-code-box">
 *     <span style="font-size: .85rem;">🔑</span>
 *     <input type="text" id="studentRaidCode" placeholder="コード" maxlength="8">
 *     <button id="connectBtn" class="raid-btn" type="button">接続</button>
 *     <span id="connStatus" class="conn-status" title="接続状態">⚪</span>
 *   </div>
 *   <div id="bossMiniStatus" class="boss-mini-status">
 *     👾 <span id="miniBossName">ボス</span> <span id="miniBossHp"></span>
 *   </div>
 *   <div id="streakBadge" class="streak-badge">
 *     🔥 <span id="streakCount">0</span>れんぞく
 *   </div>
 *   <div class="user-profile-box">
 *     <button id="avatarBtn" class="avatar-select-btn" type="button">⚔️</button>
 *     <div class="name-input-box">
 *       <input type="text" id="studentName" value="たろう" placeholder="なまえ" maxlength="8">
 *     </div>
 *     <div class="avatar-picker-popover" id="avatarPicker">
 *       <span class="avatar-option" data-avatar="⚔️">⚔️</span>
 *       <span class="avatar-option" data-avatar="🧙‍♂️">🧙‍♂️</span>
 *       <span class="avatar-option" data-avatar="🏹">🏹</span>
 *       <span class="avatar-option" data-avatar="🥷">🥷</span>
 *       <span class="avatar-option" data-avatar="🐱">🐱</span>
 *       <span class="avatar-option" data-avatar="🐶">🐶</span>
 *       <span class="avatar-option" data-avatar="🤖">🤖</span>
 *     </div>
 *   </div>
 *   <div id="raidMsg" class="raid-msg"></div>
 * </div>
 */

// ------------------------------------------------------------------
// Firebase & Raid Boss Logic
// ------------------------------------------------------------------
let db = null;
let authPromise = null;

try {
  const firebaseConfig = {
    apiKey: "AIzaSyDdqalOwQFkZnNvFCKzXqM4VeP4IBPhzXo",
    authDomain: "raid-boss-project.firebaseapp.com",
    databaseURL: "https://raid-boss-project-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "raid-boss-project",
    storageBucket: "raid-boss-project.firebasestorage.app",
    messagingSenderId: "195656323635",
    appId: "1:195656323635:web:ca2dd1251af61929080946",
    measurementId: "G-6VBWZVLKLK"
  };

  if (typeof firebase !== 'undefined' && firebase.initializeApp) {
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.database();
    // ★最重要: 匿名認証の事前実行とプロミスの保持
    authPromise = firebase.auth().signInAnonymously().catch(err => {
      console.error("匿名認証エラー:", err);
      return null;
    });
  }
} catch (err) {
  console.error("Firebase初期化エラー:", err);
}

let currentRaidCode = "";
let studentRoomRef = null;
let currentRoomListener = null;

function normalizeCode(str) {
  if (!str) return "";
  return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).trim().toUpperCase();
}

const connStatus = document.getElementById("connStatus");
const connectBtn = document.getElementById("connectBtn");
const bossMiniStatus = document.getElementById("bossMiniStatus");
const miniBossName = document.getElementById("miniBossName");
const miniBossHp = document.getElementById("miniBossHp");
const studentRaidCodeInput = document.getElementById("studentRaidCode");
const studentNameInput = document.getElementById("studentName");
const avatarBtn = document.getElementById("avatarBtn");
const avatarPicker = document.getElementById("avatarPicker");
const streakBadge = document.getElementById("streakBadge");
const streakCountEl = document.getElementById("streakCount");
const raidMsgEl = document.getElementById("raidMsg");

let raidMsgTimer = null;
function showRaidMsg(txt, type) {
  if (!raidMsgEl) return;
  clearTimeout(raidMsgTimer);
  raidMsgEl.textContent = txt;
  raidMsgEl.className = `raid-msg show ${type || ""}`;
  raidMsgTimer = setTimeout(() => {
    raidMsgEl.classList.remove("show");
  }, 3500);
}

function updateConnStatus(status, tooltip) {
  if (!connStatus) return;
  connStatus.title = tooltip;
  if (status === "connected") {
    connStatus.textContent = "🟢";
    if (connectBtn) connectBtn.textContent = "接続中";
    if (bossMiniStatus) bossMiniStatus.classList.add("show");
  } else if (status === "connecting") {
    connStatus.textContent = "🟡";
    if (connectBtn) connectBtn.textContent = "確認中...";
    if (bossMiniStatus) bossMiniStatus.classList.remove("show");
  } else if (status === "error") {
    connStatus.textContent = "🔴";
    if (connectBtn) connectBtn.textContent = "接続";
    if (bossMiniStatus) bossMiniStatus.classList.remove("show");
  } else {
    connStatus.textContent = "⚪";
    if (connectBtn) connectBtn.textContent = "接続";
    if (bossMiniStatus) bossMiniStatus.classList.remove("show");
  }
}

async function connectToRaid(code, isAuto = false) {
  const cleanCode = normalizeCode(code);
  if (studentRaidCodeInput) studentRaidCodeInput.value = cleanCode;

  if (!cleanCode) {
    currentRaidCode = "";
    if (studentRoomRef && currentRoomListener) {
      studentRoomRef.off("value", currentRoomListener);
    }
    studentRoomRef = null;
    updateConnStatus("none", "レイドコード未入力");
    if (!isAuto) showRaidMsg("⚠️ レイドコードを入力してください", "warn");
    return;
  }

  if (!db) {
    updateConnStatus("error", "Firebaseが初期化されていません");
    showRaidMsg("⚠️ Firebaseの接続に失敗しました", "error");
    return;
  }

  updateConnStatus("connecting", `接続確認中: ルーム ${cleanCode}`);
  if (!isAuto) showRaidMsg(`🔍 ルーム「${cleanCode}」を確認中...`, "warn");

  // ★最重要: 匿名認証の完了を待機
  if (authPromise) {
    await authPromise;
  }

  currentRaidCode = cleanCode;
  try { localStorage.setItem("raid_boss_student_code", cleanCode); } catch(e){}

  if (studentRoomRef && currentRoomListener) {
    studentRoomRef.off("value", currentRoomListener);
  }

  studentRoomRef = db.ref(`rooms/${cleanCode}`);
  let firstLoad = true;
  currentRoomListener = snapshot => {
    const data = snapshot.val();
    const now = Date.now();

    if (!data || !data.boss || (data.expiresAt && data.expiresAt < now)) {
      updateConnStatus("error", "レイドコードが見つからないか、期限切れです");
      showRaidMsg(`⚠️ ルーム「${cleanCode}」が見つからないか期限切れです`, "error");
      return;
    }

    updateConnStatus("connected", `接続中: ルーム ${cleanCode}`);
    const bossName = data.boss.name || "ボス";
    if (firstLoad) {
      showRaidMsg(`✅ ボス「${bossName}」に接続しました！`, "good");
      firstLoad = false;
    }

    if (miniBossName) miniBossName.textContent = bossName;
    if (miniBossHp) {
      const cur = Math.max(0, data.boss.currentHp !== undefined ? data.boss.currentHp : (data.boss.maxHp || 0));
      miniBossHp.textContent = `(${cur}/${data.boss.maxHp || "?"})`;
    }
  };

  studentRoomRef.on("value", currentRoomListener, err => {
    console.error("Firebase Room Listener Error:", err);
    updateConnStatus("error", `通信エラー: ${err.message || "権限がありません"}`);
    showRaidMsg("⚠️ 通信エラーが発生しました", "error");
  });
}

function sendAttack(damage, detail, avatar = "⚔️") {
  if (!db || !studentRoomRef || !currentRaidCode) {
    return false;
  }

  const name = (studentNameInput && studentNameInput.value.trim()) || "ななし";
  try { localStorage.setItem("raid_boss_student_name", name); } catch(e){}

  studentRoomRef.child("boss/currentHp").transaction(currentHp => {
    return (currentHp || 0) - damage;
  });

  studentRoomRef.child("logs").push({
    avatar: avatar,
    name: name,
    damage: damage,
    detail: detail,
    timestamp: Date.now()
  });

  return true;
}

function initRaidUI() {
  if (connectBtn) {
    connectBtn.addEventListener("click", () => {
      const code = studentRaidCodeInput ? studentRaidCodeInput.value : "";
      connectToRaid(code, false);
    });
  }
  if (studentRaidCodeInput) {
    studentRaidCodeInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        const code = studentRaidCodeInput ? studentRaidCodeInput.value : "";
        connectToRaid(code, false);
      }
    });
  }

  // アバター選択
  if (avatarBtn && avatarPicker) {
    avatarBtn.addEventListener("click", e => {
      e.stopPropagation();
      avatarPicker.classList.toggle("show");
    });
    avatarPicker.querySelectorAll(".avatar-option").forEach(opt => {
      opt.addEventListener("click", e => {
        e.stopPropagation();
        const av = opt.getAttribute("data-avatar");
        if (av) {
          avatarBtn.textContent = av;
          try { localStorage.setItem("raid_boss_student_avatar", av); } catch(err){}
        }
        avatarPicker.classList.remove("show");
      });
    });
    document.addEventListener("click", e => {
      if (!avatarPicker.contains(e.target) && e.target !== avatarBtn) {
        avatarPicker.classList.remove("show");
      }
    });
  }

  // 設定復元
  try {
    const savedName = localStorage.getItem("raid_boss_student_name");
    if (savedName && studentNameInput) studentNameInput.value = savedName;

    const savedAvatar = localStorage.getItem("raid_boss_student_avatar");
    if (savedAvatar && avatarBtn) avatarBtn.textContent = savedAvatar;

    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get("code");
    const savedCode = localStorage.getItem("raid_boss_student_code");
    const initialCode = (codeParam && codeParam.trim()) || savedCode || "";
    if (studentRaidCodeInput && initialCode) studentRaidCodeInput.value = initialCode;
    if (initialCode) connectToRaid(initialCode, true);
    else updateConnStatus("none", "コードを入力して接続してください");
  } catch(e){}
}

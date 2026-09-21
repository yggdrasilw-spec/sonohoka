/**
 * Teacher Dashboard - 先生用リアルタイム支援ダッシュボード
 */
(function() {
  'use strict';

  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDdqalOwQFkZnNvFCKzXqM4VeP4IBPhzXo",
    authDomain: "raid-boss-project.firebaseapp.com",
    databaseURL: "https://raid-boss-project-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "raid-boss-project",
    storageBucket: "raid-boss-project.firebasestorage.app",
    messagingSenderId: "195656323635",
    appId: "1:195656323635:web:ca2dd1251af61929080946",
    measurementId: "G-6VBWZVLKLK"
  };

  const SAFE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

  let db = null;
  let auth = null;
  let teacherUid = null;
  let serverOffset = 0;

  let currentSessionId = null;
  let currentTeacherCode = null;
  let currentExpiresAt = null;

  let studentsMap = {};
  let studentsRef = null;
  let sessionTimer = null;

  // DOM
  const welcomeSection = document.getElementById('welcomeSection');
  const queueSection = document.getElementById('queueSection');
  const sessionHeader = document.getElementById('sessionHeader');
  const teacherCodeBadge = document.getElementById('teacherCodeBadge');
  const timeRemainingEl = document.getElementById('timeRemaining');
  const timerBadge = document.getElementById('timerBadge');
  const studentCountBadge = document.getElementById('studentCountBadge');
  const studentGrid = document.getElementById('studentGrid');
  const helpRequestAlert = document.getElementById('helpRequestAlert');
  const startSessionBtn = document.getElementById('startSessionBtn');
  const endSessionBtn = document.getElementById('endSessionBtn');
  const confirmEndModal = document.getElementById('confirmEndModal');
  const cancelEndBtn = document.getElementById('cancelEndBtn');
  const confirmEndActionBtn = document.getElementById('confirmEndActionBtn');

  function now() {
    return Date.now() + serverOffset;
  }

  function formatDuration(ms) {
    if (ms <= 0) return '00:00';
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function formatWaitTime(ms) {
    if (ms <= 0) return '0秒';
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    if (m > 0) {
      return m + '分' + (s < 10 ? '0' : '') + s + '秒';
    }
    return s + '秒';
  }

  function generateCode(len) {
    len = len || 6;
    let res = '';
    for (let i = 0; i < len; i++) {
      res += SAFE_CHARS.charAt(Math.floor(Math.random() * SAFE_CHARS.length));
    }
    return res;
  }

  async function initFirebase() {
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    db = firebase.database();
    auth = firebase.auth();

    db.ref('.info/serverTimeOffset').on('value', snap => {
      serverOffset = snap.val() || 0;
    });

    const cred = await auth.signInAnonymously();
    teacherUid = cred.user.uid;
    console.log('[TeacherDashboard] Firebase認証完了: UID =', teacherUid);

    cleanupExpiredTeacherCodes();
    setInterval(cleanupExpiredTeacherCodes, 5 * 60 * 1000);

    checkActiveSession();
  }

  async function cleanupExpiredTeacherCodes() {
    if (!db) return;
    try {
      const snap = await db.ref('teacherCodes').once('value');
      const codes = snap.val();
      if (!codes) return;

      const currentTime = now();
      Object.entries(codes).forEach(([code, data]) => {
        if (data && data.expiresAt && data.expiresAt < currentTime) {
          console.log('[Auto Cleanup] 期限切れ先生コード削除:', code);
          db.ref('teacherCodes/' + code).remove();
          if (data.sessionId) {
            db.ref('teacherSessions/' + data.sessionId).remove();
          }
        }
      });
    } catch (e) {
      console.warn('[Auto Cleanup] クリーンアップ走査エラー:', e);
    }
  }

  async function checkActiveSession() {
    try {
      const saved = JSON.parse(localStorage.getItem('active_teacher_session') || '{}');
      if (saved.sessionId && saved.code && saved.expiresAt && saved.expiresAt > now()) {
        const snap = await db.ref('teacherSessions/' + saved.sessionId).once('value');
        const data = snap.val();
        if (data && data.status === 'active' && data.teacherUid === teacherUid) {
          bindSession(saved.sessionId, saved.code, saved.expiresAt);
        } else {
          localStorage.removeItem('active_teacher_session');
        }
      }
    } catch (e) {
      localStorage.removeItem('active_teacher_session');
    }
  }

  async function startNewSession() {
    if (!db || !teacherUid) {
      alert('Firebaseに接続中です。少々お待ちください。');
      return;
    }

    startSessionBtn.disabled = true;
    startSessionBtn.textContent = 'コード発行中...';

    try {
      let code = '';
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 10) {
        attempts++;
        code = generateCode(6);
        const snap = await db.ref('teacherCodes/' + code).once('value');
        const val = snap.val();
        if (!val || val.expiresAt <= now()) {
          isUnique = true;
        }
      }

      if (!isUnique) {
        throw new Error('コードの生成に失敗しました。もう一度お試しください。');
      }

      const sessionId = 'ts-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
      const createdAt = now();
      const expiresAt = createdAt + 60 * 60 * 1000;

      await db.ref('teacherSessions/' + sessionId).set({
        teacherUid: teacherUid,
        teacherCode: code,
        createdAt: createdAt,
        expiresAt: expiresAt,
        status: 'active',
        students: {}
      });

      await db.ref('teacherCodes/' + code).set({
        sessionId: sessionId,
        teacherUid: teacherUid,
        createdAt: createdAt,
        expiresAt: expiresAt
      });

      localStorage.setItem('active_teacher_session', JSON.stringify({
        sessionId: sessionId,
        code: code,
        expiresAt: expiresAt
      }));

      bindSession(sessionId, code, expiresAt);

    } catch (err) {
      console.error('[TeacherDashboard] セッション作成エラー:', err);
      alert('授業の開始に失敗しました: ' + (err.message || '通信エラー'));
    } finally {
      startSessionBtn.disabled = false;
      startSessionBtn.textContent = '🚀 新しい授業をはじめる';
    }
  }

  function bindSession(sessionId, code, expiresAt) {
    currentSessionId = sessionId;
    currentTeacherCode = code;
    currentExpiresAt = expiresAt;

    welcomeSection.classList.add('hidden');
    queueSection.classList.remove('hidden');
    sessionHeader.classList.remove('hidden');

    teacherCodeBadge.textContent = code;

    if (studentsRef) studentsRef.off();
    studentsRef = db.ref('teacherSessions/' + sessionId + '/students');

    studentsRef.on('value', snap => {
      studentsMap = snap.val() || {};
      renderStudents();
    });

    if (sessionTimer) clearInterval(sessionTimer);
    updateTimer();
    sessionTimer = setInterval(updateTimer, 1000);
  }

  function updateTimer() {
    if (!currentExpiresAt) return;
    const remaining = currentExpiresAt - now();
    if (remaining <= 0) {
      timeRemainingEl.textContent = '00:00 (終了)';
      timerBadge.classList.add('urgent');
      clearInterval(sessionTimer);
      alert('授業の制限時間（60分）が終了しました。');
      endSession(false);
      return;
    }

    timeRemainingEl.textContent = formatDuration(remaining);
    if (remaining <= 5 * 60 * 1000) {
      timerBadge.classList.add('urgent');
    } else {
      timerBadge.classList.remove('urgent');
    }

    document.querySelectorAll('.wait-time-value').forEach(el => {
      const requestedAt = Number(el.dataset.requestedAt);
      if (requestedAt) {
        el.textContent = formatWaitTime(now() - requestedAt);
      }
    });
  }

  const STATUS_PRIORITY = {
    help_requested: 1000,
    teacher_coming: 800,
    teacher_supporting: 600,
    learning: 400,
    paused: 200,
    offline: 0
  };

  const STATUS_LABELS = {
    help_requested: '🔴 先生に聞く',
    teacher_coming: '🟠 先生が見に来ます',
    teacher_supporting: '🔵 先生が対応中',
    learning: '🟢 学習中',
    paused: '⏸️ 休憩中',
    offline: '⚪ 離席・切断'
  };

  function renderStudents() {
    const list = Object.entries(studentsMap).map(([uid, data]) => ({ uid, ...data }));
    studentCountBadge.textContent = '参加 ' + list.length + '人';

    list.sort((a, b) => {
      const pa = STATUS_PRIORITY[a.status] || 0;
      const pb = STATUS_PRIORITY[b.status] || 0;
      if (pa !== pb) return pb - pa;

      if (a.status === 'help_requested' && b.status === 'help_requested') {
        return (a.helpRequestedAt || 0) - (b.helpRequestedAt || 0);
      }
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });

    const hasHelp = list.some(x => x.status === 'help_requested');
    helpRequestAlert.classList.toggle('hidden', !hasHelp);

    studentGrid.innerHTML = '';
    if (!list.length) {
      studentGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px; color: var(--soft); font-weight: 700;">
          まだ児童が接続していません。<br>
          黒板や電子黒板に <strong>先生コード【 ${currentTeacherCode} 】</strong> を案内してください。
        </div>
      `;
      return;
    }

    list.forEach(student => {
      const card = document.createElement('div');
      card.className = 'student-card ' + (student.status || 'learning');

      const avatar = student.avatar || '⚔️';
      const name = student.nickname || 'ななし';
      const st = student.status || 'learning';
      const stLabel = STATUS_LABELS[st] || st;

      let waitHtml = '';
      if (st === 'help_requested' && student.helpRequestedAt) {
        const waitMs = now() - student.helpRequestedAt;
        waitHtml = `
          <div class="wait-time-row">
            <span>⏳ 待ち時間:</span>
            <span class="wait-time-value" data-requested-at="${student.helpRequestedAt}">${formatWaitTime(waitMs)}</span>
          </div>
        `;
      }

      const appName = student.appName || '自力学習教材';
      const step = student.step || 'STEP --';
      const screenName = student.screenName || '学習中';
      const supportLevel = student.supportLevel || 0;

      let actionBtnHtml = '';
      if (st === 'help_requested') {
        actionBtnHtml = `<button class="btn btn-primary" onclick="window.__TEACHER__.setStudentStatus('${student.uid}', 'teacher_coming')">🏃 対応する</button>`;
      } else if (st === 'teacher_coming') {
        actionBtnHtml = `
          <button class="btn btn-outline" onclick="window.__TEACHER__.setStudentStatus('${student.uid}', 'teacher_supporting')">👀 到着・指導中</button>
          <button class="btn btn-primary" onclick="window.__TEACHER__.setStudentStatus('${student.uid}', 'learning', true)">✓ 完了</button>
        `;
      } else if (st === 'teacher_supporting') {
        actionBtnHtml = `<button class="btn btn-primary" onclick="window.__TEACHER__.setStudentStatus('${student.uid}', 'learning', true)">✓ 対応完了</button>`;
      }

      card.innerHTML = `
        <div class="card-top">
          <div class="user-info">
            <span class="user-avatar">${avatar}</span>
            <span class="user-name">${escapeHtml(name)}</span>
          </div>
          <span class="status-badge ${st}">${stLabel}</span>
        </div>

        ${waitHtml}

        <div class="app-meta">
          <div class="app-meta-title">📖 ${escapeHtml(appName)}</div>
          <div class="app-meta-detail">
            <span>${escapeHtml(step)} / ${escapeHtml(screenName)}</span>
            ${supportLevel > 0 ? '<span class="support-chip">💡 支援 ' + supportLevel + '</span>' : ''}
          </div>
        </div>

        ${actionBtnHtml ? '<div class="card-actions">' + actionBtnHtml + '</div>' : ''}
      `;

      studentGrid.appendChild(card);
    });
  }

  function setStudentStatus(uid, status, isResolved) {
    if (!studentsRef || !uid) return;
    const updates = {
      status: status,
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    };
    if (isResolved) {
      updates.helpRequestedAt = null;
    }
    studentsRef.child(uid).update(updates).catch(err => {
      console.error('[TeacherDashboard] 生徒状態更新エラー:', err);
    });
  }

  async function endSession(needConfirm) {
    if (needConfirm) {
      confirmEndModal.classList.add('open');
      return;
    }

    if (sessionTimer) clearInterval(sessionTimer);
    if (studentsRef) studentsRef.off();

    const code = currentTeacherCode;
    const sessionId = currentSessionId;

    currentSessionId = null;
    currentTeacherCode = null;
    currentExpiresAt = null;
    studentsMap = {};
    localStorage.removeItem('active_teacher_session');

    confirmEndModal.classList.remove('open');
    sessionHeader.classList.add('hidden');
    queueSection.classList.add('hidden');
    welcomeSection.classList.remove('hidden');

    if (db && code && sessionId) {
      try {
        console.log('[TeacherDashboard] 授業終了: RTDBからセッション削除中...');
        await Promise.all([
          db.ref('teacherCodes/' + code).remove(),
          db.ref('teacherSessions/' + sessionId).remove()
        ]);
        console.log('[TeacherDashboard] RTDBセッション完全削除完了');
      } catch (err) {
        console.warn('[TeacherDashboard] 削除処理エラー:', err);
      }
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  teacherCodeBadge.addEventListener('click', async () => {
    if (!currentTeacherCode) return;
    try {
      await navigator.clipboard.writeText(currentTeacherCode);
      const original = teacherCodeBadge.textContent;
      teacherCodeBadge.textContent = 'コピー完了!';
      setTimeout(() => {
        teacherCodeBadge.textContent = original;
      }, 1400);
    } catch (e) {
      prompt('先生コードをコピーしてください:', currentTeacherCode);
    }
  });

  startSessionBtn.addEventListener('click', startNewSession);
  endSessionBtn.addEventListener('click', () => endSession(true));
  cancelEndBtn.addEventListener('click', () => confirmEndModal.classList.remove('open'));
  confirmEndActionBtn.addEventListener('click', () => endSession(false));

  window.__TEACHER__ = {
    setStudentStatus: setStudentStatus
  };

  initFirebase();
})();

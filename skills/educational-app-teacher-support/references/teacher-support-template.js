/**
 * 先生支援機能（TeacherBridge連携） 実装テンプレート
 * 
 * 1. HTMLの <head> に以下を追加:
 * <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
 * <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
 * <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-database-compat.js"></script>
 * <script src="js/student-profile.js"></script>
 * <script src="js/teacher-bridge.js"></script>
 * 
 * 2. カバー画面やヘッダーに先生コード入力UIを追加:
 * <div class="teacher-connect-card" style="margin: 16px auto; max-width: 480px; background: #fff; border: 2px solid #dbe2e8; border-radius: 16px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
 *   <div style="display: flex; align-items: center; gap: 8px;">
 *     <span style="font-size: 20px;">🧑‍🏫</span>
 *     <div style="text-align: left;">
 *       <div style="font-size: 13px; font-weight: 900; color: #334155;">なまえ：<span id="studentNicknameDisplay" style="color: #0284c7; cursor: pointer;" title="クリックして名前を変更">たろう</span></div>
 *       <div id="teacherConnSubText" style="font-size: 11px; color: #64748b;">先生コードがあれば入れよう</div>
 *     </div>
 *   </div>
 *   <div style="display: flex; align-items: center; gap: 6px;">
 *     <input type="text" id="teacherCodeInput" placeholder="先生コード" maxlength="8" autocomplete="off" style="width: 105px; padding: 6px 8px; border: 2px solid #cbd5e1; border-radius: 10px; font-size: 14px; font-weight: 900; text-align: center; text-transform: uppercase;">
 *     <button id="teacherConnectBtn" class="primary" style="padding: 7px 14px; font-size: 13px; min-width: unset;" type="button">つなぐ</button>
 *     <span id="teacherConnIndicator" title="先生との接続状態" style="font-size: 16px;">⚪</span>
 *   </div>
 * </div>
 * 
 * 3. 先生対応中の安心バナーを追加:
 * <div id="teacherNoticeBanner" class="teacher-notice-banner hidden" style="position: fixed; top: 62px; left: 50%; transform: translateX(-50%); z-index: 95; background: #fffbeb; border: 2px solid #f59e0b; border-radius: 999px; padding: 8px 18px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); display: flex; align-items: center; gap: 10px; font-weight: 900; color: #92400e;">
 *   <span id="teacherNoticeIcon" style="font-size: 20px;">🏃</span>
 *   <div>
 *     <span id="teacherNoticeMain" style="font-size: 14px;">先生が見に来ます</span>
 *     <span id="teacherNoticeSub" style="font-size: 12px; color: #b45309; margin-left: 6px;">この画面で待っていてね</span>
 *   </div>
 * </div>
 */

(function() {
  'use strict';

  // 1. TeacherBridge 初期化
  if (window.TeacherBridge) {
    TeacherBridge.init({
      appId: 'sample-app',   // 教材の一意なID
      appName: 'サンプル教材' // 先生画面に表示される教材名
    });
  }

  // 2. UI要素の取得
  const connectBtn = document.getElementById('teacherConnectBtn');
  const codeInput = document.getElementById('teacherCodeInput');
  const indicator = document.getElementById('teacherConnIndicator');
  const subText = document.getElementById('teacherConnSubText');
  const nicknameDisplay = document.getElementById('studentNicknameDisplay');
  const noticeBanner = document.getElementById('teacherNoticeBanner');
  const noticeIcon = document.getElementById('teacherNoticeIcon');
  const noticeMain = document.getElementById('teacherNoticeMain');
  const noticeSub = document.getElementById('teacherNoticeSub');

  // 3. 接続状態UIの更新
  function updateTeacherIndicator(status, code) {
    if (status === 'connected') {
      if (indicator) { indicator.textContent = '🟢'; indicator.title = '先生に接続中: ' + code; }
      if (connectBtn) connectBtn.textContent = '切断';
      if (subText) subText.textContent = '先生につながっています (' + code + ')';
    } else if (status === 'connecting') {
      if (indicator) { indicator.textContent = '🟡'; indicator.title = '接続確認中...'; }
      if (connectBtn) connectBtn.textContent = '確認中';
      if (subText) subText.textContent = '接続確認中...';
    } else {
      if (indicator) { indicator.textContent = '⚪'; indicator.title = '先生未接続'; }
      if (connectBtn) connectBtn.textContent = 'つなぐ';
      if (subText) subText.textContent = '先生コードがあれば入れよう';
    }
  }

  // 4. 先生コード接続・切断ハンドラ
  async function handleConnectTeacher() {
    if (!window.TeacherBridge) return;
    const code = codeInput ? codeInput.value.trim() : '';
    const state = TeacherBridge.getSessionState();

    if (state.connected) {
      TeacherBridge.leaveSession(true);
      updateTeacherIndicator('none');
      if (codeInput) codeInput.value = '';
      return;
    }

    if (!code) {
      alert('先生コードを入力してください。');
      return;
    }

    updateTeacherIndicator('connecting');
    const res = await TeacherBridge.joinSession(code);
    if (res.success) {
      updateTeacherIndicator('connected', res.code);
    } else {
      updateTeacherIndicator('none');
      alert(res.message);
    }
  }

  if (connectBtn) connectBtn.addEventListener('click', handleConnectTeacher);
  if (codeInput) {
    codeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleConnectTeacher();
    });
  }

  // 5. ニックネーム管理（レイド共通）
  function initNickname() {
    if (!window.StudentProfile) return;
    let name = StudentProfile.getNickname();
    if (!name) {
      name = 'たろう';
      StudentProfile.setNickname(name);
    }
    if (nicknameDisplay) {
      nicknameDisplay.textContent = name;
      nicknameDisplay.addEventListener('click', () => {
        const newName = prompt('なまえを入力してください:', StudentProfile.getNickname());
        if (newName && newName.trim()) {
          const saved = StudentProfile.setNickname(newName.trim());
          nicknameDisplay.textContent = saved;
        }
      });
    }

    // URLパラメータ (?teacherCode=XXXX or ?code=XXXX) または前回のコード復元
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('teacherCode') || urlParams.get('code');
    const lastCode = codeFromUrl || StudentProfile.getLastTeacherCode();
    if (lastCode && codeInput) {
      codeInput.value = lastCode;
      if (codeFromUrl) {
        handleConnectTeacher();
      }
    }
  }
  initNickname();

  // 6. 先生からのステータス通知監視
  if (window.TeacherBridge) {
    TeacherBridge.onTeacherStatusChange(({ status }) => {
      if (!noticeBanner) return;
      if (status === 'teacher_coming') {
        noticeBanner.classList.remove('hidden');
        noticeBanner.style.borderColor = '#f59e0b';
        noticeBanner.style.background = '#fffbeb';
        noticeBanner.style.color = '#92400e';
        if (noticeIcon) noticeIcon.textContent = '🏃';
        if (noticeMain) noticeMain.textContent = '先生が見に来ます';
        if (noticeSub) noticeSub.textContent = 'この画面で待っていてね';
      } else if (status === 'teacher_supporting') {
        noticeBanner.classList.remove('hidden');
        noticeBanner.style.borderColor = '#3b82f6';
        noticeBanner.style.background = '#eff6ff';
        noticeBanner.style.color = '#1e40af';
        if (noticeIcon) noticeIcon.textContent = '👀';
        if (noticeMain) noticeMain.textContent = '先生といっしょに見ているよ';
        if (noticeSub) noticeSub.textContent = '';
      } else {
        noticeBanner.classList.add('hidden');
      }
    });

    TeacherBridge.onSessionEnded(() => {
      updateTeacherIndicator('none');
      if (noticeBanner) noticeBanner.classList.add('hidden');
      alert('この先生コードの時間は終了しました。\n教材はこのまま続けられます。先生に新しいコードを聞いてください。');
    });
  }

  // ==============================================================
  // 7. 各種学習イベントとのフック（教材の実装に合わせて呼び出す）
  // ==============================================================

  // 【画面遷移時】
  window.hookProgress = function(step, screenId, screenName) {
    if (window.TeacherBridge) {
      TeacherBridge.updateProgress({ step, screenId, screenName });
    }
  };

  // 【ヒント段階変更時】
  window.hookSupportLevel = function(level) {
    if (window.TeacherBridge) {
      TeacherBridge.updateSupportLevel(level);
    }
  };

  // 【先生に聞く 押下時】
  window.hookAskTeacher = function() {
    if (window.TeacherBridge) {
      TeacherBridge.requestHelp();
    }
  };

  // 【先生に聞く キャンセル時】
  window.hookCancelHelp = function() {
    if (window.TeacherBridge) {
      TeacherBridge.cancelHelp();
    }
  };

  // 【先生と見た後・解決時】
  window.hookResolveHelp = function() {
    if (window.TeacherBridge) {
      TeacherBridge.resolveHelp();
    }
  };

  // 【休む 押下時】
  window.hookPause = function() {
    if (window.TeacherBridge) {
      TeacherBridge.pause();
    }
  };

  // 【学習再開時】
  window.hookResume = function() {
    if (window.TeacherBridge) {
      TeacherBridge.resume();
    }
  };
})();

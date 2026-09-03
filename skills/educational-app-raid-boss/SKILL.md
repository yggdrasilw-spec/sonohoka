---
name: educational-app-raid-boss
description: 学習アプリ・算数教材Webアプリに「リアルタイム・レイドボスチャレンジ機能（Firebase Realtime Database連携）」を組み込むための設計ガイドライン、認証必須ルール、UIコンポーネント、およびダメージ・ストリーク連携パターン。
---

# Educational App Raid Boss Integration Guide

学習アプリ・算数教材向けの **レイドボスチャレンジ（Firebase Realtime Database連携）** の標準実装スキルです。
先生がコントロールパネル（ホスト画面）で作成したボス戦ルームに児童生徒が参加し、日々の計算・学習問題を正解することでリアルタイムにボスのHPを減らし、クラス全員で協力してボスを倒す体験を提供します。

---

## 1. 最重要コア原則（認証・接続）

### ⚠️ 匿名認証（`signInAnonymously`）の必須適用
Firebase Realtime Database（RTDB）のセキュリティルールは認証済みユーザー（`auth != null`）のみに制限されています。
児童生徒にログイン操作をさせずシームレスに参加させるため、**ページ起動時（または接続前）に必ず `firebase.auth().signInAnonymously()` を呼び出し、その完了を待ってから**データベースの参照やリスナー登録を行う必要があります。

```javascript
// 認証プロミスを保持し、接続処理で確実に待機する
const authPromise = firebase.auth().signInAnonymously().catch(err => {
  console.error("匿名認証エラー:", err);
  return null;
});

async function connectToRaid(code) {
  if (authPromise) {
    await authPromise;
  }
  // 認証完了後に db.ref(`rooms/${cleanCode}`) にアクセス
}
```

### 視覚的フィードバック（接続中・エラー・成功の明示）
接続ボタンを押した際、画面が無反応に見えることを防ぐため、3つの状態を即座に明示します：
1. **確認中 (🟡)**: ボタンを「確認中...」にし、ランプを黄色にし、トースト「🔍 ルーム確認中...」を表示。
2. **エラー (🔴)**: ルームが見つからない、または期限切れ（`data.expiresAt < now`）の場合、「⚠️ ルーム「〇〇」が見つからないか期限切れです」と明示。
3. **成功 (🟢)**: ランプを緑にし、トースト「✅ ボス「〇〇」に接続しました！」を表示し、👾 ボス名と現在HP/最大HPを即時表示。

### 入力文字列の正規化（全角→半角・大文字変換）
キーボード入力の誤操作（全角アルファベットや全角数字）を自動で半角英数大文字へ変換（`normalizeCode`）し、前後の空白を除去します。

---

## 2. UIコンポーネント構成

ヘッダー等の操作エリアに以下の要素を配置します：

1. **🔑 レイドコード入力欄 (`#studentRaidCode`)**: 4〜8文字程度。
2. **接続ボタン (`#connectBtn`)**: 状態に応じて「接続」/「確認中...」/「接続中」と表示。
3. **接続ステータスランプ (`#connStatus`)**: ⚪（未接続）/ 🟡（確認中）/ 🟢（接続中）/ 🔴（エラー）。
4. **👾 ボスミニステータス (`#bossMiniStatus`)**: 接続中のみ表示（`👾 ボス名 (現在HP/最大HP)`）。
5. **アバター選択ボタン＆ポップオーバー**: （⚔️, 🧙‍♂️, 🏹, 🥷, 🐱, 🐶, 🤖）。
6. **なまえ入力欄 (`#studentName`)**: デフォルト「たろう」など、`localStorage` で保存。
7. **🔥 れんぞくせいかいバッジ (`#streakBadge`)**: 連続正解時のみ表示。
8. **メッセージトースト (`#raidMsg`)**: 3〜4秒で消えるステータス案内。

---

## 3. ゲーム・バトル進行ロジック

### 正解時の処理
```javascript
if (correct) {
  state.streak++;
  updateStreakUI();

  // ダメージ計算（基本10ダメージ、連続正解でクリティカル倍率）
  let baseDamage = 10;
  let multiplier = 1;
  let isCritical = false;

  if (state.streak >= 5) {
    multiplier = 3; // 5連勝以上で3倍
    isCritical = true;
  } else if (state.streak >= 3) {
    multiplier = 2; // 3連勝以上で2倍
    isCritical = true;
  }
  const finalDamage = baseDamage * multiplier;

  // ボスへのダメージ送信（トランザクションによる安全なHP減算）
  const attackSent = sendAttack(finalDamage, `${modeName} (${state.streak}連勝 ${multiplier}倍)`);

  if (attackSent) {
    const critMsg = isCritical ? ` 🔥【${state.streak}れんぞく！ ${multiplier}倍クリティカル！】` : "";
    feedback.textContent = `💥 せいかい！ ボスに ${finalDamage} ダメージ！${critMsg}`;
  } else {
    // レイド未接続時（ローカル演習モード）
    const streakMsg = state.streak >= 3 ? ` 🔥【${state.streak}れんぞくせいかい！】` : "";
    feedback.textContent = `せいかい！ よくできました！${streakMsg}`;
  }
}
```

### 不正解時の処理
```javascript
state.streak = 0;
updateStreakUI();
feedback.textContent = "おしい！ もういちど かんがえてみよう";
```

### ボスHP減算と攻撃ログ送信
```javascript
function sendAttack(damage, detail) {
  if (!db || !studentRoomRef || !currentRaidCode) {
    return false; // 未接続（ローカル動作）
  }

  const name = (studentNameInput && studentNameInput.value.trim()) || "ななし";
  try { localStorage.setItem("raid_boss_student_name", name); } catch(e){}

  // ボスHPのトランザクション減算
  studentRoomRef.child("boss/currentHp").transaction(currentHp => {
    return (currentHp || 0) - damage;
  });

  // ログ送信
  studentRoomRef.child("logs").push({
    avatar: state.avatar,
    name: name,
    damage: damage,
    detail: detail,
    timestamp: Date.now()
  });

  return true;
}
```

---

## 4. 初期状態と未接続時の基本動作（最重要設計原則）
- **初期値は空欄で未接続スタート**:
  - レイドコード入力欄は初期状態で**空欄（未接続・ステータス⚪）**とします。前回のコードを `localStorage` から自動復元して勝手に接続してはなりません（意図せず接続されてしまうのを防ぐため）。
  - ただし、URLパラメータ `?code=XXXX` が明示的に指定されている場合は、初期入力＆自動接続してOKです。
- **未接続時は完全に「普通の問題集」として動作**:
  - レイドに接続していない場合、**ボスへのダメージ表記（「💥 せいかい！ ボスに XX ダメージ！」）やストリーク演出（🔥【Nれんぞく！ M倍クリティカル！】、ストリークバッジ）は一切出しません**。
  - 正解時のフィードバックは「せいかい！ よくできました！」のみとし、通常の問題集として何の違和感もなく使えるようにします。
  - コードを入力して「接続（🟢）」に成功した時のみ、ボス戦モード（ストリーク加算・ダメージ計算・ボス攻撃ログ送信）を有効化します。

詳細な実装コードテンプレートは [references/implementation-template.js](references/implementation-template.js) を参照。

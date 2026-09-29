# ブランド・アセット差し替え監査

この学校版では、元プロジェクトでMIT対象外とされた名称・ロゴ・マスコット造形をアプリ配布物から除外し、新規アセットへ置換しています。

確認項目：

- 旧マスコットJSファイル：配布物に存在しない
- 旧マスコット基準SVG：配布物に存在しない
- 旧アイコンパス：配布物に存在しない
- 新マスコット：`app/js/mascot.js` / `docs/mascot.svg`
- 新ロゴ：`app/kazunome-logo.svg`
- 新アイコン：`app/kazunome-icon.svg`
- 背景の旧キャラクターシルエット：きらめき形状へ置換
- 着せ替え：新マスコット座標系で再描画
- 画面表示・DOM ID・CSS・得点内部名：旧ブランド由来語を `spark / ひらめき` へ改名
- localStorageキー：`kazunome-lab:v1`
- 旧保護対象名称は法的に保持が必要な原ライセンス文 `LICENSE` のみに残す

`node --test tests/*.test.mjs` にブランド監査を含めています。手動では `tools/audit_branding.sh` でも確認できます。

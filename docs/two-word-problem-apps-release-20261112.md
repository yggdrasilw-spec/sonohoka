# 2026年11月12日 算数の文章題2教材の公開

提供されたDownloads内の2つのHTMLを変更せず、リポジトリ直下にコピー。

| 教材番号 | 教材 | ファイル | 対象の目安 |
| --- | --- | --- | --- |
| 109 | かけ算の文章題・立式マスター | kakezan_bunshodai.html | 2年 |
| 110 | ふえた分？ ぜんぶ？ | fueru_monndai.html | 2年 |

原本とコピーのSHA-256一致を確認。

- 109: `8e610c0bb7e87fbf896d03b74109f645f191f953f8461e23f1bddcdafaf13c3c`
- 110: `32edeafe788879bbb9fafe363c55e16adc03c8f499b2c6b3226c9d94944994fb`

ポートフォリオに2枚を追加し、件数表示を実際の107本に更新。各カードに9.5秒、1280×720、H.264/AACの無音紹介動画とPNGを設定。字幕は下部の専用帯に3本。109は文章→ヒント→立式→正答、110は1つ分→もとの量→1つ増える→増えた量→全体を紹介する。

再収録: `node scripts/capture-portfolio-109-110.cjs`。Playwright用FFmpegが作業ディレクトリにある場合は `PLAYWRIGHT_BROWSERS_PATH=C:/Users/user/sonohoka/.portfolio-work/playwright` を設定。書き出し: `python scripts/encode-portfolio-missing.py 109 110`。元録画・各場面の画像は `.portfolio-work/demo-109/` と `demo-110/`、採用区間・字幕・原本ハッシュは `scripts/portfolio-demos-109.json` と `110.json` に保存。

検証: `node scripts/qa-portfolio-109-110.cjs`。公開後は第1引数に `https://yggdrasilw-spec.github.io/sonohoka/` を指定。同じ内容で公開先のHTML・MP4・PNGのハッシュを照合する。

- 107枚のカードIDの一意性、検索・2年フィルター・リンク・画像読込。
- PC・390px・320pxでの動画モーダル再生、終盤へのシーク、閉じた後の解放。PCのホバー再生、Range/206。
- 109の最初の問題の正答・完了表示・リロード後の進捗保存。
- 110の3場面すべての12段階の描画と最後の式。
- 2教材のPC・390px・320pxの画面を保存。JavaScriptの未処理例外なし。
- 動画全編のデコード、H.264/AAC、字幕・場面境界・サムネイルを確認。

実機タッチ操作、全音声の聞き取り、児童による学習効果の検証は未実施。

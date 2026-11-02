# ぶんぽうラボ：ポートフォリオ106

公開アプリ： https://yggdrasilw-spec.github.io/english-stage/grammar/

9.5秒、1280×720、H.264 / yuv420p、AACの無音トラック。実ブラウザーの操作動画を切り出し、3本の字幕を下112pxの専用領域に表示します。教材の操作部に字幕を重ねません。

| 出力区間 | 実画面の操作 | 字幕 |
| --- | --- | --- |
| 0–3秒 | 現在進行形レッスンの「ふだん」から「今」へ切り替え | 図と例文で「ふだん」と「今」を比較 |
| 3–6秒 | 主語sheへのbe動詞を誤答し、正しい形と理由を確認 | 誤答の理由を、必要な規則から確認 |
| 6–9.5秒 | 当該誤答をAIプロンプトへ引き継ぎ、全文をコピー | 苦手を引き継ぎ、AIとの対話学習へ |

`scripts/record-grammar-demo.cjs <English Stageのチェックアウト>` で録画し、`scripts/encode-grammar-demo.py` で編集します。元WebM、採用秒位置の `clips.json`、字幕PNG、編集境界の確認画像は `.portfolio-work/grammar106/` に保存され、Git管理には含めません。公開するのは `media/portfolio-106-intro.mp4` と `media/portfolio-106-intro.png` です。

`node scripts/qa-portfolio-grammar.cjs` で検索・スマートフォン表示・動画再生・シーク・Range/206を検証します。公開後はポートフォリオのベースURLを引数に渡し、HTMLと動画・ポスターのハッシュも照合します。

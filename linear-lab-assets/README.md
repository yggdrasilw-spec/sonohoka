# 一次関数ラボ：場面の理解を支える画像

- `scenes.js`：ブロックの個数と長さ、水そうの経過時間と水量をSVGで描画。図の数値は課題・操作と連動します。
- `scenes.css`：場面の図と操作のレイアウト。
- `warming-water.webp`：水温の測定実験のイラスト。720 × 480、約17KB。数字や式は画像に埋め込まずHTMLに表示します。

対象は学習1（ブロック）、15・16の水温課題、17（水そう）。動点と面積の課題は既存の正確な図を使用します。
水そうは同じ形を描き、同じ尺度で水位を変えます。0〜3分を動かすと図とグラフが連動し、3分後には両方とも7Lになります。新しい課題を開くと0分に戻ります。

水温イラストは2026-10-07に組み込みのimage_genツールで生成し、WebPに縮小しました。生成時のプロンプト：

> Use case: scientific-educational. Asset type: compact illustration for a Japanese middle-school linear functions lesson. Primary request: water temperature experiment. Draw one transparent glass laboratory beaker half filled with blue water, on a simple gray electric laboratory hot plate, a slim thermometer immersed in the water attached to a small stand, and a simple analog stopwatch beside it. Style: polished flat educational illustration, navy outlines, soft blue and warm orange accents, white background, minimal clean textbook illustration, landscape 3:2, objects centered and comfortably padded. No people, no steam, no flames, no bubbles, no boiling. No text, no letters, no numbers, no marked graduations, no formulas, no graphs, no logos or watermark. Water is cool being gently warmed. Keep entire apparatus visible. The thermometer and clock represent measured temperature and elapsed time; exact labels will be added by the application.

検証：`node scripts/qa-linear-scenes.cjs`。19学習全課題の表示、図の数値、課題の切り替え、回答操作、画像読み込みと表示幅を確認します。PC・スマートフォン幅のスクリーンショットを `C:/Users/user/.cache/linear-scenes-qa/` に保存します。

## 図・表・計算・グラフの対応

`lesson-links.js`で、学習1・17と水温の課題の表を操作できるようにしました。選んだxの列をオレンジで囲み、具体的な代入計算とグラフの座標を示します。水温は青の測定値とオレンジの予測値を区別し、式を選ぶ課題では正解するまで予測式を表示しません。

## 追加の文章題20問

学習メニューの「生活の文章題｜20問」から開きます。料金・移動・量の変化・式と条件の4組で、それぞれ5問です。

- `word-problems.js`：問題文、単位、式のモデル、答え、ヒント、解説のデータ。
- `word-lab.js`、`word-lab.css`：問題選択、正誤判定、進捗保存、操作に連動する図・表・計算・グラフ。
- `word-problems.md`：先生用の問題・答え・解説一覧。`node scripts/export-linear-word-problems.cjs`でデータから再生成します。

本・ノートは個数に応じて描き、料金は基本と追加分を分けて示します。移動は同じ距離尺度で位置を比較します。整数の数量はグラフを点で表し、連続量は直線で表します。2点の記録から求める問題では、最初はその記録だけを表示し、手がかりを見るか正解すると式のモデルを表示します。

検証：`node scripts/qa-linear-word-lab.cjs`。独立して用意した20問の期待解、空欄・不正解・正解、分数入力、学習済みの保存、表からの操作、スライダーの連続操作、小画面での操作、測定と予測の区別、PCで下の操作ボタンが隠れないことを確認します。スクリーンショットは `C:/Users/user/.cache/linear-word-lab-qa/` に保存します。

## 文章題用に追加した3点の画像

`shopping-notebooks.webp`（文章題1・19）、`bicycle-rental.webp`（文章題2）、`catch-up.webp`（文章題9）を追加しました。組み込みのimage_genで生成し、720×480のWebPとして保存しています。3点合計約92KBです。生成プロンプトは `story-assets.md` に保存しています。

画像は場面を示し、隣のSVGで操作中の数量・位置を確認できます。追いつきの画像には「出発時のイメージ」と表示して、操作後の現在位置の図と区別します。検証スクリプトでは対象4問の画像の読み込みと、ほかの問題に画像が混入しないことも確認します。

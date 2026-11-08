# 自動レッスンの画像

単語と画像の対応を変えないため、17語とも既存の単語画像を優先しています。元のフォニックスに画像がある語はその画像、残りは英検5級の同じ単語IDに紐づく画像です。元のファイルのバイト列を維持し、出所とSHA-256を `image-manifest.json` に記録しています。ブラウザーが画像を取得できないときだけ、新しく生成した補助シートの該当セルをCSSで表示します。haveは補助シートでgiveへ代用せず、文字の意味を表示します。

- 既存画像：`existing/` と `../words/`。一覧は `image-manifest.json`。
- 生成した補助画像：`word-scenes-v1.png`（4×4、16場面）。切り出しや描き替えはせず、CSSの背景位置で表示。
- 生成方法：組み込み `image_gen`。2026-11-08の生成。API/CLIや追加の有料サービスは使用していません。
- 同じ語の絵を場面ごとに変更しません。文字の移動・色付け・音声に合わせた強調はHTML/CSSで実装し、画像に英単語や発音規則を描き込んでいません。

## 補助画像に使った生成指示（原文）

```text
Create a production illustration sprite sheet for a Japanese elementary English phonics app. Exactly 16 square equal tiles arranged in a precise 4 columns x 4 rows square grid, all tiles same very pale warm ivory background (#fffaf0), no gutters, no borders. Each tile is a separate clear, charming softly shaded storybook illustration with a large centered subject and generous internal breathing room (subject fits within central 75% of tile). Cohesive hand-painted gouache style, contemporary children's educational book, expressive but anatomically clear, teal/sage/honey/coral accents. No text, no letters, no numerals, no symbols or watermarks. Strict row-major subject order: ROW 1: (1) close-up of child-safe scissors clearly cutting a strip of colored paper, no hands; (2) an adorable fluffy little kitten sitting facing viewer, cute expression; (3) a recognizable mallard duck; (4) a single striped sock. ROW 2: (5) two hands catching one red ball, clearly caught in hands; (6) a small arched footbridge crossing a stream; (7) a blue rain cloud with falling raindrops; (8) sunny daytime landscape with sun high in blue sky over green hills. ROW 3: (9) crescent moon in a small dark blue night-sky vignette; (10) an open picture book with blank pages and no writing; (11) calm turquoise sea with horizon, waves and tiny sailboat; (12) friendly child's head and neck portrait, short hair, front facing. ROW 4: (13) snowy scene with snow-covered fir tree and snowflakes; (14) black-and-white dairy cow standing side view; (15) one hand offering a wrapped gift to another hand, clearly giving; (16) a large heap of many red apples in a wide basket to represent a large amount. The sprite sheet itself must be square; tile boundaries at exactly 25%,50%,75% both axes. Keep each scene wholly within its own tile with no overlap. These are learning illustrations, no embedded explanatory diagrams or wording.
```

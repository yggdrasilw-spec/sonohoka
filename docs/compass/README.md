# コンパス：100種類の模様

[模様を選んで描く](../../compass_pattern.html) / [3Dコンパス](../../compass_3d.html)

2026-11-02更新。初回版の「7構成×サイズ違い4題」は廃止し、円・円弧の構成が異なる100種類に置き換えた。元の4題を含む。半径・直径の練習15問は別枠。

## 収録内容

絵の一覧から選べる13分類：はじめの4題、輪の組み合わせ、輪の中のもよう、花びら・葉、丸い花、四分円、半円、星・くぼみ、ロゼット、なみ・アーチ、風車・うず、形を楽しむ、くり返し。

花・葉・ちょうの羽、レンズ、すなどけい、星型、なみ、うろこ、風車、まがたま、ハート、雲、ゆきだるま、めがね、さくらんぼ、かさ、円の格子などを収録。各模様の構成、参考URL、線の数は [pattern-catalog.json](pattern-catalog.json) を参照。

元の画像・プリントの紙面を転載せず、参考資料で見つけた円・円弧の組み合わせの考え方を、作図用の中心座標・半径・開始角・終了角として再構成した類問集。原問100問の複製や、画像100枚の収集品ではない。固有のキャラクター・ロゴは含めない。

## 画像検索と参考資料

「コンパス もよう 算数」「コンパス 模様 作図」「compass drawing circle arc geometric patterns worksheet」でも画像を探し、画像の掲載元を確認した。追加で56件のPDF・画像を調査用にローカル保存。取得情報は [image-sources.json](image-sources.json)、保存先は `tmp/compass-research/more/`。全PDFの先頭ページと、主要な参考画像を一覧で目視確認した。

| 参考元 | 参考にした構成 |
|---|---|
| [教材おきば：もようづくり](https://kyozai-okiba.com/3_201.html) | 半円・四分円・繰り返し・輪の組み合わせ |
| [教材おきば：コンパスを使って](https://kyozai-okiba.com/3_74.html) | 円弧の組み合わせ |
| [ぷりんときっず：円と球](https://print-kids.net/print/sansuu/en-to-kyuu/) | 花びら・輪と内側の模様 |
| [ぷりんと365：円の作図](https://www.print365.net/?p=4877) | 円の重なり・半円 |
| [学習プリント.com](https://xn--fdk3a7ctb5192box5b.com/es/3nen_mt_entokyu_en-compass-moyou.html) | 正方形の中の円弧・ずれた円・格子 |
| [どらニャンドリル](https://doranyan.sakura.ne.jp/doranyan%20hp/40%20zukei/ennomoyou1.html) | 花・ロゼット・風車・ハート・形づくり |
| [TOSSランド](https://land.toss-online.com/lesson/52IHDdaqMMPVt03AK2FD) | 四すみの円弧を重ねる作図 |
| [Alan D Adams: A Compass Exercise: Precision Revealed](https://www.drawingislamicgeometricdesigns.com/blog/a-compass-exercise-precision-revealed) | 同じ半径の七円・十三円・六角格子。CC BY 4.0。中心座標を作図用に再構成・拡張。 |

初回の関連PDF46件・80ページの取得履歴は [pdf-sources.json](pdf-sources.json)。PDF本体は `tmp/compass-research/` に保存し、公開リポジトリには含めていない。

## 重複を数えないための確認

[build-compass-patterns.py](../../scripts/build-compass-patterns.py) に構成を明示的に定義。105候補から重複2件を除き、103候補のうち分類を分散させて100種類を選定した。大きさだけを変えるループは使用しない。

同じ円上で重なる円弧を結合した後、平行移動・全体の拡大縮小・任意角の回転・鏡映・描画順を無視した円弧の座標表現を比較する。[distinctness-audit.json](distinctness-audit.json) に件数・分類・除外ペアを記録。

`python scripts/audit-compass-patterns.py` は100件の重複がないことと、全件を2.3倍・37度回転・鏡映した場合も同じ構成として判定することを検証する。全100種類を25件ずつ4枚に描画し、見た目の違い、円弧の接続、名前を確認した。目視用画像は `tmp/compass-100-review/`。

## 動作確認と表示

`node scripts/qa-compass.cjs` で100種類すべての作図手順と完成、15問の正誤判定、アニメーション中の切替、絵の一覧からの選択、分類・問題欄との同期、320/390/1280px表示を確認する。小さな目などの半径5mmでも、測定アニメーションの時間が正になり、半径まで連続的に開く。

図の1ますは図の上の1cm。表示の物理的な長さを測定には使わない。Three.js r128（MIT）を `js/vendor/three-r128.min.js` に同梱し、CDNが使えない環境でも起動する。ライセンスは `js/vendor/three-LICENSE.txt`。

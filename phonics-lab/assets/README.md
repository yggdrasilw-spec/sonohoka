# 画像の生成記録

## 2026年10月4日：息の向きの修正

全27図を見直し、m・nの鼻へ向かっていた矢印を、鼻の下から外へ向かう矢印に差し替えました。kの閉鎖状態にあった、口の前から奥へ進む矢印を除去しました。既存の簡略表現と舌・唇の位置を維持し、組み込み画像生成で編集しました。最終ファイルは `mouths/m.webp`、`mouths/n.webp`、`mouths/k.webp`。編集プロンプトの全文と元画像識別子は [airflow-correction-prompts.json](airflow-correction-prompts.json) に記録しています。

2026年10月3〜4日、OpenAI画像生成で本教材専用に作成。生成画像を格子ごとに切り出し、WebPに変換しました。既存作品・教科書図・キャラクター・ロゴは素材として使用していません。

## 最終版の生成指示

以下は最終版に使用したプロンプトの仕様記録です。

**単語の絵**：小学生向けのやさしい水彩風イラスト。白い背景。単語を表す対象が一目で分かる。等間隔の格子、各セルに独立した対象。文字、ラベル、ロゴ、商標、既存キャラクターなし。対象一覧は `../data.js` のwords。数詞はthree＝3個、six＝6個、nine＝9個、ten＝10個。this / thatは近いもの・遠いものを指す子ども。quietは静かにする動作。quizは問題のカード。

**口内図の基準**：非常に単純な平面の教育用模式図。白い背景、太く滑らかな紺の輪郭、ピンクの舌、小さな四角い歯、青い息の矢印。リアルな皮膚、肉、歯茎、臓器、喉の断面、陰影、写真表現を入れない。左向きの横から見た口。文字や番号は入れない。舌を貫通する息の矢印は禁止。

**承認された基準図**：m＝唇を閉じ、鼻へ息が出る。s＝舌の前を歯茎付近へ近づけ、細い隙間から口へ息が出る。k＝舌の奥が軟口蓋に接し、口への息は接触位置で止まる。

**展開した図**：n、p、t、f、l、英語r、sh、th、w、y、英語短母音5種、h、chの閉鎖、日本語の5母音、日本語r、kを開く状態。同じ紺・ピンク・青の簡略表現を維持。接触する音は接触、狭める音は隙間を示す。lには舌の側方から息が通る小さな補助図。

**nの修正**：唇を明確に開いて離す。舌先が上の前歯のすぐ後ろの歯茎に接し、口への通路をふさぐ。歯の間・唇には舌を出さない。息の矢印は鼻へだけ出す。

**fの修正**：上の前歯が持ち上がった下唇に軽く触れる。下の歯は後ろ。舌は低く休ませる。狭い歯と唇の隙間から口へ息が出る。鼻への矢印を入れない。

声の有無、複合音の順序、説明文はHTMLで付加しています。色や矢印は模式的で、医学的な解剖図として使用するものではありません。

## 元画像識別子

- 単語30枚：`exec-1d3a5720-35c1-4865-9260-c2b8610a6ebc`
- 追加単語30枚：`exec-986c36d2-13e4-4643-9ed0-7a21e101b65e`
- 追加単語23枚：`exec-b1a52c14-3ff5-44d9-ad22-6e02359c9ed1`
- 承認されたm/s/k：`exec-8da76ba3-d232-4623-becc-16120224ca7d`
- 簡略図グループ：`exec-98055251-564c-4b4c-94ab-74508bcc3eff`、`exec-4ac44add-8d09-4b0a-b2f6-76713fba5998`、`exec-e78696c1-7f0c-44c4-a49e-5ec1b684f630`、`exec-96b69eb9-42f0-4f1a-9de3-7e37654fff3c`
- n修正：`exec-a84c0471-3aaf-4386-8bce-a11d654d20f3`
- f修正：`exec-60ae3b7b-559a-4f06-94b7-88f343098ef8`

## 発音の参照

- [Cambridge IPA chart](https://www.cambridge.org/features/IPAchart/)
- [University of Groningen: Defining consonants](https://opentextbooks.rug.nl/americanenglishphonetics2/chapter/8-1-defining-consonants/)
- [JIPA: Japanese](https://www.cambridge.org/core/journals/journal-of-the-international-phonetic-association/article/japanese/EF0E01DD40A1B2779F3ADFF96B5D97E3)
- [文化庁：ローマ字のつづり方](https://www.bunka.go.jp/seisaku/kokugo_nihongo/kokugo_shisaku/pdf/94340701_01.pdf)

参照先の図をコピーしたものではありません。

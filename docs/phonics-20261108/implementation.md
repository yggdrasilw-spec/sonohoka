# 英語 おとラボ 拡張報告（2026-11-08）

## 利用入口と変更範囲

- 新入口：`phonics-lab/english.html#advanced`。旧入口 `phonics-lab/index.html` は維持。
- 英検5級 English Stage のホームに「英語 おとラボ」のバナーを追加。新入口から English Stage に戻れる。
- 日本語母音・ローマ字のタブ、説明、録音選択項目を新入口に表示しない。英語の文字名・30音・単語読み、既存の画像、音声プレーヤー、録音・バックアップを共有する。全面的な作り直しはしていない。
- 追加のサーバー、有料サービス、実行時TTS呼び出しはない。追加の音声は既存のGoogle Neural2-F MP3を同梱して再利用。

## 調査した既存構成

|対象|既存の構成と今回の扱い|
|---|---|
|データ|`data.js` に26文字・30音・対応する例語・口の図・日本語音。`reading-data.js` に24の基本読み語、moon・snake、watch・one。重複する語・録音キーを再利用。|
|出題|音と文字を選び、音の部品を聞き、絵・意味を開く探索方式。採点する正答履歴はなかった。今回は比較の後に短い選択問題を追加。|
|音声|`audio-data.js` の178標準音声。30単音は先生のWAV、文字名・単語等は既存MP3。`Audio` で再生し、先生の録音を優先。単語から単音を新しく切り出していない。|
|録音|IndexedDB `phonics-lab-voice` / `recordings` を共有。旧版の音声バックアップを読み込む互換性を維持。日本語録音も内部では保持し、新入口の選択肢からだけ除外。|
|保存|旧版は `phonics-lab-state`、`phonics-reading-sounds`、`phonics-lab-audio-review`。旧キーを消去・移行しない。英語の基本画面位置は `english-phonics-state`、新練習は `english-phonics-progress-v1`。音の選択は従来の読み教材と共有。|
|UI|既存の暖色背景、紺色の見出し、青緑の再生ボタン、タブ、録音ダイアログを再利用。新たに探検一覧・比較カード・誤答後の説明を追加。|

## 実装した学習範囲

規則説明と米語音素の照合は済んでいるが、17語の再利用MP3を今回すべて専門家が試聴したわけではない。音声のデコード成功を発音の保証とは扱わない。

|探検|区分|今回使う例語|扱う範囲・制限|
|---|---|---|---|
|silent e|A 条件|cut / cute、have / give|短母音と名前読みの比較。u_e /juː/ の比較を先行。a_e・i_e・o_e等の網羅的な新規問題は未追加。have・giveを無理に長母音にしない。|
|ck|A 条件|duck / sock|単音節、単一短母音の直後、語末 /k/ という条件。|
|tch|A 条件|catch / much|tchを1つの /tʃ/ として扱い、muchをその条件に反する綴りの例として覚える。|
|dge|A 条件|bridge|単音節、単一短母音の直後、語末 /dʒ/。badgeなどでの汎化確認は追加待ち。|
|ai / ay|B 同音異綴|rain / day|同じ /eɪ/ とよくある位置を比較。音だけから綴りを一意に選ばせない。|
|oo|C 同綴異音|moon / book|/uː/ と /ʊ/。長さだけでなく音の質も異なる。blood /ʌ/ は説明に留め、音声問題には出さない。|
|ea|C 同綴異音|sea / head|/iː/ と /ɛ/。break /eɪ/ は説明に留め、音声問題には出さない。|
|ow|C 同綴異音|snow / cow|米語 /oʊ/ と /aʊ/。語末でも一意に予測しない。|
|語ごとに覚える|D 個別記憶|have / give / much|手がかりと違う部分に注目。oughなどの新規音価は未追加。|

9探検・17語・15問。前提知識を各探検に明記し、基本の音へ戻れる。探検の順番を強制せず、基礎を習得済みとも判定しない。問題と選択肢の順番を変え、最初の回答と再回答を分けて直近200回答まで探検ごとに保存する。「ひと回り」は活動完了の表示であり、習得・発音の自動採点ではない。端末間同期、練習途中の同じ問題位置からの再開、複数タブの履歴統合は今回の対象外。

## 発音・音声の検証状況

- 米語音素は、公式 [CMU Pronouncing Dictionary](https://github.com/cmusphinx/cmudict) の単語単位の音素列と照合し、ARPABET→IPA変換結果が今回の17語のIPAと一致することをビルド時に確認。取得した辞書全体のSHA-256と使用単語の音素列は `research/pronunciation-evidence.json` に記録。辞書自体にも誤りの可能性があるため、音声の最終試聴を別工程にした。
- `advanced-data.json` の各単語に米・英IPA、語中の対象音、音声出所・声・ファイルSHA-256、辞書確認用リンクを保持。英国IPAは参考表記で、今回の自動照合対象は米語音素のみ。headの /ɛ/ と /e/ の表記差を説明。sock・snowの米英差も隠さない。
- 単語単体の強形を提示する。会話内の弱形や各地域の別発音を誤答判定する機能は作っていない。児童の声を「唯一の発音」に照合して採点しない。
- Cambridgeの辞書ページは取得時に403/520になったため、辞書音声・本文は転載していない。確認先へのリンクを設け、米語音素の照合はCMUを使用した。
- 再利用した音声の元データに未試聴の記録があるため、`audioStatus: listening-review-required` を維持。学習カードは確認待ちの試聴であることを表示する。
- C分類の「音で分ける」は、対象探検の使用音声を大人が最後まで試聴して辞書と照合し、その端末で確認した場合だけ利用できる。問題音声を最後まで聞くまでは回答できない。文字で考える問題は先に利用可能。
- 確認は音声ファイルのハッシュ、録音の更新日時・サイズ・形式に結び付ける。録音差し替えや標準ファイル更新時には再確認が必要。標準と録音が異なるとき、別の方の再生を確認根拠として扱わない。自動的に専門家確認済みにはしない。
- 先生の録音は従来どおり優先し、標準との比較、削除して標準へ戻す操作も維持。

## 126項目の扱いとデータ構造

添付ZIPは調査初稿として読み、教材化の命令として実行しなかった。`research/original-rules.json` と `original-report.md` に元データを保存。126件の全IDを `research/coverage.json` に保存し、原行は全て `research-only` として隔離した。

今回の独自教材と一部対応する原行は15件、対応する新規教材がない原行は111件。ただし原行と探検は1対1ではなく、15件も原行全体の承認を意味しない。たとえばoo・eaの3音価のうち、今回音声比較するのはそれぞれ2音価のみ。

- `advanced-data.json` / `advanced-data.js`：公開する限定教材。`lessons` と `words` と `sources` を分離。例外はlessonの `exception`、前提は `prerequisites`、問題は `questions`、実際の音素・音声はwordに保持。
- `advanced.js`：データからA条件、B同音異綴、C同綴異音、D個別記憶の説明・問題・確認ゲート・履歴を表示する。綴りからの全自動発音判定は行わない。
- `scripts/build-phonics-extension.py`：独自に編集した許可リストだけを教材データにする。調査126件から自動で問題を作らない。音声・辞書ファイルの取得はビルドに含めない。
- `scripts/qa-phonics-extension.cjs`：重複ID、解答範囲、選択肢重複、例語参照、資料照合状態、音声ハッシュ、発音証拠、JS/JSONの一致を検証。不正なデータを意図的に与えて拒否も確認。

新しい項目は規則の出典、条件・例外、単語の辞書照合、音声出所と試聴を揃えてから許可リストへ追加する。初稿の `kind` や `verification_status` だけで公開可否を判断しない。

## 教育資料の参照

- [Reading Rockets — Phonics: In Practice](https://www.readingrockets.org/reading-101/reading-101-learning-modules/course-modules/phonics/practice)：短母音と子音からの導入、ck、tch/dge、VCe、owの多音価、前提技能の確認。
- [Logic of English — Spelling Rules](https://logicofenglish.com/pages/spelling-rules)：ayの位置、語末eの複数の役割、ck/tch/dgeの条件。原資料の「always」等を無条件の児童向け絶対規則に転用していない。
- [UFLI Scope & Sequence](https://ufli.education.ufl.edu/wp-content/uploads/2022/06/UFLI-Scope2.pdf)：初稿の学習順序の参照先。教材スライド、読解文、問題、ロゴ、音声はコピーしていない。
- 説明と問題は今回独自に作成。CMUの音素データには同梱 `CMUDICT-LICENSE.txt` を適用。

## 動作確認

- 新拡張：データ検査と不正データ拒否、全17語の音声デコード、9探検の全問題の誤答→ヒント→再回答→完了、初回答の区別、再読み込みでの履歴保持、旧キー保持、確認前の音声問題停止、確認後の解放、録音差し替えで確認解除、日英タブの分離をChromeで確認。
- レイアウト：320px、768px、1280px。スクリーンショットを確認し、横はみ出しなし。
- 既存回帰：先生30音のWAVハッシュ、全30音の再生先、読み教材の単音、旧切り出し録音より先生録音を優先、カスタム録音優先、削除して標準に戻す、確認一覧を検証して合格。
- 英検5級側：107テスト合格、文法13テスト合格。語彙・3,908MP3・75リスニング問題、リリースのキャッシュバージョン、文法の配布一致の検査も合格。
- 実機のChromebook・iPad・スマートフォン、マイク許可を伴う実録音、発音専門家による全件試聴、児童による自力学習は未検証。Chromeの幅変更は実機確認の代わりではない。

ローカル確認はリポジトリ直下を `python -m http.server 8967 --bind 127.0.0.1` で配信し、`node scripts/qa-phonics-extension.cjs` を実行。別ポートは `PHONICS_ORIGIN` を指定。既存回帰は `scripts/qa-phonics-teacher-audio.cjs`（標準ポート8967）。今回の制限環境では利用できる8968へURLだけ読み替えて実行した。

再生成には元ZIPを展開したフォルダー（`phonics_rules_ja.json`、`phonics_research_report_ja.md`、公式CMUの `cmudict.dict` と `LICENSE`）と英検5級配布ファイルが必要：

```text
python scripts/build-phonics-extension.py --research-dir <展開・辞書フォルダー> --english-dir <english-stageのdist>
```

## 次の優先順位

1. 今回の17語の専門家試聴・必要なら先生録音。cape・blood・break・badge等を辞書・音声の組で照合し、cap/cape、oo /ʌ/、ea /eɪ/、dgeの別例へ広げる。
2. a_e・i_e・o_e・u_eの音価差の比較を補い、ee/ea、oi/oy、oa/ow、ouの多音価。発音候補を一意に決める架空の規則は作らない。
3. rを含む母音と米英差、音節、語末 -s/-es・-ed。条件と文法を分け、独立した例語音声を確認する。
4. 接辞・黙字・chの別音、頻出不規則語とough。頻度と児童の既知語を基準に少数ずつ追加する。

## 公開結果

- 新アプリ：[英語 おとラボ](https://yggdrasilw-spec.github.io/sonohoka/phonics-lab/english.html#advanced)。教材実装コミット `3b7b6917c57ab21de37fddf8401ecda93cbfc825`、[Pages公開ジョブ](https://github.com/yggdrasilw-spec/sonohoka/actions/runs/42489084724) 成功。
- [英検5級 English Stage](https://yggdrasilw-spec.github.io/english-stage/) のホームに入口を追加。コミット `9e4c577460767717ee27c2c46cf07e0f2f6e50fc`、[検証・公開ジョブ](https://github.com/yggdrasilw-spec/english-stage/actions/runs/42489029681) 成功。
- `scripts/qa-phonics-public.cjs` で公開ホーム→新アプリ→ホームの往復、9探検、17語のMP3デコード、文字問題のフィードバック、未確認音声の問題停止、先生録音mの再生を確認。ページのJavaScriptエラーなし。
- 元の英検5級作業フォルダーにも、公開前との一致を確認した3ファイル（ホームバナー、CSS、キャッシュ付き入口）の変更だけを同期。既存の他の未コミット変更は維持した。

# フォニックス拡張アプリ：日本・英語圏の資料に基づく調査報告

調査日：2026-11-08｜対象：日本語母語の初学者、小学校高学年～英検5級入り口｜収録：**126学習項目**

## 結論

- **順序の軸は UFLI の128概念のScope & Sequence。** ただし128件は音だけでなく復習・接辞も含むので、独立した規則の個数とみなさない。
- **読み規則／綴りの選択規則／語ごとに覚える母音の多音価／例外的高頻度語**の4層に分ける。
- **米国英語 en-USに音声を統一。** aw、ar、or、new、water等は地域差がある。
- **短母音・子音の基本→ck/tch/dge・silent e→母音チーム→複数音価→r・音節→接辞→低頻度**の順で開放する。
- **規則を1つの正答と断言しない。** 見慣れた語では出現頻度と辞書で正解を固定、規則から生成した架空語は必要な場合だけ。

## 情報源（海外）

- **UFLI Foundations Scope & Sequence**：https://ufli.education.ufl.edu/wp-content/uploads/2022/06/UFLI-Scope2.pdf
- **Reading Rockets Phonics in Practice**：https://www.readingrockets.org/reading-101/reading-101-learning-modules/course-modules/phonics/practice
- **Oxford Owl Letters and Sounds**：https://home.oxfordowl.co.uk/reading/what-is-letters-and-sounds/
- **Logic of English Spelling Rules**：https://logicofenglish.com/pages/spelling-rules
- **Understood 15 phonics rules**：https://www.understood.org/en/articles/phonics-rules-for-reading-and-spelling
- **Jolly Phonics**：https://jollylearning.com/en-us/our-programs/jolly-phonics

英国の公的枠組み： https://www.gov.uk/government/publications/the-reading-framework-teaching-the-foundations-of-literacy
英国旧Letters and Sounds公式資料： https://www.gov.uk/government/publications/letters-and-sounds

## 情報源（日本）

- **文部科学省 小学校学習指導要領解説**：https://www.mext.go.jp/component/a_menu/education/micro_detail/__icsFiles/afieldfile/2019/03/18/1387017_011.pdf
- **mpi 英語の基礎基本フォニックス**：https://www.mpi-j.co.jp/store/phonics/
- **東京海洋大学 日本語話者のための英語発音講座**：https://www2.kaiyodai.ac.jp/~takagi/pweb/fhonics.htm
- **英検5級の試験内容**：https://www.eiken.or.jp/eiken/exam/grade_5/solutions.html
- Jolly Phonics日本語版の42音概要：https://www.jollyss.com/ja/jolly-phonics
- CMLフォニックス・ルール一覧PDF：https://www.cm-language.co.jp/wp-content/uploads/2021/07/CML_PhonicsRules1.pdf
- TANZAMルール一覧：https://tanzam.net/column/phonics-guide/
- 明日香出版社100ルール構成：https://www.asuka-g.co.jp/book/foreign-language/012705.html

## 調査から重要な整理

### ① 再現性の高い「綴りの選択規則」と、読めるが綴りを一意に選べない規則は別
`back`のck、`catch`のtch、`badge`のdgeは**単音節・単一短母音の直後**という適用条件が重要。音声を聞いて適切な綴りを選ぶ課題と相性がよい。
一方 `rain`のaiと`day`のayは同じ発音を異なる位置で書く傾向。単純な音声→文字の1対1問題には向かず、単語とスペリングを組で提示する。

### ② 同じつづりで違う音（特に母音）は「複数候補→単語で確定」
`oo`: moon /uː/, book /ʊ/, blood /ʌ/。`ea`: sea /iː/, head /ɛ/, break /eɪ/。`ow`: grow /oʊ/, cow /aʊ/。
「母音2つが歩いたら最初が話す」などの単純な総則を必須正解にはしない。

### ③ 語末eには複数の役割
`cap→cape`では前の母音を名前読みにし、`have/give`では長母音にならず、`cage/face`ではc/gの音の選択にも関係する。全ての語末eをmagic e扱いしない。

### ④ 音節・形態素まで扱うと拡張性が高い
6種の音節（closed / open / VCe / vowel team / r-controlled / consonant-le）を分け、後から -ed の3音、-s/-es、子音重複、eの脱落、y→i、-tion等を組み込む。

## アプリの学習ステージ案

|段階|内容|ゲームの基本形|
|---|---|---|
|1|基本子音ダイグラフ、ck/tch/dge、floss、silent e|文字が変身する、適切な綴りを選ぶ|
|2|ai/ay, ee/ea, oa/ow, oo, oi/oy, ou/ow 等|同音のつづりカード分類、異音の聞き分け|
|3|rのついた母音、6音節型、-ed/-s、接尾辞|単語を音節に分解、語形変換|
|4|黙字、chの別音、ough、頻出不規則語|例外カードを仕分け、定着確認|

## 推奨データモデル

JSON各項目：`id`, `tier`, `category`, `grapheme`, `target_ipa`, `examples`, `rule_ja`, `kind`, `exception_words`, `contrast_words`, `learning_mode`, `locale`, `source_ids`, `verification_status`。
**注意**：例語は調査・設計用の候補で、全件の辞書IPA・英検級・音声ファイルまで個別照合した「完成済み問題集」ではない。運用前に単語単位で辞書・ネイティブ音声を検証する。

## 具体的な演習UI

1. **変身型**：`cap`を読み、`e`を付けて`cape`の変化を聞く。文字と音の変化を色付きで可視化。
2. **綴り選択型**：/k/の語末に`k`/`ck`/`ke`のいずれを当てるか、短母音の条件を説明できる。
3. **同じ?違う?型**：`moon`/`book`を聞いて、`oo`が同じ音か違う音か判定する。
4. **語族型**：`head, bread, ready`／`sea, tea, eat`など同一綴りの同音単語を分類する。
5. **ハートワード型**：`said`の`ai`など不規則箇所だけ印をつけ、残りはデコードする。
6. **音節型**：`ti-ger`, `pic-nic`の分解で開音節・閉音節の比較。音節境界は辞書辞書に基づく。

## 音声・配信・著作権の技術上の注意

- **原音は単語単位のen-US録音・辞書照合**。ブラウザ音声の既定言語依存や、単独文字の自動読み上げに頼らない。
- Google Cloud Text-to-SpeechはSSMLの`<phoneme alphabet="ipa" ph="...">`で音素列と強勢を指定できる。ただし音声・言語ごとの対応と合成品質を検証する。公式：https://docs.cloud.google.com/text-to-speech/docs/ssml?hl=ja
- 語彙頻度・英検5級との適合度は独立フィールドにする。英検協会の公式試験説明は中学初級程度と定義するが、**「全語の公式指定語彙一覧」を意味しない**。
- UFLIの教材コンテンツ・デコーダブル文章・スライドなどの再配布には利用制限がある。本データは規則を独自に要約したもので、教材の文章や画像を転載していない。教材本文をそのままGitHub公開することは避ける。公式：https://ufli.education.ufl.edu/copyright/
- 公開時は「UFLIの学習順序を参考に、独自教材として作成したもの」程度の事実ベースの表記とし、UFLI公式・認定・提携と誤認される表示をしない。

## 全学習項目（データJSONと同じ構成）

### 段階1：最優先（33項目）

|ID|パターン|音・機能|例|区分|
|---|---|---|---|---|
|PH001|`sh`|/ʃ/|ship / fish / shop|reliable|
|PH002|`ch`|/tʃ/|chip / chin / lunch|reliable|
|PH003|`th (voiceless)`|/θ/|thin / three / bath|ambiguous|
|PH004|`th (voiced)`|/ð/|this / that / mother|ambiguous|
|PH005|`ph`|/f/|phone / photo / dolphin|reliable|
|PH006|`wh`|/w/|when / what / wheel|variant|
|PH007|`ng`|/ŋ/|sing / ring / song|reliable|
|PH008|`nk`|/ŋk/|pink / bank / sink|reliable|
|PH009|`qu`|/kw/|queen / quick / quiz|common|
|PH010|`ck`|/k/|back / duck / sick|spelling|
|PH011|`tch`|/tʃ/|catch / fetch / pitch|spelling|
|PH012|`dge`|/dʒ/|badge / bridge / fudge|spelling|
|PH013|`ff`|/f/|off / puff / stuff|spelling|
|PH014|`ll`|/l/|bell / hill / doll|spelling|
|PH015|`ss`|/s/|miss / kiss / mess|spelling|
|PH016|`zz`|/z/|buzz / fuzz / jazz|spelling|
|PH017|`k (after consonant or vowel team)`|/k/|milk / ask / soak|spelling|
|PH018|`ke (long vowel)`|/k/|cake / bike / like|common|
|PH019|`bl/cl/fl/gl/pl/sl`|multiple|blue / clap / flag|reliable|
|PH020|`br/cr/dr/fr/gr/tr`|multiple|brown / crab / drum|reliable|
|PH021|`sp/st/sk/sm/sn/sw`|multiple|spin / stop / skip|reliable|
|PH022|`-st/-nd/-mp/-ft`|multiple|best / hand / jump|reliable|
|PH023|`c before e/i/y`|/s/|cent / city / cycle|common|
|PH024|`c before a/o/u`|/k/|cat / cot / cup|reliable|
|PH025|`g before e/i/y (soft)`|/dʒ/|gem / giant / gym|ambiguous|
|PH026|`g before e/i/y (hard)`|/g/|get / give / girl|lexical|
|PH027|`a_e`|/eɪ/|cap → cape / tap → tape / mad → made|common|
|PH028|`i_e`|/aɪ/|kit → kite / pin → pine / rid → ride|common|
|PH029|`o_e`|/oʊ/|hop → hope / not → note / rob → robe|common|
|PH030|`u_e /juː/`|/juː/|cub → cube / cut → cute / tube|common|
|PH031|`u_e /uː/`|/uː/|rule / June / flute|common|
|PH032|`e_e`|/iː/|these / theme / Eve|common|
|PH033|`non-VCE final e`|varies|have / give / love|lexical|

### 段階2：主要拡張（33項目）

|ID|パターン|音・機能|例|区分|
|---|---|---|---|---|
|PH034|`ai`|/eɪ/|rain / train / mail|common|
|PH035|`ay`|/eɪ/|day / play / stay|common|
|PH036|`ee`|/iː/|see / tree / green|common|
|PH037|`ea /iː/`|/iː/|sea / eat / tea|ambiguous|
|PH038|`ea /ɛ/`|/ɛ/|head / bread / ready|ambiguous|
|PH039|`ea /eɪ/`|/eɪ/|break / great / steak|lexical|
|PH040|`ey /iː/`|/iː/|key / monkey / donkey|ambiguous|
|PH041|`ey /eɪ/`|/eɪ/|they / grey / prey|ambiguous|
|PH042|`oa`|/oʊ/|boat / road / coat|common|
|PH043|`ow /oʊ/`|/oʊ/|snow / slow / grow|ambiguous|
|PH044|`oe`|/oʊ/|toe / hoe / foe|common|
|PH045|`ie /aɪ/`|/aɪ/|pie / tie / lie|ambiguous|
|PH046|`ie /iː/`|/iː/|chief / field / piece|ambiguous|
|PH047|`igh`|/aɪ/|night / light / high|common|
|PH048|`y (one-syllable ending)`|/aɪ/|my / fly / cry|common|
|PH049|`y (unstressed word ending)`|/i/|happy / baby / funny|common|
|PH050|`oo /uː/`|/uː/|moon / food / soon|ambiguous|
|PH051|`oo /ʊ/`|/ʊ/|book / look / good|ambiguous|
|PH052|`oo /ʌ/`|/ʌ/|blood / flood|lexical|
|PH053|`ew /uː/`|/uː/|chew / grew / flew|ambiguous|
|PH054|`ew /juː/`|/juː/|few / mew / pew|variant|
|PH055|`ue /uː/`|/uː/|blue / true / glue|common|
|PH056|`ui`|/uː/|fruit / suit / juice|common|
|PH057|`oi`|/ɔɪ/|coin / boil / point|common|
|PH058|`oy`|/ɔɪ/|boy / toy / enjoy|common|
|PH059|`ou /aʊ/`|/aʊ/|out / cloud / sound|ambiguous|
|PH060|`ow /aʊ/`|/aʊ/|cow / now / how|ambiguous|
|PH061|`au`|/ɔ/|autumn / August / launch|common|
|PH062|`aw`|/ɔ/|saw / draw / paw|common|
|PH063|`augh`|/ɔ/|caught / daughter / taught|common|
|PH064|`ou /ʌ/`|/ʌ/|young / touch / double|ambiguous|
|PH065|`ou /uː/`|/uː/|soup / group / youth|lexical|
|PH066|`ou /ʊ/`|/ʊ/|could / would / should|lexical|

### 段階3：多音節・語形成（37項目）

|ID|パターン|音・機能|例|区分|
|---|---|---|---|---|
|PH067|`ar`|/ɑr/|car / star / farm|common|
|PH068|`or / ore`|/ɔr/|for / corn / short|common|
|PH069|`er`|/ɝ/|her / fern / term|common|
|PH070|`ir`|/ɝ/|bird / girl / shirt|common|
|PH071|`ur`|/ɝ/|turn / burn / fur|common|
|PH072|`wor`|/wɝ/|word / work / world|common|
|PH073|`air`|/ɛr/|air / hair / fair|common|
|PH074|`are`|/ɛr/|care / share / square|common|
|PH075|`ear /ɛr/`|/ɛr/|bear / pear / wear|ambiguous|
|PH076|`ear /ɪr/`|/ɪr/|hear / near / dear|ambiguous|
|PH077|`ear /ɝ/`|/ɝ/|learn / earth / heard|ambiguous|
|PH078|`ire`|/aɪr/|fire / tire / hire|common|
|PH079|`closed syllable`|short vowel|cat / hot / picnic|common|
|PH080|`open syllable`|long vowel|he / go / me|common|
|PH081|`consonant-le`|/əl/|table / little / candle|common|
|PH082|`schwa (unstressed vowels)`|/ə/|about / banana / sofa|common|
|PH083|`-ild`|/aɪld/|child / wild / mild|common|
|PH084|`-ind`|/aɪnd/|find / kind / mind|common|
|PH085|`-old`|/oʊld/|cold / gold / old|common|
|PH086|`-olt`|/oʊlt/|bolt / colt / jolt|common|
|PH087|`-ost`|/oʊst/|most / post / host|common|
|PH088|`-s /s/`|/s/|cats / books / cups|morphology|
|PH089|`-s /z/`|/z/|dogs / pens / plays|morphology|
|PH090|`-es /ɪz/`|/ɪz/|boxes / wishes / buses|morphology|
|PH091|`-ed /t/`|/t/|worked / jumped / washed|morphology|
|PH092|`-ed /d/`|/d/|played / cleaned / called|morphology|
|PH093|`-ed /ɪd/`|/ɪd/|wanted / needed / started|morphology|
|PH094|`drop final e`|spelling|make → making / hope → hoping / ride → riding|spelling|
|PH095|`double final consonant`|spelling|hop → hopping / run → running / big → bigger|spelling|
|PH096|`y → i before suffix`|spelling|happy → happier / baby → babies / cry → cried|spelling|
|PH097|`-tion`|/ʃən/|action / station / nation|common|
|PH098|`-sion /ʒən/`|/ʒən/|vision / decision / television|ambiguous|
|PH099|`-sion /ʃən/`|/ʃən/|mission / tension / extension|ambiguous|
|PH100|`-ture`|/tʃɚ/|picture / nature / future|common|
|PH101|`un-`|/ʌn/|unhappy / unkind / unfair|morphology|
|PH102|`re-`|/ri/|redo / reread / rewrite|morphology|
|PH103|`-ful / -less`|varies|helpful / careful / hopeless|morphology|

### 段階4：上級・頻度低（23項目）

|ID|パターン|音・機能|例|区分|
|---|---|---|---|---|
|PH104|`kn initial`|/n/|know / knee / knife|common|
|PH105|`wr initial`|/r/|write / wrong / wrist|common|
|PH106|`gn initial`|/n/|gnome / gnat / gnaw|common|
|PH107|`mb final`|/m/|lamb / comb / thumb|common|
|PH108|`silent t`|varies|listen / castle / whistle|lexical|
|PH109|`gh silent`|silent|night / light / high|common|
|PH110|`gh /f/`|/f/|laugh / enough / tough|lexical|
|PH111|`ch /k/`|/k/|school / chorus / chemist|lexical|
|PH112|`ch /ʃ/`|/ʃ/|chef / machine / brochure|lexical|
|PH113|`ei /eɪ/`|/eɪ/|vein / reindeer / eight|common|
|PH114|`eigh`|/eɪ/|eight / weight / neighbor|common|
|PH115|`aigh`|/eɪ/|straight|lexical|
|PH116|`eu /juː/`|/juː/|feud / neuter|lexical|
|PH117|`ough /oʊ/`|/oʊ/|though / dough|lexical|
|PH118|`ough /uː/`|/uː/|through|lexical|
|PH119|`ough /ʌf/`|/ʌf/|tough / rough / enough|lexical|
|PH120|`ough /ɔ/`|/ɔ/|thought / bought / fought|lexical|
|PH121|`ough /aʊ/`|/aʊ/|bough / plough (UK)|lexical|
|PH122|`ough /ɔf/`|/ɔf/|cough / trough|lexical|
|PH123|`-alk`|/ɔk~ɑk/|walk / talk / chalk|common|
|PH124|`o /ʌ/`|/ʌ/|come / love / son|lexical|
|PH125|`a after w`|/ɑ~ɔ/|want / wash / watch|common|
|PH126|`irregular high-frequency`|varies|said / one / two|lexical|

## 次の開発タスク

1. 既存のアプリに実装済みの単音・結合音を本データと照合し、未実装の項目だけ抽出する。
2. レベル1・2から開始する。各規則に例題3〜6語、比較語2〜3語、例外1〜3語を原則用意（例外がある場合）。
3. 各単語の音声、米国発音、音節分割、品詞・意味、学習レベル、ターゲット部分の文字インデックスを確認。
4. 出題時は学習済みのつづりのみでデコードできる単語を優先。未習文字が混ざる場合は説明・色分け。
5. 誤答は「規則を知らない」「つづりが多音価」「単語を知らない」「音の聞き分けが弱い」を分けて記録する。

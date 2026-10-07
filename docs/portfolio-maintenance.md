# 学習アプリ作品集の更新

入口は `app_links_portfolio.html`、表示は `css/portfolio.css`、検索・動画操作は `js/portfolio.js`。
各カードは短い紹介文・使い方・対象を一覧で見せ、元の詳しい説明とタグを `details` に保持している。

## 教材を追加・変更する

- `id="app-N"` と `data-register-order="N"` は重複しない教材番号にする。
- `data-grades` は学習の目安をカンマで区切る。`data-main-grade` は主な対象学年。
- `data-category` は教科。`data-audience` は `student`（児童の学習）、`teacher`（先生用）、`common`（学年共通・生活支援）、`experiment`（技術・観察教材）。
- `data-topics` は学習内容を明示する。本文の単語だけでは分類しない。キーと表示名は `js/portfolio.js` の `topics` を参照。
- `data-usage` は `understand / practice / game / create / teacher / experiment` のいずれか。
- `card-intro` は、似た教材との違いが分かる短い紹介文にする。詳細説明とリンクは既存の情報を保持する。
- `data-video` は `media/` 内の実在するMP4名。既定のサムネイルは同名PNG。別の画像には `data-poster` を指定する。動画がないカードには `data-video` を付けない。

検索は空白区切りのAND検索。全角・半角、かな表記、同義語を正規化する。教科・学年・使い方・使う人はAND、複数の学習内容はOR。学年別件数は現在の条件から再計算する。先生用と学年共通の教材は各学年からも見つかる。

## 2026年10月4日の動画追加

既存52本に、24本のH.264/AAC紹介動画とPNGサムネイルを追加した。新規動画は10秒以内、3つの短い日本語字幕つき。画面640pxと字幕専用80pxを分け、字幕が操作対象を覆わないようにしている。

元のブラウザ録画は `.portfolio-work/demo-N/source.webm`。採用区間・字幕・参照URLは `scripts/portfolio-demos-added.json` に保存している。録画素材と検証画像はローカルに保持し、Gitの対象から除外した。

先生用の問題管理・レジ・レイド・潜水艦とカレンダーの動画は、入力や設定の準備を紹介する。公開サービスでの配信・販売・ゲーム開始は行っていない。カレンダーのサンプル予定に参照先の画像がないため、月表示から先生用の行事入力へ進む流れを採用した。さんすうステップは専用ローカルプロファイルで実際の学習画面を収録した。提供形態は引き続きPC用ローカル版で、リンクは紹介・起動案内につながる。

## 確認とプレビュー

`node scripts/qa-portfolio.cjs --videos` で検索・分類・件数・条件解除・URL復元・並び順・タグ操作・ダイアログのフォーカス・動きの軽減・幅320/390px・全76件の動画情報と新規動画の再生を確認する。

`node scripts/preview-portfolio.cjs` で `http://127.0.0.1:8954/app_links_portfolio.html` を開く。

再収録は `node scripts/capture-portfolio-missing.cjs N`、書き出しは `python scripts/encode-portfolio-missing.py N`。ローカルの各アプリのチェックアウト、Playwright、Chrome、Pillow、FFmpegが必要。さんすうステップは録画専用サーバー（8952番）を起動しておく。実行環境のパスはスクリプトに明示している。

## 2026年10月6日の教材追加

教材番号80「おはなしの しき（文章題ラボ）」と81「おはなしを 図にしよう（テープ図）」を追加し、掲載数を81本に更新した。紹介文、対象学年、検索用タグ、起動リンクと実画面のPNGを用意した。字幕付き10秒以内の紹介動画とPNGサムネイルも追加した。動画なしのカードは77〜79の3本。採用区間は `scripts/portfolio-demos-80-81.json`、ローカル録画は `.portfolio-work/demo-80` と `demo-81` に保存。再収録は `node scripts/capture-portfolio-80-81.cjs`、書き出しは `python scripts/encode-portfolio-missing.py 80 81`。土堂教材ライブラリは非公開開発版のため一覧に追加しない。

`node scripts/qa-portfolio.cjs` で81本の件数・分類・検索・並び順・画像・スマートフォン表示を確認する。

教材80の入口を「文章題・図化統合版」に更新。独立リポジトリの配布用コピーを `node scripts/sync-math-apps.cjs` で80・81のリンク先へ同期する。元のリポジトリとコミットは各 `_SOURCE.json` に記録。統合版は加減12問・乗除4問から図化教材を開ける。配布用コピーを直接改修せず、独立リポジトリを更新してから同期する。

## 2026年10月7日の教材追加

教材番号82「一次関数ラボ」を試作版として追加。対象は中学2年、教科は数学。19テーマ・53課題、表・式・グラフの対応、自由な実演、発展のバッテリー問題を紹介する。リンク先は `ichiji_kansu_lab_v11.html`。実画面のPNGを掲載し、動画は付けていない。掲載数82本、動画78本、静止画4本。対象学年のキー `j2` は中学2年、並び順の主学年 `8` は小学校6年より後に扱う。

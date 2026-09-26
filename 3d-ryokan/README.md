# くらべるラボ（正式な開発・公開先）

開発と公開は、この `sonohoka/3d-ryokan` に一本化しています。
旧 `yggdrasilw-spec/3d-ryokan` は作業・プッシュ先に使わないでください。

公開URL: https://yggdrasilw-spec.github.io/sonohoka/3d-ryokan/

## ローカル実行
このフォルダーで `python scripts/serve.py --no-browser` を実行し、表示されたURLを開きます。旧版の `/app/` は付けません。

## 検証
`node --test scripts/catalog.test.mjs scripts/units.test.mjs scripts/character.test.mjs scripts/fields.test.mjs scripts/navigation.test.mjs`

## モデル・モーションの再生成
`scripts/build-walk.mjs`、`scripts/build-interactions.mjs` は `scripts/assets` のBVHから軌道を生成します。人物生成はBlenderとMPFBおよび元の素材集が別途必要です。`scripts/build-character.py` の `TOOLS` は親ディレクトリの `.tools` を参照するので、生成環境に合わせて配置してください。素材・ライセンス情報は `models/README.md`、`models/animals/README.md`、`docs/` を参照。

2026-09-26：旧リポジトリの生成スクリプト・テスト・元データ・資料を移行。旧Git履歴は移行前にbundleでバックアップ済み。

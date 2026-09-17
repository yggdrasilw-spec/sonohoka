# 人物モデルの出典

- 生成物：`child-makehuman.glb`（約4.3 MB、テクスチャを同梱）
- 人体・骨格：MakeHuman Community / MPFB 2.0.17、`game_engine` リグ（53骨）
- MPFBソース：https://github.com/makehumancommunity/mpfb2
- 使用コミット：`437dd513888a92399d1d3200d2e80859fae55abc`
- 生成環境：Blender 4.5.7 LTS、`scripts/build-character.py`
- 衣服：`male_casualsuit06`、髪：`short01`、眉：`eyebrow001`、目：`low-poly`
- 追加素材の配布元：https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html
- 素材集：https://files.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip
- 素材の著作権者表記：MakeHuman Team、Data Collection AB、Joel Palmius、Jonas Hauquier（各素材ヘッダー参照）
- 素材ライセンス：CC0 1.0。商用利用・改変・Web同梱・再配布可能。全文は `CC0-1.0.txt`。
- ライセンスの説明：https://static.makehumancommunity.org/about/license.html
- 確認日：2026-09-12

MPFB本体のプログラムはGPLで、生成した人物の素材とは別です。MPFB本体をWebアプリへ同梱していません。

頭頂の高さを1.30mへ調整しています（髪を含む外形はわずかに高くなります）。児童風の体型設定であり、年齢別・地域別の標準身体寸法を再現したものではありません。従来の手モデルに用いた手長150.2mm等の資料値へ一致させたモデルではありません。

`child-rig.json` は生成時の骨の位置です。Blender座標で +Z が上、-Y が正面。GLB読み込み後のアプリでは +Y が上、+Z が正面、-X が本人の右です。

## お風呂用の水着
- `child-swim.glb`：同じ体型・骨格の水着版。お風呂モードで切り替え、通常モードでは元の服装を表示する。
- 水着：Mindfront (Sweden)「M_Swimming_trunks_02」（mindfront_male_swimming_trunks_02）、CC BY 4.0。人物体型へのフィット、骨格へのバインド、テクスチャの1024px縮小、GLBへの変換を実施。元のデザイン・色を使用。
- 再生成：Blenderで `scripts/build-character.py -- --swim` を実行。
- 確認画像：`docs/swim-preview.png`。 `scripts/preview-swim.py` はGLBを読み込んでレンダリングする。

- 原作者・作品ページ：https://www.makehumancommunity.org/node/340
- 配布元：https://static.makehumancommunity.org/assets/assetpacks/pants03.html
- ライセンス：https://creativecommons.org/licenses/by/4.0/
- 原素材のヘッダー：author Mindfront (Sweden)、license CC BY 4.0。
- 再生成用素材：配布元の pants03_ccby.zip を ../.tools/pants03 に展開。
- 水着はCC0ではなくCC BY 4.0。上記の作者・作品・変更内容・ライセンス表記を保持すること。
- 座位の確認画像：docs/swim-seated-preview.png。node scripts/export-swim-pose.mjs の後に Blender で scripts/preview-swim.py -- --seated を実行し、アプリと同じ骨格変形を描画。

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

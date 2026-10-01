"""Encode apps 68-70 into demo videos and poster images."""
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parent.parent
encoder = root / "scripts" / "encode-frame-storyboard.py"

tasks = [
    {
        "num": 68,
        "frames": root / ".record_68-1nen_kazu_gainen",
        "output": root / "media" / "yggdrasilw_spec_github_io_sonohoka_1nen_first_kazu_gainen_html-intro.mp4",
        "poster": root / "media" / "yggdrasilw_spec_github_io_sonohoka_1nen_first_kazu_gainen_html-intro.png",
        "title": "68 かずのがいねん 1ねんせい",
        "captions": [
            "数え方・比べ方・合成と分解を1画面で総合学習",
            "タイルを選んで多彩なアクティビティを自由に切替",
            "数をドットやブロックで表して合成・分解を体感",
            "線つなぎで大小・対応・合成の関係を視覚確認",
            "正解すると「つぎへ」ボタンが登場、達成感で自走",
        ]
    },
    {
        "num": 69,
        "frames": root / ".record_69-3nen_kakezan_hissan",
        "output": root / "media" / "yggdrasilw_spec_github_io_sonohoka_3nen_kakezan_hissan_html-intro.mp4",
        "poster": root / "media" / "yggdrasilw_spec_github_io_sonohoka_3nen_kakezan_hissan_html-intro.png",
        "title": "69 かけ算の筆算⑴ 3年生",
        "captions": [
            "2桁×1桁の筆算を図・式・筆算・練習の4フェーズで学ぶ",
            "色付きコインで「何十」「何百」のかたまりを視覚化",
            "位取りごとに計算してくり上がりの仕組みを確認",
            "筆算の手順をアニメーションで追いながら理解する",
            "練習問題で手を動かして筆算の流れを定着させる",
        ]
    },
    {
        "num": 70,
        "frames": root / ".record_70-5nen_setsuzoku_kaekae",
        "output": root / "media" / "yggdrasilw_spec_github_io_sonohoka_5nen_setsuzoku_kaekae_html-intro.mp4",
        "poster": root / "media" / "yggdrasilw_spec_github_io_sonohoka_5nen_setsuzoku_kaekae_html-intro.png",
        "title": "70 つなぎ言葉であそぼう 5年生",
        "captions": [
            "順接・逆接・並列の3種類のつなぎ言葉を30問で練習",
            "前後の文の関係を読んでつなぎ言葉の種類を選ぶ",
            "選択肢ごとに「なぜそうなるか」の解説で理解を深める",
            "プログレスバーで正答率を確認しながら達成感UP",
            "接続助詞と接続詞を場面で使い分ける力を育てる",
        ]
    }
]

for t in tasks:
    if t["output"].exists() and t["poster"].exists():
        print(f"Skipping App {t['num']} (already exists)")
        continue
    print(f"Encoding App {t['num']}...")
    cmd = [
        "python",
        str(encoder),
        "--frames", str(t["frames"]),
        "--output", str(t["output"]),
        "--poster", str(t["poster"]),
        "--title", t["title"],
        "--captions", *t["captions"]
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Error encoding app {t['num']}:\n{res.stderr}")
        raise SystemExit(res.returncode)
    print(f"  -> Generated {t['output'].name} and {t['poster'].name}")

print("\nAll 3 demo videos and posters (apps 68-70) successfully generated!")

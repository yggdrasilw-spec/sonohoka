"""Encode dopaclone (かずの芽ラボ) frames into a captioned demo video and poster."""
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parent.parent
encoder = root / "scripts" / "encode-frame-storyboard.py"

task = {
    "num": 67,
    "frames": root / ".record_dopaclone",
    "output": root / "media" / "yggdrasilw_spec_github_io_sonohoka_dopaclone_app_index_html-intro.mp4",
    "poster": root / "media" / "yggdrasilw_spec_github_io_sonohoka_dopaclone_app_index_html-intro.png",
    "title": "67 かずの芽ラボ — 学校・横長版 算数ドリル",
    "captions": [
        "1〜6年の算数58スキルをブラウザだけで学ぶ学習ドリル",
        "学年を選んで自分のレベルに合った問題からスタート",
        "おすすめ順にスキルを提示・誤答を保存して復習まで",
        "3カラムレイアウトでキャラクター・問題・入力を配置",
        "スキルツリーで学習の全体像と進捗を一覧できる",
    ]
}

t = task
if t["output"].exists() and t["poster"].exists():
    print(f"Skipping (already exists)")
else:
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
        print(f"Error:\n{res.stderr}")
        raise SystemExit(res.returncode)
    print(f"  -> Generated {t['output'].name}")
    print(f"  -> Generated {t['poster'].name}")

print("\nDone!")

"""Encode apps 61-65 into captioned demo videos and poster images."""
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parent.parent
encoder = root / "scripts" / "encode-frame-storyboard.py"

tasks = [
    {
        "num": 61,
        "frames": root / ".record_61-kakezan",
        "output": root / "media" / "yggdrasilw_spec_github_io_sonohoka_kakezan_textbook_interactive_html-intro.mp4",
        "poster": root / "media" / "yggdrasilw_spec_github_io_sonohoka_kakezan_textbook_interactive_html-intro.png",
        "title": "61 かけ算① 見て・ためして・くらべて・気づこう",
        "captions": [
            "教科書に沿って自走しながらかけ算の意味に気づく",
            "「1つ分の数」と「いくつ分」を動かして確かめる",
            "アレイ図とドットの並びで式の意味を視覚化",
            "場面に合った式を選ぶインタラクティブ問題",
            "音声読み上げとステップ解説で自学自習を支援",
        ]
    },
    {
        "num": 62,
        "frames": root / ".record_62-ookii_kazu",
        "output": root / "media" / "yggdrasilw_spec_github_io_sonohoka_ookii_kazu_lab_html-intro.mp4",
        "poster": root / "media" / "yggdrasilw_spec_github_io_sonohoka_ookii_kazu_lab_html-intro.png",
        "title": "62 大きい数ラボ 〜教科書92〜105ページ〜",
        "captions": [
            "教科書92〜105ページを段階的に探究する算数ラボ",
            "位取り表で大きな数の位と読み方を直感理解",
            "1000のまとまりを数えて大きな数を構成",
            "数直線の目盛りを拡大して位置を確かめる",
            "10倍・100倍・1/10で位が動く仕組みを体感",
        ]
    },
    {
        "num": 63,
        "frames": root / ".record_63-seisuu_yasashiku",
        "output": root / "media" / "yggdrasilw_spec_github_io_sonohoka_seisuu_no_seishitsu_yasashiku_html-intro.mp4",
        "poster": root / "media" / "yggdrasilw_spec_github_io_sonohoka_seisuu_no_seishitsu_yasashiku_html-intro.png",
        "title": "63 整数のせいしつ やさしく教える版",
        "captions": [
            "スモールステップで整数のきまりをやさしく学ぶ",
            "ドットを2つずつペアにして偶数・奇数を判定",
            "数直線のジャンプで倍数の規則性を発見",
            "タイルを並べてぴったり割れる約数を見つける",
            "「先生に聞く」ボタンで困ったときも即座に支援",
        ]
    },
    {
        "num": 64,
        "frames": root / ".record_64-teacher_dashboard",
        "output": root / "media" / "yggdrasilw_spec_github_io_sonohoka_teacher_dashboard_html-intro.mp4",
        "poster": root / "media" / "yggdrasilw_spec_github_io_sonohoka_teacher_dashboard_html-intro.png",
        "title": "64 先生用リアルタイム支援ダッシュボード",
        "captions": [
            "先生専用コードで授業中の進捗をリアルタイム把握",
            "ワンタップで授業開始・残り時間タイマーが連動",
            "児童全員の学習ステップと解答状況を一覧表示",
            "「先生を呼んでいます」要請を最優先で通知",
            "つまずきを即座に支援・授業後は自動データ消去",
        ]
    },
    {
        "num": 65,
        "frames": root / ".record_65-beaver_gape",
        "output": root / "media" / "yggdrasilw_spec_github_io_sonohoka_beaver_gape_html-intro.mp4",
        "poster": root / "media" / "yggdrasilw_spec_github_io_sonohoka_beaver_gape_html-intro.png",
        "title": "65 ビーバーの顎 — 樹幹かじりの大開口バイオメカニクス",
        "captions": [
            "標本写真に基づくビーバー頭蓋の2D運動モデル",
            "スライダー操作で樹幹をかじる大開口を再現",
            "顎関節の前後滑走と咬筋の力の向きを視覚化",
            "樹幹かじりと奥歯でのすりつぶし運動を切替",
            "実際の標本写真と重ね合わせて骨格構造を検証",
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

print("\nAll 5 demo videos and posters successfully generated!")

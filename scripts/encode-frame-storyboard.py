"""Encode captured browser frames into a captioned, silent-friendly demo MP4."""
from __future__ import annotations

import argparse
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1280, 720, 10
FONT_PATHS = [Path(r"C:\Windows\Fonts\meiryo.ttc"), Path(r"C:\Windows\Fonts\YuGothM.ttc")]
FONT_PATH = next((p for p in FONT_PATHS if p.exists()), None)
FFMPEG = Path(r"C:\Users\user\AppData\Roaming\Python\Python314\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe")


def fit(src: Image.Image) -> Image.Image:
    src = src.convert("RGB")
    scale = max(W / src.width, H / src.height)
    src = src.resize((round(src.width * scale), round(src.height * scale)), Image.Resampling.LANCZOS)
    x, y = (src.width - W) // 2, (src.height - H) // 2
    return src.crop((x, y, x + W, y + H))


def captioned(src: Image.Image, title: str, caption: str, zoom: float) -> bytes:
    base = fit(src)
    if zoom > 1:
        z = base.resize((round(W * zoom), round(H * zoom)), Image.Resampling.LANCZOS)
        base = z.crop(((z.width - W) // 2, (z.height - H) // 2, (z.width + W) // 2, (z.height + H) // 2))
    draw = ImageDraw.Draw(base, "RGBA")
    draw.rectangle((0, H - 108, W, H), fill=(8, 20, 34, 198))
    font = ImageFont.truetype(str(FONT_PATH), 30) if FONT_PATH else ImageFont.load_default()
    small = ImageFont.truetype(str(FONT_PATH), 18) if FONT_PATH else ImageFont.load_default()
    draw.text((42, H - 90), caption, font=font, fill="white", stroke_width=1, stroke_fill=(0, 0, 0, 180))
    draw.text((42, H - 42), title, font=small, fill=(180, 222, 255))
    return base.tobytes()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--frames", type=Path, required=True)
    ap.add_argument("--output", type=Path, required=True)
    ap.add_argument("--poster", type=Path, required=True)
    ap.add_argument("--title", required=True)
    ap.add_argument("--captions", nargs="+", required=True)
    args = ap.parse_args()
    files = sorted(args.frames.glob("frame-*.png"))
    if len(files) != len(args.captions):
        raise SystemExit(f"frame/caption count mismatch: {len(files)} != {len(args.captions)}")
    durations = [1.0, 2.0, 2.5, 2.5, 1.5]
    frames: list[bytes] = []
    poster_img = None
    for i, (file, cap) in enumerate(zip(files, args.captions)):
        img = Image.open(file)
        if poster_img is None and i >= 2:
            poster_img = Image.frombytes("RGB", (W, H), captioned(img, args.title, cap, 1.02))
        frame = captioned(img, args.title, cap, 1.0 + min(i, 4) * 0.008)
        frames.extend([frame] * round(durations[i] * FPS))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.poster.parent.mkdir(parents=True, exist_ok=True)
    (poster_img or Image.frombytes("RGB", (W, H), frames[-1])).save(args.poster, "PNG", optimize=True)
    cmd = [str(FFMPEG), "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100", "-t", "9.5",
           "-c:v", "libx264", "-preset", "fast", "-crf", "23", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k",
           "-shortest", "-movflags", "+faststart", str(args.output)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    assert proc.stdin is not None
    for frame in frames:
        proc.stdin.write(frame)
    proc.stdin.close()
    err = proc.stderr.read().decode(errors="replace") if proc.stderr else ""
    if proc.wait() != 0:
        raise SystemExit(err[-2000:])


if __name__ == "__main__":
    main()

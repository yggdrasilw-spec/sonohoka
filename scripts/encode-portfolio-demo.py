"""Encode five captured browser states into a short captioned portfolio demo."""
from __future__ import annotations

import argparse
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1280, 720, 10
FFMPEG = Path(r"C:\Users\user\AppData\Roaming\Python\Python314\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe")
FONT = next((p for p in (Path(r"C:\Windows\Fonts\meiryo.ttc"), Path(r"C:\Windows\Fonts\YuGothM.ttc")) if p.exists()), None)
DURATIONS = [1.0, 1.6, 1.8, 2.0, 3.1]


def fit(image: Image.Image) -> Image.Image:
    image = image.convert("RGB")
    scale = max(W / image.width, H / image.height)
    image = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    x, y = (image.width - W) // 2, (image.height - H) // 2
    return image.crop((x, y, x + W, y + H))


def frame(image: Image.Image, title: str, caption: str, zoom: float) -> Image.Image:
    base = fit(image)
    if zoom > 1:
        enlarged = base.resize((round(W * zoom), round(H * zoom)), Image.Resampling.LANCZOS)
        base = enlarged.crop(((enlarged.width - W) // 2, (enlarged.height - H) // 2,
                              (enlarged.width + W) // 2, (enlarged.height + H) // 2))
    draw = ImageDraw.Draw(base, "RGBA")
    draw.rectangle((0, H - 112, W, H), fill=(8, 20, 34, 210))
    font = ImageFont.truetype(str(FONT), 30) if FONT else ImageFont.load_default()
    small = ImageFont.truetype(str(FONT), 18) if FONT else ImageFont.load_default()
    draw.text((42, H - 92), caption, font=font, fill="white", stroke_width=1, stroke_fill=(0, 0, 0, 180))
    draw.text((42, H - 44), title, font=small, fill=(180, 222, 255))
    return base


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--frames", type=Path, required=True)
    ap.add_argument("--output", type=Path, required=True)
    ap.add_argument("--poster", type=Path, required=True)
    ap.add_argument("--title", required=True)
    ap.add_argument("--captions", nargs=5, required=True)
    args = ap.parse_args()
    files = [args.frames / f"frame-{i:02d}.png" for i in range(5)]
    if not all(p.exists() for p in files):
        raise SystemExit(f"missing capture: {[str(p) for p in files if not p.exists()]}")
    rendered = [frame(Image.open(p), args.title, caption, 1.0 + i * 0.006)
                for i, (p, caption) in enumerate(zip(files, args.captions))]
    raw = b"".join(image.tobytes() * round(duration * FPS) for image, duration in zip(rendered, DURATIONS))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.poster.parent.mkdir(parents=True, exist_ok=True)
    rendered[2].save(args.poster, "PNG", optimize=True)
    ffmpeg = [str(FFMPEG), "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
              "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100", "-t", "9.5",
              "-c:v", "libx264", "-preset", "fast", "-crf", "23", "-pix_fmt", "yuv420p",
              "-c:a", "aac", "-b:a", "96k", "-shortest", "-movflags", "+faststart", str(args.output)]
    proc = subprocess.run(ffmpeg, input=raw, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    if proc.returncode:
        raise SystemExit(proc.stderr.decode(errors="replace")[-3000:])
    print(f"encoded {args.output}")


if __name__ == "__main__":
    main()

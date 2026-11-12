"""Match footage to the actual captured UI, rather than wall-clock timestamps."""
import json
import subprocess
from pathlib import Path
import imageio_ffmpeg
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parent.parent
directory = root / '.portfolio-work/demo-112'
data = json.loads((directory / 'storyboard.json').read_text(encoding='utf-8'))
raw = subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error',
    '-i', str(directory / 'source.webm'), '-vf', 'fps=20,scale=320:160',
    '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'])
frames = np.frombuffer(raw, dtype=np.uint8).reshape(-1, 160, 320, 3).astype(float)
starts = []
evidence = []
for i in range(5):
    target = np.asarray(Image.open(directory / f'frame-0{i}.png').convert('RGB')
                        .resize((320, 160), Image.Resampling.LANCZOS)).astype(float)
    # Text, outlines, and selected state; exclude irrelevant empty margins.
    diff = np.mean((frames[:, 15:125, 50:270] - target[15:125, 50:270]) ** 2, axis=(1, 2, 3))
    best = float(diff.min())
    matches = np.flatnonzero(diff < best + 1.5)
    if not len(matches):
        raise ValueError(f'Scene {i} not found')
    start = max(0, float(matches[0]) / 20 - .7) if i == 1 else float(matches[0]) / 20 + .1
    # Use a stable 1.7-second portion; all scenes were held for over two seconds.
    starts.append(start)
    evidence.append({'scene': i, 'start': start, 'mse': best,
                     'lastMatch': float(matches[-1]) / 20})
assert all(b > a + 1.7 for a, b in zip(starts, starts[1:])), evidence
data['segments'] = starts
data['sourceDurations'] = [1.7] * 5
data['alignment'] = {'method': '20fps footage matched to captured UI screenshots', 'scenes': evidence}
for file in [directory / 'storyboard.json', root / 'scripts/portfolio-demos-112.json']:
    file.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(evidence))

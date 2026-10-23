"""Align real recording to the transient samurai cut-in screenshot.

Browser startup can offset the wall-clock estimate of the video origin.
Use the unique frame captured 300ms into the cut as a visual timing anchor.
"""
import json, subprocess
from pathlib import Path
import imageio_ffmpeg
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parent.parent
directory = root / '.portfolio-work/demo-93'
file = directory / 'storyboard.json'
data = json.loads(file.read_text(encoding='utf-8'))
if 'alignment' not in data:
    raw = subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(), '-loglevel', 'error',
        '-i', str(directory / 'source.webm'), '-vf', 'fps=20,scale=128:80',
        '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'])
    frames = np.frombuffer(raw, dtype=np.uint8).reshape(-1, 80, 128, 3).astype(float)
    target = np.array(Image.open(directory / 'frame-02.png').convert('RGB').resize((128, 80))).astype(float)
    match = int(np.argmin(np.mean((frames - target) ** 2, axis=(1, 2, 3)))) / 20
    shift = match - .3 - data['segments'][2]
    data['segments'] = [max(0, value + shift) for value in data['segments']]
    data['alignment'] = {'anchor': 'frame-02.png', 'sourceTime': match, 'shift': shift}
    file.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (root / 'scripts/portfolio-demos-93.json').write_text(file.read_text(encoding='utf-8'), encoding='utf-8')
print('Aligned:', data['alignment'])

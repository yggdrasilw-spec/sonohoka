"""Align the recorded cuts to visible scene changes, excluding preparation."""
import json
import subprocess
from pathlib import Path
import imageio_ffmpeg
import numpy as np

root = Path(__file__).resolve().parent.parent
directory = root / '.portfolio-work/demo-96'
file = directory / 'storyboard.json'
data = json.loads(file.read_text(encoding='utf-8'))
if 'alignment' not in data:
    raw = subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(), '-loglevel', 'error',
        '-i', str(directory / 'source.webm'), '-vf', 'fps=20,scale=128:72',
        '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'])
    frames = np.frombuffer(raw, dtype=np.uint8).reshape(-1, 72, 128, 3)
    # Sample each navigation button away from the text and rounded corners.
    pixels = frames[:, 9, [13, 31, 49, 67, 85, 103], :].astype(float)
    distances = np.mean((pixels - np.array([32, 60, 75])) ** 2, axis=2)
    stages = np.argmin(distances, axis=1)
    def first(stage):
        indices = np.flatnonzero((stages == stage) & (distances[:, stage] < 200))
        if not len(indices):
            raise ValueError(f'Scene {stage} missing from recording')
        return float(indices[0]) / 20
    soil, water, formula = first(1), first(2), first(4)
    shift = soil - data['segments'][1]
    data['segments'] = [max(0, value + shift) for value in data['segments']]
    data['sourceDurations'][0] = soil - .05 - data['segments'][0]
    data['sourceDurations'][1] = data['segments'][2] - soil
    data['sourceDurations'][2] = water - .1 - data['segments'][2]
    data['sourceDurations'][3] = formula - .1 - data['segments'][3]
    data['alignment'] = {'method': 'recorded navigation scene changes at 20 fps',
                         'shift': shift, 'soil': soil, 'water': water, 'formula': formula}
    assert min(data['sourceDurations']) > 0
    file.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (root / 'scripts/portfolio-demos-96.json').write_text(file.read_text(encoding='utf-8'), encoding='utf-8')
print(data['alignment'])

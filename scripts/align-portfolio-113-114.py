"""Match screenshots to source footage to correct the recorder's timestamp offset."""
import json, subprocess, statistics
from pathlib import Path
import imageio_ffmpeg, numpy as np
from PIL import Image
for ident in (113, 114):
    directory = Path(f'.portfolio-work/demo-{ident}')
    data = json.loads((directory / 'storyboard.json').read_text(encoding='utf-8'))
    raw = subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(), '-loglevel', 'error', '-i', str(directory / 'source.webm'), '-vf', 'fps=20,scale=256:128', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'])
    frames = np.frombuffer(raw, dtype=np.uint8).reshape(-1, 128, 256, 3).astype(float)
    offsets = []
    for index, estimate in enumerate(data['segments']):
        target = np.array(Image.open(directory / f'frame-0{index}.png').convert('RGB').resize((256,128))).astype(float)
        distances = np.mean((frames-target)**2, axis=(1,2,3))
        low, high = max(0, int((estimate-1.8)*20)), min(len(frames), int((estimate+.5)*20))
        match = (low + int(np.argmin(distances[low:high]))) / 20
        offsets.append(match-estimate)
    offset = round(statistics.median(offsets), 3)
    data['segments'] = [round(max(0, value+offset), 3) for value in data['segments']]
    data['alignment'] = {'method': '20fps screenshot comparison; median recorder offset applied to preserve gesture timing', 'offsetSeconds': offset}
    for file in (directory / 'storyboard.json', Path(f'scripts/portfolio-demos-{ident}.json')):
        file.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(ident, offset)

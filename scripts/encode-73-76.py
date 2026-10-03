"""Encode recorded app interactions, captions and portfolio posters."""
import json
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FFMPEG = Path(r'C:\Users\user\AppData\Roaming\Python\Python314\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe')
FONT = r'C:\Windows\Fonts\meiryo.ttc'

for directory in sorted((ROOT / '.record_73-76').iterdir()):
    info_path = directory / 'storyboard.json'
    if not info_path.exists():
        continue
    info = json.loads(info_path.read_text(encoding='utf8'))
    overlays = []
    for i, caption in enumerate(info['captions']):
        overlay = Image.new('RGBA', (1280, 88), (8, 20, 34, 245))
        draw = ImageDraw.Draw(overlay)
        draw.text((35, 7), caption, font=ImageFont.truetype(FONT, 28), fill='white')
        draw.text((35, 49), info['title'], font=ImageFont.truetype(FONT, 18), fill=(180, 222, 255))
        overlay_path = directory / f'caption-{i}.png'
        overlay.save(overlay_path)
        overlays.append(overlay_path)
    output = ROOT / 'media' / (info['slug'] + '-intro.mp4')
    poster = output.with_suffix('.png')
    source_start = info.get('sourceStart', 0.7)
    cmd = [str(FFMPEG), '-y', '-ss', str(source_start), '-i', str(directory / 'source.webm')]
    for overlay_path in overlays:
        cmd += ['-loop', '1', '-i', str(overlay_path)]
    cmd += ['-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
            '-filter_complex', "[0:v]scale=1124:632,pad=1280:720:78:0:color=0x081422[v];[v][1:v]overlay=0:632:enable='lt(t,2)'[a];[a][2:v]overlay=0:632:enable='between(t,2,6)'[b];[b][3:v]overlay=0:632:enable='gte(t,6)'[out]",
            '-map', '[out]', '-map', '4:a', '-t', '9.5', '-r', '30', '-c:v', 'libx264', '-preset', 'fast',
            '-crf', '23', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', str(output)]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    base = Image.new('RGB', (1280, 720), '#081422')
    image = Image.open(directory / 'frame-02.png').convert('RGB').resize((1124, 632), Image.Resampling.LANCZOS)
    base.paste(image, (78, 0))
    base.paste(Image.open(overlays[1]), (0, 632))
    base.save(poster, optimize=True)
    info['export'] = {'file': str(output.relative_to(ROOT)), 'poster': str(poster.relative_to(ROOT)), 'source_interval': [source_start, source_start+9.5], 'duration': 9.5}
    info_path.write_text(json.dumps(info, ensure_ascii=False, indent=2), encoding='utf8')
    print(f'encoded {output.name}', flush=True)

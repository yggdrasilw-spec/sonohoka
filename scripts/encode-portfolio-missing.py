"""Trim real browser footage into 9.5-second captioned H.264/AAC demos.

The 640px recording stays unobscured; captions occupy a separate 80px band.
Source intervals and captions are saved alongside each recording.
"""
import json, subprocess, concurrent.futures
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / '.portfolio-work'
FFMPEG = Path(r'C:\Users\user\AppData\Roaming\Python\Python314\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe')
FONT = r'C:\Windows\Fonts\meiryo.ttc'

def band(title, caption):
    image = Image.new('RGB', (1280, 80), '#152a43')
    draw = ImageDraw.Draw(image)
    size = 28
    while draw.textlength(caption, font=ImageFont.truetype(FONT, size)) > 1200:
        size -= 1
    draw.text((32, 5), caption, font=ImageFont.truetype(FONT, size), fill='white')
    size = 18
    while draw.textlength(title, font=ImageFont.truetype(FONT, size)) > 1200:
        size -= 1
    draw.text((32, 47), title, font=ImageFont.truetype(FONT, size), fill='#badaff')
    return image

def run(args):
    result = subprocess.run([str(FFMPEG), '-y', '-hide_banner', '-loglevel', 'error', *args], capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr.decode(errors='replace')[-2000:])

def encode(file):
    data = json.loads(file.read_text(encoding='utf-8'))
    directory = file.parent
    for index, (start, duration) in enumerate(zip(data['segments'], data['durations'])):
        caption = data['captions'][0 if index == 0 else 1 if index < 3 else 2]
        lower = directory / f'caption-{index}.png'
        band(data['title'], caption).save(lower)
        clip = directory / f'clip-{index}.mp4'
        run(['-ss', str(start), '-i', str(directory / 'source.webm'), '-loop', '1', '-i', str(lower),
             '-filter_complex', '[0:v]fps=20,pad=1280:720:0:0:color=0x152a43,tpad=stop_mode=clone:stop_duration=1[base];[base][1:v]overlay=0:640,format=yuv420p[v]',
             '-map', '[v]', '-an', '-t', str(duration), '-c:v', 'libx264', '-preset', 'fast', '-crf', '24', '-threads', '2', str(clip)])
    manifest = directory / 'concat.txt'
    manifest.write_text('\n'.join(f"file 'clip-{i}.mp4'" for i in range(5)), encoding='utf-8')
    output = ROOT / 'media' / f"portfolio-{data['id']}-intro.mp4"
    run(['-f', 'concat', '-safe', '0', '-i', str(manifest), '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
         '-t', '9.5', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '64k', '-shortest', '-movflags', '+faststart', str(output)])
    poster = Image.new('RGB', (1280, 720))
    poster_index = 0 if data['id'] == 47 else 4 if data['id'] in {20, 23, 27, 41, 42, 72} else 2
    poster.paste(Image.open(directory / f'frame-0{poster_index}.png'), (0, 0))
    poster.paste(band(data['title'], data['captions'][0 if poster_index == 0 else 2 if poster_index == 4 else 1]), (0, 640))
    poster.save(output.with_suffix('.png'), optimize=True)
    print(f"ENCODED {data['id']} {output.stat().st_size} bytes", flush=True)

if __name__ == '__main__':
    import sys
    ids = {int(value) for value in sys.argv[1:]}
    files = [f for f in WORK.glob('demo-*/storyboard.json') if not ids or int(f.parent.name.split('-')[1]) in ids]
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(encode, files))

from pathlib import Path
import subprocess
import cv2
import imageio_ffmpeg

root = Path(r'C:\Users\user\sonohoka')
src = root / '.record_sakubun_captioned'
out = root / 'media' / 'sakubun-tanemaki-intro.mp4'
files = [src / f'frame-{i:02d}.png' for i in range(6)]
frame_counts = [12, 15, 17, 15, 15, 20]
width, height, fps = 1280, 720, 10
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
cmd = [ffmpeg, '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{width}x{height}', '-r', str(fps), '-i', '-',
       '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000', '-shortest',
       '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
       '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', str(out)]
proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
try:
    for file, count in zip(files, frame_counts):
        frame = cv2.cvtColor(cv2.imread(str(file)), cv2.COLOR_BGR2RGB)
        for _ in range(count):
            proc.stdin.write(frame.tobytes())
    proc.stdin.close()
    stderr = proc.stderr.read().decode('utf-8', errors='replace')
    code = proc.wait()
finally:
    if proc.stdin and not proc.stdin.closed:
        proc.stdin.close()
if code:
    raise SystemExit(stderr)
print(f'encoded {out} ({sum(frame_counts)/fps:.1f}s)')

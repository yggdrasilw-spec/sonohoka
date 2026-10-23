"""Encode the app's captured browser frames with three stable captions."""
from pathlib import Path
import subprocess
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

root=Path(__file__).resolve().parents[1]
frames=root/'.portfolio-work/demo-95'
media=root/'media'
font=ImageFont.truetype('C:/Windows/Fonts/meiryo.ttc',32)
small=ImageFont.truetype('C:/Windows/Fonts/meiryo.ttc',26)
captions=['右の「する人」から、左の「される人」へ。','水をかける人・かけられる人。円弧でたどろう。','同じ場所を、数に。４は「かけられる数」。']
proc=subprocess.Popen([imageio_ffmpeg.get_ffmpeg_exe(),'-y','-f','rawvideo','-pix_fmt','rgb24','-s','1280x720','-r','4','-i','-','-f','lavfi','-i','anullsrc=channel_layout=stereo:sample_rate=44100','-t','9.5','-c:v','libx264','-preset','fast','-crf','22','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-shortest','-movflags','+faststart',str(media/'portfolio-95-intro.mp4')],stdin=subprocess.PIPE,stderr=subprocess.PIPE)
for n in range(38):
    im=Image.open(frames/f'frame-{n:03}.png').convert('RGB')
    scale=min(1200/im.width,552/im.height)
    im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
    canvas=Image.new('RGB',(1280,720),'#f5f3e9')
    canvas.paste(im,((1280-im.width)//2,56+(552-im.height)//2))
    d=ImageDraw.Draw(canvas)
    d.text((640,22),'する・される ｜ 算数のことば',font=small,fill='#166557',anchor='mm')
    d.rectangle((0,620,1280,720),fill='#166557')
    d.text((640,670),captions[0 if n<12 else 1 if n<24 else 2],font=font,fill='white',anchor='mm')
    if n==18:canvas.save(media/'portfolio-95-intro.png',optimize=True)
    if n in [0,11,12,23,24,37]:canvas.save(frames/f'review-{n:03}.png')
    proc.stdin.write(canvas.tobytes())
proc.stdin.close()
err=proc.stderr.read();assert proc.wait()==0,err.decode(errors='replace')
print('Encoded media/portfolio-95-intro.mp4 and PNG poster')

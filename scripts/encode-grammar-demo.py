"""Create the 9.5-second, three-caption grammar demo from actual browser video."""
import json,subprocess
from pathlib import Path
import imageio_ffmpeg
from PIL import Image,ImageDraw,ImageFont
root=Path(__file__).resolve().parent.parent
work=root/'.portfolio-work/grammar106';data=json.loads((work/'clips.json').read_text(encoding='utf-8'))
media=root/'media';media.mkdir(exist_ok=True)
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe();font=Path('C:/Windows/Fonts/meiryo.ttc')
inputs=[];filters=[]
for i,(clip,caption) in enumerate(zip(data['clips'],data['captions'])):
 image=Image.new('RGBA',(1280,720),(0,0,0,0));draw=ImageDraw.Draw(image);draw.rectangle((0,608,1280,720),fill=(18,53,46,255));draw.text((38,626),caption,font=ImageFont.truetype(str(font),29),fill='white');draw.text((40,677),data['title'],font=ImageFont.truetype(str(font),17),fill=(211,232,218))
 overlay=work/f'caption-{i}.png';image.save(overlay)
 inputs+=['-i',clip['path'],'-loop','1','-i',str(overlay)]
 source=i*2;filters.append(f'[{source}:v]trim=start={clip["start"]}:duration={clip["duration"]},setpts=PTS-STARTPTS,fps=24,scale=1280:608,pad=1280:720:0:0:color=0x12352e[v{i}]')
 filters.append(f'[v{i}][{source+1}:v]overlay=0:0:shortest=1,setsar=1[c{i}]')
filters.append('[c0][c1][c2]concat=n=3:v=1:a=0[out]')
output=media/'portfolio-106-intro.mp4'
cmd=[ffmpeg,'-hide_banner','-y',*inputs,'-f','lavfi','-i','anullsrc=channel_layout=stereo:sample_rate=44100','-filter_complex',';'.join(filters),'-map','[out]','-map','6:a','-t','9.5','-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p','-c:a','aac','-b:a','64k','-movflags','+faststart',str(output)]
p=subprocess.run(cmd,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
if p.returncode:raise SystemExit(p.stderr.decode(errors='replace')[-3000:])
subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-ss','1.8','-i',str(output),'-frames:v','1',str(media/'portfolio-106-intro.png')],check=True)
for i,second in enumerate([.2,1.8,3.2,4.7,6.2,8.6,9.3]):subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-ss',str(second),'-i',str(output),'-frames:v','1',str(work/f'check-{i}.png')],check=True)
print(output)

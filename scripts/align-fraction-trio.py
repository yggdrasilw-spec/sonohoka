import json,subprocess
from pathlib import Path
import imageio_ffmpeg,numpy as np
from PIL import Image
for id in [99,100,101]:
 directory=Path(f'.portfolio-work/demo-{id}');data=json.loads((directory/'storyboard.json').read_text(encoding='utf-8'))
 raw=subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(),'-loglevel','error','-i',str(directory/'source.webm'),'-vf','fps=20,scale=256:180','-f','rawvideo','-pix_fmt','rgb24','-'])
 frames=np.frombuffer(raw,dtype=np.uint8).reshape(-1,180,256,3).astype(float)
 starts=[];previous=-1
 for i,estimate in enumerate(data['segments']):
  target=np.array(Image.open(directory/f'frame-0{i}.png').convert('RGB').resize((256,180))).astype(float)
  distances=np.mean((frames-target)**2,axis=(1,2,3));distances[:max(0,int((previous+.35)*20))]=1e9
  match=int(np.argmin(distances));starts.append(match/20);previous=match/20
  print(id,i,'estimate',round(estimate,2),'visual',match/20,'mse',round(float(distances[match]),2))
 data['segments']=starts
 # Keep each cut inside the recorded state; repeated final frames are allowed to overlap.
 data['sourceDurations']=[min(2.3,max(.25,starts[i+1]-start-.1)) if i<4 else min(2.3,len(frames)/20-start-.1) for i,start in enumerate(starts)]
 data['alignment']={'method':'20fps screenshot visual match, constrained chronological order','matchedTimes':starts}
 for file in [directory/'storyboard.json',Path(f'scripts/portfolio-demos-{id}.json')]:file.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

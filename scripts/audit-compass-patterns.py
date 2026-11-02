"""Verify geometric distinctness and render all 100 patterns for visual review."""
import importlib.util, json, math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

spec=importlib.util.spec_from_file_location('catalogue',Path(__file__).with_name('build-compass-patterns.py'))
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
text=Path('js/compass-patterns.js').read_text(encoding='utf8')
rows=json.loads(text.split('window.COMPASS_PATTERNS = ',1)[1].rstrip(';\n'))
assert len(rows)==100
keys=[module.signature(p['e']) for p in rows]
assert len(set(keys))==100

def transformed(es,theta=37,reflect=-1,scale=2.3,offset=(17,-9)):
 co,si=math.cos(math.radians(theta)),math.sin(math.radians(theta));out=[]
 for e in es:
  x,y=e['c'][0],e['c'][1]*reflect
  q={'c':[(x*co-y*si)*scale+offset[0],(x*si+y*co)*scale+offset[1]],'r':e['r']*scale}
  if 'a' in e:
   a,b=e['a'];q['a']=[theta-b,theta-a] if reflect<0 else [theta+a,theta+b]
  out.append(q)
 return out

for p in rows:
 for reflection in [1,-1]:
  assert module.signature(p['e'])==module.signature(transformed(p['e'],reflect=reflection)),p['n']
 assert p['sourceUrl'].startswith('https://') and p['referenceFocus']
 assert all(e['r']>0 and e['r']<=14 and abs(e['r']*2-round(e['r']*2))<1e-6 for e in p['e']),p['n']
 for e in p['e']:
  a,b=e.get('a',[0,360])
  for k in range(101):
   t=math.radians(a+(b-a)*k/100);x=e['c'][0]+e['r']*math.cos(t);y=e['c'][1]+e['r']*math.sin(t)
   assert -1e-5<=x<=p['w']+1e-5 and -1e-5<=y<=p['h']+1e-5,(p['n'],x,y)
print('PASS 100 unique constructions; scale/37-degree rotation/reflection canaries; source and radius checks')

directory=Path('tmp/compass-100-review');directory.mkdir(exist_ok=True)
font=ImageFont.truetype('C:/Windows/Fonts/meiryo.ttc',14)
for start in range(0,100,25):
 sheet=Image.new('RGB',(1500,1550),'white');draw=ImageDraw.Draw(sheet)
 for j,p in enumerate(rows[start:start+25]):
  x=j%5*300;y=j//5*310
  draw.text((x+8,y+3),f"{start+j+1:03d} {p['n']}",font=font,fill='#17331f')
  strokes=[]
  for e in p['e']:
   a,b=e.get('a',[0,360]);n=max(16,math.ceil((b-a)/2));strokes.append([(e['c'][0]+e['r']*math.cos(math.radians(a+(b-a)*k/n)),e['c'][1]+e['r']*math.sin(math.radians(a+(b-a)*k/n))) for k in range(n+1)])
  points=sum(strokes,[]);xmin=min(x for x,y in points);xmax=max(x for x,y in points);ymin=min(y for x,y in points);ymax=max(y for x,y in points);scale=250/max(xmax-xmin,ymax-ymin)
  for line in strokes:draw.line([(x+25+(px-xmin)*scale,y+40+(py-ymin)*scale) for px,py in line],fill='#1b3f94',width=2)
  draw.rectangle((x,y,x+299,y+309),outline='#ccc')
 sheet.save(directory/f'patterns-{start+1:03d}-{start+25:03d}.png')

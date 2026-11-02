"""Build a reviewed catalogue of distinct circle/arc constructions, not size variants.

Only geometric construction parameters are authored here. Reference worksheets,
photographs, lettering and page layouts are not embedded in the application.
"""
from collections import Counter, defaultdict
from copy import deepcopy
import hashlib, json, math
from pathlib import Path
import re

REF={
 'okiba':'https://kyozai-okiba.com/3_201.html',
 'arcs':'https://kyozai-okiba.com/3_74.html',
 'kids':'https://print-kids.net/print/sansuu/en-to-kyuu/',
 '365':'https://www.print365.net/?p=4877',
 'gakushu':'https://xn--fdk3a7ctb5192box5b.com/es/3nen_mt_entokyu_en-compass-moyou.html',
 'dora':'https://doranyan.sakura.ne.jp/doranyan%20hp/40%20zukei/ennomoyou1.html',
 'toss':'https://land.toss-online.com/lesson/52IHDdaqMMPVt03AK2FD',
 'adams':'https://www.drawingislamicgeometricdesigns.com/blog/a-compass-exercise-precision-revealed',
}
def c(x,y,r,a=None,b=None):
 e={'c':[x,y],'r':r}
 if a is not None:e['a']=[a,b]
 return e
def polar(d,t):return (6+d*math.cos(math.radians(t)),6+d*math.sin(math.radians(t)))
def ring(n,d,r,phase=0):return [c(*polar(d,phase+k*360/n),r) for k in range(n)]
def shift(es,dx=0,dy=0,scale=1):
 return [dict(e,c=[(e['c'][0]-6)*scale+6+dx,(e['c'][1]-6)*scale+6+dy],r=e['r']*scale) for e in deepcopy(es)]
def corners(r=12):return [c(0,0,r,0,90),c(12,0,r,90,180),c(12,12,r,180,270),c(0,12,r,270,360)]
def sides(r=6):return [c(6,0,r,0,180),c(12,6,r,90,270),c(6,12,r,180,360),c(0,6,r,270,450)]
def arc_between(cx,cy,r,p,q):
 a=math.degrees(math.atan2(p[1]-cy,p[0]-cx))%360;b=math.degrees(math.atan2(q[1]-cy,q[0]-cx))%360
 if (b-a)%360>180:a,b=b,a
 return c(cx,cy,r,a,a+(b-a)%360)
def petal(t):
 # A 3-4-5 construction gives two genuine radius-5 arcs per petal.
 u=(math.cos(math.radians(t)),math.sin(math.radians(t)));v=(-u[1],u[0]);tip=(6+6*u[0],6+6*u[1])
 return [arc_between(6+3*u[0]+sign*4*v[0],6+3*u[1]+sign*4*v[1],5,(6,6),tip) for sign in [-1,1]]
def petals(n,phase=-90):return sum([petal(phase+k*360/n) for k in range(n)],[])
def wave(n=3,y=6,r=2,alternating=True):return [c(r+2*r*k,y,r,180 if not alternating or k%2==0 else 0,360 if not alternating or k%2==0 else 180) for k in range(n)]
def heart():
 # Four connected arcs: two upper semicircles and two lower 60-degree arcs.
 return [c(4,4,2,180,360),c(8,4,2,180,360),c(2,4,8,0,60),c(10,4,8,120,180)]
def arc_through(p,q,r,side=1):
 dx,dy=q[0]-p[0],q[1]-p[1];d=math.hypot(dx,dy);h=math.sqrt(r*r-d*d/4)
 return arc_between((p[0]+q[0])/2-side*dy*h/d,(p[1]+q[1])/2+side*dx*h/d,r,p,q)
def outline(circles):
 # Keep only exposed arcs of a union of circles; no stray lines inside the cloud.
 out=[]
 for x,y,r in circles:
  boundaries=[0,360]
  for xx,yy,rr in circles:
   d=math.hypot(xx-x,yy-y)
   if d and abs(r-rr)<d<r+rr:
    t=math.degrees(math.atan2(yy-y,xx-x));a=math.degrees(math.acos((r*r+d*d-rr*rr)/(2*r*d)))
    boundaries.extend([(t-a)%360,(t+a)%360])
  for a,b in zip(sorted(boundaries),sorted(boundaries)[1:]):
   t=math.radians((a+b)/2);px=x+r*math.cos(t);py=y+r*math.sin(t)
   if not any(math.hypot(px-xx,py-yy)<rr-1e-7 for xx,yy,rr in circles):out.append(c(x,y,r,a,b))
 return out

rows=[]
def add(name,group,es,ref,focus,w=12,h=12):
 rows.append(dict(n=name,group=group,w=w,h=h,e=es,source=ref,sourceUrl=REF[ref],referenceFocus=focus))

# Preserve the four supplied lessons; every remaining entry replaces the old size variants.
add('みっつの円','はじめの4題',[c(8,5,5),c(5,9,5),c(11,9,5)],'365','三つの円の重なり',16,14)
add('四すみと円','はじめの4題',[c(6,6,6)]+corners(6),'arcs','外円と四すみの円弧')
add('四すみの大きな弧','はじめの4題',corners(),'toss','四すみから同じ半径で描く円弧')
add('六まいの花','はじめの4題',[c(6,6,6)]+[c(*polar(6,k*60),6,k*60+120,k*60+240) for k in range(6)],'kids','外円内の六枚の花びら')

for name,es in [
 ('ふたつの輪',[c(4,6,4),c(8,6,4)]),
 ('ならぶ三つの輪',[c(2,6,2),c(6,6,2),c(10,6,2)]),
 ('輪のくさり',[c(x,6,3) for x in [3,5,7,9]]),
 ('四つの輪',[c(x,y,4) for x,y in [(4,4),(8,4),(8,8),(4,8)]]),
 ('三角の輪',[c(3,8,3),c(9,8,3),c(6,3,3)]),
 ('十字の輪',[c(6,6,3),c(6,3,3),c(9,6,3),c(6,9,3),c(3,6,3)]),
 ('大小の輪',[c(4,6,4),c(9,6,3)]),
 ('ななめの三つの輪',[c(3,9,3),c(6,6,3),c(9,3,3)]),
 ('三つの輪のピラミッド',[c(4,8,4),c(8,8,4),c(6,4,4)]),
 ('ダイヤの五つの輪',ring(4,4,2)+[c(6,6,2)]),
]:add(name,'輪の組み合わせ',es,'365','円の重なり・接する円・ずれた中心')

for name,es in [
 ('三重のまと',[c(6,6,r) for r in [2,4,6]]),
 ('片よせの輪',[c(6,6,6),c(8,6,4),c(10,6,2)]),
 ('左右の小さな輪',[c(6,6,6),c(3,6,3),c(9,6,3)]),
 ('輪の中の三つ玉',[c(6,6,6)]+[c(x,6,2) for x in [2,6,10]]),
 ('輪の中の四つ玉',[c(6,6,6)]+ring(4,3,3)),
 ('輪の中の三角玉',[c(6,6,6)]+ring(3,3,3,-90)),
 ('ずれながら小さくなる輪',[c(6,6,6),c(5,5,4.5),c(6,4,3),c(5,3,1.5)]),
 ('輪の中の二つのまと',[c(6,6,6),c(3,6,3),c(9,6,3),c(3,6,1.5),c(9,6,1.5)]),
]:add(name,'輪の中のもよう',es,'gakushu','ずれた同心構成・外円と内側の円')

for name,es in [
 ('ひとひら',petal(-90)),('三まいの花',petals(3)),('四まいの花',petals(4)),
 ('五まいの花',petals(5)),('八まいの花',petals(8)),
 ('ふたば',petal(-135)+petal(-45)),
 ('ちょうの羽',sum([petal(t) for t in [-145,-35,35,145]],[])),
 ('輪に入った四まいの花',[c(6,6,6)]+petals(4)),
 ('花の中の小さな輪',petals(5)+[c(6,6,1.5)]),
 ('花と四つのつぼみ',petals(4)+ring(4,4.5,1.5,-45)),
]:add(name,'花びら・葉',es,'kids','円弧二本で花びらを作る構成を3-4-5の円弧で再構成')

for name,es in [
 ('六つのふくらみ',[c(4,4,2,180,360),c(8,4,2,180,360),c(8,8,2,0,180),c(4,8,2,0,180),c(2,6,2,90,270),c(10,6,2,270,450)]),
 ('ふくらむ四つ葉',[c(6,3,3,180,360),c(9,6,3,270,450),c(6,9,3,0,180),c(3,6,3,90,270)]),
 ('四つの半円とまと',sides()+[c(6,6,3)]),
 ('花びらの輪かざり',ring(6,4,2)),
 ('ひまわり',[c(6,6,3)]+ring(12,4,2)),
 ('うめの輪',[c(6,6,3)]+ring(5,4,2.5,-90)),
 ('花びらの外の輪',[c(6,6,6)]+ring(8,4,2)),
 ('あじさいの輪',ring(3,3,3,-90)+ring(3,3,1.5,-90)),
]:add(name,'丸い花',es,'dora','中心の円の周囲に花びらの円を並べる構成')

for name,es in [
 ('二まいのレンズ',[c(0,0,12,0,90),c(12,12,12,180,270)]),
 ('三すみの大きな弧',corners()[:3]),
 ('向かいあう四分円',[c(0,0,6,0,90),c(12,12,6,180,270)]),
 ('四すみの小さな弧',corners(3)),
 ('四すみの二重アーチ',corners(6)+corners(3)),
 ('対角の三重アーチ',[c(0,0,r,0,90) for r in [4,8,12]]+[c(12,12,r,180,270) for r in [4,8,12]]),
 ('四すみの二重レンズ',corners(12)+corners(6)),
 ('二すみの交差アーチ',corners()[:2]),
 ('三日月のレンズ',[c(0,12,12,270,360),c(12,12,12,180,270),c(6,6,6,180,360)]),
 ('四分円の階段',[c(0,12,12,270,360),c(0,8,8,270,360),c(0,4,4,270,360)]),
]:add(name,'四分円',es,'toss' if '大きな' in name or '交差' in name else 'okiba','四すみを中心にした四分円・レンズ・重ねた弧')

for name,es in [
 ('半円のリボン',[c(6,6,6,180,360),c(3,6,3,0,180),c(9,6,3,0,180)]),
 ('半円のすなどけい',[c(6,0,6,0,180),c(6,12,6,180,360)]),
 ('向かいあう半円',[c(0,6,6,270,450),c(12,6,6,90,270)]),
 ('二重のすなどけい',[c(6,0,r,0,180) for r in [3,6]]+[c(6,12,r,180,360) for r in [3,6]]),
 ('半円の中の二つの輪',[c(6,6,6,180,360),c(3,6,3),c(9,6,3)]),
 ('半円の中の三つの弧',[c(6,6,6,180,360)]+[c(x,6,2,180,360) for x in [2,6,10]]),
 ('左右で大小の半円',[c(6,6,6,90,270),c(6,3,3,270,450),c(6,9,3,270,450)]),
 ('半円と二つの花びら',[c(6,6,6,0,180)]+petal(-135)+petal(-45)),
]:add(name,'半円',es,'365','半円・円弧の組み合わせ')

for name,es in [
 ('四つのくぼみ',sides()),
 ('くぼみと外の輪',sides()+[c(6,6,6)]),
 ('くぼみと四すみ',sides()+corners(6)),
 ('四すみのアーチと小さな輪',corners(6)+[c(6,6,3)]),
 ('二重のくぼみ',sides(6)+sides(3)),
 ('たてよこの二重リボン',sides(6)+[c(6,6,6)] + [c(6,3,3),c(6,9,3)]),
 ('四すみと十字の輪',corners(6)+ring(4,3,3)),
]:add(name,'星・くぼみ',es,'gakushu','正方形の辺・四すみから描く凹形の円弧構成')

for n,word in [(3,'三'),(4,'四'),(5,'五'),(6,'六'),(8,'八')]:
 add(word+'つの円のロゼット','ロゼット',ring(n,3,3,-90),'dora','中心を多角形状に移して同じ円を重ねる')
add('花のたねの七つの円','ロゼット',[c(6,6,3)]+ring(6,3,3),'adams','同じ半径の円を交点から重ねる七円構成')
add('ロゼットと外の輪','ロゼット',ring(6,3,3)+[c(6,6,6)],'adams','同じ半径の円の花と外接円')
add('ロゼットと中心の輪','ロゼット',ring(8,3,3)+[c(6,6,1.5)],'dora','多角形状の円の重なりと中心円')
add('二重のロゼット','ロゼット',ring(6,3,3)+ring(6,3,1.5),'dora','中心位置を共有する大小の円の輪')

for name,es in [
 ('山なみ',wave(alternating=False)),
 ('なみの線',wave()),
 ('上下のなみ',wave(y=4)+wave(y=8)),
 ('ずれた二段のなみ',wave(y=4,alternating=False)+[c(x,8,2,180,360) for x in [4,8]]),
 ('うろこのアーチ',wave(y=4,alternating=False)+wave(y=8,alternating=False)+wave(y=12,alternating=False)),
 ('大波と小波',[c(6,6,6,180,360)]+wave(y=6)),
 ('なみのトンネル',[c(6,8,r,180,360) for r in [2,4,6]]+wave(y=8,alternating=False)),
 ('向かいあう山なみ',wave(y=4,alternating=False)+[c(x,8,2,0,180) for x in [2,6,10]]),
]:add(name,'なみ・アーチ',es,'okiba','同じ半円をつないだり上下にずらしたりする構成')

for name,es in [
 ('四まいの風車',[c(6,3,3,90,270),c(9,6,3,180,360),c(6,9,3,270,450),c(3,6,3,0,180)]),
 ('輪に入った風車',[c(6,6,6),c(6,3,3,90,270),c(9,6,3,180,360),c(6,9,3,270,450),c(3,6,3,0,180)]),
 ('ふたつのまがたま',[c(6,6,6),c(6,3,3,90,270),c(6,9,3,270,450),c(6,3,1),c(6,9,1)]),
 ('三つのうず',[c(*polar(3,k*120),3,k*120,k*120+180) for k in range(3)]+[c(6,6,6)]),
 ('円のうず',[c(6,6,6),c(6,6,4,180,360),c(6,6,2,0,180),c(9,6,3,0,180),c(5,6,1,180,360)]),
 ('四すみの風車',[c(6,0,6,90,180),c(12,6,6,180,270),c(6,12,6,270,360),c(0,6,6,0,90)]),
]:add(name,'風車・うず',es,'dora','円弧を回転配置した風車・ずらした円の渦')

for name,es in [
 ('ハート',[c(3,3,3,180,360),c(9,3,3,180,360),c(0,3,12,0,60),c(12,3,12,120,180)]),
 ('二つのハート',shift(heart(),-3,0,.5)+shift(heart(),3,0,.5)),
 ('ハートの輪かざり',heart()+[c(6,5,6)]),
 ('くも',outline([(3,6,3),(6,4,3),(9,6,3),(6,8,3)])),
 ('ゆきだるま',[c(6,3,3),c(6,8,4),c(5,3,0.5),c(7,3,0.5),c(6,7,0.5),c(6,9,0.5)]),
 ('いもむし',[c(x,6,2) for x in [2,5,8,11]]+[c(11,5.5,.5)]),
 ('めがね',[c(3,6,3),c(9,6,3),c(6,6,1.5,180,360)]),
 ('さくらんぼ',[c(3,8,3),c(9,8,3),arc_through((3,5),(6,1),5),arc_through((9,5),(6,1),5,-1)]),
 ('かさ',[c(6,6,6,180,360)]+[c(x,6,2,180,360) for x in [2,6,10]]+[c(6,8,2,270,450),c(5,10,1,0,180)]),
 ('ふくろうの目',[c(6,6,6),c(3.5,5,2.5),c(8.5,5,2.5),c(3.5,5,1),c(8.5,5,1),c(6,8,2,0,180)]),
]:add(name,'形を楽しむ',es,'dora','ハートと、円・円弧を組み合わせた形づくり。固有のキャラクターは収録しない')

add('四つのタイル','くり返し', [c(x,y,3) for y in [3,9] for x in [3,9]],'okiba','同じ円の正方形配置')
add('九つのタイル','くり返し', [c(x,y,2) for y in [2,6,10] for x in [2,6,10]],'gakushu','同じ円の格子配置')
add('かさなる九つの輪','くり返し', [c(x,y,3) for y in [3,6,9] for x in [3,6,9]],'gakushu','格子状の円の重なり')
add('花のたねの十三円','くり返し',[c(6,6,2)]+ring(6,2,2)+ring(6,4,2),'adams','七円から十三円へ交点を広げる構成')
add('花のたねの十九円','くり返し',[c(6,6,2)]+ring(6,2,2)+ring(6,4,2)+ring(6,2*math.sqrt(3),2,30),'adams','円の交点を使った六角格子の拡張')
add('四つの小さな四つ葉','くり返し',sum([shift(sides(6),x,y,.5) for x,y in [(-3,-3),(3,-3),(-3,3),(3,3)]],[]),'gakushu','四つ葉型の円弧を正方形に反復')
add('四つの小さなまと','くり返し',[c(x,y,r) for x,y in [(3,3),(9,3),(3,9),(9,9)] for r in [1.5,3]],'okiba','同心円を正方形に反復')

def merged(es):
 """Unify redundant arc subdivisions before comparing geometric constructions."""
 groups=defaultdict(list)
 for e in es:
  key=tuple(round(v,6) for v in [*e['c'],e['r']]);a,b=e.get('a',[0,360]);span=b-a
  if span>=359.999:groups[key].append((0,360));continue
  a%=360;b=a+span
  groups[key].append((a,min(b,360)))
  if b>360:groups[key].append((0,b-360))
 out=[]
 for (x,y,r),intervals in groups.items():
  combined=[]
  for a,b in sorted(intervals):
   if combined and a<=combined[-1][1]+1e-5:combined[-1][1]=max(b,combined[-1][1])
   else:combined.append([a,b])
  if len(combined)>1 and combined[0][0]<1e-5 and combined[-1][1]>359.999:
   combined=[[combined[-1][0],combined[0][1]+360]]+combined[1:-1]
  out.extend(c(x,y,r,None if b-a>=359.999 else a,None if b-a>=359.999 else b) for a,b in combined)
 return out

def signature(es):
 """Ignore translation, overall size, arbitrary rotation, reflection and draw order."""
 es=merged(es);cx=sum(e['c'][0] for e in es)/len(es);cy=sum(e['c'][1] for e in es)/len(es);scale=max(e['r'] for e in es)
 angles=[]
 for e in es:
  x,y=e['c'][0]-cx,e['c'][1]-cy
  if abs(x)+abs(y)>1e-5:angles.append(math.atan2(y,x))
  if e.get('a'):angles.append(math.radians(sum(e['a'])/2))
 if not angles:angles=[0]
 keys=[]
 for th in angles:
  for reflect in [1,-1]:
   co,si=math.cos(th),math.sin(th);parts=[]
   for e in es:
    x,y=(e['c'][0]-cx)/scale,(e['c'][1]-cy)/scale
    item=[round(x*co+y*si,3),round((-x*si+y*co)*reflect,3),round(e['r']/scale,3)]
    if 'a' in e:
     mid=math.radians(sum(e['a'])/2)-th;item += [round(math.cos(mid),3),round(math.sin(mid)*reflect,3),round((e['a'][1]-e['a'][0])/360,3)]
    else:item += [0,0,1]
    parts.append(tuple(0 if v==0 else v for v in item))
   keys.append(tuple(sorted(parts)))
 return min(keys)

def build():
 seen={};duplicates=[];unique=[]
 for row in rows:
  sig=signature(row['e'])
  if sig in seen:duplicates.append([row['n'],seen[sig]]);continue
  seen[sig]=row['n'];row['e']=merged(row['e']);unique.append(row)
 print('candidate',len(rows),'unique',len(unique),'removed',duplicates)
 assert len(unique)>=100, 'Add genuinely different constructions; do not add sizes to fill the count.'
 # Keep the original four first; select across families rather than dropping the final families.
 selected=unique[:4];families=defaultdict(list)
 for row in unique[4:]:families[row['group']].append(row)
 while len(selected)<100:
  for group in families:
   if families[group] and len(selected)<100:selected.append(families[group].pop(0))
 order=list(dict.fromkeys(r['group'] for r in rows));selected.sort(key=lambda r:(order.index(r['group']),rows.index(r)))
 for i,row in enumerate(selected,1):
  # Keep every visible arc inside the base sheet even when the child sets margin to zero.
  points=[]
  for e in row['e']:
   a,b=e.get('a',[0,360]);ts=[a,b]+[t for t in range(-360,1081,90) if a<=t<=b]
   points.extend((e['c'][0]+e['r']*math.cos(math.radians(t)),e['c'][1]+e['r']*math.sin(math.radians(t))) for t in ts)
  dx=max(0,math.ceil(-min(x for x,y in points)*2-1e-6)/2);dy=max(0,math.ceil(-min(y for x,y in points)*2-1e-6)/2)
  for e in row['e']:e['c']=[e['c'][0]+dx,e['c'][1]+dy]
  row['w']=max(row['w'],math.ceil((max(x for x,y in points)+dx)*2-1e-6)/2)
  row['h']=max(row['h'],math.ceil((max(y for x,y in points)+dy)*2-1e-6)/2)
  row['id']=f'pattern-{i:03d}'
  row['difficulty']='じっくり' if len(row['e'])>10 else 'ふつう' if len(row['e'])>4 else 'やさしい'
  for e in row['e']:
   assert 0<e['r']<=14
   if 'a' in e:assert 0<e['a'][1]-e['a'][0]<360
   for k in ['c','a']:
    if k in e:e[k]=[round(v,6) for v in e[k]]
 manifest=[{k:v for k,v in row.items() if k!='e'}|{'strokes':len(row['e']),'geometrySHA256':hashlib.sha256(json.dumps(row['e'],sort_keys=True).encode()).hexdigest()} for row in selected]
 payload='// 100 distinct geometric constructions; see docs/compass/pattern-catalog.json.\nwindow.COMPASS_PATTERNS = '+json.dumps(selected,ensure_ascii=False,indent=2)+';\nwindow.COMPASS_EXTRA_PATTERNS = window.COMPASS_PATTERNS.slice(4);\n'
 Path('js/compass-patterns.js').write_text(payload,encoding='utf8')
 version=hashlib.sha256(payload.encode('utf8')).hexdigest()[:12]
 html=Path('compass_pattern.html');html.write_text(re.sub(r'js/compass-patterns\.js(?:\?v=[a-f0-9]+)?',f'js/compass-patterns.js?v={version}',html.read_text(encoding='utf8')),encoding='utf8')
 Path('docs/compass/pattern-catalog.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 Path('docs/compass/distinctness-audit.json').write_text(json.dumps(dict(count=len(selected),candidates=len(rows),uniqueCandidates=len(unique),excludedDuplicatePairs=duplicates,method='Canonical circle/arc geometry. Ignore translation, uniform scaling, arbitrary rotation, reflection, stroke order and arc subdivisions.',groups=dict(Counter(r['group'] for r in selected))),ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 print('selected',len(selected),dict(Counter(r['group'] for r in selected)))
 return selected

if __name__ == "__main__":
 build()

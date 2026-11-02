"""Download supplementary reference material for local review, never republish it."""
import concurrent.futures, hashlib, json, re
from pathlib import Path
from urllib.parse import urljoin
import requests

OUT=Path('tmp/compass-research/more'); OUT.mkdir(parents=True,exist_ok=True)
sources=[
 dict(id='doranyan',title='どらニャンドリル：コンパスで幾何学模様をかこう',url='https://doranyan.sakura.ne.jp/doranyan%20hp/40%20zukei/ennomoyou1.html'),
 dict(id='gakushu',title='学習プリント.com：コンパスを使ってもようをかこう',url='https://xn--fdk3a7ctb5192box5b.com/es/3nen_mt_entokyu_en-compass-moyou.html'),
 dict(id='toss',title='TOSSランド：第4時 コンパスで円の模様を描く',url='https://land.toss-online.com/lesson/52IHDdaqMMPVt03AK2FD',image='https://storage.googleapis.com/tossland/bfx2dxNMpzLV/print1.png'),
 dict(id='adams',title='Alan Adams: A Compass Exercise: Precision Revealed',url='https://www.drawingislamicgeometricdesigns.com/blog/a-compass-exercise-precision-revealed',credit='Alan D Adams, CC BY 4.0; geometric circle-grid construction redrawn and adapted'),
 dict(id='homework',title='家庭学習レシピ：コンパスで模様をかく自主学習',url='https://homework-recipe.com/3rdbsan5'),
]
jobs=[]
for s in sources:
 r=requests.get(s['url'],timeout=40);r.raise_for_status();r.encoding=r.apparent_encoding;(OUT/(s['id']+'.html')).write_text(r.text,encoding='utf8')
 pdfs=list(dict.fromkeys(urljoin(s['url'],u) for u in re.findall(r'href=[\"\x27]([^\"\x27]+\.pdf)[\"\x27]',r.text,re.I)))
 if s['id']=='gakushu': pdfs=[u for u in pdfs if re.search(r'/0[1-8]\.pdf$',u)]
 for i,u in enumerate(pdfs):jobs.append((s['id'],u,f"{s['id']}-{i+1:02d}.pdf"))
 imgs=list(dict.fromkeys(urljoin(s['url'],u.replace('&amp;','&')) for u in re.findall(r'(?:src|data-src)=[\"\x27]([^\"\x27]+)[\"\x27]',r.text)))
 if s['id']=='adams':imgs=[u for u in imgs if 'Flower' in u or 'Compass-IMG' in u]
 elif s['id']=='gakushu':imgs=[u for u in imgs if 'en-compass-moyou' in u]
 elif s['id']=='homework':imgs=[u for u in imgs if '/uploads/2015/01/' in u]
 else:imgs=[]
 if s.get('image'):imgs.insert(0,s['image'])
 for i,u in enumerate(imgs):jobs.append((s['id'],u,f"{s['id']}-image-{i+1:02d}"+('.gif' if '.gif' in u else '.png' if '.png' in u else '.jpg')))

def download(job):
 id,url,name=job;r=requests.get(url,timeout=60)
 if not r.ok:return dict(source=id,url=url,error=r.status_code)
 (OUT/name).write_bytes(r.content)
 return dict(source=id,url=url,localFile=name,bytes=len(r.content),sha256=hashlib.sha256(r.content).hexdigest())
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: files=list(pool.map(download,jobs))
Path('docs/compass/image-sources.json').write_text(json.dumps(dict(searchDate='2026-11-02',queries=['コンパス もよう 算数','コンパス 模様 作図','compass drawing circle arc geometric patterns worksheet'],sources=sources,files=files),ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(len(files),'supplementary references saved locally')

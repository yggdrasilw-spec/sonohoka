"""Reuse the phonics/Eiken word images, keeping original bytes and provenance."""
import argparse, concurrent.futures, hashlib, json, pathlib, shutil, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
args = argparse.ArgumentParser()
args.add_argument('--english-dir', type=pathlib.Path, default=ROOT.parent/'english-stage/dist')
args = args.parse_args()
app = ROOT/'phonics-lab'
words = json.loads((app/'advanced-data.json').read_text(encoding='utf8'))['words']
cards = json.loads((args.english_dir/'data/grade5.json').read_text(encoding='utf8'))
target = app/'assets/story/existing'
target.mkdir(parents=True, exist_ok=True)

def sync(word):
    # Preserve the pictures already seen in the original phonics app first.
    local = app/'assets/words'/f'{word}.webp'
    if local.exists():
        return word, dict(src=local.relative_to(app).as_posix(), origin='phonics-lab/'+local.relative_to(app).as_posix(),
            sha256=hashlib.sha256(local.read_bytes()).hexdigest(), kind='existing-phonics')
    card = next(c for c in cards if c['id']=='g5-w-'+word)
    origin = card['image']['url']
    suffix = pathlib.PurePosixPath(origin).suffix
    assert suffix in ('.png','.webp','.jpg'), origin
    file = target/(word+suffix)
    if not file.exists():
        if origin.startswith('assets/'):
            shutil.copyfile(args.english_dir/origin, file)
        else:
            assert origin.startswith('https://shiritori-images.yggdrasil-learning.workers.dev/'), origin
            source = ROOT.parent/'hiragana-ninshiki'/origin.split('.workers.dev/')[1]
            if source.exists():
                shutil.copyfile(source, file)
            else:
                with urllib.request.urlopen(origin, timeout=30) as r:
                    assert r.headers.get_content_type().startswith('image/')
                    file.write_bytes(r.read())
    return word, dict(src=file.relative_to(app).as_posix(),origin=origin,sourceCardId=card['id'],
        sha256=hashlib.sha256(file.read_bytes()).hexdigest(),kind='existing-eiken')

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    images = dict(pool.map(sync, words))
data = dict(version='2026-11-08.1',priority='existing-word-image-first',images=images,
    fallback=dict(src='assets/story/word-scenes-v1.png',kind='generated-sprite',columns=4,rows=4,
        words=['cut','cute','duck','sock','catch','bridge','rain','day','moon','book','sea','head','snow','cow','give','much']))
(app/'assets/story/image-manifest.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(app/'story-images.js').write_text('window.PHONICS_STORY_IMAGES = '+json.dumps(data,ensure_ascii=False,indent=2)+';\n',encoding='utf8')
print(f'Reused {len(images)} original word images; generated images are fallback only.')

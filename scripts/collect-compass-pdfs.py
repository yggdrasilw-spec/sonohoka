"""Collect public reference PDFs locally; commit only source metadata, never the PDFs."""
import concurrent.futures, hashlib, json, re
from pathlib import Path
from urllib.parse import urljoin
import requests

PAGES = [
    ('okiba-pattern', 'https://kyozai-okiba.com/3_201.html'),
    ('okiba-arcs', 'https://kyozai-okiba.com/3_74.html'),
    ('print-kids', 'https://print-kids.net/print/sansuu/en-to-kyuu/'),
    ('print365', 'https://www.print365.net/?p=4877'),
]
out = Path('tmp/compass-research'); out.mkdir(parents=True, exist_ok=True)
jobs = []
for group, page in PAGES:
    resp = requests.get(page, timeout=40); resp.raise_for_status()
    urls = list(dict.fromkeys(urljoin(page, x) for x in re.findall(r'href=[\"\x27]([^\"\x27]+\.pdf)[\"\x27]', resp.text, re.I)))
    if group == 'print-kids': urls = [u for u in urls if 'moyou' in u or 'sakuzu' in u]
    if group == 'print365': urls = [u for u in urls if 'sakuzu' in u]
    jobs.extend((group, page, u, f'{group}-{i+1:02d}.pdf') for i,u in enumerate(urls))

def download(job):
    group, page, url, name = job
    r = requests.get(url, timeout=60); r.raise_for_status()
    assert r.content.startswith(b'%PDF'), url
    (out/name).write_bytes(r.content)
    return dict(id=name[:-4], group=group, sourcePage=page, url=url, localFile=name,
                bytes=len(r.content), sha256=hashlib.sha256(r.content).hexdigest(), collected='2026-11-02')

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    rows = list(pool.map(download, jobs))
Path('docs/compass/pdf-sources.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(f'Collected {len(rows)} PDFs from {len(PAGES)} pages into {out}')

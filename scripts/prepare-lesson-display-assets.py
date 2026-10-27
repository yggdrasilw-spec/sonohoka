"""Build display WebPs without changing source images or their framing."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def convert(source, target, edge):
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as original:
        im = original.convert('RGBA' if 'A' in original.getbands() else 'RGB')
        im.thumbnail((edge, edge), Image.Resampling.LANCZOS)
        im.save(target, 'WEBP', quality=80, method=6)
    return source.stat().st_size, target.stat().st_size


if __name__ == '__main__':
    jobs = [(p, ROOT / 'img/display' / (p.stem + '.webp'), 480)
            for p in (ROOT / 'img').glob('beaver_*.png')]
    jobs += [(p, ROOT / 'my-town/assets/display-places' / p.name, 160)
             for p in (ROOT / 'my-town/assets/places').glob('*.webp')]
    jobs += [(p, ROOT / 'my-town/assets/display-map-places' / p.name, 256)
             for p in (ROOT / 'my-town/assets/map-places').glob('*.webp')]
    jobs += [(p, p.with_name(p.stem + '-display.webp'), 960 if p.stem == 'reference-side' else 480)
             for p in (ROOT / 'img/beaver-specimens').glob('*.jpg')]
    source_bytes = display_bytes = 0
    for source, target, edge in jobs:
        before, after = convert(source, target, edge)
        source_bytes += before
        display_bytes += after
    print(f'{len(jobs)} images: {source_bytes:,} -> {display_bytes:,} bytes')

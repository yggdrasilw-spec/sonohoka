"""Slice the five generated 2x2 sheets at their central grid separators."""
from pathlib import Path
from PIL import Image

assets = Path(__file__).resolve().parents[1] / 'sansuu-kotoba' / 'assets'

def separator(image, axis):
    width, height = image.size
    size, cross = (width, height) if axis == 'x' else (height, width)
    hits = []
    for a in range(size // 2 - 12, size // 2 + 13):
        pixels = [image.getpixel((a, b) if axis == 'x' else (b, a)) for b in range(cross)]
        gray = sum(100 < min(p) < 230 and max(p) - min(p) < 12 for p in pixels)
        if gray / cross > .8:
            hits.append(a)
    assert hits and hits[-1] - hits[0] < 10, (axis, hits)
    return hits[0], hits[-1] + 1

for row, key in enumerate(['poke', 'pat', 'fan', 'call', 'light'], start=5):
    source = Image.open(assets / f'other-{key}-sheet-v1.png').convert('RGB')
    x0, x1 = separator(source, 'x')
    y0, y1 = separator(source, 'y')
    xs, ys = [(2, x0 - 1), (x1 + 1, source.width - 2)], [(2, y0 - 1), (y1 + 1, source.height - 2)]
    for frame in range(4):
        r, c = divmod(frame, 2)
        tile = source.crop((xs[c][0], ys[r][0], xs[c][1], ys[r][1]))
        assert tile.width >= 760 and tile.height >= 500, tile.size
        tile.save(assets / f'scene-{row}-{frame}.webp', quality=92)
    print({'scene': key, 'row': row, 'grid': [x0, x1, y0, y1], 'frames': 4})

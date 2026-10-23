"""Mechanically slice the generated sheet at detected grid lines; no art edits."""
from pathlib import Path
from PIL import Image

assets = Path(__file__).resolve().parents[1] / 'sansuu-kotoba' / 'assets'
image = Image.open(assets / 'source-sheet.png').convert('RGB')

def boundaries(axis, source=image):
    width, height = source.size
    size, cross = (width, height) if axis == 'x' else (height, width)
    hits = []
    for a in range(size):
        gray = 0
        for b in range(cross):
            rgb = source.getpixel((a, b) if axis == 'x' else (b, a))
            if 100 < rgb[0] < 225 and max(rgb) - min(rgb) < 10:
                gray += 1
        if gray / cross > .8:
            hits.append(a)
    clusters = []
    for a in hits:
        if clusters and a - clusters[-1][-1] <= 3:
            clusters[-1].append(a)
        else:
            clusters.append([a])
    internal = [round(sum(c) / len(c)) for c in clusters if 3 < c[0] < size - 3]
    return [0, *internal, size - 1]

xs, ys = boundaries('x'), boundaries('y')
assert len(xs) == 5 and len(ys) == 6, (xs, ys)
for row in range(5):
    if row == 3:
        continue  # Curry has its own corrected, rice-first continuity sheet.
    for col in range(4):
        tile = image.crop((xs[col] + 2, ys[row] + 2, xs[col+1] - 2, ys[row+1] - 2))
        tile.save(assets / f'scene-{row}-{col}.webp', quality=92)
curry = Image.open(assets / 'curry-sheet-v2.png').convert('RGB')
cx, cy = boundaries('x', curry), boundaries('y', curry)
assert len(cx) == 3 and len(cy) == 3, (cx, cy)
for frame in range(4):
    row, col = divmod(frame, 2)
    tile = curry.crop((cx[col] + 2, cy[row] + 2, cx[col+1] - 2, cy[row+1] - 2))
    tile.save(assets / f'scene-3-{frame}.webp', quality=92)
print({'curry_source': curry.size, 'x_grid': cx, 'y_grid': cy, 'frames': 4})
print({'source': image.size, 'x_grid': xs, 'y_grid': ys, 'frames': 20})

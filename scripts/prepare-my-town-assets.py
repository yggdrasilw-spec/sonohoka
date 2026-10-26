"""Lossless sprite extraction/packing and delivery-size image conversion.
Run after the built-in image generator has saved the requested illustrations.
Source images are retained by imagegen; this script does no drawing/generation.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / 'my-town' / 'assets'

def runs(mask, vertical=False):
    size = mask.height if vertical else mask.width
    found, start = [], None
    for n in range(size + 1):
        occupied = n < size and mask.crop((0, n, mask.width, n+1) if vertical else (n, 0, n+1, mask.height)).getbbox() is not None
        if occupied and start is None:
            start = n
        if not occupied and start is not None:
            if n-start > 12:
                found.append((start, n))
            start = None
    return found

def main():
    for source in (ROOT / 'places').glob('*.png'):
        with Image.open(source) as im:
            im.convert('RGB').resize((320, 320), Image.Resampling.LANCZOS).save(source.with_suffix('.webp'), quality=86)
    sprite = ROOT / 'character' / 'walk-sheet.png'
    # First run takes the unmodified generated sheet. Subsequent runs are safe.
    if not (ROOT / 'character' / 'south-0.webp').exists():
        with Image.open(sprite) as sheet:
            alpha = sheet.getchannel('A').point(lambda v: 255 if v > 32 else 0)
            row_runs = runs(alpha, vertical=True)
            assert len(row_runs) == 4, row_runs
            frames = []
            for r, (top, bottom) in enumerate(row_runs):
                strip = alpha.crop((0, top, sheet.width, bottom))
                cols = runs(strip)
                assert len(cols) == 4, cols
                for c, (left, right) in enumerate(cols):
                    frame = sheet.crop((left, top, right, bottom))
                    box = frame.getchannel('A').getbbox()
                    frames.append((r, c, frame.crop(box)))
            scale = min(112/max(f.width for _, _, f in frames), 144/max(f.height for _, _, f in frames))
            packed = Image.new('RGBA', (512, 640))
            for r, c, frame in frames:
                tile = Image.new('RGBA', (128, 160))
                frame = frame.resize((round(frame.width*scale), round(frame.height*scale)), Image.Resampling.LANCZOS)
                tile.alpha_composite(frame, ((128-frame.width)//2, 152-frame.height))
                tile.save(ROOT / 'character' / f'{["south", "west", "east", "north"][r]}-{c}.webp', lossless=True)
                packed.alpha_composite(tile, (c*128, r*160))
            packed.save(sprite, optimize=True)
    print('Prepared', len(list((ROOT / 'places').glob('*.webp'))), 'place images and 16 aligned sprite frames')

if __name__ == '__main__':
    main()

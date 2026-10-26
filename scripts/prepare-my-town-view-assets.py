"""Mechanically crop picture margins and pack the generated eight-view turn sheet."""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1] / 'my-town' / 'assets'

def spans(mask, vertical):
    found, start = [], None
    length = mask.height if vertical else mask.width
    for i in range(length+1):
        box = (0, i, mask.width, i+1) if vertical else (i, 0, i+1, mask.height)
        occupied = i < length and mask.crop(box).getbbox() is not None
        if occupied and start is None:
            start = i
        if not occupied and start is not None:
            if i-start > 12:
                found.append((start, i))
            start = None
    return found

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source-dir', type=Path)
    args = parser.parse_args()
    output = ROOT / 'map-places'
    output.mkdir(exist_ok=True)
    manifest = json.loads((ROOT / 'generation.json').read_text(encoding='utf-8'))
    for item in manifest['places']:
        source = args.source_dir / item['sourceFile'] if args.source_dir else ROOT / item['file']
        with Image.open(source) as original:
            im = original.convert('RGB')
            mask = ImageChops.difference(im, Image.new('RGB', im.size, 'white')).convert('L').point(lambda v: 255 if v > 22 else 0)
            box = mask.getbbox()
            if not box:
                raise ValueError(f'Empty picture: {source}')
            margin = round(max(box[2]-box[0], box[3]-box[1])*.025)
            box = (max(0, box[0]-margin), max(0, box[1]-margin), min(im.width, box[2]+margin), min(im.height, box[3]+margin))
            im = im.crop(box)
            im.thumbnail((512, 512), Image.Resampling.LANCZOS)
            im.save(output / f'{item["id"]}.webp', quality=88)
    source = ROOT / 'character' / 'turn-source.png'
    if source.exists():
        with Image.open(source) as im:
            mask = im.getchannel('A').point(lambda v: 255 if v > 32 else 0)
            row_spans = spans(mask, True)
            assert len(row_spans) == 2, row_spans
            frames = []
            for top, bottom in row_spans:
                columns = spans(mask.crop((0, top, im.width, bottom)), False)
                assert len(columns) == 4, columns
                for left, right in columns:
                    frame = im.crop((left, top, right, bottom))
                    frames.append(frame.crop(frame.getchannel('A').getbbox()))
            scale = min(112/max(f.width for f in frames), 144/max(f.height for f in frames))
            packed = Image.new('RGBA', (512, 320))
            for i, frame in enumerate(frames):
                tile = Image.new('RGBA', (128, 160))
                frame = frame.resize((round(frame.width*scale), round(frame.height*scale)), Image.Resampling.LANCZOS)
                tile.alpha_composite(frame, ((128-frame.width)//2, 152-frame.height))
                tile.save(ROOT / 'character' / f'turn-{i}.webp', lossless=True)
                packed.alpha_composite(tile, ((i%4)*128, (i//4)*160))
            packed.save(ROOT / 'character' / 'turn-sheet.webp', lossless=True)
    print('Prepared 40 tightly framed map pictures and 8 upright turning poses')

if __name__ == '__main__':
    main()

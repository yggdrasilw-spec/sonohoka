"""Build audition candidates from existing TTS words, without replacing lesson audio.

Requires numpy and imageio-ffmpeg. Cut boundaries were inspected in waveforms /
spectrograms; these are listening candidates, not approved phonics exemplars.
"""
from pathlib import Path
import subprocess
import json
import wave
import numpy as np
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'phonics-lab/assets/audio-candidates'
SR = 24000
LETTERS = {'ae':'a', 'eh':'e', 'ih':'i', 'aa':'o', 'uh':'u', 'k':'c・k',
           'kw':'qu', 'ks':'x', 'dh':'th（声）', 'a-e':'a…e'}
# id, source, IPA, start seconds, end seconds, listening note
CUTS = [
    ('s', 'sun', 's', .095, .245, '母音が始まる前の、息が続く部分。'),
    ('f', 'fish', 'f', .105, .158, '弱く短い息の部分。聞こえにくさも確認。'),
    ('sh', 'shoe', 'ʃ', .100, .270, '母音へ移る前の、息が続く部分。'),
    ('m', 'milk', 'm', .105, .165, '唇を閉じた鼻音の部分。短いため長さも確認。'),
    ('n', 'nose', 'n', .105, .180, '母音へ移る前の鼻音。母音が混ざらないか確認。'),
    ('ae', 'apple', 'æ', .120, .245, '最初の母音の中央。日本語の「あ」との違いも確認。'),
    ('ih', 'ink', 'ɪ', .115, .205, '最初の母音。後ろの鼻音の影響がないか確認。'),
    ('p', 'pig', 'p', .100, .155, '破裂と息の部分。短さと、余分な母音がないかを重点確認。'),
    ('b', 'ball', 'b', .105, .145, '非常に短い候補。これだけで音が分かるかを重点確認。'),
    ('k', 'cup', 'k', .105, .185, '破裂とその後の息。母音に入る直前で切っています。'),
    ('d', 'dog', 'd', .105, .165, '非常に短い破裂音。母音が混ざらないか重点確認。'),
    ('eh', 'egg', 'ɛ', .120, .250, '最初の母音の中央。'),
    ('g', 'gorilla', 'ɡ', .112, .155, '弱く短い破裂音。後ろの弱母音との境目を重点確認。'),
    ('h', 'hat', 'h', .110, .185, '母音が始まる前の息。後ろの母音の口の形の影響が残る候補。'),
    ('j', 'juice', 'dʒ', .130, .235, '閉鎖後の摩擦部分を含む候補。単なるzhになっていないか確認。'),
    ('l', 'lemon', 'l', .105, .150, '舌先を付けた短い部分。母音への移り変わりを切ると聞き分けにくい音。'),
    ('aa', 'octopus', 'ɑ', .125, .220, '最初の母音の中央。日本語の「お」とは違う音。'),
    ('kw', 'queen', 'kw', .105, .230, 'kからwへ移る複合音。後ろの母音との境目を重点確認。'),
    ('r', 'rabbit', 'ɹ', .105, .160, '母音の前の短いr。単独では聞き分けにくいため重点確認。'),
    ('t', 'tiger', 't', .105, .185, '破裂とその後の息。余分な母音がないか確認。'),
    ('uh', 'umbrella', 'ʌ', .115, .175, '最初の短い母音。後ろのmの影響が残らないか確認。'),
    ('v', 'van', 'v', .105, .150, '弱く短い摩擦の候補。声の振動と息が聞こえるか重点確認。'),
    ('w', 'water', 'w', .105, .160, '母音へ移る前の短いw。移り変わりも手がかりになるため重点確認。'),
    ('ks', 'box', 'ks', .515, .720, '単語の最後から切り出したkとs。kの破裂が残るか確認。'),
    ('y', 'yellow', 'j', .105, .165, '母音へ移る前の短いy。文字名のワイやジェイとは区別。'),
    ('z', 'zebra', 'z', .105, .215, '母音の前の、声を伴う摩擦部分。'),
    ('th', 'three', 'θ', .110, .160, '弱い息の部分。後ろのrを含めない短い候補。'),
    ('dh', 'this', 'ð', .120, .155, '非常に短い、声を伴うth。母音との境目を重点確認。'),
    ('ch', 'chair', 'tʃ', .135, .245, '破裂から摩擦へ続く部分。単なるshになっていないか確認。'),
    ('ts', 'hats', 'ts', .500, .760, '単語の最後から切り出したtとs。tの破裂が残るか確認。'),
    ('oo', 'moon', 'uː', .225, .405, '単語の中央から切り出した母音。元の長さより短いため、長さも確認。'),
    ('a-e', 'snake', 'eɪ', .285, .495, '単語の中央の二重母音。エからイへの動きが残っているか確認。'),
]

def decode(word):
    source = ROOT / 'phonics-lab/assets/audio' / f'word-{word}.mp3'
    raw = subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error',
        '-i', str(source), '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'])
    return np.frombuffer(raw, dtype='<i2').astype(float) / 32768

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    entries = []
    order='ae b k d eh f g h ih j l m n aa p kw r s t uh v w ks y z th dh ch sh ts oo a-e'.split()
    assert len(CUTS) == len(order) == 32
    for sound, word, ipa, start, end, note in sorted(CUTS, key=lambda row: order.index(row[0])):
        x = decode(word)[round(start*SR):round(end*SR)].copy()
        assert len(x) > 0 and abs(x).max() > .0001
        # Cap boosting at 12 dB; do not stretch or loop a consonant into a tone.
        gain = min(4.0, .65 / abs(x).max())
        x *= gain
        fade = min(round(.001*SR), len(x)//4)
        x[:fade] *= np.linspace(0, 1, fade)
        x[-fade:] *= np.linspace(1, 0, fade)
        padded = np.concatenate([np.zeros(round(.03*SR)), x, np.zeros(round(.25*SR))])
        filename = f'cut-{sound}.wav'
        with wave.open(str(OUT / filename), 'wb') as target:
            target.setnchannels(1); target.setsampwidth(2); target.setframerate(SR)
            target.writeframes((np.clip(padded, -1, 1)*32767).astype('<i2').tobytes())
        entries.append(dict(id=sound, letters=LETTERS.get(sound, sound), word=word, ipa=ipa, start=start, end=end,
            note=note, gain=round(gain, 3), file=filename))
    manifest = dict(status='audition-only', sampleRate=SR,
        processing='Trim, up to 12 dB gain, 1 ms edge fades, 30/250 ms silence. No looping or stretching.', entries=entries)
    (OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    (OUT / 'data.js').write_text('window.PHONICS_CUTS = '+json.dumps(manifest, ensure_ascii=False, indent=2)+';\n', encoding='utf-8')
    print(f'Created {len(entries)} audition clips in {OUT}')

if __name__ == '__main__':
    main()

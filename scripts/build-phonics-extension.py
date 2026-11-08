"""Build the reviewed subset; research rows never become lessons automatically.
Run from repository root. Downloads are separate, never done during a build.
"""
import json, pathlib, shutil, hashlib, argparse

ROOT = pathlib.Path(__file__).resolve().parents[1]
APP = ROOT / 'phonics-lab'
args = argparse.ArgumentParser()
args.add_argument('--research-dir', type=pathlib.Path, default=ROOT/'work/phonics-research-20261108')
args.add_argument('--english-dir', type=pathlib.Path, default=ROOT.parent/'english-stage/dist')
args = args.parse_args()
RESEARCH, ENGLISH = args.research_dir, args.english_dir
def read(p): return json.loads(p.read_text(encoding='utf-8'))
def write(p, x): p.write_text(json.dumps(x, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

raw = read(RESEARCH/'phonics_rules_ja.json')
assert len(raw['rules']) == 126
write(APP/'research/original-rules.json', raw)
shutil.copyfile(RESEARCH/'phonics_research_report_ja.md', APP/'research/original-report.md')
base = read(APP/'assets/audio/manifest.json')['entries']
other = read(ENGLISH/'data/audio-manifest.json')
cmu = (RESEARCH/'cmudict.dict').read_text(encoding='utf8').splitlines()
arpabet = {}
for line in cmu:
    key, *phones = line.split()
    arpabet.setdefault(key.split('(')[0], []).append(' '.join(phones))
rows = [
 ('cut','切る','kʌt','u','ʌ','kʌt'), ('cute','かわいい','kjuːt','u…e','juː','kjuːt'),
 ('duck','あひる','dʌk','ck','k','dʌk'), ('sock','くつ下','sɑk','ck','k','sɒk'),
 ('catch','つかまえる','kætʃ','tch','tʃ','kætʃ'), ('bridge','橋','brɪdʒ','dge','dʒ','brɪdʒ'),
 ('rain','雨','reɪn','ai','eɪ','reɪn'), ('day','日・1日','deɪ','ay','eɪ','deɪ'),
 ('moon','月','muːn','oo','uː','muːn'), ('book','本','bʊk','oo','ʊ','bʊk'),
 ('sea','海','siː','ea','iː','siː'), ('head','頭','hɛd','ea','ɛ','hed'),
 ('snow','雪','snoʊ','ow','oʊ','snəʊ'), ('cow','牛','kaʊ','ow','aʊ','kaʊ'),
 ('have','持っている','hæv','a…e','æ','hæv'), ('give','あげる','ɡɪv','i…e','ɪ','ɡɪv'),
 ('much','たくさん','mʌtʃ','ch','tʃ','mʌtʃ'),
]
words = {}
evidence = {}
ipa_map = dict(K='k', AH='ʌ', T='t', Y='j', UW='uː', D='d', S='s', AA='ɑ', AE='æ',
    CH='tʃ', B='b', R='r', IH='ɪ', JH='dʒ', EY='eɪ', N='n', M='m', UH='ʊ',
    IY='iː', HH='h', EH='ɛ', OW='oʊ', AW='aʊ', V='v', G='ɡ')
for id, ja, ipa, grapheme, sound, uk in rows:
    assert id in arpabet, id
    converted = [''.join(ipa_map.get(p.rstrip('012'), '?') for p in a.split()) for a in arpabet[id]]
    assert ipa in converted, (id, ipa, converted)
    if 'word:'+id in base:
        f = base['word:'+id]
        src = 'assets/audio/'+f['file']
        origin = 'phonics-lab/'+src
    else:
        f = next(f for f in other['files'] if f['id']=='g5-w-'+id and f['part']=='word' and f['speed']=='normal')
        origin = 'english-stage/dist/'+f['path']
        src = 'assets/audio/advanced/'+pathlib.Path(f['path']).name
        shutil.copyfile(ENGLISH/f['path'], APP/src)
    sha = hashlib.sha256((APP/src).read_bytes()).hexdigest()
    words[id] = dict(id=id, ja=ja, ipaUS=ipa, ipaUK=uk, grapheme=grapheme, sound=sound,
        locale='en-US', dictionaryStatus='cmu-crosschecked', audioStatus='listening-review-required',
        dictionary='https://dictionary.cambridge.org/pronunciation/english/'+id,
        audio=dict(src=src, kind='tts', voice='en-US-Neural2-F', sha256=sha, origin=origin))
    evidence[id] = dict(arpabet=arpabet[id], ipaUS=ipa, ipaUKReference=uk,
        note='US IPA transcribed from CMU phonemes; UK notation is informational, not graded. /ɛ/ and /e/ are notation variants here.')

def lesson(id, title, kind, prereq, rule, exception, wordids, questions, research):
    return dict(id=id,title=title,kind=kind,prerequisites=prereq,rule=rule,exception=exception,
        words=wordids,questions=questions,researchIds=research,ruleStatus='source-crosschecked',
        sources=['reading-rockets','logic-of-english'])
def q(id, prompt, options, answer, feedback, words):
    return dict(id=id,prompt=prompt,options=options,answer=answer,feedback=feedback,words=words)
lessons = [
 lesson('silent-e','eが付くと、音はどうなる？','A','文字の名前・短い母音。cutのuを聞こう。',
  '母音1文字＋子音1文字＋読まないeでは、母音が文字の名前の音になることが多いよ。cut → cute では /ʌ/ → /juː/。eを1音ずつ足して読むのではないよ。',
  'have・giveでは母音が名前の音にならない。語末のeには、ほかの働きもあるよ。', ['cut','cute','have','give'],
  [q('e-change','cut と cute の、母音の音は？',['同じ','変わる'],1,'cut /kʌt/ と cute /kjuːt/。uの音が変わり、最後のeだけの音は足さないよ。',['cut','cute']),
   q('e-limit','最後にeがあれば、いつも母音は名前の音？',['いつもそうなる','そうならない単語もある'],1,'have /hæv/、give /ɡɪv/ も聞いてみよう。eだけでは決められないね。',['have','give'])], ['PH030','PH033']),
 lesson('ck','短い母音のすぐあと：ck','A','短い母音 /ʌ/ と /ɑ/、子音 /k/。',
  '1音節の単語で、短い母音1つのすぐあとに最後の /k/ があると、ckと書くことが多いよ。duck・sockを見よう。',
  'どんな /k/ にもckを使うわけではない。母音のすぐあとか、単語の終わりかを見よう。', ['duck','sock'],
  [q('ck-end','duck の最後の /k/ を書くつづりは？',['ck','tch','dge'],0,'duckは /d/ /ʌ/ /k/。短い母音のすぐあとで、ckが1つの /k/ を表すよ。',['duck']),
   q('ck-position','duck・sockのckは、どこにある？',['短い母音のすぐあと・単語の終わり','単語の先頭'],0,'2つとも短い母音のすぐあとにあるね。ckを /k/ /k/ と2回読まないよ。',['duck','sock'])], ['PH010']),
 lesson('tch','3文字で1つの音：tch','A','短い母音と ch /tʃ/。',
  '1音節の単語で、短い母音1つのすぐあとに最後の /tʃ/ があると、tchと書くことが多いよ。catchのtchはまとめて1つの音。',
  'much・such・richなどは短い母音のあとでもch。絶対の書き方ではないよ。', ['catch','much'],
  [q('tch-fill','catch の最後の /tʃ/ を書くのは？',['ck','tch','dge'],1,'catch /kætʃ/ の最後は3文字で /tʃ/。tの音を別に足さないよ。',['catch']),
   q('tch-exception','much の最後も必ずtchに直す？',['直す','muchのまま覚える'],1,'much /mʌtʃ/ はch。短い母音のあとでも、この単語のつづりはそのまま覚えよう。',['much'])], ['PH011']),
 lesson('dge','3文字で1つの音：dge','A','短い母音 /ɪ/ と j /dʒ/。',
  '1音節の単語で、短い母音1つのすぐあとに最後の /dʒ/ があると、dgeと書くことが多いよ。bridgeを聞こう。',
  'すべての /dʒ/ がdgeではない。条件を確かめ、単語のつづりも覚えよう。', ['bridge'],
  [q('dge-fill','bridge の最後の /dʒ/ を書くのは？',['tch','ck','dge'],2,'bridge /brɪdʒ/ は、短い /ɪ/ のすぐあとにdge。3文字をまとめて読むよ。',['bridge'])], ['PH012']),
 lesson('ai-ay','同じ音に、ちがうつづり','B','文字の名前a /eɪ/。',
  'rainのaiとdayのayは、どちらも /eɪ/。同じ音でもつづりは1つとは限らないよ。aiは語の途中、ayは語の終わりによく出てくる。',
  'これはよくある位置の手がかり。音だけからaiかayかを必ず決められるわけではない。単語とつづりをいっしょに覚えよう。', ['rain','day'],
  [q('ai-same','rain の ai と day の ay の音は？',['同じ /eɪ/','必ず別の音'],0,'rain /reɪn/、day /deɪ/。つづりがちがっても、同じ音を表せるね。',['rain','day']),
   q('ay-place','day の /eɪ/ は、どのつづり？',['ai','ay'],1,'dayはay。これはdayという単語のつづりを確かめる問題だよ。',['day'])], ['PH034','PH035']),
 lesson('oo','ooには、いくつかの音','C','単語を最後まで聞き、母音だけを比べよう。',
  'moonのooは /uː/、bookのooは /ʊ/。同じooでも、単語によって音が変わるよ。',
  'bloodのooは /ʌ/ という別の音。音声の追加確認待ちなので今の聞き分け問題には出さない。文字の前後だけで音を決めないよ。', ['moon','book'],
  [q('oo-group','moon /muːn/ のooは、どちらの仲間？',['moonの /uː/','bookの /ʊ/'],0,'moonの /uː/ とbookの /ʊ/ は、長さだけでなく音の質も異なるよ。',['moon','book']),
   q('oo-limit','初めて見るooの単語は、どう確かめる？',['いつもmoonと同じ音にする','単語のお手本や辞書で確かめる'],1,'ooの音は1つではない。知っている単語の音と比べて、お手本で確かめよう。',['moon','book'])], ['PH050','PH051','PH052']),
 lesson('ea','eaも、1つの音とは限らない','C','seaとheadの母音を比べよう。',
  'seaのeaは /iː/、headのeaは /ɛ/。この /ɛ/ は辞書では /e/ とも書くよ。',
  'breakのeaは /eɪ/。音声の追加確認待ち。eaを見ただけでどの音か当てる決まりは作らず、単語で確かめよう。', ['sea','head'],
  [q('ea-group','head /hɛd/ のeaは、どちらの仲間？',['seaの /iː/','headの /ɛ/'],1,'headは /ɛ/。seaと同じeaでも音がちがうよ。単語を見て、聞き直してみよう。',['sea','head'])], ['PH037','PH038','PH039']),
 lesson('ow','owの音を、単語で比べよう','C','snowとcowの母音を比べよう。',
  'snowのowは米語では /oʊ/、cowのowは /aʊ/。どちらもowで書けるよ。',
  '語末のowでも音は1つに決まらない。英国のsnowは /əʊ/ と表す。地域のちがいもあり、どちらかを間違いにはしないよ。', ['snow','cow'],
  [q('ow-group','cow /kaʊ/ のowは、どちらの仲間？',['snowの /oʊ/','cowの /aʊ/'],1,'cowは /aʊ/。snowと同じ語末のowでも、音がちがうね。',['snow','cow']),
   q('ow-limit','語末にowがあれば、いつも同じ音？',['同じとは限らない','いつもsnowの音'],0,'snowもcowも最後はow。それだけでは音は決まらないね。',['snow','cow'])], ['PH043','PH060']),
 lesson('word-memory','手がかりとちがう部分を覚えよう','D','silent e・tchを試してから。',
  'have・give・muchは、ここで学んだ手がかりだけではつづりと音を決められない単語。違う部分に注目して、単語のお手本を覚えよう。',
  '例外に合わせて新しい決まりを無理に作らない。oughなどの多くの音は、次の段階で単語ごとに扱うよ。', ['have','give','much'],
  [q('memory-have','haveの母音は /æ/。最後のeから /eɪ/ に変えてよい？',['変えてよい','この単語の音を覚える'],1,'haveは /hæv/。知っている決まりは手がかり。お手本とちがうときは、単語を確かめよう。',['have','give'])], []),
]
data = dict(version='2026-11-08.1',locale='en-US',words=words,lessons=lessons,
    kinds={'A':'条件を見つける','B':'同じ音のつづりを比べる','C':'単語の音を分ける','D':'単語で覚える'},
    sources=[dict(id='reading-rockets',title='Reading Rockets — Phonics: In Practice',url='https://www.readingrockets.org/reading-101/reading-101-learning-modules/course-modules/phonics/practice'),dict(id='logic-of-english',title='Logic of English — Spelling Rules',url='https://logicofenglish.com/pages/spelling-rules'),dict(id='cmu',title='CMU Pronouncing Dictionary (US)',url='https://github.com/cmusphinx/cmudict'),dict(id='ufli',title='UFLI Scope & Sequence',url='https://ufli.education.ufl.edu/wp-content/uploads/2022/06/UFLI-Scope2.pdf')])
write(APP/'advanced-data.json',data)
(APP/'advanced-data.js').write_text('/* Generated by scripts/build-phonics-extension.py */\nwindow.PHONICS_ADVANCED = '+json.dumps(data,ensure_ascii=False,indent=2)+';\nObject.values(window.PHONICS_ADVANCED.words).forEach(w=>{window.PHONICS_AUDIO["word:"+w.id] ||= w.audio;});\n',encoding='utf8')
write(APP/'research/pronunciation-evidence.json',dict(source='https://github.com/cmusphinx/cmudict',dictionarySHA256=hashlib.sha256((RESEARCH/'cmudict.dict').read_bytes()).hexdigest(),words=evidence))
shutil.copyfile(RESEARCH/'LICENSE',APP/'research/CMUDICT-LICENSE.txt')
coverage=[]
for rule in raw['rules']:
    coverage.append(dict(id=rule['id'],tier=rule['tier'],grapheme=rule['grapheme'],kind=rule['kind'],
        status='research-only',lessons=[l['id'] for l in lessons if rule['id'] in l['researchIds']],
        note='Mapped lessons are a limited independently edited subset; this research row is not approved wholesale.'))
write(APP/'research/coverage.json',coverage)
print(f'Built {len(lessons)} lessons, {len(words)} words; {len(coverage)} research rows remain gated.')

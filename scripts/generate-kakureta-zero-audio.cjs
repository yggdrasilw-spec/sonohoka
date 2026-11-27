'use strict';

// Without --generate, prints the complete recording plan without calling Google.
// Set KAKURETA_PLAYWRIGHT to a Playwright module path if it is not installed locally.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.KAKURETA_PLAYWRIGHT || 'playwright');

const root = path.resolve(__dirname, '..');
const directory = path.join(root, 'media', 'kakureta-zero');
const voice = 'ja-JP-Neural2-B';
const speakingRate = 0.9;
const digits = ['れい', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];
const approvedIntro = new Map([
  ['「2」を 位取り表に 入れて みよう。', 'put-two.mp3'],
  ['一の位に、1 の カードを 1まいずつ 入れるよ。', 'place-cards.mp3'],
  ['このとき、小数第一位は どうなって いるかな?', 'reveal-tenths.mp3'],
  ['小数第一位には 0.1 の カードが なんこ あるかな?', 'count-tenths.mp3']
]);
const readings = [
  ['小数第一位', 'しょうすうだいいちい'],
  ['小数点', 'しょうすうてん'],
  ['位取り表', 'くらいどりひょう'],
  ['一の位', 'いちのくらい'],
  ['十の位', 'じゅうのくらい'],
  ['同じ位', 'おなじくらい'],
  ['位', 'くらい'],
  ['整数', 'せいすう'],
  ['右はし', 'みぎはし'],
  ['入っ', 'はいっ'],
  ['入れ', 'いれ'],
  ['答え', 'こたえ'],
  ['方眼', 'ほうがん'],
  ['ひっ算', 'ひっさん'],
  ['計算', 'けいさん'],
  ['正解', 'せいかい'],
  ['正しい', 'ただしい'],
  ['合っ', 'あっ'],
  ['数え', 'かぞえ'],
  ['書', 'か'],
  ['見', 'み'],
  ['大きさ', 'おおきさ'],
  ['空いて', 'あいて'],
  ['空', 'あ'],
  ['上げ', 'あげ'],
  ['数', 'かず'],
  ['考え', 'かんがえ'],
  ['大切', 'たいせつ']
];

function cardinal(value) {
  const number = Number(value);
  assert.ok(Number.isInteger(number) && number >= 0 && number <= 100, value);
  if (number === 100) return 'ひゃく';
  if (number < 10) return digits[number];
  const tens = Math.floor(number / 10);
  const ones = number % 10;
  return (tens === 1 ? '' : digits[tens]) + 'じゅう' + (ones ? digits[ones] : '');
}

function spokenLine(text) {
  let line = text
    .replace(/(?<=^|[=＝：:\s])[-−](\d+(?:\.\d+)?)/g, 'マイナス $1')
    .replace(/(\d*)\.(\d+)/g, (_, whole, fraction) =>
      (whole ? cardinal(whole) : '') + 'てん' + Array.from(fraction, digit => digits[digit]).join(''))
    .replace(/\d+/g, cardinal)
    .replaceAll('いちこ', 'いっこ')
    .replaceAll('ろくこ', 'ろっこ')
    .replaceAll('はちこ', 'はっこ')
    .replace(/[+＋]/g, ' たす ')
    .replace(/[-−]/g, ' ひく ')
    .replace(/[=＝]/g, ' イコール ')
    .replaceAll('○', 'まる')
    .replaceAll('×', 'ばつ')
    .replaceAll('あ・い', 'あ と い')
    .replaceAll('?', '？')
    .replaceAll('!', '！')
    .replace(/[:：]/g, '。')
    .replace(/\.{3,}(?=[！？])|…+(?=[！？])/g, '')
    .replace(/\.{3,}|…+/g, '、');
  for (const [word, reading] of readings) line = line.replaceAll(word, reading);
  assert.match(line, /^[\p{Script=Hiragana}\p{Script=Katakana}ー「」。、！？\s]+$/u, text + ' → ' + line);
  return line.replace(/ +([。！？、])/g, '$1').replace(/ +/g, ' ').trim();
}

function ssmlFor(text) {
  const paragraphs = text.split('\n').map(spokenLine);
  return '<speak>' + paragraphs.join('<break time="240ms"/>') + '</speak>';
}

async function collectText() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(path.join(root, 'kakureta_zero.html')).href);
    return await page.evaluate(() => {
      const texts = new Set();
      const collect = () => {
        for (const id of ['P', 'M']) {
          const text = narrationText(id);
          if (text) texts.add(text);
        }
      };
      const show = (phase, result = 0) => {
        ph = phase;
        done[st] = result;
        render(false);
        collect();
      };
      snd = false;
      for (st = 0; st < NS; st++) {
        show(0);
        if (st < firstQuestion) continue;
        if (st < example) {
          pick(OP[st - firstQuestion].find(value => value !== 0));
          collect();
          show(1, 1);
          continue;
        }
        if (st === example) {
          show(1);
          show(2, 1);
          continue;
        }
        const problem = PB[st - practice];
        if (problem[3] === 1 || problem[3] === 2) {
          ans(1 - problem[4]);
          collect();
        } else {
          const fields = [...document.querySelectorAll('.pg input')];
          const mistakes = new Map();
          fields.forEach(field => {
            const expected = EX[field.dataset.i];
            field.value = expected.x;
            if (!expected.x || mistakes.has(expected.r)) return;
            mistakes.set(expected.r, field);
          });
          for (const field of mistakes.values()) {
            const correct = field.value;
            field.value = '';
            chk();
            collect();
            field.value = correct;
          }
        }
        show(0, 1);
        if (st === NS - 1) show(0, 2);
      }
      return [...texts];
    });
  } finally {
    await browser.close();
  }
}

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function recordingPlan(texts) {
  return texts.map(text => {
    const existing = approvedIntro.get(text);
    if (existing) return { text, file: existing, approved: true };
    const ssml = ssmlFor(text);
    return { text, ssml, file: 'lesson-' + hash(JSON.stringify([voice, speakingRate, ssml])).slice(0, 16) + '.mp3' };
  });
}

function gcloud(args) {
  const windows = process.platform === 'win32';
  return execFileSync(windows ? 'cmd.exe' : 'gcloud', windows ? ['/d', '/s', '/c', 'gcloud ' + args.join(' ')] : args,
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

async function generate(jobs) {
  const unique = [...new Map(jobs.map(job => [job.file, job])).values()];
  for (const job of unique.filter(job => job.approved)) assert.ok(fs.existsSync(path.join(directory, job.file)), job.file);
  const pending = unique.filter(job => !job.approved && !fs.existsSync(path.join(directory, job.file)));
  if (pending.length) {
    const project = process.env.GOOGLE_CLOUD_PROJECT || gcloud(['config', 'get-value', 'project']);
    assert.match(project, /^[a-z][a-z0-9-]+$/);
    const headers = { Authorization: 'Bearer ' + gcloud(['auth', 'print-access-token']), 'x-goog-user-project': project, 'content-type': 'application/json' };
    for (let start = 0; start < pending.length; start += 5) {
      const batch = pending.slice(start, start + 5);
      const results = await Promise.allSettled(batch.map(async job => {
        const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            input: { ssml: job.ssml },
            voice: { name: voice, languageCode: 'ja-JP' },
            audioConfig: { audioEncoding: 'MP3', speakingRate }
          }),
          signal: AbortSignal.timeout(45000)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(job.file + ' HTTP ' + response.status + ' ' + (result.error?.status ?? ''));
        const bytes = Buffer.from(result.audioContent ?? '', 'base64');
        assert.ok(bytes.length > 2000 && bytes[0] === 255 && (bytes[1] & 224) === 224, job.file);
        fs.writeFileSync(path.join(directory, job.file), bytes);
        console.log(job.file + ' ' + [...job.ssml].length + ' characters');
      }));
      for (const result of results) if (result.status === 'rejected') throw result.reason;
    }
  }
  const published = Object.fromEntries(jobs.map(job => {
    const bytes = fs.readFileSync(path.join(directory, job.file));
    return [job.text, job.file + '?v=' + hash(bytes).slice(0, 12)];
  }));
  fs.writeFileSync(path.join(directory, 'narration.js'),
    '// Generated by scripts/generate-kakureta-zero-audio.cjs\nwindow.KAKURETA_ZERO_AUDIO = ' + JSON.stringify(published, null, 2) + ';\n');
  console.log('Packaged ' + unique.length + ' recordings (' + jobs.length + ' text entries).');
  console.log('New requests: ' + pending.length + '; SSML input characters: ' + pending.reduce((sum, job) => sum + [...job.ssml].length, 0));
}

(async () => {
  const jobs = recordingPlan(await collectText());
  if (process.argv.includes('--generate')) await generate(jobs);
  else console.log(JSON.stringify(jobs, null, 2));
})().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});

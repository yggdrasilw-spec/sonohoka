import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const { default: sharp } = await import(pathToFileURL('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs').href);
const root = 'C:/Users/user/sonohoka';
const src  = path.join(root, '.record_tashizan_daibouken');
const out  = path.join(root, '.record_tashizan_daibouken_captioned');
const poster = path.join(root, 'media/yggdrasilw_spec_github_io_sonohoka_tashizan_daibouken_html-intro.png');

const captions = [
  ['たしざん だいぼうけん', 1.0],
  ['ストーリーで計算の順番を学ぼう', 2.0],
  ['どちらから足しても同じになるよ', 2.0],
  ['数字をタップして入れ替えてみよう', 2.0],
  ['正解！ご褒美演出で達成感アップ', 1.5],
  ['スモールステップで足し算をマスター', 1.0],
];

function escapeXml(v) {
  return v.replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));
}

await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });
const files = (await fs.readdir(src)).filter(f => /^frame-\d+\.png$/.test(f)).sort();
for (let i = 0; i < files.length; i++) {
  const input = path.join(src, files[i]);
  const meta = await sharp(input).metadata();
  const w = meta.width ?? 1280;
  const h = meta.height ?? 720;
  const text = escapeXml(captions[i][0]);
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="${h - 92}" width="${w}" height="92" fill="#14213d" fill-opacity=".86"/><text x="${w / 2}" y="${h - 36}" text-anchor="middle" fill="#fff" font-family="Meiryo, sans-serif" font-size="30" font-weight="700">${text}</text></svg>`;
  await sharp(input).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).png().toFile(path.join(out, files[i]));
}
await fs.copyFile(path.join(out, files[2]), poster);
await fs.writeFile(path.join(out, 'storyboard.txt'), captions.map(([text, seconds], i) => `${i}: ${seconds}s - ${text} (${files[i]})`).join('\n'));
console.log(`captioned ${files.length} frames`);

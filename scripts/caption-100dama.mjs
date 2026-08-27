import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const { default: sharp } = await import(pathToFileURL('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs').href);

const src = 'C:/Users/user/sonohoka/.record_100dama';
const out = 'C:/Users/user/sonohoka/.record_100dama_captioned';
await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });
const files = (await fs.readdir(src)).filter(f => f.endsWith('.jpg')).sort();
const captions = [
  [0, 1.0, '百玉そろばん'],
  [1.0, 6.8, '右側の玉をタップして、数えてみよう'],
  [6.8, 8.8, '２とび・５とび・１０とびで数え方を広げる'],
  [8.8, 99, '合成・分解の流れも自動で確認できる'],
];
for (let i = 0; i < files.length; i++) {
  const t = i / 2;
  const caption = captions.find(([a, b]) => t >= a && t < b)?.[2] ?? '';
  const input = path.join(src, files[i]);
  const meta = await sharp(input).metadata();
  const w = meta.width ?? 1280;
  const h = meta.height ?? 720;
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="${h - 86}" width="${w}" height="86" fill="#120900" fill-opacity=".72"/><text x="${w / 2}" y="${h - 32}" text-anchor="middle" fill="white" font-family="Meiryo, sans-serif" font-size="30" font-weight="700">${caption}</text></svg>`;
  await sharp(input).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).jpeg({ quality: 92 }).toFile(path.join(out, files[i]));
}
await sharp(path.join(out, files[Math.min(files.length - 1, Math.floor(files.length * 0.82))])).png().toFile('C:/Users/user/sonohoka/media/100dama-soroban-intro.png');
console.log(`captioned ${files.length} frames`);

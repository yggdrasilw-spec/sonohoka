// Publish only the standalone kana lab; do not copy the unfinished shiritori changes.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),source=path.resolve(process.argv[2]||path.join(root,'../hiragana-ninshiki'));
const target=path.join(root,'kana-feedback-lab');
const files=[['kana-feedback-lab.html','index.html'],['kana-feedback-lab.css','kana-feedback-lab.css'],['kana-feedback-lab.mjs','kana-feedback-lab.mjs'],['kana-feedback-engine.mjs','kana-feedback-engine.mjs'],['data/kana-feedback-reference.json','data/kana-feedback-reference.json']];
const hash=b=>crypto.createHash('sha256').update(b.toString('utf8').replace(/\r\n/g,'\n')).digest('hex');
const pending=files.map(([name,dest])=>{
 const original=fs.readFileSync(path.join(source,name));let output=original;
 if(name.endsWith('.html')){
  const text=original.toString('utf8');if(!text.includes('href="shiritori.html"'))throw Error('Source back link changed; review the distribution adapter.');
  output=Buffer.from(text.replace('href="shiritori.html">しりとりへ','href="../app_links_portfolio.html">作品集へ'));
 }
 return {name,dest,original,output};
});
const revision=cp.execFileSync('git',['-C',source,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const status=cp.execFileSync('git',['-C',source,'status','--porcelain','--untracked-files=all','--',...files.map(f=>f[0])],{encoding:'utf8'}).trim();
for(const item of pending){const destination=path.join(target,item.dest);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,item.output);}
fs.writeFileSync(path.join(target,'_SOURCE.json'),JSON.stringify({repository:'https://github.com/yggdrasilw-spec/hiragana-ninshiki',sourceRevision:revision,sourceHasUncommittedChanges:!!status,hashNormalization:'UTF-8 text with LF line endings',adaptation:'Standalone lab only. HTML renamed to index.html; back link points to the portfolio.',files:pending.map(f=>({source:f.name,path:f.dest,sourceSha256:hash(f.original),sha256:hash(f.output)}))},null,2)+'\n');
fs.writeFileSync(path.join(target,'README.md'),'# かなの かたち研究室（作品集用コピー）\n\n元の開発先は hiragana-ninshiki。直接改修せず、元を更新して `node scripts/sync-kana-feedback-lab.cjs` で同期します。元のHEAD・未コミット状態・各ファイルのSHA-256は `_SOURCE.json` に記録しています。\n\n対象は「く・し・つ・り・こ・き」の６文字。助言の比較・人手レビュー用の試作で、字形の正誤判定は未実装です。\n\nお手本：KanjiVG / Ulrich Apel、https://kanjivg.tagaini.net/ 、CC BY-SA 3.0（https://creativecommons.org/licenses/by-sa/3.0/）。６文字を抽出し、SVG path文字列は変更せず、表示時に点列化・拡大します。参考線データとその派生データは同ライセンスです。画面と出力JSONにも帰属を表示しています。\n');
console.log('Synced '+pending.length+' lab files; source uncommitted='+!!status);

// Update portfolio distribution copies from the two independent repositories.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const jobs=[{source:path.resolve(process.argv[2]||'../source_private/word-problem-lab'),target:'word-problem-lab',prefix:'',repo:'word-problem-lab'},{source:path.resolve(process.argv[3]||'../tools/tape-diagram'),target:'tape-diagram',prefix:'app/',repo:'tape-diagram'}];
for(const job of jobs){
 const files=cp.execFileSync('git',['-C',job.source,'ls-files'],{encoding:'utf8'}).trim().split(/\r?\n/);
 for(const file of files){
  if(job.prefix&&!file.startsWith(job.prefix))continue;
  const relative=file.slice(job.prefix.length);
  if(!job.prefix&&!(/^(assets|docs|diagram)\//.test(relative)||/^[^/]+\.(html|js|css)$/.test(relative)||relative==='README.md'))continue;
  const target=path.join(root,job.target,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(job.source,file),target);
 }
 const revision=cp.execFileSync('git',['-C',job.source,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
 fs.writeFileSync(path.join(root,job.target,'_SOURCE.json'),JSON.stringify({repository:'https://github.com/yggdrasilw-spec/'+job.repo,revision},null,2)+'\n');
 console.log(job.target+': '+revision);
}

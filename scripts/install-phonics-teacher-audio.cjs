// node scripts/install-phonics-teacher-audio.cjs <review-output-directory>
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const {createHash}=require('node:crypto');
const root=path.resolve(__dirname,'../phonics-lab'),input=path.resolve(process.argv[2]||'output/phonics-teacher-20261101');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),ctx);
const sounds=ctx.window.PHONICS.sounds,source=JSON.parse(fs.readFileSync(path.join(input,'manifest.json'),'utf8'));
if(source.entries.length!==sounds.length||source.entries.some((e,i)=>e.id!==sounds[i].id))throw Error('Recording order must match all 30 lesson 2 sounds.');
const dir=path.join(root,'assets/audio'),manifestPath=path.join(dir,'manifest.json'),manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const provenance=[];
for(const [i,e] of source.entries.entries()){
 const from=path.resolve(input,e.file);if(!from.startsWith(input+path.sep))throw Error('Invalid source path');
 const data=fs.readFileSync(from);if(data.toString('ascii',0,4)!=='RIFF'||data.length<=44)throw Error('Expected nonempty WAV');
 const file='sound-'+e.id+'.wav';fs.writeFileSync(path.join(dir,file),data);
 manifest.entries['sound:'+e.id]={key:'sound:'+e.id,label:sounds[i].letters+' /'+sounds[i].ipa+'/',language:'en-US',voice:'先生の録音',provider:'teacher-recording',file,sourceSHA256:source.sourceSHA256,cut:{start:e.start,end:e.end},bytes:data.length};
 provenance.push({number:i+1,id:e.id,letters:sounds[i].letters,ipa:sounds[i].ipa,file,start:e.start,end:e.end,sha256:createHash('sha256').update(data).digest('hex')});
}
manifest.provider='Google Cloud TTS and teacher recording';
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(dir,'teacher-recording.json'),JSON.stringify({recordedDate:'2026-11-01',sourceSHA256:source.sourceSHA256,sourceDuration:source.duration,processing:source.processing,entries:provenance},null,2)+'\n');
execFileSync(process.execPath,[path.join(__dirname,'generate-phonics-audio.cjs'),'--publish-only'],{stdio:'inherit'});
console.log('Installed 30 lesson 2 teacher recordings.');

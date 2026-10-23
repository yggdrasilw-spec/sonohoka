// Record the actual add-one-group workflow; source footage stays in .portfolio-work.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'.portfolio-work/demo-94');
(async()=>{
 fs.mkdirSync(dir,{recursive:true});const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const ctx=await browser.newContext({viewport:{width:1280,height:820},recordVideo:{dir,size:{width:1280,height:820}}});
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(`http://127.0.0.1:${server.address().port}/sonohoka/kakezan_rescue.html`);await p.locator('#sound').click();await p.waitForTimeout(300);
  const marks=[],durations=[1,1.6,1.8,2,3.1];
  for(let i=0;i<5;i++){
   marks.push(Date.now()/1000);
   if(i===1)await p.locator('[data-mode="0"]').click();
   if(i===2)await p.locator('#play').click();
   await p.waitForTimeout(i===2?350:150);await p.screenshot({path:path.join(dir,`frame-0${i}.png`)});
   await p.waitForTimeout(Math.max(0,durations[i]*1000-(Date.now()/1000-marks[i])*1000+80));
  }
  assert.equal(await p.locator('#topAnswer').innerText(),'24');assert.deepEqual(errors,[]);
  const video=p.video(),end=Date.now()/1000;await ctx.close();await video.saveAs(path.join(dir,'source.webm'));
  const ff=cp.spawnSync('python',['-c','import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())'],{encoding:'utf8'}).stdout.trim();
  const probe=cp.spawnSync(ff,['-hide_banner','-i',path.join(dir,'source.webm')],{encoding:'utf8'}).stderr;
  const m=probe.match(/Duration: (\d+):(\d+):([\d.]+)/);assert(m,probe);const duration=+m[1]*3600+ +m[2]*60+ +m[3];
  const data={id:94,title:'九九のたすけ舟',url:'kakezan_rescue.html',source:'source.webm',captions:['九九のこたえをわすれちゃった！ どうする？','５つのたすけかたから、えらんでためそう','21＋3＝24。１つぶん、ふえたね！'],posterIndex:4,segments:marks.map(t=>Math.max(0,t-(end-duration))),sourceDurations:marks.map((t,i)=>(marks[i+1]||end)-t),durations,errors};
  fs.writeFileSync(path.join(dir,'storyboard.json'),JSON.stringify(data,null,2)+'\n');fs.writeFileSync(path.join(root,'scripts/portfolio-demos-94.json'),JSON.stringify(data,null,2)+'\n');console.log('CAPTURE PASS');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});

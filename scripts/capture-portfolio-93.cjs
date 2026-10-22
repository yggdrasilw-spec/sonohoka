// Actual browser footage: change the split, change direction, then explain one part.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'.portfolio-work/demo-93');
async function main(){
 fs.mkdirSync(dir,{recursive:true});const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const ctx=await browser.newContext({viewport:{width:1280,height:800},recordVideo:{dir,size:{width:1280,height:800}}});
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(`http://127.0.0.1:${server.address().port}/sonohoka/kakezan_wakeyou.html`);await p.locator('#mute').click();await p.waitForTimeout(1800);
  const marks=[],durations=[1,1.6,1.8,2,3.1];
  for(let i=0;i<5;i++){
   marks.push(Date.now()/1000);
   if(i===1)await p.locator('[data-s="k-"]').click();
   if(i===2)await p.locator('#mb').click();
   if(i===3){await p.locator('#h1').click();await p.locator('#hm').scrollIntoViewIfNeeded()}
   if(i===4){await p.locator('#hb').click();await p.locator('#hb').click();await p.locator('#hm').scrollIntoViewIfNeeded()}
   await p.waitForTimeout(300);await p.screenshot({path:path.join(dir,`frame-0${i}.png`)});
   await p.waitForTimeout(Math.max(0,(i===4?4800:durations[i]*1000)-(Date.now()/1000-marks[i])*1000+120));
  }
  await p.screenshot({path:path.join(dir,'frame-04.png')});
  assert.equal(await p.locator('#e1').textContent(),'7×4');assert.match(await p.locator('#hm').innerText(),/28$/);assert.deepEqual(errors,[]);
  const video=p.video(),end=Date.now()/1000;await ctx.close();await video.saveAs(path.join(dir,'source.webm'));
  const ff=cp.spawnSync('python',['-c','import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())'],{encoding:'utf8'}).stdout.trim();
  const m=cp.spawnSync(ff,['-hide_banner','-i',path.join(dir,'source.webm')],{encoding:'utf8'}).stderr.match(/Duration: (\d+):(\d+):([\d.]+)/),duration=+m[1]*3600+ +m[2]*60+ +m[3];
  const data={id:93,title:'かけ算を わけよう',url:'kakezan_wakeyou.html',source:'source.webm',captions:['アレイ図を わけて考えよう','切り方を変えて、2つの式をくらべる','ヒントで「何こずつ・いくつぶん」を確認'],posterIndex:4,segments:marks.map(t=>Math.max(0,t-(end-duration))),sourceDurations:marks.map((t,i)=>(marks[i+1]||end)-t),durations,errors};
  fs.writeFileSync(path.join(dir,'storyboard.json'),JSON.stringify(data,null,2)+'\n');fs.writeFileSync(path.join(root,'scripts/portfolio-demos-93.json'),JSON.stringify(data,null,2)+'\n');console.log('CAPTURE PASS',data.segments);
 }finally{await browser.close();server.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});

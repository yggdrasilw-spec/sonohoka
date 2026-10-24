// Record the real app. No teaching state or drawing is replaced for the video.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'.portfolio-work/demo-96');
(async()=>{fs.mkdirSync(dir,{recursive:true});const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir,size:{width:1280,height:720}}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/sonohoka/heikin_narasu.html`);await page.waitForTimeout(700);
 const marks=[],durations=[2,1.5,1.5,3,1.5];
 const mark=()=>marks.push(Date.now()/1000);
 const done=()=>page.waitForFunction(()=>!Narasu.snapshot().busy);
 const col=i=>page.locator(`[data-col="${i}"]`).click();
 mark();await page.screenshot({path:path.join(dir,'frame-00.png')});
 for(const [a,b] of [[0,2],[1,3],[0,2]]){await col(a);await col(b);await done();}
 await page.waitForTimeout(450);
 assert.deepEqual(await page.evaluate(()=>Narasu.snapshot().state.values),[3,3,3,3]);
 mark();await page.locator('#scenes button').nth(1).click();
 await page.locator('#soilHeight').selectOption('4');await page.locator('#soilMode').selectOption('layers');await page.locator('#soilPlay').click();
 await page.waitForFunction(()=>Narasu.snapshot().visual.soil.kind==='push'&&Narasu.snapshot().busy);
 await page.screenshot({path:path.join(dir,'frame-01.png')});
 mark();await page.waitForFunction(()=>!Narasu.snapshot().soilAuto&&!Narasu.snapshot().busy);
 await page.waitForTimeout(300);await page.screenshot({path:path.join(dir,'frame-02.png')});const soilEnd=Date.now()/1000;
 await page.locator('#scenes button').nth(2).click();await page.locator('#toJug').click();
 for(let i=0;i<2;i++){await col(i);await done();}
 mark();await page.locator('#divide').click();await done();await page.waitForTimeout(400);await page.screenshot({path:path.join(dir,'frame-03.png')});const divideEnd=Date.now()/1000;
 assert.deepEqual(await page.evaluate(()=>Narasu.snapshot().state.values),[120,120]);
 await page.locator('#next').click();for(const value of [240,2,120]){await page.locator('#answer').fill(String(value));await page.locator('#answerForm button').click();}
 await page.locator('#toggleDiagram').click();await page.locator('#toggleDiagram').click();
 mark();await page.waitForTimeout(200);await page.screenshot({path:path.join(dir,'frame-04.png')});await page.waitForTimeout(1600);
 assert(await page.locator('#drawing').isHidden());assert.match(await page.locator('#math').innerText(),/平均 ＝ 合計 ÷ 個数/);assert.deepEqual(errors,[]);
 const end=Date.now()/1000,video=page.video();await context.close();await video.saveAs(path.join(dir,'source.webm'));
 const ff=cp.spawnSync('python',['-c','import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())'],{encoding:'utf8'}).stdout.trim();
 const probe=cp.spawnSync(ff,['-hide_banner','-i',path.join(dir,'source.webm')],{encoding:'utf8'}).stderr,m=probe.match(/Duration: (\d+):(\d+):([\d.]+)/);assert(m,probe);
 const duration=+m[1]*3600+ +m[2]*60+ +m[3],origin=end-duration;
 const data={id:96,title:'ならして ぴったり！｜平均の導入',url:'heikin_narasu.html',sourceCommit:cp.spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),source:'source.webm',captions:['玉を動かして、同じ高さに','土を運ぶ動画で「ならす」を知る','水を合わせて等分。平均＝合計÷個数'],posterIndex:3,segments:marks.map(t=>Math.max(0,t-origin)),sourceDurations:marks.map((t,i)=>i===2?undefined:(marks[i+1]||end)-t),durations,errors};
 // Leave preparation outside the adopted intervals.
 data.sourceDurations[2]=soilEnd-marks[2];data.sourceDurations[3]=divideEnd-marks[3];
 data.crop=[1080,490,100,130];
 fs.writeFileSync(path.join(dir,'storyboard.json'),JSON.stringify(data,null,2)+'\n');fs.writeFileSync(path.join(root,'scripts/portfolio-demos-96.json'),JSON.stringify(data,null,2)+'\n');console.log('CAPTURE PASS',data);
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

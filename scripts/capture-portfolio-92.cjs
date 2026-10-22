// Real browser recording: select 5's table, add groups, then show the array.
const fs=require('fs'),path=require('path'),assert=require('assert'),cp=require('child_process');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'.portfolio-work/demo-92');
async function main(){
 fs.mkdirSync(dir,{recursive:true});const server=serve();await new Promise(r=>server.listen(8962,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
 const ctx=await browser.newContext({viewport:{width:1280,height:640},recordVideo:{dir,size:{width:1280,height:640}}});const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:8962/sonohoka/kuku_1to9.html');await p.locator('#startBtn').click();
 assert.equal(await p.locator('.unit-card').count(),9);await p.locator('.unit-card').first().click();
 await p.locator('#bSnd').click();await p.locator('#bVoice').click();await p.waitForTimeout(600);
 const marks=[],durations=[1,1.6,1.8,2,3.1];
 for(let i=0;i<5;i++){marks.push(Date.now()/1000);if(i===1||i===2)await p.locator('#bAdd').click();if(i===3)await p.locator('#bMode').click();if(i===4)await p.locator('#bHint').click();await p.waitForTimeout(180);await p.screenshot({path:path.join(dir,`frame-0${i}.png`)});await p.waitForTimeout(Math.max(0,durations[i]*1000-(Date.now()/1000-marks[i])*1000+150));}
 assert.match(await p.locator('#exp').innerText(),/10/);assert(await p.locator('#st').evaluate(e=>e.classList.contains('arr')));assert.deepEqual(errors,[]);
 const v=p.video(),end=Date.now()/1000;await ctx.close();await v.saveAs(path.join(dir,'source.webm'));
 const ff=cp.spawnSync('python',['-c','import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())'],{encoding:'utf8'}).stdout.trim();
 const meta=cp.spawnSync(ff,['-hide_banner','-i',path.join(dir,'source.webm')],{encoding:'utf8'}).stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);const duration=+meta[1]*3600+ +meta[2]*60+ +meta[3];
 const info={id:92,title:'かけざんの ぼうけん（1〜9のだん）',url:'kuku_1to9.html',source:'source.webm',captions:['1〜9のだんを、まとまりで考える','5こずつ増やすと、式はどうなる？','アレイ図と色ヒントで、式の意味を確かめる'],posterIndex:4,segments:marks.map(t=>Math.max(0,t-(end-duration))),sourceDurations:marks.map((t,i)=>(marks[i+1]||end)-t),durations,errors};
 fs.writeFileSync(path.join(dir,'storyboard.json'),JSON.stringify(info,null,2));fs.writeFileSync(path.join(root,'scripts/portfolio-demos-92.json'),JSON.stringify(info,null,2)+'\n');console.log('CAPTURE PASS',info.segments);
 }finally{await browser.close();server.close();}
}
main().catch(e=>{console.error(e);process.exit(1)});

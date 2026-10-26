// Record the real My Town UI, including continuous turning; no substitute frames.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'.portfolio-work/demo-98');
(async()=>{fs.mkdirSync(dir,{recursive:true});const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const context=await browser.newContext({viewport:{width:1280,height:640},recordVideo:{dir,size:{width:1280,height:640}}}),p=await context.newPage(),marks=[];
 const initial={version:1,title:'Our Town',plots:['elementary-school',null,'park','library','house','post-office',null,'zoo','station','restaurant','supermarket','hospital',null,'flower-shop',null,'bus-stop'],start:0,goal:11};
 await p.goto(`http://127.0.0.1:${server.address().port}/sonohoka/my-town/`);await p.evaluate(data=>localStorage.setItem('my-town-v1',JSON.stringify(data)),initial);await p.reload();await p.waitForTimeout(400);
 const mark=async i=>{marks[i]=Date.now()/1000;await p.screenshot({path:path.join(dir,`frame-0${i}.png`)});};
 const next=async()=>{await p.locator('#map-dialog').evaluate(()=>{});await p.locator('[data-map-action="next"]').click();await p.waitForFunction(()=>!MyTown.snapshot().busy);};
 await mark(0);await p.waitForTimeout(1300);await p.locator('[data-id="aquarium"]').click();await p.locator('.plot').nth(1).click();await mark(1);await p.waitForTimeout(1500);
 await p.locator('#route-tab').click();await p.locator('#speed').selectOption('500');await p.locator('#open-map').click();await p.locator('#map-zoom').selectOption('1');await next();await mark(2);await p.waitForTimeout(1200);await next();
 await mark(3);await next();await next();await next();
 const turnSpan=Date.now()/1000-marks[3];await next();await next();await mark(4);await p.waitForTimeout(2600);
 const end=Date.now()/1000,video=p.video();await context.close();await video.saveAs(path.join(dir,'source.webm'));
 const ff=cp.spawnSync('python',['-c','import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())'],{encoding:'utf8'}).stdout.trim();
 const probe=cp.spawnSync(ff,['-hide_banner','-i',path.join(dir,'source.webm')],{encoding:'utf8'}).stderr,m=probe.match(/Duration: (\d+):(\d+):([\d.]+)/);if(!m)throw Error(probe);
 const duration=+m[1]*3600+ +m[2]*60+ +m[3],origin=end-duration;
 const data={id:98,title:'My Town｜わたしの町を英語で案内しよう',url:'my-town/',source:'source.webm',parentCommit:cp.spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),sourceHashes:Object.fromEntries(['index.html','app.js','town-model.js','data.js','style.css'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'my-town',f))).digest('hex')])),initialState:initial,captions:['絵を置いて、自分の町をつくる','大きな地図で、英語の道案内','向きと矢印で、左・右を確かめる'],posterIndex:4,segments:marks.map(t=>Math.max(0,t-origin)),sourceDurations:[1.25,1.45,1.1,turnSpan,2.5],durations:[1,1.4,1.1,3.6,2.4]};
 fs.writeFileSync(path.join(dir,'storyboard.json'),JSON.stringify(data,null,2)+'\n');fs.writeFileSync(path.join(root,'scripts/portfolio-demos-98.json'),JSON.stringify(data,null,2)+'\n');console.log('CAPTURE PASS',JSON.stringify({turnSpan,recordedSeconds:duration}));
}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

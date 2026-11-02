const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');const {serve}=require('./portfolio-demo-inspect.cjs');
(async()=>{const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{for(const [id,file,title,captions] of [
 [104,'compass_3d','3Dコンパス｜円をかこう',['視点を変えて、針と鉛筆を見よう','半径を保って、コンパスを回す','円を重ねて、模様をつくろう']],
 [105,'compass_pattern','コンパスで もようを かこう',['32の模様から、ひとつ選ぼう','中心と半径を、順番に確かめる','コンパスを回して、線をうつそう']]]){
 const dir=path.resolve(`.portfolio-work/demo-${id}`);fs.mkdirSync(dir,{recursive:true});const context=await browser.newContext({viewport:{width:1280,height:900},recordVideo:{dir,size:{width:1280,height:900}}}),p=await context.newPage();
 await p.goto(`http://127.0.0.1:${server.address().port}/sonohoka/${file}.html`);await p.waitForTimeout(500);const marks=[];
 const mark=async(i,wait=2300)=>{marks[i]=Date.now()/1000;await p.screenshot({path:path.join(dir,`frame-0${i}.png`)});await p.waitForTimeout(wait)};
 if(id===104){await p.locator('[data-v="obl"]').click();await mark(0);await p.locator('[data-v="top"]').click();await mark(1);await p.locator('#sl input').nth(3).fill('6');await p.locator('#run').click();await mark(2);await p.locator('[data-p="target"]').click();await p.waitForTimeout(2000);await mark(3);await p.waitForTimeout(18000);await mark(4);}
 else{await p.locator('#ovo').uncheck();await p.locator('#osf').uncheck();await mark(0);await p.locator('#family').selectOption('同心円');await p.locator('#nx').click();await p.waitForTimeout(900);await mark(1);await p.locator('#nx').click();await p.waitForTimeout(1800);await mark(2);await p.locator('#nx').click();await p.waitForTimeout(1800);await mark(3);await p.locator('#nx').click();await mark(4);}
 const end=Date.now()/1000,video=p.video();await context.close();await video.saveAs(path.join(dir,'source.webm'));
 const ff=cp.spawnSync('python',['-c','import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())'],{encoding:'utf8'}).stdout.trim(),probe=cp.spawnSync(ff,['-hide_banner','-i',path.join(dir,'source.webm')],{encoding:'utf8'}).stderr,m=probe.match(/Duration: (\d+):(\d+):([\d.]+)/);if(!m)throw Error(probe);
 const duration=+m[1]*3600+ +m[2]*60+ +m[3],origin=end-duration;
 const data={id,title,url:file+'.html',source:'source.webm',sourceSHA256:crypto.createHash('sha256').update(fs.readFileSync(file+'.html')).digest('hex'),captions,crop:[1280,900,0,0],posterIndex:4,segments:marks.map(t=>Math.max(0,t-origin)),sourceDurations:[2.2,2.2,2.2,2.2,2.2],durations:[1.5,1.6,1.8,2.2,2.4]};fs.writeFileSync(path.join(dir,'storyboard.json'),JSON.stringify(data,null,2)+'\n');fs.writeFileSync(`scripts/portfolio-demos-${id}.json`,JSON.stringify(data,null,2)+'\n');console.log('CAPTURED',id);
}}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);process.exitCode=1});

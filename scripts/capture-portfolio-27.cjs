// Record actual handwriting, kana buttons, keyboard, and both image sources.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'.portfolio-work/demo-27');
async function main(){
 fs.mkdirSync(dir,{recursive:true});const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const ctx=await browser.newContext({viewport:{width:1280,height:800},recordVideo:{dir,size:{width:1280,height:800}}});
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(`http://127.0.0.1:${server.address().port}/hiragana-ninshiki/shiritori.html`);
  await p.waitForFunction(()=>ST.wlLoaded);await p.locator('#noticeStart').click();
  await p.evaluate(()=>launchGame());
  await p.evaluate(()=>{ST.cpuGenres=['food'];saveSettings();const m=document.createElement('div');m.id='captureMarker';Object.assign(m.style,{position:'fixed',left:'0',top:'0',width:'12px',height:'12px',zIndex:'999999',pointerEvents:'none'});document.body.append(m);});
  const colors=[[240,30,30],[30,240,30],[30,30,240],[240,30,240],[30,240,240]],durations=[2,1.7,1.8,2,2];
  async function scene(index,action,hold=1200){await p.evaluate(c=>document.getElementById('captureMarker').style.background=`rgb(${c.join(',')})`,colors[index]);if(action)await action();await p.waitForTimeout(hold);await p.screenshot({path:path.join(dir,`frame-0${index}.png`)});}
  await p.locator('#tabCanvas').click();await p.waitForTimeout(600);
  await scene(0,async()=>{const b=await p.locator('#drawCanvas').boundingBox();await p.mouse.move(b.x+b.width*.42,b.y+b.height*.2);await p.mouse.down();await p.mouse.move(b.x+b.width*.33,b.y+b.height*.5,{steps:12});await p.mouse.move(b.x+b.width*.43,b.y+b.height*.8,{steps:12});await p.mouse.up();});
  assert(await p.evaluate(()=>ST.strokes.length>0));
  await p.locator('#tabBtn').click();await p.evaluate(()=>setCurrentInput(''));await p.waitForTimeout(300);
  await scene(1,async()=>{for(const text of ['ね','こ']){await p.locator('#modeBtn .kb-key').filter({hasText:new RegExp('^'+text+'$')}).click();await p.waitForTimeout(220);}});
  assert.equal(await p.evaluate(()=>ST.currentInput),'ねこ');
  await p.locator('#tabKbd').click();await p.locator('#kbdInput').fill('');await p.waitForTimeout(300);
  await scene(2,async()=>{await p.locator('#kbdInput').pressSequentially('りんご',{delay:200});});
  await p.locator('#btnOk').click();await p.waitForFunction(()=>ST.history.length>=2&&!ST.cpuBusy);
  await p.locator('.link-node').first().click();await p.waitForFunction(()=>{const e=document.querySelector('#detImgBox .img-main');return e?.complete&&e.naturalWidth>0;});
  assert.match(await p.locator('#detImgBox .img-credit').innerText(),/AI生成/);await scene(3,null,1800);
  await p.locator('[onclick="showPage(\'settings\')"]').click();await p.locator('[data-settings-tab="images"]').click();
  await p.locator('#imagePolicyControls select[data-category="default"]').selectOption('wikimedia');await p.locator('[onclick="showPage(\'game\')"]').click();
  await p.waitForFunction(()=>{const e=document.querySelector('#detImgBox .img-main');return e?.complete&&e.naturalWidth>0&&e.src.includes('wikimedia.org');},null,{timeout:30000});
  const wikiCredit=await p.locator('#detImgBox .img-credit').innerText();assert(wikiCredit.length>10);await scene(4,null,2000);
  assert.deepEqual(errors,[]);const video=p.video();await ctx.close();await video.saveAs(path.join(dir,'source.webm'));
  const ff=cp.spawnSync('python',['-c','import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())'],{encoding:'utf8'}).stdout.trim();
  // Find scene starts inside the recording itself; wall clocks can drift.
  const raw=cp.spawnSync(ff,['-v','error','-i',path.join(dir,'source.webm'),'-vf','crop=2:2:4:4,fps=20','-f','rawvideo','-pix_fmt','rgb24','-'],{maxBuffer:10000000}).stdout;
  const starts=colors.map(c=>{for(let n=0;n<raw.length/12;n++){if(c.every((v,k)=>Math.abs(raw[n*12+k]-v)<50))return n/20;}throw Error('Missing scene marker');});
  const end=raw.length/12/20;
  const info={id:27,title:'しりとりアプリ',url:'https://yggdrasilw-spec.github.io/hiragana-ninshiki/shiritori.html',sourceCommit:cp.spawnSync('git',['-C','C:/Users/user/hiragana-ninshiki','rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),source:'source.webm',captions:['手書きで、ことばを入力','ボタンでも、キーボードでも遊べる','AI生成・Wikiの画像と、ことばの意味を確認'],posterIndex:3,maskMarker:true,segments:starts,sourceDurations:starts.map((t,i)=>Math.min([2,1.7,1.9,1.8,2][i],(starts[i+1]||end)-t)),durations,wikiCredit,errors};
  fs.writeFileSync(path.join(dir,'storyboard.json'),JSON.stringify(info,null,2));fs.writeFileSync(path.join(root,'scripts/portfolio-demos-27.json'),JSON.stringify(info,null,2)+'\n');console.log('CAPTURE PASS',info);
 }finally{await browser.close();server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1});

const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
const E=require('../word-problem-lab/curriculum.js');
const root=path.resolve(__dirname,'..'),work=path.join(root,'.portfolio-work');
async function main(){
 const server=serve();await new Promise(r=>server.listen(8957,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{for(const id of [80,81]){
  const directory=path.join(work,'demo-'+id);fs.mkdirSync(directory,{recursive:true});
  const context=await browser.newContext({viewport:{width:1280,height:640},recordVideo:{dir:directory,size:{width:1280,height:640}}});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const url='http://127.0.0.1:8957/sonohoka/'+(id===80?'word-problem-lab':'tape-diagram')+'/index.html';
  await page.goto(url);await page.waitForTimeout(500);
  if(id===80)await page.locator('.learningGrid').evaluate(e=>window.scrollTo(0,e.offsetTop-15));
  else{
   await page.locator('#introConvert').click();await page.locator('#introNext').click();await page.locator('#introAuto').click();
   await page.waitForFunction(()=>!document.getElementById('introNext').disabled);await page.locator('#introNext').click();
  }
  await page.waitForTimeout(1000);
  const clockOrigin=await page.evaluate(()=>performance.now()),segments=[];
  // Playwright video timestamps begin when the page is created; synchronize with its first frame.
  const recordingOffset=clockOrigin/1000;
  async function frame(index){segments.push(recordingOffset+(await page.evaluate(()=>performance.now())-clockOrigin)/1000);await page.waitForTimeout(150);await page.screenshot({path:path.join(directory,`frame-0${index}.png`)});await page.waitForTimeout(2000);}
  await frame(0);
  if(id===80){
   const m=E.model(E.lessons[0]);await page.locator(`[data-role="${m.unknown}"]`).click();await page.locator('#expression').fill(m.paths[0].expression);await page.locator('#answer').fill(E.format(m.answer));await frame(1);
   await page.locator(`input[name=reason][value="${m.paths[0].id}"]`).check();await frame(2);
   await page.locator('#solveForm button[type=submit]').click();await page.locator('#feedback').scrollIntoViewIfNeeded();
   if(!await page.locator('#feedback').evaluate(e=>e.classList.contains('success')))throw Error('Expected correct answer');await frame(3);await frame(4);
  }else{
   await page.locator('#introNext').click();await frame(1);await page.locator('#introTransform').click();await page.waitForTimeout(1000);await frame(2);
   await page.locator('#introNext').click();await page.waitForTimeout(1200);await frame(3);await frame(4);
  }
  const video=page.video();await context.close();await video.saveAs(path.join(directory,'source.webm'));
  const data={id,title:id===80?'おはなしの しき（文章題ラボ）':'おはなしを 図にしよう（テープ図）',url,segments,durations:[1.8,1.8,1.8,2,2.1],captions:id===80?['お話を読んで、知りたい数を選ぶ','式と答え、そう考えた理由を入力','答えと理由を確かめて、次のお話へ']:['たくさんの○を、数のまとまりで見る','○からテープ図に変えて考える','２本のテープで、全体と部分を確かめる']};
  fs.writeFileSync(path.join(directory,'storyboard.json'),JSON.stringify(data,null,2));if(errors.length)throw Error(errors.join(';'));console.log('RECORDED',id);
 }}finally{await browser.close();server.close();}
}
main().catch(e=>{console.error(e);process.exit(1)});

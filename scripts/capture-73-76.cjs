const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const apps = [
  {id:73, file:'chouhoukei_seihoukei_fukushu_v4.html', slug:'chouhoukei-seihoukei-fukushu', title:'長方形・正方形のふくしゅう', captions:['形のなまえと意味を復習','先生と一緒に図を見て考える','答えと説明でたしかめる'], actions:[p=>p.locator('[data-mode="teacher"]').click(),p=>p.locator('#revealBtn').click(),p=>p.locator('#nextBtn').click(),p=>p.locator('#revealBtn').click()]},
  {id:74, file:'ryokan_units_package/index.html', slug:'ryokan-units', title:'たんいをえらぼう', captions:['身近なものの量と単位を学ぶ','絵を見てぴったりの単位を選ぶ','量感カードで理由も確認'], actions:[p=>p.getByRole('button',{name:'ながさ（2年）',exact:true}).click(),async p=>{const unit=await p.evaluate(()=>S.q.unit);await p.getByRole('button',{name:unit,exact:true}).click();},p=>p.getByRole('button',{name:'どうして？',exact:true}).click(),p=>p.locator('.expic').scrollIntoViewIfNeeded()]},
  {id:75, file:'setsuzoku_v3_28images_package/index.html', slug:'setsuzoku-28images', title:'つなぎ言葉であそぼう・絵で考える', captions:['絵と文でつなぎ言葉を考える','前後の意味に合う答えを選ぶ','正解と解説でつながりを確認'], actions:[p=>p.locator('.mbtn').first().click(),async p=>{const keys=await p.evaluate(()=>S.probs[S.i].opts.flatMap((o,k)=>o.ok?[k]:[]));for(const k of keys)await p.locator(`.opt[data-k="${k}"]`).click();},p=>p.locator('#go').click(),p=>p.locator('#fb').scrollIntoViewIfNeeded()]},
  {id:76, file:'hako_shape_review_app_package/hako_shape_review_app.html', slug:'hako-shape-review', title:'はこの形のふくしゅう', captions:['箱の形を見て考える','先生と一問一答で確認','答えと図で性質をたしかめる'], actions:[p=>p.locator('[data-start="learn"]').click(),p=>p.locator('#revealBtn').click(),p=>p.locator('#nextBtn').click(),p=>p.locator('#revealBtn').click()]}
];
async function main(){
 apps[0].prepare=async p=>{await p.locator('[data-mode="teacher"]').click();for(let i=0;i<13;i++){await p.locator('#revealBtn').click();await p.locator('#nextBtn').click();}};
 apps[0].actions=[p=>p.locator('#revealBtn').click(),p=>p.locator('#nextBtn').click(),p=>p.locator('#revealBtn').click(),p=>p.locator('#nextBtn').click()];
 apps[3].actions=[p=>p.locator('[data-start="learn"]').click(),p=>p.locator('#lessonScreen [data-act="auto"]').first().click(),p=>p.locator('#revealBtn').click(),p=>p.locator('#nextBtn').click()];
 apps[3].captions=['箱の形を見て考える','箱を回して見えない面も確認','答えと図で性質をたしかめる'];
 const server=require('node:http').createServer(async(req,res)=>{try{const file=path.join(root,decodeURIComponent(req.url.split('?')[0]));const data=await fs.readFile(file);const ext=path.extname(file);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.webp':'image/webp','.png':'image/png','.mp4':'video/mp4','.json':'application/json'})[ext]||'application/octet-stream');res.end(data)}catch{res.statusCode=404;res.end('Not found')}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 if(process.argv.includes('--portfolio')){
  const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/app_links_portfolio.html');
  for(const app of apps){
   const card=page.locator(`[data-register-order="${app.id}"]`);if(await card.count()!==1)throw new Error('Card missing or duplicated '+app.id);
   const media=card.locator('.card-media');await media.scrollIntoViewIfNeeded();await card.locator('img').evaluate(img=>img.decode());
   await media.hover();const video=card.locator('video');await page.waitForFunction(el=>el.readyState>=3&&el.currentTime>0,await video.elementHandle());
   const metadata=await video.evaluate(v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight}));if(Math.abs(metadata.duration-9.5)>.15||metadata.width!==1280)throw new Error(JSON.stringify(metadata));
   await card.screenshot({path:path.join(root,'.record_73-76',app.slug,'portfolio-card.png')});
   await media.click();await page.waitForFunction(()=>document.querySelector('#mediaModal video').currentTime>0);await page.locator('#mediaModal video').evaluate(v=>{v.currentTime=8});await page.waitForTimeout(300);
   await page.screenshot({path:path.join(root,'.record_73-76',app.slug,'playback-end.png')});await page.locator('.media-modal-close').click();
   const href=await card.locator('.actions a').getAttribute('href');if(!href.endsWith(app.file))throw new Error('Incorrect app link');
   console.log(JSON.stringify({card:app.id,hover:'ok',modal:'ok',...metadata}));
  }
  await page.setViewportSize({width:390,height:844});await page.locator('#searchInput').fill('はこの形のふくしゅう');await page.locator('[data-register-order="76"]').screenshot({path:path.join(root,'.record_73-76','mobile-card.png')});
  if(errors.length)throw new Error(errors.join('; '));await browser.close();server.close();return;
 }
 const check=process.argv.includes('--check');
 for(const app of apps.filter(a=>!process.argv.includes('--shapes')||[73,76].includes(a.id))){
  const dir=path.join(root,'.record_73-76',app.slug);await fs.mkdir(dir,{recursive:true});
  const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1,...(check?{}:{recordVideo:{dir,size:{width:1280,height:720}}})});
  const recordingStart=Date.now();const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
  await page.goto(base+'/'+app.file);await page.waitForTimeout(500);
  const html=await fs.readFile(path.join(root,app.file),'utf8');
  const assets=[...html.matchAll(/(?:img\/)[\w\/-]+\.webp/g)].map(m=>m[0]);
  for(const asset of new Set(assets))await fs.access(path.join(root,path.dirname(app.file),asset));
  if(!check){
   if(app.prepare)await app.prepare(page);
   const start=Date.now();const sourceStart=(start-recordingStart)/1000;await page.screenshot({path:path.join(dir,'frame-00.png')});await page.waitForTimeout(1100);
   for(let i=0;i<app.actions.length;i++){await app.actions[i](page);await page.waitForTimeout(350);await page.screenshot({path:path.join(dir,`frame-0${i+1}.png`)});await page.waitForTimeout(1350);}
   const remaining=10000-(Date.now()-start);if(remaining>0)await page.waitForTimeout(remaining);
   const video=page.video();await context.close();await video.saveAs(path.join(dir,'source.webm'));
   await fs.writeFile(path.join(dir,'storyboard.json'),JSON.stringify({...app,actions:undefined,prepare:undefined,source:'source.webm',sourceStart,interval:[sourceStart,sourceStart+9.5]},null,2));
  }else await context.close();
  if(errors.length)throw new Error(app.file+': '+errors.join('; '));
  console.log(JSON.stringify({app:app.id,status:'ok',assets:new Set(assets).size,recorded:!check}));
 }
 await browser.close();
 server.close();
}
main().catch(e=>{console.error(e);process.exit(1)});

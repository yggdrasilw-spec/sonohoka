// Run with Playwright installed: node scripts/qa-kakezan-kyoushitsu.cjs
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const out=process.env.QA_OUTPUT||path.join(root,'tmp','kakezan-kyoushitsu-qa');
fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return}res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'image/png');res.end(data)});
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({headless:true,channel:process.env.QA_BROWSER||'chrome'});
  try{
    const base=`http://127.0.0.1:${server.address().port}`;
    for(const mobile of [false,true]){
      const ctx=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1366,height:768},hasTouch:mobile,isMobile:mobile,reducedMotion:'reduce'});
      await ctx.addInitScript(()=>{
        window.audioLog={spoken:[],cancels:0};
        class Utterance{constructor(text){this.text=text}}
        Object.defineProperty(window,'SpeechSynthesisUtterance',{value:Utterance});
        Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[{lang:'ja-JP',name:'Test Japanese',localService:true}],addEventListener(){},speak(u){audioLog.spoken.push(u.text)},cancel(){audioLog.cancels++},resume(){},paused:false}});
      });
      const page=await ctx.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.goto(base+'/kakezan_kyoushitsu.html');
      await page.waitForSelector('#vw canvas');
      await page.locator('#go0').click();
      // Drag immediately, while the narration is still queued after the effect.
      const box=await page.locator('#vw canvas').boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
      const drag=async()=>{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+80,y+25,{steps:8});await page.mouse.up()};
      await drag();
      await page.waitForFunction(()=>audioLog.spoken.some(t=>t.includes('もとに')));
      if(!mobile){
        await page.waitForTimeout(1200);
        await page.screenshot({path:path.join(root,'media','portfolio-kakezan-kyoushitsu.png')});
      }
      const before=await page.evaluate(()=>({c:audioLog.cancels,y:V.y,d:V.d}));
      await drag();
      await page.mouse.wheel(0,180);
      const after=await page.evaluate(()=>({c:audioLog.cancels,y:V.y,d:V.d}));
      assert.equal(after.c,before.c,'drag/wheel must preserve active narration');
      assert.notEqual(after.y,before.y,'drag must still rotate');
      assert.notEqual(after.d,before.d,'wheel must still zoom');
      if(mobile){
        const cdp=await ctx.newCDPSession(page);
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-30,y,id:1},{x:x+30,y,id:2}]});
        await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-60,y,id:1},{x:x+60,y,id:2}]});
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        assert.equal(await page.evaluate(()=>audioLog.cancels),after.c,'pinch must preserve narration');
      }
      // Selecting a new subject replaces the old speech; the guide remains available.
      await page.evaluate(()=>pick(0));
      await page.waitForFunction(()=>audioLog.spoken.some(t=>t.includes('でんき')));
      assert.equal(await page.locator('#ri').isVisible(),true);
      await page.locator('#guide summary').click();
      assert.equal(await page.locator('#guide').evaluate(e=>e.open),true);
      await page.locator('#ri').focus();await page.keyboard.press('Enter');
      await page.waitForTimeout(900);
      assert.ok((await page.evaluate(()=>audioLog.spoken.at(-1))).includes('もとに'));
      const n=await page.evaluate(()=>audioLog.cancels);
      await page.locator('#vb').click();
      assert.ok(await page.evaluate(()=>audioLog.cancels)>n,'OFF must stop speech');
      assert.equal(await page.locator('#ri').isVisible(),false);
      await page.locator('#vb').click();
      await page.locator('#bk').click();
      await page.waitForTimeout(1200);
      await page.screenshot({path:path.join(out,mobile?'mobile.png':'desktop.png')});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'no horizontal overflow');
      assert.deepEqual(errors,[]);
      const portfolio=await ctx.newPage();await portfolio.goto(base+'/app_links_portfolio.html');
      await portfolio.locator('#searchInput').fill('きょうしつ');
      await portfolio.waitForTimeout(200);
      assert.equal(await portfolio.locator('#app-91').isVisible(),true);
      assert.equal(await portfolio.locator('#app-91 .actions a').getAttribute('href'),'kakezan_kyoushitsu.html');
      assert.equal(await portfolio.locator('#app-91 img').evaluate(e=>e.complete&&e.naturalWidth>0),true);
      console.log(`${mobile?'mobile':'desktop'}: queued/active narration, drag, zoom, replay, OFF, guide, portfolio passed`);
      await ctx.close();
    }
  }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});

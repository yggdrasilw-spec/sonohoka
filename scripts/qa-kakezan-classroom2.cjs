const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'tmp','classroom2-qa');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return}res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':'text/javascript; charset=utf-8');res.end(data)});
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try{
    const base=`http://127.0.0.1:${server.address().port}/kakezan_kyoushitsu.html`;
    if(process.env.QA_VISUAL_ONLY){
      const page=await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'});
      await page.goto(base+'?room=2');await page.waitForFunction(()=>typeof SP!=='undefined'&&SP.length===9);
      await page.locator('#go0').click();await page.waitForTimeout(1400);
      await page.evaluate(()=>{VO=0;on=false});
      await page.screenshot({path:path.join(out,'desktop-overview.png')});
      for(let i=0;i<9;i++){
        await page.evaluate(i=>{pick(i);hint=2;show=true},i);await page.waitForTimeout(1300);
        assert.equal(await page.evaluate(()=>{
          const W=$('vw').clientWidth,H=$('vw').clientHeight,P=v=>{const p=v.clone().project(cam);return[(p.x+1)*W/2,(1-p.y)*H/2]};
          const s=SP[cur],gs=s.od[gi],R=rings(s,gs,P,W,H);
          return gs.every((g,k)=>g.every(j=>s.it[j].k.every(v=>{const [x,y]=P(v),r=R[k];return Math.abs(x-r.x)<=r.hw+.1&&Math.abs(y-r.y)<=r.hh+.1})));
        }),true,'hint must contain every item in the group');
        await page.screenshot({path:path.join(out,`station-${i}.png`)});
      }
      await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{all(OV);cur=-1;show=false;$('work').hidden=true;$('idle').hidden=false});await page.waitForTimeout(1400);
      await page.screenshot({path:path.join(out,'mobile-overview.png'),fullPage:true});
      await page.evaluate(()=>{pick(3);hint=2;show=true});await page.waitForTimeout(1400);
      await page.screenshot({path:path.join(out,'mobile-focused.png'),fullPage:true});
      console.log('Final visual QA: 9 complete hint bounds, desktop/mobile screenshots passed');return;
    }
    for(const mobile of [false,true]){
      const ctx=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1366,height:768},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
      const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(base);await page.waitForFunction(()=>typeof SP!=='undefined'&&SP.length===21);
      await page.locator('#coverSettings').click();assert.equal(await page.locator('#settings').evaluate(e=>e.open),true);
      await page.locator('#settings form button').click();assert.equal(await page.locator('#cover').count(),1);
      await page.locator('#go0').click();await page.waitForTimeout(600);
      const canvas=await page.locator('#vw canvas').boundingBox(),x=canvas.x+canvas.width/2,y=canvas.y+canvas.height/2;
      const before=await page.evaluate(()=>({y:V.y,d:V.d}));
      await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+80,y+20,{steps:8});await page.mouse.up();await page.mouse.wheel(0,100);
      assert.notEqual(await page.evaluate(()=>V.y),before.y);assert.notEqual(await page.evaluate(()=>V.d),before.d);
      // Equations alone never mark completion.
      await page.evaluate(()=>{on=false;VO=0;for(let i=0;i<SP.length;i++){pick(i);const q=SP[i].gr[0];document.querySelectorAll('.n').forEach((e,k)=>e.value=[q.a,q.b,q.a*q.b][k]);chk()}});
      assert.equal(await page.evaluate(()=>done.size),0);
      assert.equal(await page.evaluate(()=>roomTimer),0);
      // Finish all 21 subjects via the actual equation and explanation buttons.
      await page.evaluate(()=>{for(let i=0;i<SP.length;i++){pick(i);const q=SP[i].gr[0];document.querySelectorAll('.n').forEach((e,k)=>e.value=[q.a,q.b,q.a*q.b][k]);chk();document.querySelector('#why .opt[data-ok="1"]').click()}});
      assert.equal(await page.evaluate(()=>done.size),21);
      assert.ok(await page.evaluate(()=>roomTimer)>0);
      await page.waitForURL('**/*room=2*',{timeout:15000});
      await page.waitForFunction(()=>typeof SP!=='undefined'&&SP.length===9);
      assert.equal(await page.locator('#cover').count(),0,'automatic entry needs no second start tap');
      assert.equal(await page.locator('#vw canvas').count(),1);
      assert.equal(await page.evaluate(()=>done.size),0);
      assert.equal(await page.evaluate(()=>FN.length),0,'room 1 fans were never built');
      await page.evaluate(()=>{on=false;VO=0});
      await page.waitForTimeout(1400);
      await page.screenshot({path:path.join(out,mobile?'mobile-overview.png':'desktop-overview.png')});
      // Check one-to-one object/group mappings and all four explanation levels, both array orientations.
      const counts=await page.evaluate(()=>SP.map(s=>({n:s.n,N:s.it.length,groups:s.gr.map(q=>({a:q.a,b:q.b,indices:q.gs.flat()})),meshes:s.ms.length})));
      for(const s of counts)for(const q of s.groups){assert.equal(q.a*q.b,s.N,s.n);assert.equal(new Set(q.indices).size,s.N,s.n);assert.equal(q.indices.length,s.N)}
      for(const level of [1,2,3,4]){
        await page.evaluate(level=>{LV=level;$('lv').value=level},level);
        for(let i=0;i<9;i++){
          const orientations=await page.evaluate(i=>SP[i].gr.length,i);
          for(let j=0;j<orientations;j++){
            await page.evaluate(({i,j})=>{pick((i+1)%SP.length);pick(i);gi=j;const q=SP[i].gr[j];document.querySelectorAll('.n').forEach((e,k)=>e.value=[q.a,q.b,q.a*q.b][k]);chk()}, {i,j});
            assert.equal(await page.evaluate(()=>ok1),true);
            if(level===1)await page.locator('#why .opt[data-ok="1"]').click();
            else if(level===4){await page.evaluate(()=>{const q=SP[cur].gr[gi];$('wt').value=`${q.per} ${q.a}${SP[cur].u}ずつ、${q.b}${q.g}ぶん あるから、${q.a}×${q.b}`});await page.locator('#wc').click()}
            else{await page.evaluate(()=>document.querySelectorAll('#why .bl').forEach(e=>e.value=e.dataset.a));await page.locator('#wc').click()}
            assert.equal(await page.evaluate(()=>ok2),true,`level ${level}, item ${i}, orientation ${j}`);
            await page.evaluate(()=>{clearTimeout(roomTimer);roomTimer=0});
          }
        }
      }
      assert.equal(await page.evaluate(()=>done.size),9);
      assert.equal(await page.evaluate(()=>roomTimer),0,'test paused progression while checking explanation levels');
      assert.equal(await page.locator('#cnt').textContent(),'9 / 9');
      if(!mobile){
        for(let i=0;i<9;i++){
          await page.evaluate(i=>{pick((i+1)%9);pick(i);hint=2;show=true},i);await page.waitForTimeout(1300);
          assert.equal(await page.evaluate(()=>{const r=cv.getBoundingClientRect(),p=SP[cur].it[0].c.clone().project(cam);return hitAt({clientX:r.left+(p.x+1)*r.width/2,clientY:r.top+(1-p.y)*r.height/2})}),i,'visible item must remain selectable');
          await page.screenshot({path:path.join(out,`station-${i}.png`)});
        }
      }
      if(mobile){await page.evaluate(()=>{pick(0);hint=2;show=true});await page.waitForTimeout(1300);await page.screenshot({path:path.join(out,'mobile-focused.png'),fullPage:true})}
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      // Settings allow either room immediately, and navigation resets the state.
      await page.locator('#settingsButton').click();await page.locator('#room1').click();
      await page.waitForURL(url=>!url.searchParams.has('arrival')&&url.searchParams.get('room')==='1');
      await page.waitForFunction(()=>typeof SP!=='undefined'&&SP.length===21);
      await page.locator('#go0').click();await page.waitForTimeout(600);
      await page.locator('#settingsButton').click();await page.locator('#room2').click();
      await page.waitForURL('**/*room=2');await page.waitForFunction(()=>typeof SP!=='undefined'&&SP.length===9);
      await page.locator('#go0').click();await page.waitForTimeout(600);
      assert.equal(await page.evaluate(()=>done.size),0);assert.equal(await page.locator('#vw canvas').count(),1);
      assert.deepEqual(errors,[]);
      console.log(`${mobile?'mobile':'desktop'}: auto progression, fresh scene, 9 mappings, 4 levels, orientations, settings passed`);
      await ctx.close();
    }
  }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});

const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'tmp','gym-qa');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(f,(e,b)=>{if(e){res.writeHead(404).end();return}res.setHeader('Content-Type',f.endsWith('.html')?'text/html; charset=utf-8':'text/javascript; charset=utf-8');res.end(b)})});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'chrome'});
  try{
    const base=`http://127.0.0.1:${server.address().port}/kakezan_kyoushitsu.html`;
    for(const mobile of [false,true]){
      const ctx=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1366,height:768},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
      const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(base+'?room=2');await page.waitForFunction(()=>typeof SP!=='undefined'&&SP.length===9);
      await page.locator('#go0').click();await page.waitForTimeout(550);
      const solve=async(withExplanation)=>page.evaluate(withExplanation=>{on=false;VO=0;LV=1;for(let i=0;i<SP.length;i++){pick(i);const q=SP[i].gr[0];document.querySelectorAll('.n').forEach((e,k)=>e.value=[q.a,q.b,q.a*q.b][k]);chk();if(withExplanation)document.querySelector('#why .opt[data-ok="1"]').click()}},withExplanation);
      await solve(false);assert.equal(await page.evaluate(()=>done.size),0);assert.equal(await page.evaluate(()=>roomTimer),0);
      await solve(true);assert.equal(await page.evaluate(()=>done.size),9);assert.ok(await page.evaluate(()=>roomTimer)>0);
      // Opening settings pauses the automatic transition; closing resumes it.
      await page.locator('#settingsButton').click();assert.equal(await page.evaluate(()=>roomTimer),0);
      await page.locator('#settings form button').click();await page.waitForFunction(()=>roomTimer>0);
      await page.waitForURL('**/*room=3*',{timeout:15000});await page.waitForFunction(()=>typeof SP!=='undefined'&&SP.length===6);
      assert.equal(await page.locator('#cover').count(),0);assert.equal(await page.locator('#vw canvas').count(),1);
      assert.equal(await page.evaluate(()=>done.size),0);assert.equal(await page.evaluate(()=>FN.length),0);
      await page.evaluate(()=>{on=false;VO=0});await page.waitForTimeout(1400);
      await page.screenshot({path:path.join(out,mobile?'mobile-overview.png':'desktop-overview.png'),fullPage:mobile});
      const maps=await page.evaluate(()=>SP.map(s=>({n:s.n,N:s.it.length,groups:s.gr.map(q=>({a:q.a,b:q.b,indices:q.gs.flat()}))})));
      for(const s of maps)for(const q of s.groups){assert.equal(q.a*q.b,s.N,s.n);assert.equal(new Set(q.indices).size,s.N);assert.equal(q.indices.length,s.N)}
      assert.equal(await page.evaluate(()=>SP[0].vaultStages),5);assert.equal(maps[0].N,15);assert.deepEqual(maps[0].groups.map(q=>[q.a,q.b]),[[5,3]]);
      for(const level of [1,2,3,4]){
        await page.evaluate(level=>{LV=level;$('lv').value=level},level);
        for(let i=0;i<6;i++)for(let j=0;j<await page.evaluate(i=>SP[i].gr.length,i);j++){
          await page.evaluate(({i,j})=>{pick((i+1)%SP.length);pick(i);gi=j;const q=SP[i].gr[j];document.querySelectorAll('.n').forEach((e,k)=>e.value=[q.a,q.b,q.a*q.b][k]);chk()},{i,j});
          assert.equal(await page.evaluate(()=>ok1),true);
          if(level===1)await page.locator('#why .opt[data-ok="1"]').click();
          else if(level===4){await page.evaluate(()=>{const q=SP[cur].gr[gi];$('wt').value=`${q.per} ${q.a}${SP[cur].u}ずつ、${q.b}${q.g}ぶん あるから、${q.a}×${q.b}`});await page.locator('#wc').click()}
          else{await page.evaluate(()=>document.querySelectorAll('#why .bl').forEach(e=>e.value=e.dataset.a));await page.locator('#wc').click()}
          assert.equal(await page.evaluate(()=>ok2),true,`level ${level}, item ${i}, orientation ${j}`);
        }
      }
      assert.equal(await page.evaluate(()=>done.size),6);assert.equal(await page.evaluate(()=>roomTimer),0,'gym is the final room');
      for(let i=0;i<(mobile?1:6);i++){
        await page.evaluate(i=>{pick(i===0?1:0);pick(i);hint=2;show=true},i);await page.waitForTimeout(1300);
        assert.equal(await page.evaluate(()=>{const s=SP[cur],W=$('vw').clientWidth,H=$('vw').clientHeight,P=v=>{const p=v.clone().project(cam);return[(p.x+1)*W/2,(1-p.y)*H/2]},gs=s.od[gi],R=rings(s,gs,P,W,H);return gs.every((g,k)=>g.every(j=>s.it[j].k.every(v=>{const[x,y]=P(v),r=R[k];return Math.abs(x-r.x)<=r.hw+.1&&Math.abs(y-r.y)<=r.hh+.1}))) }),true);
        await page.screenshot({path:path.join(out,mobile?'mobile-vault.png':`station-${i}.png`),fullPage:mobile});
      }
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      await page.goto(base);await page.waitForFunction(()=>typeof SP!=='undefined'&&SP.length===21);
      await page.locator('#coverSettings').click();await page.locator('#room3').click();await page.waitForURL('**/*room=3');
      await page.waitForFunction(()=>typeof SP!=='undefined'&&SP.length===6);await page.locator('#go0').click();await page.waitForTimeout(550);
      assert.equal(await page.evaluate(()=>done.size),0);assert.equal(await page.locator('#vw canvas').count(),1);assert.deepEqual(errors,[]);
      console.log(`${mobile?'mobile':'desktop'}: room 2 → gym, paused/resumed transition, 5-stage × 3 vaults, all 4 levels, 6 mappings, settings passed`);
      await ctx.close();
    }
  }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});

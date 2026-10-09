const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.integer-release-qa');fs.mkdirSync(out,{recursive:true});
const report={math:{},browser:[],checks:[]};
function context(name){const code=fs.readFileSync(path.join(root,name+'.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(name==='card_rank_number'?/rs\(\);draw\(\);\s*$/:/draw\(\);\s*$/,'');const c=vm.createContext({document:{addEventListener(){},querySelector(){return null},querySelectorAll(){return[];}}});vm.runInContext(code,c);return c;}
report.math.rank=vm.runInContext(`(()=>{let count=0,invalid=0;for(const n of [3,4])for(let code=0;code<10**n;code++){
 const v=String(code).padStart(n,'0').split('').map(Number),counts=Array(10).fill(0),nums=[];v.forEach(d=>counts[d]++);
 const build=(prefix,left)=>{if(!left){nums.push(String(prefix));return;}for(let d=0;d<10;d++)if(counts[d]&&(prefix||d)){counts[d]--;build(prefix*10+d,left-1);counts[d]++;}};build(0,n);
 for(const dir of [0,1])for(const k of [1,2,3]){Object.assign(S,{n,v,dir,k});calc();const expected=nums.slice().sort((a,b)=>dir?+a-+b:+b-+a);if(JSON.stringify(D.list)!==JSON.stringify(expected)||D.target!==(expected[k-1]??null)||D.kk!==k)throw Error('rank '+JSON.stringify({n,v,dir,k}));
 if(!D.target)invalid++;else for(let p=0;p<n;p++){const L=D.levels[p],g=L.gr[L.gi];if(L.rank<g.from||L.rank>g.to)throw Error('group rank');if(levelText(p).includes('のこりは 1まいだけ'))throw Error('false remaining claim');}count++;}}
 return{count,invalid,mismatches:0};})()`,context('card_rank_number'));
report.math.parity=vm.runInContext(`(()=>{let count=0,noSolution=0,hints=0;for(let code=0;code<1000;code++){const v=String(code).padStart(3,'0').split('').map(Number),nums=[];
 for(let a=0;a<3;a++)for(let b=0;b<3;b++)for(let c=0;c<3;c++)if(a!==b&&b!==c&&a!==c&&v[a])nums.push(100*v[a]+10*v[b]+v[c]);
 for(MODE=0;MODE<4;MODE++){const eligible=nums.filter(n=>n%2===(MODE<2?0:1)),expected=eligible.length?(MODE%2===0?Math.max(...eligible):Math.min(...eligible)):null,P=p1calc(v);if(P.best!==expected)throw Error('parity');if(expected===null){noSolution++;if(!noParityText(v).includes('作れません'))throw Error('missing reason');}
 else for(const c of P.cands){const remaining=[0,1,2].filter(i=>i!==c.ci);if(!c.ri.every(i=>remaining.includes(i))||c.ri.length!==2||v[c.ri[0]]===0)throw Error('hint candidate invalid');hints++;}
 V[0]=v;G.tr=[-1,-1,-1];G.hint=0;G.ok=0;trHint();if(expected===null){if(!G.msg.includes('作れません'))throw Error('empty hint');}else{trHint();for(const c of P.cands)if(!G.msg.includes('<b>'+c.num+'</b>'))throw Error('candidate missing from hint');trHint();const got=[0,1,2].map(s=>v[G.tr.indexOf(s)]).join('');if(+got!==expected)throw Error('hint answer mismatch');trCheck();if(!G.ok)throw Error('hint answer rejected');}count++;}}
 let gcdCases=0,lcmCases=0;for(let a=1;a<=60;a++)for(let b=1;b<=60;b++){let g=0;for(let d=1;d<=Math.min(a,b);d++)if(a%d===0&&b%d===0)g=d;if(gcd(a,b)!==g)throw Error('gcd');gcdCases++;if(a<=30&&b<=30){let L=1;while(L%a||L%b)L++;if(lcm(a,b)!==L)throw Error('lcm');const t=540+L,h=Math.floor(t/60),m=t%60;if(jikoku(L)!==(h<12?'午前':'午後')+(h%12||12)+'時'+(m?m+'分':''))throw Error('time');lcmCases++;}}
 return{count,noSolution,hintCandidates:hints,gcdCases,lcmCases,mismatches:0};})()`,context('seisuu-hatten'));

async function main(){
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const errors=[];try{
  const p=await browser.newPage({viewport:{width:1366,height:900},reducedMotion:'reduce'});
  p.on('pageerror',e=>errors.push(e.message));
  await p.route('https://www.gstatic.com/**',r=>r.abort());
  const url=name=>'file:///'+root.replaceAll('\\','/')+'/'+name;
  for(const file of ['card_rank_number.html','seisuu-hatten.html']){
   await p.goto(url(file));
   for(const [width,height] of [[1366,900],[1024,768],[768,1024],[390,844],[320,640],[640,480]]){
    await p.setViewportSize({width,height});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),file+' overflow');
    if(file==='seisuu-hatten.html')for(let i=0;i<4;i++){
     await p.locator('#tabs button').nth(i).click();
     const steps=await p.evaluate(()=>T[cur].steps);
     for(let s=0;s<steps;s++){
      await p.evaluate(s=>{step=s;draw()},s);
      assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'scene overflow');
      assert(!/テスト|大問|クッキー|東町|西公園/.test(await p.locator('body').innerText()));
     }
    }
    report.browser.push({file,width,height,overflow:false});
    await p.screenshot({path:path.join(out,file.replace('.html','')+'-'+width+'.png'),fullPage:true});
   }
   if(file==='card_rank_number.html'){
    await p.setViewportSize({width:1366,height:900});await p.goto(url(file));
    await p.screenshot({path:path.join(root,'media/portfolio-card-rank.png'),fullPage:false});
    await p.locator('[data-card="0"]').click();await p.locator('[data-place="0"]').click();
   }else{
    assert.deepEqual(await p.evaluate(()=>V),[[2,5,8],[20,30],[4,10],[9,12]]);
    await p.locator('#tabs button').nth(1).click();await p.evaluate(()=>{step=4;draw()});
    assert((await p.locator('#right').innerText()).includes('10袋'));
    await p.locator('#da').click();assert(await p.evaluate(()=>UI.autoplay));
    await p.locator('#da').click();assert(!(await p.evaluate(()=>UI.autoplay)));
    await p.locator('#tabs button').nth(3).click();await p.evaluate(()=>{step=3;draw()});
    assert((await p.locator('#right').innerText()).includes('午前9時36分'));
   }
  }
  await p.goto(url('seisuu_no_seishitsu_yasashiku.html'));
  const state=()=>p.evaluate(()=>JSON.stringify(__SEISUU_YASASHIKU__.getState()));
  const initial=await state();await p.locator('#cover [data-open-hatten]').click();
  await p.frameLocator('#hattenFrame').locator('#tabs button').first().waitFor();
  assert(await p.locator('#hattenDialog').evaluate(d=>d.open));
  await p.locator('#hattenClose').click();assert.equal(await state(),initial);
  await p.waitForFunction(()=>document.getElementById('hattenFrame').getAttribute('src')==='about:blank');
  await p.locator('#startBtn').click();
  await p.evaluate(()=>__SEISUU_YASASHIKU__.renderScene(__SEISUU_YASASHIKU__.SCENES.findIndex(s=>s.id==='s1q1')));
  const before=await state();
  for(const [width,height] of [[1280,900],[768,1024],[390,844],[320,640]]){
   await p.setViewportSize({width,height});await p.locator('#app [data-open-hatten]').click();
   const frame=p.frameLocator('#hattenFrame');await frame.locator('#tabs button').first().waitFor();
   await frame.locator('#tabs button').nth(1).click();
   await frame.locator('#nx').click();
   assert(await p.locator('#hattenDialog').evaluate(d=>d.getBoundingClientRect().width<=innerWidth+1));
   await p.screenshot({path:path.join(out,'embedded-'+width+'.png'),fullPage:true});
   await frame.locator('#tabs button').nth(1).focus();await p.keyboard.press('Escape');
   await p.waitForFunction(()=>!document.getElementById('hattenDialog').open);
   assert.equal(await state(),before,'development must not change lesson progress');
   assert.equal(await p.locator('#app [data-open-hatten]').evaluate(e=>e===document.activeElement),true);
  }
  await p.locator('#lessonJumpBtn').click();assert.equal(await p.locator('.lesson-jump-card').count(),9);
  await p.getByRole('button',{name:'発展を開く',exact:true}).click();await p.locator('#hattenClose').click();assert.equal(await state(),before);
  await p.evaluate(()=>__SEISUU_YASASHIKU__.renderScene(__SEISUU_YASASHIKU__.SCENES.findIndex(s=>s.type==='finalSummary')));
  await p.locator('#lessonMain [data-open-hatten]').click();await p.locator('#hattenClose').click();
  // Check the exact portfolio content intended for commit, with existing CSS/JS.
  const staged=fs.readFileSync(process.env.PORTFOLIO_REVIEW_FILE||path.join(root,'app_links_portfolio.html'),'utf8');
  const preview=path.join(root,'.integer-release-portfolio.html');fs.writeFileSync(preview,staged);
  await p.goto(url('.integer-release-portfolio.html'));
  await p.locator('#searchInput').fill('数のカード');assert(await p.locator('#app-84').isVisible());
  assert.equal(await p.locator('#app-84 .actions a').getAttribute('href'),'card_rank_number.html');
  await p.locator('#searchInput').fill('非公開');assert(await p.locator('#app-85').isVisible());
  assert.equal(await p.locator('#app-85 a,#app-85 video').count(),0);
  assert(!/gusu_kisu|integer-test-explanations|\/Downloads\//.test(staged));
  await p.setViewportSize({width:390,height:844});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await p.screenshot({path:path.join(out,'portfolio-private-mobile.png'),fullPage:true});fs.unlinkSync(preview);
  assert.deepEqual(errors,[]);report.checks=['6 sizes; all 18 development scenes','rewritten defaults and vocabulary','bag answer and animation pause','watering answer at 09:36','cover/top/jump/end entries','4 embedded sizes; Escape and focus restore','lesson records unchanged; iframe unloaded','exact staged portfolio: search, public link, private no link or screenshots','page errors: 0'];
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({math:report.math,screens:report.browser.length,checks:report.checks,errors},null,2));
 }finally{await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});

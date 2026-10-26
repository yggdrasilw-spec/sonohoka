const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const file=path.resolve(__dirname,'../bunsuu_ibunbo.html');
const out=path.resolve(__dirname,'../output/bunsuu-review');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});
try{const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('file:///'+file.replaceAll('\\','/'));
let screens=0,states=0;
const count=await p.locator('#course option').count();assert.equal(count,13);
for(let i=0;i<count-1;i++){
 await p.selectOption('#course',String(i));
 const pages=await p.evaluate(()=>S[st.s].p.length);
 for(let k=0;k<pages;k++){
  assert.equal(await p.locator('#c>.card').count(),1);
  for(const el of await p.locator('.mo').all()){
   const id=await el.getAttribute('id'),max=+(await el.getAttribute('data-mx'));
   for(let n=0;n<=max;n++){
    await p.evaluate(([id,n])=>{MS[id]=n;mr(document.getElementById(id))},[id,n]);
    assert.doesNotMatch(await el.innerText(),/NaN|undefined/);states++;
   }
  }
  assert.doesNotMatch(await p.locator('#c').innerText(),/NaN|undefined/);screens++;
  if(k<pages-1)await p.locator('#nt').click();
 }
}
// Every fixed and randomized exercise: independently computed rational answer.
await p.selectOption('#course',String(count-1));
for(let i=0;i<110;i++){
 const prob=await p.evaluate(i=>{pi=i;pr();return P[pi]},i);
 const [t,a,b,c,d]=prob;
 let n=t==='e'?a*c/b:t==='r'?a:t==='a'?a*d+c*b:a*d-c*b;
 let den=t==='e'?c:t==='r'?b:b*d;
 const gcd=(x,y)=>y?gcd(y,x%y):x,g=gcd(n,den);
 if(t!=='e'){n/=g;den/=g}
 await p.locator('#n').fill(String(n));if(t!=='e')await p.locator('#m').fill(String(den));
 await p.getByRole('button',{name:'こたえあわせ',exact:true}).click();assert.match(await p.locator('#fb').innerText(),/せいかい/);
}
await p.evaluate(()=>{pi=0;pr()});
for(const invalid of ['','-3','1.5','1e0','abc']){
 await p.locator('#n').fill(invalid);await p.evaluate(()=>ck());assert.doesNotMatch(await p.locator('#fb').innerText(),/せいかい/);
}
await p.locator('#n').fill('３');await p.evaluate(()=>ck());assert.match(await p.locator('#fb').innerText(),/せいかい/);
// Modal: keyboard alternative to tapping tiny number-line ticks, focus return.
await p.getByRole('button',{name:'📏 数直線ずかん',exact:true}).click();
await p.selectOption('#nd','6');await p.selectOption('#nk','3');await p.getByRole('button',{name:'この 分数を えらぶ'}).click();
assert.match(await p.locator('#nlr').innerText(),/同じ/);assert(await p.locator('#app').evaluate(e=>e.inert));
await p.keyboard.press('Escape');assert.equal(await p.locator('#app').evaluate(e=>e.inert),false);
await p.evaluate(()=>{pi=2;pr();hint();hint();hint()});
assert.equal(await p.locator('#hb .mo').count(),1);await p.locator('#hb').getByRole('button',{name:'▶ つぎの へんか',exact:true}).click();
assert.equal(await p.locator('#hb .mo').getAttribute('data-s'),'1');
await p.evaluate(()=>{pi=1;pr();hint()});await p.locator('#n').fill('12');
const score=await p.evaluate(()=>sc);await p.evaluate(()=>ck());assert.equal(await p.evaluate(()=>sc),score);assert.match(await p.locator('#fb').innerText(),/ヒントで/);
// Stop a running replay before a navigation/restart; stale timers must not advance it.
await p.selectOption('#course','2');await p.locator('#nt').click();await p.evaluate(()=>mall('preEq'));await p.getByRole('button',{name:'この 画面を もういちど'}).click();
await p.waitForTimeout(2800);assert.equal(await p.locator('#preEq').getAttribute('data-s'),'0');
for(const [width,height] of [[1366,768],[1024,768],[768,1024],[390,844],[320,640]]){
 await p.setViewportSize({width,height});await p.evaluate(()=>jump(0));
 for(const i of [0,2,9,12]){
  await p.evaluate(i=>jump(i),i);
  const pages=await p.evaluate(()=>S[st.s].pr?1:S[st.s].p.length);
  for(let k=0;k<pages;k++){
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width} stage ${i} page ${k}`);
   if(k<pages-1)await p.locator('#nt').click();
  }
 }
 await p.evaluate(()=>{jump(2);nxt();MS.preEq=3;mr(document.getElementById('preEq'))});
 await p.screenshot({path:path.join(out,`equivalent-${width}.png`),fullPage:true});
}
assert.deepEqual(errors,[]);
const result={screens,animationStates:states,exercises:110,viewports:5,errors};
fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2));console.log(result);
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});

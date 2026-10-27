const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
(async()=>{const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});const base=process.argv[2]||`http://127.0.0.1:${server.address().port}/sonohoka/`,out=path.resolve('.portfolio-work/fractions-review');fs.mkdirSync(out,{recursive:true});const p=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
try{
 await p.goto(base+'onaji_okisa_bunsuu.html');
 const cases=await p.evaluate(()=>{let count=0;const old={...S};for(const m of ['x','d'])for(let d=2;d<=(m==='x'?12:30);d++)for(let n=1;n<d;n++)for(let k=2;k<=30;k++){S={...S,m,n,d,k,s:3};fix();const v=cv();if(v.a*v.e!==v.b*v.c)throw Error(JSON.stringify(S));if(S.k&&!okk(S.k))throw Error('divisor');count++}S=old;render();return count});
 await p.locator('#md').focus();await p.keyboard.press('Enter');assert.equal(await p.evaluate(()=>S.m),'d');assert.equal(await p.evaluate(()=>S.s),0);
 await p.evaluate(()=>{S={...S,n:11,d:22,k:11,s:3};render()});assert(await p.locator('[data-k="11"]').isVisible());await p.screenshot({path:out+'/same-desktop.png'});
 await p.goto(base+'yakubun.html');
 const paths=await p.evaluate(()=>{let count=0;for(let d=2;d<=60;d++)for(let n=1;n<d;n++){const[h,v]=path(n,d);const[a,b]=h.at(-1);if(a*d!==b*n)throw Error('value');for(let k=2;k<=Math.min(a,b);k++)if(a%k===0&&b%k===0)throw Error('reduction');if(v.reduce((a,b)=>a*b,1)!==d/b)throw Error('gcd product');count++}return count});
 await p.getByRole('button',{name:'② 約分しよう',exact:true}).click();await p.getByRole('button',{name:'÷2',exact:true}).click();await p.evaluate(()=>reset(7,12));await p.waitForTimeout(1150);assert.deepEqual(await p.evaluate(()=>S.h),[[7,12]]);
 await p.evaluate(()=>reset(24,36));await p.getByRole('button',{name:'÷2',exact:true}).click();await p.getByRole('button',{name:'÷2',exact:true}).click();await p.waitForTimeout(1100);assert.deepEqual(await p.evaluate(()=>S.h),[[24,36],[12,18]]);
 await p.locator('#cn').fill('１１');await p.getByRole('button',{name:'💡 ヒント',exact:true}).click();assert.equal(await p.locator('#cn').inputValue(),'１１');
 await p.locator('#kin').fill('3');await p.keyboard.press('Enter');await p.waitForTimeout(1100);assert.equal(await p.evaluate(()=>document.activeElement.id),'kin');await p.screenshot({path:out+'/reduce-desktop.png'});
 await p.goto(base+'tsubun.html');
 const stages=await p.evaluate(()=>{let count=0;for(p=0;p<PS.length;p++)for(s=0;s<6;s++)for(t=0;t<N()[s];t++){pv={};draw();if(/NaN|undefined/.test($('sv').innerHTML+$('tx').innerHTML))throw Error('render');count++}p=s=t=0;draw();return count});
 for(let i=0;i<8;i++)for(const k of [1,2,3]){await p.evaluate(({i,k})=>{s=5;t=i;const[a,b,c,d,o]=PR[t],D=b*d*k;pv={0:a*d*k,1:D,2:c*b*k,3:D,4:(o==='+'?a*d+c*b:a*d-c*b)*k,5:D};chk()}, {i,k});assert.equal(await p.locator('#fb').textContent(),'ぜんぶ せいかい！「つぎへ」で すすもう')}
 await p.evaluate(()=>{s=5;t=0;pv={0:1,1:2,2:1,3:5,4:7,5:10};chk()});assert((await p.locator('#fb').textContent()).includes('同じに'));
 await p.locator('#i0').fill('５');await p.locator('#i1').fill('１０');await p.locator('#i2').fill('２');await p.locator('#i3').fill('１０');await p.getByRole('button',{name:'こたえあわせ',exact:true}).click();assert((await p.locator('#fb').textContent()).includes('せいかい'));
 await p.locator('#i0').fill('1e0');await p.getByRole('button',{name:'こたえあわせ',exact:true}).click();assert(!(await p.locator('#fb').textContent()).includes('せいかい'));assert.equal(await p.locator('#i0').inputValue(),'1e0');await p.locator('#i0').fill('" onfocus="alert(1)');await p.getByRole('button',{name:'こたえあわせ',exact:true}).click();assert.equal(await p.locator('#i0').getAttribute('onfocus'),null);
 await p.locator('#nx').click();assert.equal(await p.locator('#i0').inputValue(),'');await p.locator('#i0').fill('');await p.keyboard.press('Enter');assert.equal(await p.evaluate(()=>document.activeElement.id),'i0');
 await p.locator('#ps').focus();const before=await p.evaluate(()=>[s,t]);await p.locator('#ps').dispatchEvent('keydown',{key:'ArrowRight'});assert.deepEqual(await p.evaluate(()=>[s,t]),before);await p.screenshot({path:out+'/common-desktop.png'});
 for(const file of ['onaji_okisa_bunsuu','yakubun','tsubun'])for(const width of [1280,1024,768,390,320]){
  await p.setViewportSize({width,height:width===1024?600:900});await p.goto(base+file+'.html');
  if(file==='onaji_okisa_bunsuu')await p.evaluate(()=>{S.s=3;render()});
  if(file==='yakubun')await p.getByRole('button',{name:'② 約分しよう',exact:true}).click();
  if(file==='tsubun')await p.getByRole('button',{name:'⑥ れんしゅう',exact:true}).click();
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),file+' overflow '+width);await p.screenshot({path:`${out}/${file}-${width}.png`,fullPage:true});
 }
 assert.deepEqual(errors,[]);console.log('PASS',JSON.stringify({equivalentCases:cases,reductionPaths:paths,lessonStages:stages,practiceCommonDenominators:24,viewports:15,races:2}));
}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);process.exitCode=1});


// Mechanical grid slicing and WebP encoding only; no resizing or art edits.
const assert=require('node:assert/strict'),path=require('node:path');
const sharp=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const assets=path.resolve(__dirname,'../sansuu-kotoba/assets');
async function split(scene,row){
 const source=path.join(assets,`${scene}-sheet-v2.png`);
 const {data,info}=await sharp(source).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
 const {width,height,channels}=info;assert(width>=1536&&height>=1024);assert.equal(channels,3);
 function center(axis){
  const size=axis==='x'?width:height,cross=axis==='x'?height:width,hits=[];
  for(let a=Math.floor(size/2)-12;a<=Math.ceil(size/2)+12;a++){
   let gray=0;
   for(let b=0;b<cross;b++){
    const i=(axis==='x'?b*width+a:a*width+b)*3,r=data[i],g=data[i+1],blue=data[i+2];
    if(r>80&&r<230&&Math.max(r,g,blue)-Math.min(r,g,blue)<35)gray++;
   }
   if(gray/cross>.85)hits.push(a);
  }
  assert(hits.length,`${scene}: no ${axis} grid divider`);return Math.round(hits.reduce((a,b)=>a+b,0)/hits.length);
 }
 const xs=[0,center('x'),width-1],ys=[0,center('y'),height-1],frames=[];
 for(let frame=0;frame<4;frame++){
  const r=Math.floor(frame/2),c=frame%2,left=xs[c]+2,top=ys[r]+2,w=xs[c+1]-xs[c]-4,h=ys[r+1]-ys[r]-4;
  assert(w>=760&&h>=500);
  const dest=path.join(assets,`scene-${row}-${frame}.webp`);
  await sharp(source).extract({left,top,width:w,height:h}).webp({quality:92,effort:6}).toFile(dest);
  frames.push({frame,width:w,height:h});
 }
 return {scene,source:[width,height],grid:{x:xs,y:ys},frames};
}
(async()=>{for(const [scene,row] of [['push',4],['subtract',0],['multiply',1]])console.log(JSON.stringify(await split(scene,row)));})().catch(e=>{console.error(e);process.exitCode=1});

// Mechanical cropping/padding aligns the cuff; the finger drawings are generated.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const sharp=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const dir=path.resolve(__dirname,'../sansuu-kotoba/assets/gloves');
(async()=>{
 const source=path.join(dir,'close-sheet-v2.png'),{data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const {width,height}=info,clear=[];
 for(let y=Math.floor(height*.4);y<height*.65;y++){let n=0;for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>128)n++;if(n/width<.015)clear.push(y);}
 assert(clear.length>5,'Need transparent gap between animation rows');const split=Math.round((clear[0]+clear.at(-1))/2),ys=[0,split,height],frames=[];
 for(let frame=0;frame<8;frame++){
  const row=Math.floor(frame/4),col=frame%4,left=Math.floor(width*col/4),right=Math.floor(width*(col+1)/4),top=ys[row],h=ys[row+1]-top,w=right-left;
  const tile=await sharp(source).extract({left,top,width:w,height:h}).ensureAlpha().raw().toBuffer();
  let bottom=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(tile[(y*w+x)*4+3]>128)bottom=Math.max(bottom,y);
  let min=w,max=0;for(let y=Math.max(0,bottom-20);y<=bottom;y++)for(let x=0;x<w;x++)if(tile[(y*w+x)*4+3]>128){min=Math.min(min,x);max=Math.max(max,x);}
  const dx=Math.round(280-(min+max)/2),dy=530-bottom;assert(dx>=0&&dy>=0&&dx+w<=560&&dy+h<=560,`frame ${frame}: alignment bounds`);
  const png=await sharp(source).extract({left,top,width:w,height:h}).png().toBuffer();
  const out=path.join(dir,`close-${frame}.webp`);
  const aligned=await sharp({create:{width:560,height:560,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:png,left:dx,top:dy}]).png().toBuffer();
  await sharp(aligned).resize(384,384).webp({quality:94,alphaQuality:100,effort:6}).toFile(out);
  frames.push({frame,crop:[left,top,w,h],translation:[dx,dy],file:`close-${frame}.webp`});
 }
 const ropeSource=path.join(dir,'rope-grip-photo-v2.png'),meta=await sharp(ropeSource).metadata();assert(meta.hasAlpha);assert.deepEqual([meta.width,meta.height],[1547,1017],'New source needs new grip/rope anchors');
 await sharp(ropeSource).resize({width:900}).webp({quality:95,alphaQuality:100,effort:6}).toFile(path.join(dir,'rope-grip-v2.webp'));
 const rgba=await sharp(ropeSource).ensureAlpha().raw().toBuffer(),w=meta.width,h=meta.height;
 const brown=(x,y)=>{const i=(y*w+x)*4;return rgba[i+3]>128&&rgba[i]>110&&rgba[i]>rgba[i+1]*1.08&&rgba[i+1]>rgba[i+2]*1.08;};
 const lineY=x=>{const ys=[];for(let y=0;y<h;y++)if(brown(x,y))ys.push(y);assert(ys.length);return (ys[0]+ys.at(-1))/2;};
 const xs=[];for(let x=0;x<w;x++)if(brown(x,h-1))xs.push(x);assert(xs.length);
 const ends=[{x:w-1,y:lineY(w-1)},{x:(xs[0]+xs.at(-1))/2,y:h-1}],points=[];
 for(let x=w-121;x<w;x++)points.push({x,y:lineY(x)});
 const mx=points.reduce((a,p)=>a+p.x,0)/points.length,my=points.reduce((a,p)=>a+p.y,0)/points.length;
 const slope=points.reduce((a,p)=>a+(p.x-mx)*(p.y-my),0)/points.reduce((a,p)=>a+(p.x-mx)**2,0),gripX=1080;
 const gripY=ends[0].y+(ends[0].x-gripX)*(ends[1].y-ends[0].y)/(ends[0].x-ends[1].x);
 const anchors={close:{width:560,height:560,grip:{x:280,y:365},cuff:{x:280,y:530}},push:{width:1254,height:1254,grip:{x:627,y:815},contact:{x:432,y:730}},rope:{width:w,height:h,grip:{x:gripX,y:gripY},ends,tangent:{x:1,y:slope},mirror:true}};
 fs.writeFileSync(path.join(dir,'animation-v2.json'),JSON.stringify({frames,anchors},null,2)+'\n');console.log(JSON.stringify({frames:frames.length,split,anchors}));
 fs.writeFileSync(path.join(dir,'rig-v2.js'),'window.LessonGloveRig = '+JSON.stringify(anchors,null,2)+';\n');
})().catch(e=>{console.error(e);process.exitCode=1});

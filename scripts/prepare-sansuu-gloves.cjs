// Encode generated transparent sprites; do not draw or remove backgrounds.
const assert=require('node:assert/strict'),path=require('node:path');
const sharp=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async()=>{for(const pose of ['open','cup','grip','push']){
 const dir=path.resolve(__dirname,'../sansuu-kotoba/assets/gloves'),src=path.join(dir,`${pose}-source.png`);
 const meta=await sharp(src).metadata();assert(meta.hasAlpha,`${pose}: alpha required`);
 const stats=await sharp(src).stats();assert.equal(stats.channels[3].min,0);assert.equal(stats.channels[3].max,255);
 await sharp(src).resize(384,384,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).webp({quality:94,alphaQuality:100,effort:6}).toFile(path.join(dir,`${pose}.webp`));
 console.log(JSON.stringify({pose,source:[meta.width,meta.height],output:[384,384],alpha:true}));
}})().catch(e=>{console.error(e);process.exitCode=1});

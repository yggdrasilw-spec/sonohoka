// Uncalibrated comparison observations. No automatic pass/fail or mastery score.
export const ENGINE_VERSION='kana-observation-1';
export const SUPPORTED=['く','し','つ','り','こ','き'];
export function box(strokes){
  const pts=strokes.flatMap(s=>s.points),xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
  if(!pts.length)return null;
  const l=Math.min(...xs),r=Math.max(...xs),t=Math.min(...ys),b=Math.max(...ys);
  return {l,r,t,b,w:Math.max(1e-6,r-l),h:Math.max(1e-6,b-t)};
}
export function length(points){return points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-points[i].x,p.y-points[i].y),0);}
export function resample(points,count=48){
  if(!points.length)return [];
  const distances=[0];for(let i=1;i<points.length;i++)distances.push(distances.at(-1)+Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y));
  const total=distances.at(-1);let cursor=1;
  return Array.from({length:count},(_,i)=>{
    if(!total)return {...points[0]};
    const target=i*total/(count-1);while(cursor<points.length-1&&distances[cursor]<target)cursor++;
    const a=points[cursor-1],b=points[cursor],f=(target-distances[cursor-1])/(distances[cursor]-distances[cursor-1]||1);
    return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f};
  });
}
function normalize(strokes){
  const b=box(strokes),size=Math.max(b.w,b.h);
  return strokes.map(s=>({...s,points:resample(s.points).map(p=>({x:(p.x-(b.l+b.r)/2)/size,y:(p.y-(b.t+b.b)/2)/size}))}));
}
const distance=(a,b)=>a.reduce((sum,p,i)=>sum+Math.hypot(p.x-b[i].x,p.y-b[i].y),0)/a.length;
function permutations(items){if(items.length<2)return [items];return items.flatMap((item,i)=>permutations(items.filter((_,j)=>j!==i)).map(tail=>[item,...tail]));}
export function match(actual,reference){
  if(!Array.isArray(actual)||!Array.isArray(reference)||!actual.length||!reference.length)return {available:false,reason:'input'};
  if(actual.length!==reference.length||actual.length>4)return {available:false,reason:'count'};
  const a=normalize(actual),r=normalize(reference),scores=[];
  for(const order of permutations(a.map((_,i)=>i))){
    const pairs=order.map((index,j)=>{
      const forward=distance(a[index].points,r[j].points),reverse=distance([...a[index].points].reverse(),r[j].points);
      return {index,reference:j,cost:Math.min(forward,reverse),reversed:reverse+.015<forward,directionClear:Math.abs(forward-reverse)>.04};
    });
    scores.push({pairs,cost:pairs.reduce((s,p)=>s+p.cost,0)/pairs.length});
  }
  scores.sort((a,b)=>a.cost-b.cost);const best=scores[0];
  return {...best,available:best.cost<.18&&(!scores[1]||scores[1].cost-best.cost>.025),reason:best.cost>=.18?'shape':'ambiguous'};
}
function curvature(points){
  const pts=resample(points),samples=[];
  for(let i=3;i<pts.length-3;i++){
    const a=pts[i-3],b=pts[i],c=pts[i+3],u={x:b.x-a.x,y:b.y-a.y},v={x:c.x-b.x,y:c.y-b.y};
    const angle=Math.abs(Math.atan2(u.x*v.y-u.y*v.x,u.x*v.x+u.y*v.y));samples.push({angle,index:i});
  }
  return samples.sort((a,b)=>b.angle-a.angle)[0]||{angle:0,index:0};
}
export function evaluate({char,strokes,reference}){
  const result={engineVersion:ENGINE_VERSION,char,identity:{status:'unavailable',reason:'字形の正誤は未判定。規則は人手レビュー・実筆跡での校正前です。'},writing:[],beauty:[],metrics:{},mapping:{available:false},reviewStatus:'uncalibrated'};
  const valid=rows=>Array.isArray(rows)&&rows.length>0&&rows.length<=12&&rows.reduce((n,s)=>n+(s.points?.length||0),0)<=12000&&rows.every(s=>Array.isArray(s.points)&&s.points.length&&s.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
  if(!SUPPORTED.includes(char)){result.message='この文字は観察規則の対象外です。';return result;}
  if(!valid(strokes)||!valid(reference)){result.message='筆跡を入力してから比べてください。';return result;}
  const bounds=box(strokes),refBox=box(reference);
  if(Math.max(bounds.w,bounds.h)<4||strokes.some(s=>length(s.points)<2)){
    result.message='点や短い線だけでは、部分の対応を確かめられません。';return result;
  }
  result.metrics={strokes:strokes.length,referenceStrokes:reference.length,aspect:bounds.w/bounds.h,referenceAspect:refBox.w/refBox.h};
  result.mapping=match(strokes,reference);
  if(!result.mapping.available){result.message=result.mapping.reason==='count'?'画のまとまりが異なるため、細かな助言を保留しました。分け書き・つなげ書きも目視で確認してください。':'線の対応がはっきりしないため、細かな助言を保留しました。';return result;}
  const add=(list,id,title,text,indices,referenceIndices,observed,expected,point=null)=>list.push({id,layer:list===result.beauty?'beauty':'writing',status:'candidate',title,text,focus:{strokeIndices:indices,referenceIndices,point},observed,expected,reviewStatus:'unreviewed',thresholdSource:'prototype-only'});
  const aspect=result.metrics.aspect/result.metrics.referenceAspect;
  if(aspect>1.28||aspect<.78)add(result.beauty,'outline','字全体の外形',aspect>1.28?'字全体を、少し縦に長くする目安を比べよう。':'字全体を、少し横に広げる目安を比べよう。',strokes.map((_,i)=>i),reference.map((_,i)=>i),result.metrics.aspect,result.metrics.referenceAspect);
  const pairs=result.mapping.pairs;
  const actualLengths=strokes.map(s=>length(s.points)),refLengths=reference.map(s=>length(s.points));
  pairs.forEach((pair,j)=>{
    const index=pair.index,stroke=strokes[index],ref=reference[j];
    if(pair.cost>.20)return;
    if(index!==j)add(result.writing,'order-'+j,'書いた順',`${index+1}番目に書いた線は、お手本の${j+1}画目に対応する候補です。書く順を比べよう。`,[index],[j],index+1,j+1);
    if(pair.reversed&&pair.directionClear)add(result.writing,'direction-'+j,'書いた向き','色のついた線を、どちらから書き始めたか比べよう。',[index],[j],'お手本と逆向きの候補','お手本の矢印');
    if(pairs.length>1){
      const a=actualLengths[index]/Math.max(...actualLengths),r=refLengths[j]/Math.max(...refLengths);
      if(Math.abs(a-r)>.18)add(result.beauty,'length-'+j,'線同士の長さ',a>r?'色のついた線を、ほかの線に対して少し短くする目安を比べよう。':'色のついた線を、ほかの線に対して少し長くする目安を比べよう。',[index],[j],a,r);
    }
    if(['し','つ'].includes(char)){
      const a=curvature(stroke.points),r=curvature(ref.points);
      if(a.angle>r.angle+.65&&a.angle>.85)add(result.beauty,'curve-'+j,'曲がりの丸み','色のところを、少し丸く曲がる目安と比べよう。',[index],[j],a.angle,r.angle,resample(stroke.points)[a.index]);
    }
  });
  result.message=result.writing.length||result.beauty.length?'比較から出した助言の候補です。正誤や美しさの採点ではありません。':'今回の比較条件では、助言候補は出ませんでした。正しく書けたという判定ではありません。';
  return result;
}

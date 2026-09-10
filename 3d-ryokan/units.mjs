// World dimensions in meters. Values are explicitly educational model settings.
export const items={
 ruler:{name:'ものさし',height:.3,label:'ものさしの長さ',value:30,unit:'cm',hint:'手に持つと、手のひら何個分かな？'},
 pencil:{name:'えんぴつ',height:.18,label:'えんぴつの長さ',value:18,unit:'cm',hint:'小さなえんぴつ。実寸で見ると、いつもの長さかな？'},
 milk:{name:'牛乳パック',height:.235,label:'牛乳パックの中身',value:1,unit:'L',hint:'外形の高さ23.5cm。手とくらべてみよう。'}
};
export const tub={innerLength:1.25,innerWidth:.64,innerHeight:.45,referenceLiters:200};
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
export function waterDepth(liters,displacementLiters=0){return (clamp(liters,0,200)+Math.max(0,displacementLiters))/1000/(tub.innerLength*tub.innerWidth);}
export function calibrationFrustum(widthPx,heightPx,pxPerMm){if(!(pxPerMm>0&&widthPx>0&&heightPx>0))throw new RangeError('Positive viewport and calibration required');return {left:-widthPx/(pxPerMm*2000),right:widthPx/(pxPerMm*2000),top:heightPx/(pxPerMm*2000),bottom:-heightPx/(pxPerMm*2000)};}

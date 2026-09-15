import {Vector3,MathUtils} from './vendor/three.module.js';
const v=(...a)=>new Vector3(...a);
export function graspProfile(d,id){
 const width=d.width||(id==='milk'?.07:id==='ruler'?.03:.007),depth=d.depth||(id==='milk'?.07:.008);
 const support=d.kind==='book'||d.kind==='card';
 return {width,depth,support,large:support||width>.10||d.kind==='bucket'||d.kind==='kettle'};
}
export function graspPose(d,id,objectPosition,reach,gripAmount){
 const {width,depth,support,large}=graspProfile(d,id),lift=Math.min(d.height*.5,.105);
 // A book resting on a table is first grasped at its side edges; hands only
 // move underneath once its bottom clears the tabletop by at least 3 cm.
 const supportBlend=MathUtils.smoothstep(objectPosition.y,.731,.801);
 const rightOffset=support?v(-width/2-.018,.085,-depth/2-.058).lerp(v(-width*.30,-.012,-depth/2-.055),supportBlend):v(-width/2-.018,lift,-.058);
 const leftOffset=support?v(width/2+.018,.085,-depth/2-.058).lerp(v(width*.30,-.012,-depth/2-.055),supportBlend):v(width/2+.018,lift,-.058);
 const rightGoal=objectPosition.clone().add(rightOffset),leftGoal=objectPosition.clone().add(leftOffset);
 const right=v(-.19,.70,.06).lerp(rightGoal,reach),left=v(.19,.70,.06).lerp(leftGoal,large?reach:0);
 const r={long:v(0,-1,.12).lerp(v(0,0,1),reach).normalize(),normal:v(1,0,0).lerp(support?v(1,0,0).lerp(v(0,1,0),supportBlend).normalize():v(1,0,0),reach).normalize()};
 const l={long:v(0,-1,.12).lerp(v(0,0,1),large?reach:0).normalize(),normal:v(-1,0,0).lerp(support?v(-1,0,0).lerp(v(0,1,0),supportBlend).normalize():v(-1,0,0),reach).normalize()};
 return {right,left,rightGrip:gripAmount*(support?.55:.85),leftGrip:large?gripAmount*(support?.55:.7):0,palms:{r,l}};
}

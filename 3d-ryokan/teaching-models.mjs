import * as T from './vendor/three.module.js';
import {handReference} from './catalog.mjs';
const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.48,...extra});
const skin=material('#e3ad83'),nail=material('#edc8ac');
function add(g,geometry,m,x=0,y=0,z=0){const o=new T.Mesh(geometry,m);o.position.set(x,y,z);o.castShadow=!m.transparent;o.receiveShadow=true;g.add(o);return o;}
function box(g,w,h,d,m,x=0,y=0,z=0){return add(g,new T.BoxGeometry(w,h,d),m,x,y,z);}
function cyl(g,r,h,m,y=0){return add(g,new T.CylinderGeometry(r,r,h,48),m,0,y);}
function ellipsoid(g,x,y,z,rx,ry,rz,m){const o=add(g,new T.SphereGeometry(1,20,16),m,x,y,z);o.scale.set(rx,ry,rz);return o;}
function tube(g,points,r,m){return add(g,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),40,r,10,false),m);}
export function createHand(sign){
 const g=new T.Group(),palm=handReference.length-handReference.middle;
 // Wrist crease at y=0, fingertips point down. Palm width excludes thumb.
 ellipsoid(g,0,-palm*.48,0,handReference.width/2,palm*.52,.013,skin);
 ellipsoid(g,-sign*.022,-palm*.38,.006,.016,.030,.014,skin);
 const fingers=[];
 for(const [i,len] of [.058,handReference.middle,.059,.046].entries()){
  const base=new T.Group();base.position.set(sign*(-.025+i*.0165),-palm+(i===3?.01:0),0);g.add(base);
  let parent=base;const joints=[];
  const radius=i===3?.006:.0072;
  for(const [j,f]of [.45,.32,.23].entries()){
   const joint=new T.Group();parent.add(joint);if(j)joint.position.y=-len*[.45,.32][j-1];
   const seg=len*f;ellipsoid(joint,0,-seg/2,0,radius*(1-j*.12),seg/2,radius*(1-j*.12),skin);
   if(j===2)ellipsoid(joint,0,-seg*.57,-radius*.84,radius*.68,seg*.30,.00065,nail);
   joints.push(joint);parent=joint;
  }
  fingers.push({base,joints});
 }
 const thumb=new T.Group();thumb.position.set(-sign*.026,-palm*.25,.004);thumb.rotation.z=-sign*.65;g.add(thumb);
 const tip=new T.Group();thumb.add(tip);tip.position.y=-.026;
 ellipsoid(thumb,0,-.013,0,.009,.017,.009,skin);ellipsoid(tip,0,-.012,0,.008,.015,.008,skin);ellipsoid(tip,0,-.016,-.007,.0055,.007,.0007,nail);
 g.userData.pose=(curl=0)=>{for(const f of fingers)f.joints.forEach((j,k)=>j.rotation.x=-curl*[.65,1,.65][k]);thumb.rotation.x=-curl*.8;tip.rotation.x=-curl*.65;};
 return g;
}
export function createTeachingModel(d){
 const root=new T.Group(),g=new T.Group();root.add(g);root.userData.content=g;
 const w=d.width,h=d.height,z=d.depth,white=material('#f6f2df'),blue=material('#80b4c0'),metal=material('#abb6b7',{metalness:.75,roughness:.25});
 if(d.kind==='book'||d.kind==='card'){
  const cover=Math.min(z*.12,.0006),c=material(d.kind==='card'?'#fffbec':z>.015?'#6a8c64':'#b48665');
  box(g,w,h,z,white,0,h/2);box(g,w,h,cover,c,0,h/2,z/2-cover/2);box(g,w,h,cover,c,0,h/2,-z/2+cover/2);
  if(d.kind==='book'){box(g,.004,h,z,c,-w/2+.002,h/2);for(let i=1;i<Math.min(20,z/.0003);i++)box(g,w-.005,.00025,.0001,material('#c9c5b4'),.002,h*.2+i*h*.026,z/2-.00006);}
 }else if(d.kind==='measure'){
  const outer=w/2,inner=d.innerDiameter/2,bottom=.0025;
  const points=[[0,0],[outer,0],[outer,h],[inner,h],[inner,bottom],[0,bottom]].map(([x,y])=>new T.Vector2(x,y));
  add(g,new T.LatheGeometry(points,64),material('#c3e2df',{transparent:true,opacity:.27,side:T.DoubleSide,depthWrite:false}));
  const fluid=cyl(g,inner-.0001,.001,material('#39a5c3',{transparent:true,opacity:.65}),bottom);fluid.visible=false;
  root.userData.setVolume=ml=>{const depth=ml/1e6/(Math.PI*inner**2);fluid.visible=ml>0;fluid.scale.y=depth/.001;fluid.position.y=bottom+depth/2;};
  for(let ml=d.stepMl;ml<=d.capacityMl;ml+=d.stepMl){const y=bottom+ml/1e6/(Math.PI*inner**2);box(g,w*.20,.0006,.0005,material('#375e65'),-w*.22,y,Math.sqrt(outer**2-(w*.22)**2));}
 }else if(d.kind==='bottle'){
  box(g,w,h*.77,z,material('#bbd4d1',{transparent:true,opacity:.52}),0,h*.385);
  const geo=new T.CylinderGeometry(1,1,h*.17,4,1);const a=geo.attributes.position;
  for(let i=0;i<a.count;i++){const top=a.getY(i)>0;const x=a.getX(i),zz=a.getZ(i);a.setXYZ(i,(x+zz)*(top?.014:w/2),a.getY(i),(zz-x)*(top?.014:z/2));}geo.computeVertexNormals();
  add(g,geo,material('#c1d9d3',{transparent:true,opacity:.52}),0,h*.855);cyl(g,.014,h*.06,white,h*.97);
  box(g,w,h*.28,z,blue,0,h*.43);
 }else if(d.kind==='can'){
  const r=w/2;const pts=[[0,0],[r*.86,0],[r,.008],[r,h-.012],[r*.79,h-.003],[r*.79,h],[0,h]].map(([x,y])=>new T.Vector2(x,y));add(g,new T.LatheGeometry(pts,64),metal);cyl(g,r*.999,h*.72,material('#e5b058'),h*.48);
  const tab=add(g,new T.TorusGeometry(.008,.0015,8,20),metal,0,h+.0001);tab.rotation.x=Math.PI/2;
 }else if(d.kind==='bucket'){
  const r=w/2,pts=[[0,0],[r*.72,0],[r,h],[r-.003,h],[r*.72-.003,.004],[0,.004]].map(([x,y])=>new T.Vector2(x,y));add(g,new T.LatheGeometry(pts,64),blue);
  // Folded handle stays within the published body envelope.
  tube(g,[[-r*.95,h*.90,0],[-r*.7,h*.52,r*.4],[0,h*.40,r*.70],[r*.7,h*.52,r*.4],[r*.95,h*.90,0]],.0035,metal);
 }else if(d.kind==='kettle'){
  ellipsoid(g,-.024,h*.32,0,z*.49,h*.30,z*.49,metal);cyl(g,z*.30,.006,metal,h*.58);
  tube(g,[[-.024-z*.42,h*.42,0],[-.024-z*.37,h*.85,0],[-.024,h-.006,0],[-.024+z*.37,h*.85,0],[-.024+z*.42,h*.42,0]],.006,material('#494b43'));
  tube(g,[[.025,h*.25,0],[w*.35,h*.39,0],[w*.48,h*.65,0]],.012,metal);
 }else if(d.kind==='syringe'){
  cyl(g,w/2,.090,material('#dce6df',{transparent:true,opacity:.45}),.051);cyl(g,.0025,.012,white,.006);cyl(g,.003,h-.090,white,.090+(h-.090)/2);cyl(g,w/2,.003,white,h-.0015);
  for(let i=0;i<=10;i++)box(g,.005,.0004,.0004,material('#345d63'),-.004,.018+i*.006,w/2);
 }
 // Bounds apply to the simplified envelope only; the data explains unverified details.
 if(d.kind!=='measure'&&d.kind!=='bottle'&&d.kind!=='book'&&d.kind!=='card'){
  const b=new T.Box3().setFromObject(g),size=b.getSize(new T.Vector3()),center=b.getCenter(new T.Vector3());g.position.sub(center);const wrapper=new T.Group();root.remove(g);wrapper.add(g);wrapper.scale.set(w/size.x,h/size.y,z/size.z);wrapper.position.y=h/2;root.add(wrapper);root.userData.content=wrapper;
 }
 return root;
}

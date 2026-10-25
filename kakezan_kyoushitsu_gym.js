/* 体育館だけを生成する。段数は上のクッションを含む５段で、各段が数える対象。 */
function buildGym({T,scene,SP,mk,grid,one,reg,M,tx,BW}){
  const blue=0x4485bd,wood=0xc88e51,cream=0xfff0cf,ink=0x253f54;
  const mesh=(geo,c,x,y,z,p=scene,i=-1)=>{const m=new T.Mesh(geo,M(c));m.position.set(x,y,z);p.add(m);if(i>=0)reg(m,i);return m};
  const box=(w,h,d,c,x,y,z,p=scene,i=-1)=>mesh(new T.BoxGeometry(w,h,d),c,x,y,z,p,i);
  const group=(x,y,z,p=scene)=>{const g=new T.Group();g.position.set(x,y,z);p.add(g);return g};
  const text=(t,w,h,x,y,z,p=scene,i=-1,c=cream)=>{
    const m=box(w,h,.014,c,x,y,z,p,i);m.material.map=tx(/^\d$/.test(t)?128:768,128,(g,W,H)=>{g.fillStyle='#fff0cf';g.fillRect(0,0,W,H);g.fillStyle='#253f54';g.font='bold 68px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(t,W/2,H/2,W-24)});return m;
  };
  const line=(pts,c,r,p=scene,i=-1)=>mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(v=>new T.Vector3(...v))),32,r,5,false),c,0,0,0,p,i);
  // Wooden court, boundary lines, wall pads and basketball goal.
  box(12,.1,10,0xe6be85,0,-.06,0);
  for(let k=0;k<20;k++)box(12,.003,.012,0xcda66e,0,0,-4.75+k*.5);
  const wall=(w,x,z,a)=>{const m=mesh(new T.PlaneGeometry(w,3.6),0xe9eee9,x,1.8,z);m.rotation.y=a};
  wall(12,0,-5.05,0);wall(12,0,5.05,Math.PI);wall(10,-6.05,0,Math.PI/2);wall(10,6.05,0,-Math.PI/2);
  for(const z of [-4.97,4.97])box(12,.65,.035,blue,0,.34,z);
  for(const x of [-5.97,5.97])box(.035,.65,10,blue,x,.34,0);
  for(const x of [-5.1,5.1])box(.035,.008,8.3,0xffffff,x,.008,0);
  for(const z of [-4.15,4.15])box(10.2,.008,.035,0xffffff,0,.008,z);
  box(10.2,.009,.035,0xffffff,0,.01,0);
  const circle=mesh(new T.TorusGeometry(1.1,.018,4,48),0xffffff,0,.015,0);circle.rotation.x=Math.PI/2;
  text('かけ算 スポーツ ひろば',4.5,.32,0,3.3,-4.96);
  box(1.5,.85,.06,0xffffff,0,2.55,-4.9);
  const goal=mesh(new T.TorusGeometry(.27,.032,6,24),0xe3703e,0,2.2,-4.5);goal.rotation.x=Math.PI/2;
  for(let k=0;k<8;k++){const a=k*Math.PI/4;line([[Math.cos(a)*.25,2.2,-4.5+Math.sin(a)*.25],[Math.cos(a)*.15,1.84,-4.5+Math.sin(a)*.15]],0xffffff,.008)}
  // Three five-stage vaulting boxes. Every stage has its own outline and a visible numeral.
  const vault=mk('とびばこの だんは ぜんぶで 何だん？','だん',one(5,3,'1だいに','だい'),{y:0,p:.16,w:5.4,h:1.65,t:[-.5,.78,1.5]});
  SP[vault].vaultStages=5;
  for(let c=0;c<3;c++){
    const x=-2.3+c*1.8;
    for(let k=0;k<5;k++){
      const w=1.14-k*.095,h=.235,y=.055+k*.25,g=group(x,y,1.5);
      const sh=new T.Shape();sh.moveTo(-w/2,0);sh.lineTo(w/2,0);sh.lineTo(w/2-.04,h);sh.lineTo(-w/2+.04,h);sh.closePath();
      mesh(new T.ExtrudeGeometry(sh,{depth:.95,bevelEnabled:false}),k%2?0xc58a4c:0xd79f60,0,0,-.475,g,vault);
      // The cushion belongs to the top (fifth) stage; it is not an extra sixth stage.
      if(k===4)box(w-.06,.08,1.01,0x356e9b,0,h-.035,0,g,vault);
      text(String(k+1),.22,.18,0,.12,.52,g,vault);
      for(const hx of [-.31,.31])box(.13,.045,.015,0x754f30,hx,.115,.48,g,vault);
      SP[vault].it[c*5+k]={o:g};
    }
    text('５だん',.85,.23,x,1.56,1.52,scene,vault);
  }
  // Balls on three shelves, four per shelf.
  let i=mk('たなの ボールは 何こ？','こ',grid(3,4,'だん','れつ'),{y:Math.PI/2,p:0,w:3.6,h:2.3,t:[-5.65,1.55,-2.4]});
  let root=group(-5.65,1.55,-2.4);root.rotation.y=Math.PI/2;
  text('ボール おきば',3.1,.3,0,1.23,0,root,i);
  box(3.3,2.2,.04,wood,0,0,-.17,root,i);
  for(let r=0;r<3;r++){
    const y=.7-r*.7;box(3.3,.06,.5,0x91663e,0,y-.24,.05,root,i);
    for(let c=0;c<4;c++){
      const g=group((c-1.5)*.77,y,.07,root),b=mesh(new T.SphereGeometry(.21,16,10),0xe1873f,0,0,0,g,i);
      mesh(new T.TorusGeometry(.211,.009,4,24),ink,0,0,0,g,i);mesh(new T.TorusGeometry(.211,.009,4,24),ink,0,0,0,g,i).rotation.y=Math.PI/2;
      SP[i].it[r*4+c]={o:g};
    }
  }
  // Floor cones, kept apart so each row and column is countable from above.
  i=mk('マットの コーンは 何こ？','こ',grid(4,3,'れつ','れつ'),{y:-.25,p:1.15,w:3.4,h:3.8,t:[3.5,.2,.25]});
  box(2.8,.035,3.5,0xa3c2d4,3.5,.025,.25,scene,i);
  for(let r=0;r<4;r++)for(let c=0;c<3;c++){
    const g=group(3.5+(c-1)*.85,.05,.25+(r-1.5)*.8);
    box(.39,.04,.39,0xe9703c,0,.02,0,g,i);
    mesh(new T.ConeGeometry(.16,.45,12),0xf38b42,0,.26,0,g,i);
    mesh(new T.CylinderGeometry(.085,.104,.07,12),0xffffff,0,.29,0,g,i);
    SP[i].it[r*3+c]={o:g};
  }
  // Rear wall: hoops and jump ropes, shown when the camera comes around.
  i=mk('かべの フープは 何本？','本',grid(2,4,'だん','れつ'),{y:Math.PI,p:0,w:4.6,h:2.6,t:[-2.6,1.8,4.9]});SP[i].bw=1;
  root=group(-2.6,1.8,4.9,BW);root.rotation.y=Math.PI;
  text('フープ',3.8,.3,0,1.22,0,root,i);
  for(let r=0;r<2;r++)for(let c=0;c<4;c++){
    const g=group((c-1.5)*1.0,.55-r*1.1,.06,root);
    mesh(new T.TorusGeometry(.39,.033,6,32),[blue,0xe6b73f,0xd76858,0x4da58d][c],0,0,0,g,i);SP[i].it[r*4+c]={o:g};
  }
  i=mk('かべの なわとびは 何本？','本',grid(2,3,'だん','れつ'),{y:Math.PI,p:0,w:3.3,h:2.6,t:[2.6,1.8,4.9]});SP[i].bw=1;
  root=group(2.6,1.8,4.9,BW);root.rotation.y=Math.PI;
  text('なわとび',3,.3,0,1.22,0,root,i);
  for(let r=0;r<2;r++)for(let c=0;c<3;c++){
    const g=group((c-1)*.95,.68-r*1.1,.06,root),color=[blue,0xc06b71,0x4da58d][c];
    line([[-.15,.16,0],[-.27,-.33,0],[0,-.55,0],[.27,-.33,0],[.15,.16,0]],color,.018,g,i);
    for(const x of [-.15,.15])box(.075,.24,.075,0xe9ae40,x,.16,0,g,i);
    SP[i].it[r*3+c]={o:g};
  }
  // Climbing wall grips: a simple rectangular arrangement.
  i=mk('かべの もち手は 何こ？','こ',grid(3,5,'だん','れつ'),{y:0,p:0,w:3.4,h:2.2,t:[3.6,1.85,-4.9]});
  box(3.1,1.9,.04,0xc6d6b8,3.6,1.85,-4.96,scene,i);
  text('のぼる かべ',3,.3,3.6,3.02,-4.9,scene,i);
  for(let r=0;r<3;r++)for(let c=0;c<5;c++){
    const g=group(3.6+(c-2)*.55,2.4-r*.55,-4.85),m=mesh(new T.SphereGeometry(.13,8,6),[blue,0xd57755,0xd4ab40][r],0,0,0,g,i);m.scale.set(1.25,.8,.6);SP[i].it[r*5+c]={o:g};
  }
  const fill=new T.DirectionalLight(0xffffff,.2);fill.position.set(0,5,-5);scene.add(fill);
}

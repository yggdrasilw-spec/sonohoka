/* 教室２だけで呼び出す。教室１のオブジェクトは生成しない。 */
function buildClassroom2({T,scene,SP,mk,grid,one,reg,M,tx,BW}){
  const mint=0x65b9a6,coral=0xec8969,cream=0xfff4d8,navy=0x35485e;
  const colors=[coral,0xf2c85c,mint,0x83afdc,0xc59acb];
  const mesh=(geo,color,x,y,z,parent=scene,i=-1)=>{
    const m=new T.Mesh(geo,M(color));m.position.set(x,y,z);parent.add(m);if(i>=0)reg(m,i);return m;
  };
  const box=(w,h,d,c,x,y,z,p=scene,i=-1)=>mesh(new T.BoxGeometry(w,h,d),c,x,y,z,p,i);
  const ball=(r,c,x,y,z,p,i)=>mesh(new T.SphereGeometry(r,12,8),c,x,y,z,p,i);
  const group=(x,y,z,p=scene)=>{const g=new T.Group();g.position.set(x,y,z);p.add(g);return g};
  const label=(text,w,x,y,z,p=scene,i=-1)=>{
    const m=box(w,.32,.025,cream,x,y,z,p,i);
    m.material.map=tx(640,80,(c,W,H)=>{c.fillStyle='#fff4d8';c.fillRect(0,0,W,H);c.fillStyle='#35485e';c.textAlign='center';c.textBaseline='middle';c.font='bold 40px sans-serif';c.fillText(text,W/2,H/2,W-20)});
    return m;
  };
  const star=(r,c,p,i)=>{
    const s=new T.Shape();for(let k=0;k<10;k++){const a=Math.PI/2+k*Math.PI/5,R=k%2?r*.45:r,x=Math.cos(a)*R,y=Math.sin(a)*R;k?s.lineTo(x,y):s.moveTo(x,y)}s.closePath();
    return mesh(new T.ExtrudeGeometry(s,{depth:.045,bevelEnabled:false}),c,0,0,0,p,i);
  };
  // Bright workshop, striped floor, mint wall trim and a central play mat.
  box(12,.12,10,0xf1d9bb,0,-.07,0);
  for(let j=0;j<10;j++)box(11.9,.006,.035,0xddc4a6,0,0,-4.5+j);
  // Single-sided walls keep the view open when the orbit camera is outside.
  mesh(new T.PlaneGeometry(12,3.2),0xffeee2,0,1.6,-5.05);
  mesh(new T.PlaneGeometry(10,3.2),0xe5f3ec,-6.05,1.6,0).rotation.y=Math.PI/2;
  mesh(new T.PlaneGeometry(10,3.2),0xe5f3ec,6.05,1.6,0).rotation.y=-Math.PI/2;
  mesh(new T.PlaneGeometry(12,3.2),0xffeee2,0,1.6,5.05).rotation.y=Math.PI;
  for(const z of [-4.98,4.98])box(12,.18,.04,mint,0,.16,z);
  for(const x of [-5.98,5.98])box(.04,.18,10,mint,x,.16,0);
  box(6,.015,3.7,0xaed6cb,0,.012,.8);
  for(let k=0;k<3;k++)box(5.7,.008,.025,cream,0,.024,-.5+k*1.3);
  label('わくわく こうさく きょうしつ',5.5,0,2.96,-4.95);
  // Each wall station uses local x/y coordinates; its objects face into the room.
  function station(n,u,gr,x,z,angle,w,h,title,back=false){
    const root=group(x,1.65,z,back?BW:scene);root.rotation.y=angle;
    const i=mk(n,u,gr,{y:angle,p:0,w:w+.35,h:h+.6,t:[x,1.65,z]});if(back)SP[i].bw=1;
    box(w+.16,h+.18,.06,navy,0,0,0,root,i);box(w,h,.05,cream,0,0,.04,root,i);
    label(title,w,0,h/2+.24,.05,root,i);
    return {root,i,w,h};
  }
  function items(S,R,C,dx,dy,draw){
    for(let r=0;r<R;r++)for(let c=0;c<C;c++){
      const g=group((c-(C-1)/2)*dx,((R-1)/2-r)*dy,.11,S.root);
      draw(g,S.i,r,c);SP[S.i].it[r*C+c]={o:g};
    }
  }
  // Front: two clearly separated grids.
  let s=station('ほしの かざりは 何こ？','こ',grid(3,4,'だん','れつ'),-2.8,-4.93,0,3.6,1.7,'ほしの アトリエ');
  items(s,3,4,.78,.48,(g,i,r,c)=>star(.19,colors[(r+c)%5],g,i));
  s=station('ロケットは 何だい？','だい',grid(2,4,'だん','れつ'),2.5,-4.93,0,3.6,1.7,'うちゅうへ ゴー！');
  items(s,2,4,.78,.72,(g,i,r,c)=>{
    box(.23,.32,.09,colors[c],0,-.01,0,g,i);
    const tip=mesh(new T.ConeGeometry(.16,.22,3),coral,0,.25,0,g,i);tip.rotation.y=Math.PI/2;
    const win=mesh(new T.CylinderGeometry(.065,.065,.03,12),navy,0,.03,.07,g,i);win.rotation.x=Math.PI/2;
    box(.1,.12,.07,coral,-.16,-.12,0,g,i);box(.1,.12,.07,coral,.16,-.12,0,g,i);
  });
  // Left: doughnuts on a display and five flowers in each of three pots.
  s=station('おみせの ドーナツは 何こ？','こ',grid(4,3,'だん','れつ'),-5.93,-2.6,Math.PI/2,2.6,1.95,'ドーナツやさん');
  items(s,4,3,.72,.43,(g,i,r,c)=>{
    mesh(new T.TorusGeometry(.125,.06,7,16),0xc98951,0,0,0,g,i);
    mesh(new T.TorusGeometry(.125,.043,6,16),[0xf3a2b4,0x805b49,0xf6d174][r%3],0,0,.045,g,i);
  });
  s=station('はちの おはなは ぜんぶで 何本？','本',one(5,3,'1はちに','はち'),-5.93,1.4,Math.PI/2,3.1,1.8,'おはなを そだてよう');
  for(let c=0;c<3;c++){
    const x=(c-1)*.99;box(.82,.3,.18,coral,x,-.57,.18,s.root,s.i);
    for(let k=0;k<5;k++){
      const g=group(x+(k-2)*.15,.03+(k%2)*.4,.2,s.root);
      box(.018,.43+(k%2)*.1,.018,mint,0,-.23-(k%2)*.05,0,g,s.i);
      for(let n=0;n<5;n++)ball(.048,0xf1bc52,Math.sin(n*6.283/5)*.072,Math.cos(n*6.283/5)*.072,0,g,s.i);
      ball(.045,coral,0,0,.04,g,s.i);SP[s.i].it[c*5+k]={o:g};
    }
  }
  // Right: penguin figures and four bells on each of two tambourines.
  s=station('ペンギンの おきものは 何わ？','わ',grid(2,3,'だん','れつ'),5.93,-2.6,-Math.PI/2,2.7,1.95,'ペンギン こうぼう');
  items(s,2,3,.75,.85,(g,i)=>{
    const m=ball(.19,navy,0,-.02,0,g,i);m.scale.y=1.25;
    const belly=ball(.135,0xffffff,0,-.06,.13,g,i);belly.scale.y=1.2;
    for(const x of [-.065,.065])ball(.025,navy,x,.14,.17,g,i);
    mesh(new T.ConeGeometry(.047,.12,4),0xf2c85c,0,.055,.245,g,i).rotation.x=Math.PI/2;
    box(.1,.035,.14,0xf2c85c,-.1,-.25,.04,g,i);box(.1,.035,.14,0xf2c85c,.1,-.25,.04,g,i);
  });
  s=station('タンバリンの すずは ぜんぶで 何こ？','こ',one(4,2,'1だいに','だい'),5.93,1.4,-Math.PI/2,3,1.8,'おんがく コーナー');
  for(let c=0;c<2;c++){
    const x=(c-.5)*1.35;
    mesh(new T.TorusGeometry(.43,.055,6,24),coral,x,0,.12,s.root,s.i);
    for(let k=0;k<4;k++){
      const a=Math.PI/4+k*Math.PI/2,g=group(x+Math.cos(a)*.43,Math.sin(a)*.43,.2,s.root);
      ball(.115,0xe4bc49,0,0,0,g,s.i);box(.065,.014,.01,navy,0,-.025,.113,g,s.i);SP[s.i].it[c*4+k]={o:g};
    }
  }
  // Back wall objects are hidden from outside, as in classroom 1.
  s=station('かざりの はたは 何まい？','まい',grid(2,5,'だん','れつ'),-2.7,4.93,Math.PI,3.8,1.7,'おまつりの じゅんび',true);
  items(s,2,5,.67,.7,(g,i,r,c)=>{
    const sh=new T.Shape();sh.moveTo(-.22,.19);sh.lineTo(.22,.19);sh.lineTo(0,-.2);sh.closePath();
    mesh(new T.ExtrudeGeometry(sh,{depth:.03,bevelEnabled:false}),colors[(r+c)%5],0,0,0,g,i);
  });
  s=station('たなの つみきは 何こ？','こ',grid(3,4,'だん','れつ'),2.5,4.93,Math.PI,3.4,1.8,'にじいろ つみき',true);
  items(s,3,4,.72,.5,(g,i,r,c)=>box(.29,.29,.22,colors[(r+c)%5],0,0,0,g,i));
  for(let r=0;r<3;r++)box(3.3,.055,.34,mint,0,.5-r*.5-.19,.15,s.root,s.i);
  // Center: three plates, six individually separated pizza slices per plate.
  const i=mk('おさらに のった ピザは ぜんぶで 何きれ？','きれ',one(6,3,'1さらに','さら'),{y:0,p:1.25,w:4.8,h:2.9,t:[0,.77,.7]});
  box(5,.12,1.9,cream,0,.62,.7,scene,i);
  for(const x of [-2.1,2.1])for(const z of [0,1.4])box(.09,.57,.09,mint,x,.29,z,scene,i);
  for(let c=0;c<3;c++){
    const x=(c-1)*1.55,plate=mesh(new T.CylinderGeometry(.65,.65,.035,32),0xffffff,x,.71,.7,scene,i);
    for(let k=0;k<6;k++){
      const g=group(x,.75,.7),a=k*Math.PI/3+.045,b=(k+1)*Math.PI/3-.045;
      const sh=new T.Shape();sh.moveTo(Math.cos((a+b)/2)*.045,Math.sin((a+b)/2)*.045);sh.lineTo(Math.cos(a)*.54,Math.sin(a)*.54);sh.absarc(0,0,.54,a,b,false);sh.closePath();
      const slice=mesh(new T.ExtrudeGeometry(sh,{depth:.045,bevelEnabled:false}),0xf1bd55,0,0,0,g,i);slice.rotation.x=-Math.PI/2;
      const mid=(a+b)/2;mesh(new T.CylinderGeometry(.065,.065,.012,10),coral,Math.cos(mid)*.34,.057,-Math.sin(mid)*.34,g,i);
      SP[i].it[c*6+k]={o:g};
    }
  }
  label('ピザやさん ごっこ',3.3,0,1.12,-.12,scene,i);
  const fill=new T.DirectionalLight(0xffffff,.2);fill.position.set(0,5,-5);scene.add(fill);
}

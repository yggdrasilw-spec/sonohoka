(function(root){
  'use strict';
  const scenes={
    gather:{title:'二つのまとまりを 合わせる',alt:'赤い花と白い花を、左右から同じ花びんへ集める動き',cue:'二つのまとまりを、一つに集めるよ。',roles:['a','b','total']},
    receive:{title:'受け取ると、どう変わる？',alt:'差し出されたあめを、子どもが手のひらで受け取る動き',cue:'はじめに持っていた分に、もらった分が加わるよ。',roles:['a','b','total']},
    remove:{title:'取り去ると、どう変わる？',alt:'お皿から取ったあめを食べる動き',cue:'はじめにあった分は、食べた分と残りの分に分かれるよ。',roles:['total','a','b']},
    compare:{title:'一つずつ 相手を見つける',alt:'二人のシールを横に一つずつ組にして並べる動き',cue:'一つずつ組にして、相手のない分を見るよ。',roles:['a','total','b']},
    repeat:{title:'同じ一皿分が、いくつ分？',alt:'同じ一皿分を用意するため、あめをお皿に置く動き',cue:'一皿分の数をそろえて、同じまとまりを作るよ。',roles:['a','b','total']},
    share:{title:'お皿を決めて、一つずつ配る',alt:'先に置いたお皿へ、あめを一つずつ順番に配る動き',cue:'お皿の数は決まっているよ。一つずつ順番に配り、一皿にいくつ入るかを見るよ。',roles:['total','b','a']},
    take:{title:'一皿分を決めて、取り分ける',alt:'一皿分のまとまりを、大きな袋からお皿へ取り分ける動き',cue:'小袋は一皿分のまとまりの見本だよ。一皿に入れる数を決め、その分ずつ取って、できた皿を数えるよ。',roles:['total','a','b']},
    cards:{title:'一人分を、どうまとめる？',alt:'赤いカードと青いカードを並べて、一人分の組を作る動き',cue:'赤と青を合わせて一人分を作れるね。色ごとに人数分を考える道筋もあるよ。',roles:['a','b','c','total']},
    measure:{title:'どの長さを基準にする？',alt:'リボンと基準の帯を並べて長さを確かめる動き',cue:'絵の帯の長さは見本。下の図で、単位や、もとにする長さを確かめよう。',roles:['a','b','total']},
    cut:{title:'一本分を、何回取れる？',alt:'一本分を取り分けるため、リボンをはさみで切る動き',cue:'一本分の長さずつ区切るよ。下の図で、全体に何本分入るかを確かめよう。',roles:['a','b','total']},
    average:{file:'average-v2',title:'全部を変えずに、ならす',alt:'同じ大きさの容器の間で、本を移して配り直す動き',cue:'本を移しても、全部の数は変わらないね。下の図で、三日分を同じ数にならそう。',roles:[]},
    rate:{file:'rate-v2',title:'同じ時間に、同じ道のり',alt:'一人の子どもが道に沿って歩く動き',cue:'一定の速さで進むよ。目印の絵から距離を測らず、下の対応する時間と道のりを見よう。',roles:['a','b','total']},
    work:{title:'同じ仕事を、分担する',alt:'二人が同じ箱の仕事を分担して、それぞれ同じ作業をする様子',cue:'同じ量の仕事を、同じ速さで分担する場合だよ。人数が変わると、時間はどう変わるかな？',roles:['total','a','b']}
  };
  function keyFor(m){
    if(m.kind==='combine')return 'gather';if(m.kind==='increase')return 'receive';
    if(m.kind==='decrease')return 'remove';if(m.kind==='compare')return 'compare';
    if(m.kind==='groups')return m.unknown==='a'?'share':m.unknown==='b'?'take':'repeat';
    if(m.kind==='compound')return 'cards';if(m.kind==='average')return 'average';
    if(m.kind==='fractiondiv')return 'cut';if(m.kind==='speed')return 'rate';
    if(m.kind==='inverse')return 'work';
    if(['times','lengthgroups','unitprice','decimalmul','fractionmul','decimaladd'].includes(m.kind))return 'measure';
    return null;
  }
  function draw(m){
    const key=keyFor(m);if(!key)return null;const scene=scenes[key];
    if(m.stage===0)return circleAction(m,scene);
    const details=document.createElement('details');details.className='actionScene';details.dataset.scene=key;
    const summary=document.createElement('summary');summary.textContent='場面の絵で たしかめる（静止画）';
    const heading=document.createElement('h3');heading.textContent=scene.title;
    const img=document.createElement('img');img.src='assets/scenes/'+(scene.file||key)+'.png';img.alt=scene.alt;img.width=640;img.height=400;img.decoding='async';
    const sample=document.createElement('p');sample.className='tiny';sample.textContent='場面の見本の静止画だよ。絵の個数や長さは、今のお話の数を表していないよ。';
    const cue=document.createElement('p');cue.textContent=scene.cue;
    details.append(summary,heading,img,sample,cue);
    const places=document.createElement('div');places.className='sceneQuantities';
    for(const id of scene.roles){
      const q=m.quantities.find(q=>q.id===id);if(!q||q.derived)continue;
      const card=document.createElement('div'),label=document.createElement('span'),number=document.createElement('strong');
      card.className=id===m.unknown?'askedQuantity':'knownQuantity';card.dataset.quantity=id;
      label.textContent=q.label;number.textContent=(id===m.unknown?'□':q.display||root.WordProblemEngine.format(q.value))+q.unit;
      card.append(label,number);if(id===m.unknown){const ask=document.createElement('small');ask.textContent='ここを聞いているよ';card.append(ask);}places.append(card);
    }
    if(places.children.length){details.append(places);const focus=document.createElement('p');focus.textContent=m.stage===0?'何の数を聞いているか、□の場所をたしかめよう。':'動きの言葉だけで計算を決めず、□がどの量かをたしかめよう。';details.append(focus);}
    return details;
  }
  function circleAction(m,scene){
    const d=document.createElement('details');d.className='actionScene circleAction';d.dataset.scene=keyFor(m);
    const summary=document.createElement('summary');summary.textContent='動きの絵で たしかめる';
    const title=document.createElement('h3');title.textContent=scene.title;
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 540 280');svg.setAttribute('role','img');svg.setAttribute('aria-label','この問題の個数に合わせた○の動き');
    const hint=document.createElement('p');hint.textContent=m.kind==='decrease'?'○が食べた分だけ動くよ。矢印と×は動いたあとも残るよ。':m.kind==='compare'?'○を一つずつ組にするよ。組にならない○に注目しよう。':'○が動いて一つのまとまりになるよ。矢印は動いたあとも残るよ。';
    const status=document.createElement('p');status.setAttribute('role','status');
    const play=document.createElement('button');play.type='button';play.textContent='▶ ○を動かす（もう一度もできる）';
    function n(tag,attrs,text){const x=document.createElementNS(svg.namespaceURI,tag);Object.entries(attrs).forEach(([k,v])=>x.setAttribute(k,v));if(text)x.textContent=text;return x;}
    let running=[];
    function render(move){
      running.forEach(a=>a.cancel());running=[];svg.replaceChildren();
      const defs=n('defs',{}),marker=n('marker',{id:'actionArrow'+m.id,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:6,markerHeight:6,orient:'auto'});marker.append(n('path',{d:'M0 0L10 5L0 10z',fill:'#ad7940'}));defs.append(marker);svg.append(defs);
      svg.append(n('text',{x:16,y:24,'font-size':18},m.kind==='compare'?m.names.a+' ／ '+m.names.total:m.kind==='decrease'?'はじめ → 食べた分 ／ のこり':'二つのまとまり → 合わせる'));
      if(move&&m.kind==='compare')for(let i=0;i<m.a;i++){
        const x=30+(i%10)*48,y=70+Math.floor(i/10)*35;
        svg.append(n('line',{x1:x,y1:y+13,x2:x,y2:y+32,stroke:'#236553','stroke-width':2}));
      }
      const count=m.kind==='compare'?m.a+m.total:m.total;
      for(let i=0;i<count;i++){
        let x,y,dx=0,dy=0,color='#236553';
        if(m.kind==='compare'){
          const other=i>=m.a,j=other?i-m.a:i;x=30+(j%10)*48;y=(other?170:70)+Math.floor(j/10)*35;dy=other?-55:0;color=other?'#bd7331':'#236553';
        }else if(m.kind==='decrease'){x=35+(i%10)*48;y=85+Math.floor(i/10)*42;if(i<m.a){dy=105;color='#bd7331';}}
        else{const second=i>=m.a,j=second?i-m.a:i;x=35+(j%10)*48;y=(second?180:75)+Math.floor(j/10)*35;dy=second?-55:20;color=second?'#bd7331':'#236553';}
        if(move&&(dx||dy))svg.append(n('line',{x1:x,y1:y,x2:x+dx,y2:y+dy,stroke:'#ad7940','stroke-width':2,'stroke-dasharray':'4 4','marker-end':`url(#actionArrow${m.id})`}));
        const circle=n('circle',{cx:x,cy:y,r:13,fill:'white',stroke:color,'stroke-width':3});svg.append(circle);
        if(move){const a=circle.animate([{transform:'translate(0px,0px)'},{transform:`translate(${dx}px,${dy}px)`}],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:900,delay:matchMedia('(prefers-reduced-motion: reduce)').matches?0:i*50,fill:'forwards'});running.push(a);if(m.kind==='decrease'&&i<m.a)svg.append(n('path',{d:`M${x-8} ${y+dy-8}l16 16m0 -16l-16 16`,stroke:'#a64c32','stroke-width':2}));}
      }
      status.textContent=move?'○一つが一つのもの。動いたあとの○と矢印を見て、自分の図にも書き残そう。':'動かして、お話の変わり方を見よう。';
    }
    play.addEventListener('click',()=>render(true));d.append(summary,title,hint,svg,play,status);render(false);return d;
  }
  const api={scenes,keyFor,draw};
  if(typeof module!=='undefined')module.exports=api;
  root.WordProblemActionScenes=api;
})(typeof window==='undefined'?globalThis:window);

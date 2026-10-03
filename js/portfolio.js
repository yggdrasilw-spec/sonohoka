document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const topics = {add:'足し算',subtract:'引き算',multiply:'かけ算・九九',divide:'わり算',written:'筆算',place:'位取り・大きな数',units:'長さ・かさ・単位',shape:'図形・しきつめ',clock:'時計・時間',ratio:'倍・割合',number:'数感覚・数の性質',words:'国語・作文・辞書',characters:'漢字・書き順・かな',games:'ゲーム・対戦',classroom:'学級・生活',ai:'AI・画像認識',voice:'音声つき'};
  const usages = {understand:'意味・仕組みを学ぶ',practice:'問題を練習する',game:'ゲームで学ぶ',create:'書く・作品を作る',teacher:'学級・生活を支援する',experiment:'技術・観察を体験する'};
  const normalize = text => String(text).normalize('NFKC').toLowerCase().replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0)-0x60)).replace(/([1-6])年生/g,'$1年').replace(/\s+/g,' ').trim();
  const aliases = [['足し算','たしざん','足しざん','たし算','加算'],['引き算','ひきざん','引きざん','ひき算','減算'],['かけ算','かけざん','掛け算','九九','乗算'],['わり算','わりざん','割り算','割算','除算'],['筆算','ひっさん'],['時計','とけい','時刻'],['漢字','かんじ'],['書き順','かきじゅん','筆順'],['図形','ずけい'],['しきつめ','敷き詰め','敷詰め','敷きつめ','タイリング'],['そろばん','算盤'],['長さ','ながさ'],['単位','たんい'],['位取り','くらいどり'],['ひらがな','平仮名'],['かたかな','片仮名']].map(a=>a.map(normalize));
  const tokenize = text => normalize(text).split(' ').filter(Boolean);
  const cards = [...document.querySelectorAll('.card')];
  const items = cards.map(card => ({card,id:Number(card.dataset.registerOrder),title:card.querySelector('h3').textContent,grades:(card.dataset.grades||'').split(',').filter(Boolean),main:Number(card.dataset.mainGrade)||99,category:card.dataset.category,audience:card.dataset.audience,usage:card.dataset.usage,topics:card.dataset.topics.split(',').filter(Boolean),text:normalize([card.textContent,card.dataset.category,...(card.dataset.grades||'').split(',').filter(Boolean).map(g=>g+'年')].join(' '))}));
  $('appCount').textContent = `${items.length}本`;
  items.forEach(item=>item.card.querySelector('[data-usage-label]').textContent=usages[item.usage]);
  const state = {q:'',grade:'all',category:'all',usage:'all',audience:'all',topics:new Set(),sort:'mainGrade'};
  const controls = {q:'searchInput',grade:'gradeSelect',category:'categorySelect',usage:'usageSelect',audience:'audienceSelect',sort:'sortSelect'};
  const params = new URLSearchParams(location.search);
  Object.keys(controls).forEach(key=>{const value=params.get(key);if(value!==null&&(key==='q'||[...$(controls[key]).options].some(o=>o.value===value)))state[key]=value;$(controls[key]).value=state[key]});
  (params.get('topics')||'').split(',').filter(t=>topics[t]).forEach(t=>state.topics.add(t));
  Object.entries(topics).forEach(([key,label])=>{const button=document.createElement('button');button.type='button';button.className='chip';button.dataset.topic=key;button.textContent=label;button.setAttribute('aria-pressed',String(state.topics.has(key)));button.addEventListener('click',()=>{state.topics.has(key)?state.topics.delete(key):state.topics.add(key);apply()});$('topicChips').append(button)});
  if(state.topics.size||state.usage!=='all'||state.audience!=='all')$('advancedFilters').open=true;
  function matchesKeyword(item) {return tokenize(state.q).every(term=>{const variants=aliases.find(group=>group.includes(term))||[term];return variants.some(v=>item.text.includes(v))})}
  function matches(item,omit) {
    if(!matchesKeyword(item))return false;
    if(omit!=='grade'&&state.grade!=='all') {
      const common=item.audience==='common'||item.audience==='teacher';
      if(state.grade==='common'?!common:!item.grades.includes(state.grade)&&!common)return false;
    }
    if(state.category==='classroom'&&!item.topics.includes('classroom'))return false;
    if(state.category==='experiment'&&item.audience!=='experiment')return false;
    if(!['all','classroom','experiment'].includes(state.category)&&item.category!==state.category)return false;
    if(state.usage!=='all'&&item.usage!==state.usage)return false;
    if(state.audience!=='all'&&item.audience!==state.audience)return false;
    return !state.topics.size||item.topics.some(t=>state.topics.has(t));
  }
  function sort() {
    const sorted=items.slice().sort((a,b)=>state.sort==='newest'?b.id-a.id:state.sort==='registered'?a.id-b.id:state.sort==='title'?a.title.localeCompare(b.title,'ja'):a.main-b.main||a.id-b.id);
    sorted.forEach(i=>document.querySelector('.grid').append(i.card));
  }
  function saveURL(){const p=new URLSearchParams();Object.entries(state).forEach(([key,value])=>{if(key==='topics'){if(value.size)p.set(key,[...value].join(','))}else if(value&&value!=='all'&&!(key==='sort'&&value==='mainGrade'))p.set(key,value)});try{history.replaceState(null,'',location.pathname+(p.size?'?'+p:'')+location.hash)}catch{}}
  function activeButton(label,clear){const button=document.createElement('button');button.type='button';button.textContent=label+' ×';button.setAttribute('aria-label',label+'の条件を解除');button.addEventListener('click',()=>{clear();apply();focusResults()});$('activeFilters').append(button)}
  function apply(){
    let count=0;items.forEach(item=>{const show=matches(item);item.card.hidden=!show;if(show)count++;else item.card.querySelector('video')?.pause()});
    $('resultCount').textContent=`${items.length}本中 ${count}本を表示`;
    $('noResults').hidden=count!==0;
    $('searchClearBtn').hidden=!state.q;
    $('resetFiltersBtn').hidden=!state.q&&state.grade==='all'&&state.category==='all'&&state.usage==='all'&&state.audience==='all'&&!state.topics.size;
    document.querySelectorAll('[data-topic]').forEach(b=>b.setAttribute('aria-pressed',String(state.topics.has(b.dataset.topic))));
    [...$('gradeSelect').options].forEach(o=>{const common=i=>['common','teacher'].includes(i.audience);const n=items.filter(i=>matches(i,'grade')&&(o.value==='all'||(o.value==='common'?common(i):i.grades.includes(o.value)||common(i)))).length;o.textContent=(o.value==='all'?'すべての学年':o.value==='common'?'学年共通・先生用':o.value+'年')+`（${n}）`});
    $('activeFilters').replaceChildren();if(state.q)activeButton(`検索：${state.q}`,()=>{state.q='';$('searchInput').value=''});
    ['category','grade','usage','audience'].forEach(key=>{if(state[key]!=='all'){const label=$(controls[key]).selectedOptions[0].textContent.replace(/（\d+）$/,'');activeButton(label,()=>{state[key]='all';$(controls[key]).value='all'})}});
    state.topics.forEach(t=>activeButton(topics[t],()=>state.topics.delete(t)));
    const advanced=state.topics.size+Number(state.usage!=='all')+Number(state.audience!=='all');$('advancedCount').textContent=advanced?`（${advanced}条件）`:'';
    sort();saveURL();
  }
  function focusResults(){ $('resultsHeading').focus({preventScroll:true});$('resultsBar').scrollIntoView({block:'start',behavior:'instant'}) }
  function reset(){Object.keys(controls).filter(k=>k!=='sort').forEach(key=>{state[key]=key==='q'?'':'all';$(controls[key]).value=state[key]});state.topics.clear();apply();focusResults()}
  Object.entries(controls).forEach(([key,id])=>$(id).addEventListener(key==='q'?'input':'change',()=>{state[key]=$(id).value;apply()}));
  $('searchClearBtn').addEventListener('click',()=>{state.q='';$('searchInput').value='';apply();$('searchInput').focus()});
  $('resetFiltersBtn').addEventListener('click',reset);$('emptyResetBtn').addEventListener('click',reset);
  document.querySelector('.grid').addEventListener('click',event=>{const tag=event.target.closest('[data-search]');if(!tag)return;state.q=tag.dataset.search;$('searchInput').value=state.q;apply();focusResults()});
  const modal=$('mediaModal'),modalVideo=modal.querySelector('video'),motion=matchMedia('(prefers-reduced-motion: reduce)');let opener;
  const close=()=>modal.close();modal.querySelector('.media-modal-close').addEventListener('click',close);
  modal.addEventListener('keydown',event=>{if(event.key!=='Tab')return;const first=modal.querySelector('.media-modal-close'),last=$('modalAppLink');if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}});
  modal.addEventListener('click',event=>{if(event.target===modal){const box=modal.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)close()}});
  modal.addEventListener('close',()=>{modalVideo.pause();modalVideo.removeAttribute('src');modalVideo.load();document.body.classList.remove('modal-open');opener?.focus({preventScroll:true})});
  modalVideo.addEventListener('error',()=>{$('videoError').hidden=false});
  items.forEach(item=>{
    const card=item.card,link=card.querySelector('.actions a.primary'),file=card.dataset.video;
    const media=document.createElement(file?'button':'div');media.className='card-media'+(file?' has-video':'');if(file){media.type='button';media.setAttribute('aria-label',item.title+'の紹介動画を見る');media.setAttribute('aria-haspopup','dialog')}
    const img=document.createElement('img');img.loading='lazy';img.decoding='async';img.alt=item.title+'の画面';img.src='media/'+(card.dataset.poster||(file?file.replace(/\.(mp4|webm)$/i,'.png'):''));img.addEventListener('error',()=>{img.remove();const fallback=document.createElement('span');fallback.className='media-fallback';fallback.textContent=item.title;media.prepend(fallback)});media.append(img);card.prepend(media);
    if(!file)return;
    const video=document.createElement('video');video.muted=true;video.loop=true;video.playsInline=true;video.preload='none';video.setAttribute('aria-hidden','true');media.append(video);
    const stop=()=>{video.pause();media.classList.remove('is-hover')};
    media.addEventListener('mouseenter',()=>{if(motion.matches||!matchMedia('(hover:hover)').matches)return;if(!video.getAttribute('src'))video.src='media/'+file;video.play().then(()=>{if(media.matches(':hover')&&!modal.open)media.classList.add('is-hover');else stop()}).catch(stop)});
    media.addEventListener('mouseleave',stop);video.addEventListener('error',stop);
    media.addEventListener('click',()=>{items.forEach(i=>{i.card.querySelector('video')?.pause();i.card.querySelector('.card-media')?.classList.remove('is-hover')});opener=media;$('mediaTitle').textContent=item.title+' — 紹介動画';$('modalAppLink').href=link.href;$('modalAppLink').textContent=link.textContent.trim()+' ↗';$('videoError').hidden=true;modalVideo.src='media/'+file;modalVideo.muted=true;document.body.classList.add('modal-open');modal.showModal();modal.querySelector('.media-modal-close').focus();modalVideo.play().catch(()=>{})});
    card.querySelectorAll('.actions a').forEach(a=>{a.setAttribute('aria-label',item.title+'：'+a.textContent.trim()+'（新しいタブ）');a.title='新しいタブで開きます'});
  });
  motion.addEventListener('change',()=>{if(motion.matches)items.forEach(i=>{i.card.querySelector('video')?.pause();i.card.querySelector('.card-media')?.classList.remove('is-hover')})});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){modalVideo.pause();items.forEach(i=>i.card.querySelector('video')?.pause())}});
  apply();
});

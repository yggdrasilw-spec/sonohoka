/* A representative sound inventory. English short vowels use a general American model. */
'use strict';
window.PHONICS = (() => {
 const words = {
 apple:['りんご','apple'],ant:['あり','ant'],cat:['ねこ','cat'],ball:['ボール','ball'],banana:['バナナ','banana'],bus:['バス','bus'],cup:['コップ','cup'],key:['かぎ','key'],kite:['たこ','kite'],dog:['いぬ','dog'],duck:['あひる','duck'],door:['ドア','door'],egg:['たまご','egg'],elephant:['ぞう','elephant'],pen:['ペン','pen'],fish:['さかな','fish'],fan:['せんぷうき','fan'],flower:['はな','flower'],gorilla:['ゴリラ','gorilla'],goat:['やぎ','goat'],grapes:['ぶどう','grapes'],hat:['ぼうし','hat'],hand:['て','hand'],house:['いえ','house'],ink:['インク','ink'],insect:['こんちゅう','insect'],pig:['ぶた','pig'],juice:['ジュース','juice'],jam:['ジャム','jam'],jet:['ジェットき','jet'],lemon:['レモン','lemon'],lion:['ライオン','lion'],leaf:['はっぱ','leaf'],milk:['ぎゅうにゅう','milk'],monkey:['さる','monkey'],moon:['つき','moon'],nose:['はな','nose'],net:['あみ','net'],nine:['9','nine'],octopus:['たこ','octopus'],sock:['くつした','sock'],box:['はこ','box'],panda:['パンダ','panda'],queen:['じょおう','queen'],quiz:['クイズ','quiz'],quiet:['しずかに','quiet'],rabbit:['うさぎ','rabbit'],robot:['ロボット','robot'],rainbow:['にじ','rainbow'],sun:['たいよう','sun'],snake:['へび','snake'],tiger:['とら','tiger'],ten:['10','ten'],tomato:['トマト','tomato'],umbrella:['かさ','umbrella'],van:['ワゴンしゃ','van'],violin:['バイオリン','violin'],vase:['かびん','vase'],water:['みず','water'],window:['まど','window'],watch:['うでどけい','watch'],fox:['きつね','fox'],six:['6','six'],yellow:['きいろ','yellow'],yogurt:['ヨーグルト','yogurt'],yoyo:['ヨーヨー','yo-yo'],zebra:['しまうま','zebra'],zoo:['どうぶつえん','zoo'],zipper:['ファスナー','zipper'],three:['3','three'],thumb:['おやゆび','thumb'],tooth:['は','tooth'],this:['これ','this'],that:['あれ','that'],mother:['おかあさん','mother'],chair:['いす','chair'],cheese:['チーズ','cheese'],chicken:['にわとり','chicken'],shoe:['くつ','shoe'],sheep:['ひつじ','sheep'],shark:['さめ','shark'],hats:['ぼうしが ふたつ','hats'],cats:['ねこが にひき','cats'],boots:['ながぐつ','boots']
 };
 const W=(key,start,length=1)=>({key,label:words[key][1],ja:words[key][0],start,length});
 const raw=[
 ['ae','a','æ','ae',1,'口を大きく開いて、舌を前にする','英語の a の音。日本語の「あ」と聞きくらべよう。',[W('apple',0),W('ant',0),W('cat',1)]],
 ['b','b','b','p',1,'くちびるを閉じて、開く','声を出すと、のどがぶるぶる。',[W('ball',0),W('banana',0),W('bus',0)]],
 ['k','c・k','k','k',0,'舌の奥でふさいで、はなす','息をいったん止める。開くと短い音が出る。',[W('cup',0),W('key',0),W('cat',0),W('kite',0)]],
 ['d','d','d','t',1,'舌先で、上の歯のうしろをふさぐ','舌をはなして、声を出す。',[W('dog',0),W('duck',0),W('door',0)]],
 ['eh','e','ɛ','eh',1,'舌を前にして、口を少し開く','英語の e の音。',[W('egg',0),W('elephant',0),W('pen',1)]],
 ['f','f','f','f',0,'上の前歯を、下くちびるに近づける','すき間から、息を出す。',[W('fish',0),W('fan',0),W('flower',0)]],
 ['g','g','ɡ','k',1,'舌の奥でふさいで、はなす','声を出すと、のどがぶるぶる。',[W('gorilla',0),W('goat',0),W('grapes',0)]],
 ['h','h','h','h',0,'口の中をふさがず、息を出す','そのあとに続く、母音の口へ。',[W('hat',0),W('hand',0),W('house',0)]],
 ['ih','i','ɪ','ih',1,'舌を前にして、少し高くする','英語の i の音。日本語の「い」と聞きくらべよう。',[W('ink',0),W('insect',0),W('pig',1)]],
 ['j','j','dʒ','ch',1,'舌の前でふさいで、はなす','すき間から、声を続けて出す。',[W('juice',0),W('jam',0),W('jet',0)]],
 ['l','l','l','l',1,'舌先を、上の歯のうしろにつける','舌の横から、息が通る。',[W('lemon',0),W('lion',0),W('leaf',0)]],
 ['m','m','m','m',1,'くちびるを閉じる','声を出すと、息は鼻へ。',[W('milk',0),W('monkey',0),W('moon',0)]],
 ['n','n','n','n',1,'舌先を、上の歯のうしろにつける','口をふさいで、息は鼻へ。',[W('nose',0),W('net',0),W('nine',0)]],
 ['aa','o','ɑ','aa',1,'口を開いて、舌を低くする','英語の o の音。日本語の「お」と聞きくらべよう。',[W('octopus',0),W('sock',1),W('box',1)]],
 ['p','p','p','p',0,'くちびるを閉じて、開く','声を付けずに、短く出す。',[W('pig',0),W('pen',0),W('panda',0)]],
 ['kw','qu','kw','k',0,'舌の奥をはなして、くちびるを丸める','k と w の動きを、つなぐ。',[W('queen',0,2),W('quiz',0,2),W('quiet',0,2)]],
 ['r','r','ɹ','r',1,'舌を、口の上につけない','日本語の「ら」と聞きくらべよう。',[W('rabbit',0),W('robot',0),W('rainbow',0)]],
 ['s','s','s','s',0,'舌と歯の近くに、せまいすき間','そこから、息を続けて出す。',[W('sun',0),W('sock',0),W('snake',0)]],
 ['t','t','t','t',0,'舌先で、上の歯のうしろをふさぐ','舌をはなして、短く出す。',[W('tiger',0),W('ten',0),W('tomato',0)]],
 ['uh','u','ʌ','uh',1,'口を軽く開き、声を出す','英語の u の音。日本語の「う」と聞きくらべよう。',[W('umbrella',0),W('cup',1),W('bus',1)]],
 ['v','v','v','f',1,'上の前歯を、下くちびるに近づける','すき間から、声と息を出す。',[W('van',0),W('violin',0),W('vase',0)]],
 ['w','w','w','w',1,'くちびるを丸める','すぐに、次の母音の口へ。',[W('water',0),W('window',0),W('watch',0)]],
 ['ks','x','ks','k',0,'k の動きと、s の動きをつなぐ','単語の終わりで、見つけよう。',[W('box',2),W('fox',2),W('six',2)]],
 ['y','y','j','y',1,'舌の前を、高くする','すぐに、次の母音の口へ。',[W('yellow',0),W('yogurt',0),W('yoyo',0)]],
 ['z','z','z','s',1,'s と似た、せまいすき間','声を出して、ぶるぶるを感じよう。',[W('zebra',0),W('zoo',0),W('zipper',0)]],
 ['th','th','θ','th',0,'舌先を、歯の間に少し出す','すき間から、息を出す。',[W('three',0,2),W('thumb',0,2),W('tooth',3,2)]],
 ['dh','th','ð','th',1,'舌先を、歯の間に少し出す','声を出す th もあるよ。',[W('this',0,2),W('that',0,2),W('mother',2,2)]],
 ['ch','ch','tʃ','ch',0,'舌の前で、いったんふさぐ','はなして、すき間から息を出す。',[W('chair',0,2),W('cheese',0,2),W('chicken',0,2)]],
 ['sh','sh','ʃ','sh',0,'舌の前で、せまいすき間をつくる','息を続けて出す。',[W('shoe',0,2),W('sheep',0,2),W('shark',0,2)]],
 ['ts','ts','ts','t',0,'t の動きと、s の動きをつなぐ','終わりの音を、聞いてみよう。',[W('hats',2,2),W('cats',2,2),W('boots',3,2)]]
 ];
 const sounds=raw.map(([id,letters,ipa,mouth,voiced,action,hint,examples])=>({id,letters,ipa,mouth,voiced:id==='kw'?'mixed':!!voiced,action,hint,examples}));
 const vowels=[['a','あ','口を大きく開く'],['i','い','舌を前にして、高くする'],['u','う','舌の奥を高くする。くちびるは強く突き出さない'],['e','え','舌を前にして、ほどよく開く'],['o','お','くちびるを丸める']].map(([id,kana,action])=>({id,kana,action,mouth:'jp-'+id}));
 const alphabet='abcdefghijklmnopqrstuvwxyz'.split('');
 const names=['エー','ビー','シー','ディー','イー','エフ','ジー','エイチ','アイ','ジェイ','ケー','エル','エム','エヌ','オー','ピー','キュー','アール','エス','ティー','ユー','ヴィー','ダブリュー','エックス','ワイ','ズィー'];
 const letterSounds=['ae','b','k','d','eh','f','g','h','ih','j','k','l','m','n','aa','p','kw','r','s','t','uh','v','w','ks','y','z'];
 const syllables={m:['ま','み','む','め','も'],k:['か','き','く','け','こ'],n:['な','に','ぬ','ね','の'],p:['ぱ','ぴ','ぷ','ぺ','ぽ']};
 const pair={b:'p',p:'b',d:'t',t:'d',g:'k',k:'g',f:'v',v:'f',s:'z',z:'s',th:'dh',dh:'th'};
 return {words,sounds,vowels,alphabet,names,letterSounds,syllables,pair};
})();

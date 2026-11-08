/* Original short captions. Only the already crosschecked words are spoken. */
'use strict';
window.PHONICS_STORIES = [
 {id:'silent-e',label:'e がやってきた',focus:'u…e',frames:[
  {words:['cut'],caption:'cut。「切る」だね。真ん中の u の音を聞いてみよう。'},
  {words:['cute'],from:'cut',effect:'add-e',caption:'最後に e がやってきた。cute。「かわいい」に変わったよ。'},
  {words:['cut','cute'],effect:'change',caption:'cut → cute。u の音が変わる。最後の e だけの音は、足さないよ。'},
  {words:['have','give'],effect:'exception',caption:'でも、have と give はちがう。最後に e があっても、母音は名前の音にならない。'},
  {words:['cut','cute'],effect:'recap',caption:'e は、音を予想する手がかり。いつも同じになる、という約束ではないよ。'}]},
 {id:'ck',label:'2文字で、ひとつの音',focus:'ck',frames:[
  {words:['duck'],caption:'duck。最後の ck に注目。2文字だけど、音はひとつ。'},
  {words:['sock'],caption:'sock の最後も ck。短い母音の、すぐあとにあるね。'},
  {words:['duck','sock'],effect:'join',caption:'短い母音 → ck。ここでは ck を、まとめて /k/ と読むよ。'},
  {words:['duck','sock'],effect:'recap',caption:'1音節の単語の終わり。短い母音1つのすぐあとの /k/ は、ck と書くことが多いよ。'}]},
 {id:'tch',label:'3文字が、ひとつになる',focus:'tch',frames:[
  {words:['catch'],caption:'catch。「つかまえる」。最後の3文字を見よう。'},
  {words:['catch'],effect:'join',caption:'t・c・h を、まとめて /tʃ/。t の音を別に足さないよ。'},
  {words:['much'],effect:'exception',caption:'much は、同じ /tʃ/ でも ch。短い母音のあとでも、つづりがちがうことがある。'},
  {words:['catch','much'],effect:'recap',caption:'短い母音のすぐあとの、語末の /tʃ/。tch は手がかりだけど、much は単語で覚えよう。'}]},
 {id:'dge',label:'dge も、まとめて読む',focus:'dge',frames:[
  {words:['bridge'],caption:'bridge。「橋」。まずは、単語ぜんぶを聞こう。'},
  {words:['bridge'],effect:'join',caption:'最後の d・g・e は、まとめて /dʒ/。3文字から、ひとつの音。'},
  {words:['bridge'],effect:'recap',caption:'1音節の単語の終わり。短い母音1つのすぐあとの /dʒ/ は、dge と書くことが多いよ。'}]},
 {id:'ai-ay',label:'つづりはちがう。音は同じ',focus:'ai / ay',frames:[
  {words:['rain'],caption:'rain。「雨」。ai の音を聞いてみよう。'},
  {words:['day'],caption:'day。「日」。今度は ay。どんな音かな？'},
  {words:['rain','day'],effect:'same',caption:'ai と ay。文字はちがっても、どちらも /eɪ/。同じ音なんだね。'},
  {words:['rain','day'],effect:'recap',caption:'ai は途中、ay は終わりによく出るよ。音だけで決めず、単語のつづりもいっしょに覚えよう。'}]},
 {id:'oo',label:'同じ oo、ちがう音',focus:'oo',frames:[
  {words:['moon'],caption:'moon。「月」。oo の音を、覚えておいてね。'},
  {words:['book'],caption:'book。「本」。同じ oo。でも、さっきとちがう音だね。'},
  {words:['moon','book'],effect:'different',caption:'moon と book。oo は同じでも、音はちがう。長さだけでなく、音の感じも変わるよ。'},
  {words:['moon','book'],effect:'recap',caption:'oo の音は、ほかにもあるよ。文字だけで決めず、単語のお手本で確かめよう。'}]},
 {id:'ea',label:'ea にも、いくつかの音',focus:'ea',frames:[
  {words:['sea'],caption:'sea。「海」。ea の音を聞いてみよう。'},
  {words:['head'],caption:'head。「頭」。同じ ea が、別の音になったね。'},
  {words:['sea','head'],effect:'different',caption:'sea と head。つづりは同じでも、単語が変わると音もちがう。'},
  {words:['sea','head'],effect:'recap',caption:'ea にも、ほかの音があるよ。「いつもこの音」と決めずに、お手本と比べよう。'}]},
 {id:'ow',label:'終わりの ow でも、ちがう',focus:'ow',frames:[
  {words:['snow'],caption:'snow。「雪」。最後の ow を聞こう。'},
  {words:['cow'],caption:'cow。「牛」。最後は同じ ow。でも、音はちがうね。'},
  {words:['snow','cow'],effect:'different',caption:'snow と cow。どちらも単語の終わり。場所だけでは、音は決まらないよ。'},
  {words:['snow','cow'],effect:'recap',caption:'snow は、地域によっても音が少しちがう。ひとつだけが正解、と考えなくていいんだよ。'}]},
 {id:'word-memory',label:'手がかりと、お手本',focus:'ことばで確かめる',frames:[
  {words:['have','give'],effect:'exception',caption:'have と give。最後の e があっても、母音は名前の音にならなかったね。'},
  {words:['much'],effect:'exception',caption:'much は、短い母音のあとでも ch。こんな単語は、違うところに注目して覚えよう。'},
  {words:['rain','day'],effect:'same',caption:'同じ音でも、つづりがちがう。'},
  {words:['moon','book'],effect:'different',caption:'同じつづりでも、音がちがう。'},
  {words:['cut','cute'],effect:'recap',caption:'きまりは、読むための手がかり。お手本とくらべると、読めることばが増えていくよ。'}]}
];

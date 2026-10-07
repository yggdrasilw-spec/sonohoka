const fs=require('node:fs');
const vm=require('node:vm');
const problems=vm.runInNewContext(fs.readFileSync('linear-lab-assets/word-problems.js','utf8')+';linearWordProblems');
const lines=['# 一次関数ラボ：追加の文章題20問','', '価格・速さ・測定値は授業用のオリジナル設定です。問題はアプリの学習メニューから「生活の文章題｜20問」で選べます。','', '図・表・計算・グラフは同じxに連動します。整数の個数は点で表し、連続量と区別します。2点から増え方を求める問題は、最初は測定した2点だけを表示します。',''];
for(const p of problems){
 const formula=(a,b)=>'y＝'+a+'x'+(b>=0?'＋':'−')+Math.abs(b);
 lines.push('## '+p.id+'. '+p.title+'（'+p.group+'）','',p.story,'', '**問い：** '+p.prompt,'','x：'+p.xLabel+'（'+p.xUnit+'）／y：'+p.yLabel+'（'+p.yUnit+'）','', '**答え：** '+(p.fields?p.fields.map(f=>f.label+'：'+f.answer).join('、'):p.choices[p.answer]),'', '**考え方：** '+p.explanation,'', '**式：** '+formula(p.a,p.b)+(p.a2!==undefined?' ／ B：'+formula(p.a2,p.b2):''),'');
 if(p.choices)lines.push('**選択肢：** '+p.choices.join(' ／ '),'');
}
fs.writeFileSync('linear-lab-assets/word-problems.md',lines.join('\n'));
console.log('Exported 20 problems with answers and explanations.');

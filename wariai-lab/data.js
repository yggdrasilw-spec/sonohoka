window.WariaiProblems = (()=>{
 const source3='〇3年割合につながるモジュール教材（割合）.pptx';
 const make=(id,base,ratio,unknown,source,slide,grade,note='アプリ用に未知の量と問いを設定。')=>({id,base,ratio,unknown,source,slide,grade,note,unit:'m',diagram:'tape',initial:'word',range:'正の有理数、基準量は0にしない'});
 const core=[
  make('core-compare','3','4','compare',source3,2,3,'原問「3mの4倍は何mでしょうか」を採用。初期画面では図と解答を隠す。'),
  make('core-ratio','9','4','ratio','○5年割合につながるモジュール教材（割合）.pptx',13,3,'原問「36mを9mずつ切る」を、連続量の割合を問う「36mは9mの何倍？」に変更。'),
  make('core-base','9','4','base','○5年割合につながるモジュール教材（基準量）.pptx',12,4,'原問「36mを4つに等しく分ける」を「4倍した長さが36m。元の長さは？」に変更。')
 ];
 const extended=[...core,
  make('small-ratio','10','4/5','ratio',null,null,5,'追加問。小さい数÷大きい数で、1倍より小さい割合を求める。'),
  make('small-compare','10','4/5','compare',null,null,5,'追加問。0.8倍では元の量より小さくなる。'),
  make('small-base','10','6/5','base',null,null,5,'追加問。1.2倍した長さから元の量を求める。'),
  make('fraction-ratio','3/4','2/3','ratio',null,null,6,'追加問。1/2mは3/4mの何倍か。近似小数でなく2/3を正答とする。'),
  make('fraction-compare','3/4','2/3','compare',null,null,6,'追加問。連続量のテープを使い、3/4mの2/3倍を考える。'),
  make('fraction-base','3/4','2/3','base',null,null,6,'追加問。2/3倍で1/2mになる元の量を考える。')
 ];
 const source6=[
  {...make('source6-28','70','7/10','ratio','○6年　割合.pptx',28,6,'原問の数値と百分率での回答を保持。'),unit:'本',percent:true},
  {...make('source6-29','75','6/5','ratio','○6年　割合.pptx',29,6,'原問の数値と百分率での回答を保持。'),unit:'g',percent:true},
  {...make('source6-30','85','3/5','compare','○6年　割合.pptx',30,6,'原問の数値と問いを保持。'),percent:true},
  {...make('source6-31','450','3/10','compare','○6年　割合.pptx',31,6,'原問の数値と問いを保持。'),unit:'L',percent:true},
  {...make('source6-32','200','9/10','base','○6年　割合.pptx',32,6,'原問の数値と問いを保持。'),unit:'人',percent:true},
  {...make('source6-33','88','3/2','base','○6年　割合.pptx',33,6,'原問の数値と問いを保持。'),unit:'個',percent:true}
 ];
 return {core,extended,source6};
})();

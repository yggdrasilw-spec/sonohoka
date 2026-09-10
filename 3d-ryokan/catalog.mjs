// Dimensions are metres, capacities mL. No package/case dimensions are used.
const source=(title,url)=>({title,url,checked:'2026-09-10'});
const pet=source('ホクモウ：飲料用PET容器一覧','https://www.hokumo.net/plastic/petbottle-lineup/');
const masu=n=>source('TRUSCO：サンプラ '+n,'https://www.orange-book.com/ja/c/products/index.html?itemCd='+n+'+++++++++++++++++++++++++3056');
const generic='外形の細部・色は教材用に簡略化。掲載寸法を保って作成。';
function entry(name,kind,mm,value,unit,reference,note='',extra={}){return {name,kind,width:mm[0]/1000,height:mm[1]/1000,depth:mm[2]/1000,value,unit,label:name+(unit==='mm'?'の厚さ':kind==='kettle'?'の満水容量':'の容量'),hint:note||generic,sources:[reference],dimensionStatus:'資料値',...extra};}
export const catalog={
 masuL:entry('1Lます','measure',[106,148,106],1,'L',masu('01114'),'外径106mm・高さ148mm。1Lは上端までの満水量ではありません。',{capacityMl:1000,innerDiameter:.103,stepMl:100}),
 masuDL:entry('1dLます','measure',[52,73,52],1,'dL',masu('01112'),'1dL＝100mL。10mLずつの目盛り。',{capacityMl:100,innerDiameter:.047,stepMl:10}),
 syringe:entry('10mLシリンジ','syringe',[19.7,118.5,19.7],10,'mL',source('Savillex：700-510','https://savillex.jp/product/generallabware/700-510.html'),'研究用シリンジの例。胴外径19.7mm・押し子込み118.5mm。つば幅・内径は未確認、細部は模式図。針なし。',{capacityMl:10,dimensionStatus:'胴径・全長を確認／つば幅未確認'}),
 pet250:entry('PET 250mL','bottle',[55,142.5,55],250,'mL',pet,'飲料用角形容器。空容器の公称容量・本体寸法。キャップは省略。',{capacityMl:250}),
 pet500:entry('PET 500mL','bottle',[60,207,60],500,'mL',pet,'飲料用角形容器。500mL＝5dL。空容器の本体寸法。キャップは省略。',{capacityMl:500}),
 pet1500:entry('PET 1.5L','bottle',[106.6,244,89.1],1.5,'L',pet,'飲料用角形容器。1500mL＝1.5L。本体寸法。キャップは省略。',{capacityMl:1500}),
 pet2000:entry('PET 2L','bottle',[106.6,305,87.6],2,'L',pet,'飲料用角形容器。2L＝20dL。本体寸法。キャップは省略。',{capacityMl:2000}),
 can350:entry('ジュース缶 350mL','can',[66.22,122.22,66.22],350,'mL',source('大華金属：STANDARD 202 smooth 350mL','https://www.greatchina.com.tw/en/standard-202smooth-2/'),'容器メーカーの350mL缶を基準とする例。特定のジュース商品の再現ではありません。',{capacityMl:350}),
 bucket10:entry('バケツ 10L','bucket',[290,255,290],10,'L',source('アサヒ化成：B-0305 エンゼルバケツ10L','https://hi-asahi.co.jp/products/bucket/246.html'),'本体直径290mm・高さ255mm。取っ手を上げた高さは未確認。空の状態で持ちます。',{capacityMl:10000}),
 kettle:entry('やかん 2.5L','kettle',[260,220,195],2.5,'L',source('パール金属 H-1722：MonotaRO製品仕様','https://www.monotaro.com/p/1915/6086/'),'満水2.5L／適正1.7L。取っ手・注ぎ口を含む外寸。空の状態で持ちます。',{capacityMl:2500,workingCapacityMl:1700}),
 notebook:entry('ノート（A5）','book',[148,210,5],5,'mm',source('コクヨ ノ-104B：コーナン製品外寸','https://www.kohnan-eshop.com/shop/g/g4901480070452/'),'A5・40枚のノート。閉じた厚さは約5mm（販売店資料）。',{dimensionStatus:'約寸法（販売店）'}),
 fieldnote:entry('小さなノート','book',[95,165,6],6,'mm',source('コクヨ：野帳 スケッチ40枚','https://www.kokuyo.com/stationery/category/notebook-paper/fieldnote/10733/'),'閉じた厚さ6mm。表紙を横から見てみよう。'),
 encyclopedia:entry('図鑑','book',[216,284,25],25,'mm',source('BCC 2025カタログ p145：小学館NEO 昆虫DVD付','https://www.bccweb.co.jp/supplier/pdf/ScienceGoodsCatalog2025_web.pdf'),'NEO昆虫DVD付の外寸を参照。厚さ25mm＝2.5cm。表紙の絵はオリジナル。'),
 postcard:entry('郵便はがき用紙','card',[100,148,.22],.22,'mm',source('エレコム EJH-WSFN100','https://www.elecom.co.jp/products/EJH-WSFN100.html'),'郵便番号枠入り私製はがき用紙の例。100×148mm・紙厚0.22mm。日本郵便発行の通常はがきとは別製品。'),
};
export const handReference={length:.1502,width:.0694,middle:.0634,wristThickness:.0325,source:source('児童の手の計測研究（2020）Table 2：8.0–8.4歳男子','https://pmc.ncbi.nlm.nih.gov/articles/PMC7720326/'),note:'研究集団の平均値を参照。日本人児童の標準値ではない。親指・他の指・関節配分・掌厚は造形上の推定。身長130cmは独立した教材設定。'};
export const conversionQuestions=[
 ['1cm＝10（　）','mm','長さは1cm＝10mm。'],['1m＝100（　）','cm','長さは1m＝100cm。'],['1km＝1000（　）','m','長い道のりはkmで表す。'],
 ['1L＝10（　）','dL','1dLます10杯で1L。'],['1dL＝100（　）','mL','10mLを10回で1dL。'],['1L＝1000（　）','mL','100mLを10杯で1L。'],
 ['1kg＝1000（　）','g','重さの換算。'],['1t＝1000（　）','kg','大きな重さの換算。'],
 ['1m²＝10000（　）','cm²','100cm×100cm。'],['1m³＝1000000（　）','cm³','100cm×100cm×100cm。'],['1cm³＝1（　）','mL','体積とかさの対応。'],['1m³＝1000（　）','L','10cm角の1Lを1000個。'],['1a＝100（　）','m²','10m×10m。'],['1ha＝10000（　）','m²','100m×100m。'],['1km²＝100（　）','ha','1000m×1000m。'],
 ['教室の長さ（例）8（　）','m','教室の例題値。実測値ではありません。'],['学校までの道のり（例）2（　）','km','道のりの例題値。'],['消しゴムの重さ（例）20（　）','g','実物の重さには違いがあります。'],['児童の体重（例）30（　）','kg','体重の例題値。この男の子の測定値ではありません。'],['トラックの重さ（例）3（　）','t','車両ごとに違います。'],['教室の床の面積（例）60（　）','m²','床の広さの例題値。'],
 ];
export function buildQuestions(){const q=Object.entries(catalog).map(([item,d])=>({item,text:`${d.label}は ${d.value}（　）`,answer:d.unit,explanation:d.hint}));const length=Object.entries(catalog).filter(([,d])=>d.kind==='book'||d.kind==='card').flatMap(([item,d])=>[{item,text:`${d.name}のたては ${Number((d.height*100).toFixed(2))}（　）`,answer:'cm',explanation:'たて・横・厚さは別の長さ。横から厚さも確かめよう。'},{item,text:`${d.name}の横は ${Number((d.width*1000).toFixed(2))}（　）`,answer:'mm',explanation:d.hint}]);return [...q,...length,...conversionQuestions.map(([text,answer,explanation])=>({text,answer,explanation}))];}

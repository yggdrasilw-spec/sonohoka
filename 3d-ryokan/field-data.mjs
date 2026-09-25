const ref=(title,url)=>({title,url});
export const fieldItems={
 classroom:{
  room:{name:'教室全体',value:'横7m × 奥行9m × 高さ3m',size:[7,3,9],note:'日本の教室の一例。学校によって大きさは違います。見やすいように手前と右の壁・天井を透かしています。',sources:[ref('文部科学省：学校施設の活用（教室7m×9m・天井3mの例）','https://www.mext.go.jp/a_menu/shotou/zyosei/03062401/houkoku_pdf/5.pdf')]},
  pupil:{name:'児童机',value:'横65cm × 奥行45cm × 高さ58cm',size:[.65,.58,.45],note:'天板はJISサイズの製品例。高さ58cmはこの教材の設定。学年だけでなく、身長に合わせて机を選びます。',sources:[ref('NAIKI：学校用デスク・チェアー','https://www.naiki.co.jp/websolution/pdf2024/pdf/763.pdf')]},
  longdesk:{name:'長机',value:'長さ180cm × 奥行45cm × 高さ70cm',size:[1.8,.70,.45],note:'製品にある寸法の一例。180cmは1m80cm。',sources:[ref('NAIKI：折りたたみテーブル','https://www.naiki.co.jp/websolution/pdf2023/pdf/497.pdf')]},
  teacher:{name:'教卓',value:'横80cm × 奥行45cm × 高さ90cm',size:[.80,.90,.45],note:'内田洋行の教卓の寸法例。児童机と高さを比べよう。',sources:[ref('内田洋行：教卓ITK-M03','https://www.edu-catalog.uchida.co.jp/library/books/mate99ele/book/seo/0091.html')]},
  locker:{name:'ロッカー',value:'横130cm × 奥行45cm × 高さ150cm',size:[1.3,1.5,.45],note:'4列オープン収納ST-7825の外寸例。区切りの形は簡略化。',sources:[ref('内田洋行：教育施設カタログ正誤表（正しい寸法）','https://www.uchida.co.jp/education/catalog/pdf/efacility28.pdf')]},
  board:{name:'黒板',value:'横360cm × たて120cm',size:[3.6,1.2,.04],note:'設置仕様にある正面黒板の例。板の厚さ4cm・床から下端90cmは教材の設定。',sources:[ref('小松島市：学校什器・備品リスト','https://www.city.komatsushima.lg.jp/fs/5/4/8/2/0/3/_/%E8%A6%81%E6%B1%82%E6%B0%B4%E6%BA%96%E6%9B%B8%20%E5%88%A5%E7%B4%998%20%E4%BB%80%E5%99%A8%E3%83%BB%E5%82%99%E5%93%81%E7%AD%89%E3%83%AA%E3%82%B9%E3%83%88231121.pdf')]}
 },
 outdoor:{
  pool:{name:'25mプール',value:'長さ25m × 幅12.5m',size:[25,1.2,12.5],note:'長さ25m。幅12.5m・深さ1.2m・5コースは比較用の設定。形は比較しやすいよう簡略化しています。',sources:[]},
  track:{name:'50m走',value:'スタートからゴールまで50m',size:[50,.01,3.6],note:'白い線の間が正確に50m。5mおきの印で、25mプール2つ分を確かめよう。コース幅は教材の設定。',sources:[]},
  school:{name:'3階建ての校舎',value:'横36m × 奥行9m × 高さ10.5m',size:[36,10.5,9],note:'比較用に設計した校舎の例。実在する校舎の測定値ではありません。1階ぶんを3.5mに設定。',sources:[]},
  elephant:{name:'ゾウ',value:'模型の高さ3m',measure:3,axis:'y',note:'体高の資料を参考に全高3mへ調整した比較用模型。実物は種類・雌雄・個体で異なります。',sources:[ref('San Diego Zoo：Elephant','https://animals.sandiegozoo.org/animals/elephant')]},
  giraffe:{name:'キリン',value:'頭のてっぺんまで5m',measure:5,axis:'y',note:'大きなキリンの例として5mに設定。資料では雄は最大約5.5m。',sources:[ref('San Diego Zoo：Giraffe','https://animals.sandiegozoo.org/animals/giraffe')]},
  crocodile:{name:'イリエワニの長さ',value:'鼻先から尾まで5m',measure:5,axis:'x',note:'成体3〜5mという資料から5mを比較例に採用。無料のワニ模型を使用し、イリエワニ固有の形態を再現した模型ではありません。',sources:[ref('Australian Museum：Estuarine Crocodile','https://australian.museum/learn/animals/reptiles/estuarine-crocodile/')]},
  whale:{name:'シロナガスクジラの長さ',value:'頭から尾まで30m',measure:30,axis:'x',note:'大きな個体の長さの例。無料のクジラ模型を使用し、シロナガスクジラ固有の形態ではありません。陸上に置くのは長さを比べるための表示です。',sources:[ref('NOAA Fisheries：Blue Whale','https://www.fisheries.noaa.gov/species/blue-whale')]}
 },
 micro:{
  nail:{name:'爪の横幅と1cm',value:'1cm ＝ 10mm',size:[.010,.018,.004],note:'小学2年生の爪の横幅くらい、という目安。指・人によって違います。この爪の模型は横幅を1cmに設定しています。自分の爪も定規で測ってみよう。',sources:[]},
  graphite:{name:'少し書いた芯の先と1mm',value:'芯の先の直径を1mmにした例',size:[.007,.035,.007],note:'限界までとがらせた直後ではなく、少し字を書いてちびた後の芯の先くらい。削り方・筆圧で変わるため、いつも1mmという意味ではありません。',sources:[]}
 }
};
export const animalCredits={elephant:'a27MA0rXyyj',giraffe:'80w8kwQU0QH',crocodile:'2an6E2WjW3z',whale:'7-TgeTuwbzw'};

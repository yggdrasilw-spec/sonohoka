'use strict';
// Keep source IDs stable for saved towns and image filenames; display US-oriented labels.
window.TOWN_PLACES = [
['amusement park','ゆうえんち','culture'],['aquarium','すいぞくかん','basic'],['castle','しろ','culture'],['church','きょうかい','culture'],
['elementary school','小学校','basic'],['fire station','しょうぼうしょ','basic'],['hospital','びょういん','basic'],['house','家','basic'],
['library','としょかん','basic'],['museum','はくぶつかん','culture'],['gym','たいいくかん','basic'],['music hall','おんがくホール','culture'],
['public hall','こうみんかん','culture'],['swimming pool','プール','culture'],['theater','げきじょう','culture'],['rice field','田んぼ','culture'],
['bridge','橋','culture'],['bus stop','バスてい','basic'],['farm','のうじょう','culture'],['park','公園','basic'],
['police station','けいさつしょ','basic'],['post office','ゆうびんきょく','basic'],['restaurant','レストラン','basic'],['roller coaster','ジェットコースター','culture'],
['stadium','きょうぎじょう','culture'],['station','駅','basic'],['street','通り','culture'],['town','町','culture'],
['zoo','どうぶつえん','basic'],['garden','庭','culture'],['bookstore','本屋','shops'],['convenience store','コンビニ','shops'],
['department store','デパート','shops'],['flower shop','花屋','shops'],['gas station','ガソリンスタンド','shops'],['hamburger shop','ハンバーガー店','shops'],
['shopping mall','ショッピングモール','shops'],['supermarket','スーパー','shops'],['shrine','神社','culture'],['temple','お寺','culture']
].map(([sourceName,ja,category])=>({
  id:sourceName.replaceAll(' ','-'),
  name:({'public hall':'community center','music hall':'concert hall','hamburger shop':'burger restaurant','station':'train station'})[sourceName]||sourceName,
  aliases:[sourceName],ja,category,
  // These are useful vocabulary, but an unnamed street / an entire town is not a
  // particular destination within this town. Keep the cards, omit route endpoints.
  canNavigate:!['street','town'].includes(sourceName)
}));

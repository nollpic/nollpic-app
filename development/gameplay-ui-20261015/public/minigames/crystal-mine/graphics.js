(function () {
 'use strict';
 const palette={blue:['#6de2ff','#299cde','#135493'],pink:['#ffd1df','#eb80b1','#ae427b'],green:['#cbf3c2','#65c59d','#288368'],gold:['#fff4a3','#edc25b','#b88426']};
 const shapes={diamond:'50,6 88,50 50,94 12,50',square:'19,19 81,19 81,81 19,81',hexagon:'28,8 72,8 94,50 72,92 28,92 6,50'};
 const names={blue:'파란',pink:'분홍',green:'초록',gold:'노란'},shapeNames={diamond:'마름모',square:'네모',hexagon:'육각형'};
 let serial=0;
 function gem(item) {
  const c=palette[item.color],points=shapes[item.shape];
  const clip='gm-gem-'+(++serial);
  return `<svg class="gm-gem" viewBox="0 0 100 104" aria-hidden="true"><polygon points="${points}" fill="${c[1]}" stroke="#173d5d" stroke-width="4" stroke-linejoin="round"/>${item.star?'<path d="M50 26L57 41 74 43 62 55 65 72 50 64 35 72 38 55 26 43 43 41Z" fill="#fff9b2" stroke="#6d4a14" stroke-width="3" stroke-linejoin="round"/>':''}</svg>`;
 }
 window.NollpicCrystalGraphics={gem,name:item=>`${names[item.color]} ${shapeNames[item.shape]} 보석${item.star?' · 별 있음':' · 별 없음'}`};
})();

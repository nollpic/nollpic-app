(function () {
 'use strict';
 /* 2026-10-15 크리스탈 보석 그림 (깎인 면 + 반짝임). 모양 6 × 색 6, 금 간 보석(crack) · 거꾸로 선 보석(flip)
    예전 그림(평평한 다각형 3종 × 4색, 별 표시)은 _backup/crystal-mine-20261015/ */
 // 색: [밝은 면, 기본, 어두운 면, 윤곽]
 const palette={
  blue:['#bfeaff','#3fa9f5','#1c6fc0','#0d3a6e'], purple:['#e2d6ff','#9b7cf2','#6347c7','#2f2170'],
  green:['#c9f5dc','#38c486','#178a5a','#0a4a31'], red:['#ffc9c2','#f0524a','#b8262a','#5e1012'],
  pink:['#ffd9ea','#f58bbd','#cc4f8c','#6b1f47'], gold:['#fff3b8','#f5c53d','#c88f12','#694606']
 };
 const names={blue:'파란',purple:'보라',green:'초록',red:'빨간',pink:'분홍',gold:'노란'};
 const shapeNames={diamond:'마름모',hexagon:'육각',octagon:'팔각',drop:'물방울',heart:'하트',star:'별'};
 // 다각형 모양: 바깥 꼭짓점 (100×104 칸, 가운데 50,54)
 const poly={
  diamond:[[50,6],[90,52],[50,98],[10,52]],
  hexagon:[[50,6],[89,28],[89,76],[50,98],[11,76],[11,28]],
  octagon:[[32,8],[68,8],[92,32],[92,72],[68,96],[32,96],[8,72],[8,32]],
  star:[[50,4],[61,36],[95,37],[68,57],[78,92],[50,72],[22,92],[32,57],[5,37],[39,36]]
 };
 const curve={
  drop:'M50 6 C62 26 82 44 82 66 A32 32 0 0 1 18 66 C18 44 38 26 50 6Z',
  heart:'M50 94 L13 54 C1 40 6 18 25 14 C37 12 46 19 50 28 C54 19 63 12 75 14 C94 18 99 40 87 54Z'
 };
 const C=[50,54];
 const scale=(p,k)=>[C[0]+(p[0]-C[0])*k,C[1]+(p[1]-C[1])*k];
 const pts=a=>a.map(p=>p.map(n=>n.toFixed(1)).join(',')).join(' ');
 let serial=0;
 function gem(item) {
  const c=palette[item.color]||palette.blue,id='gm-gem-'+(++serial);
  let outline,inner,facets='';
  if(poly[item.shape]){
   const o=poly[item.shape],t=o.map(p=>scale(p,item.shape==='star'?.42:.5));
   outline=`<polygon points="${pts(o)}"/>`;inner=`<polygon points="${pts(t)}"/>`;
   // 바깥 꼭짓점 ↔ 안쪽 꼭짓점을 잇는 면 (위쪽 면은 밝게, 아래쪽 면은 어둡게)
   o.forEach((p,i)=>{const q=o[(i+1)%o.length],tp=t[i],tq=t[(i+1)%o.length],mid=(p[1]+q[1])/2;
    facets+=`<polygon points="${pts([p,q,tq,tp])}" fill="${mid<C[1]?c[0]:c[2]}" opacity="${mid<C[1]?.55:.45}"/>`;});
  } else {
   const d=curve[item.shape];
   outline=`<path d="${d}"/>`;inner=`<path d="${d}" transform="translate(${C[0]} ${C[1]}) scale(.5) translate(${-C[0]} ${-C[1]})"/>`;
   facets=`<rect x="0" y="${C[1]}" width="100" height="60" fill="${c[2]}" opacity=".45" clip-path="url(#${id})"/>`;
  }
  const crackPath='M30 30 L46 46 L38 54 L56 70 L50 78 L66 88';
  const crack=item.crack?`<path d="${crackPath}" fill="none" stroke="${c[3]}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="${crackPath}" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity=".75"/>`:'';
  const body=`<defs><clipPath id="${id}">${outline}</clipPath></defs>`+
   `<g fill="${c[1]}">${outline}</g>${facets}`+
   `<g fill="${c[0]}" opacity=".9">${inner}</g>`+
   `<path d="M30 22 L42 16 L36 40 Z" fill="#fff" opacity=".75" clip-path="url(#${id})"/>`+
   `<circle cx="68" cy="30" r="3.2" fill="#fff" opacity=".9" clip-path="url(#${id})"/>`+
   `<g fill="none" stroke="${c[3]}" stroke-width="4" stroke-linejoin="round">${outline}</g>`;
  // 금은 뒤집어도 같은 자리에 보이게 회전 밖에 그림
  return `<svg class="gm-gem" viewBox="0 0 100 104" aria-hidden="true"><g${item.flip?' transform="rotate(180 50 52)"':''}>${body}</g>${crack}</svg>`;
 }
 const label=item=>`${names[item.color]} ${shapeNames[item.shape]} 보석`;
 window.NollpicCrystalGraphics={gem,label,colorName:c=>names[c],shapeName:s=>shapeNames[s],
  name:item=>label(item)+(item.crack?' · 금 감':'')+(item.flip?' · 거꾸로':'')};
})();

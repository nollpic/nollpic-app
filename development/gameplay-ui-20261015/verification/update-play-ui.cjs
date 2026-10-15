const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../public');
const inventory=JSON.parse(fs.readFileSync(path.join(__dirname,'intro-inventory.json'),'utf8'));
function edit(file,fn){const p=path.join(root,file),s=fs.readFileSync(p,'utf8');fs.writeFileSync(p,fn(s));}
function replace(s,a,b){if(!s.includes(a))throw Error('Missing source: '+a.slice(0,100));return s.replace(a,b);}
for(const c of inventory)edit(c.file,s=>{if(s.includes('/minigames/play-ui.css'))return s;const tags='<link rel="stylesheet" href="/minigames/play-ui.css"><script src="/minigames/play-ui.js" defer></script>';return s.includes('</head>')?replace(s,'</head>',tags+'</head>'):replace(s,'<body',tags+'<body');});
for(const file of ['minigames/direction-wizard/game.js','minigames/wizard-shared/cards-ui.js'])edit(file,s=>{
 // This is the same transition previously invoked by the instructional confirmation.
 s=replace(s,'function draw(){if(!engine)return;const v=',"function draw(){if(!engine)return;if(active()&&valid()&&engine.view().phase==='rule')engine.begin();const v=");
 if(file.includes('cards-ui')){
  s=replace(s,"(t.compound?'369 + 짝수 · ':'369 · ')+(t.rule==='direct'?'조건대로':'반대로')","(t.compound?'369 포함 + 짝수 → ':'369 포함 → ')+(t.rule==='direct'?'봉인':'통과')");
  s=replace(s,"v.phase==='rule'?'안내를 다 읽고 시작해요. 시간 제한은 없어요.':v.rejected.length?'첫 선택은 오답으로 남아요. 규칙을 보고 다시 풀어봐요.':'천천히 규칙에 맞는 답을 골라요.'","v.rejected.length?'다시 골라요.':''");
  s=replace(s,"if(t.type==='color'&&v.phase==='input'&&v.rejected.length){$('w-feedback').classList.add('has-color-example');$('w-feedback').innerHTML=colorExample(t,'지금 카드');}",'');
  s=replace(s,"(r.corrected?'다시 생각해서 해결했어요! 첫 선택 기록은 그대로예요.':'첫 선택 정답! 마법 에너지가 모였어요.'):'아직 아니에요. '+NollpicWizardCards.instructions(engine.view().trial,engine.view().band)","(r.corrected?'해결했어요!':'맞았어요!'):'다시 골라요.'");
 }
 return s;
});
edit('minigames/magic-circuit/game.js',s=>{
 s=replace(s,'function draw(){if(!engine)return;const v=',"function draw(){if(!engine)return;if(active()&&valid()&&engine.view().phase==='ready')engine.begin();const v=");
 s=replace(s,"'같은 번호의 ▶에서 ◆까지 연결해요. 선은 겹치지 않아요.'+(b.blocks.length?' 돌 칸은 지나갈 수 없어요.':'')+(Object.keys(b.required).length?' 번호가 붙은 ★ 칸을 꼭 지나가요.':'')+(Object.keys(b.arrows).length?' 화살표 칸에서 나갈 때 화살표 방향을 따라요.':'')","'같은 번호끼리 이어요 · 겹치면 안 돼요'+(b.blocks.length?' · 돌은 피해요':'')+(Object.keys(b.required).length?' · ★ 꼭 지나기':'')+(Object.keys(b.arrows).length?' · 화살표 따라가기':'')");
 s=replace(s,"'번 회로를 연결해요. 그린 선의 칸을 누르면 그 뒤가 지워져요.'","'번 길을 이어요.'");
 return s;
});
edit('minigames/secret-architecture/game.js',s=>{
 s=replace(s,'function draw(){if(!engine)return;const v=',"function draw(){if(!engine)return;if(active()&&valid()&&!engine.view().paused&&engine.view().phase==='ready')engine.action('begin');const v=");
 s=replace(s,"attempt.stage+'단계 · '+(attempt.band==='lower'?'저학년':'고학년')","attempt.stage+'단계'");
 s=replace(s,"'설계도 '+(v.problem+1)+' / 3 · 최초 정답 '+v.records.filter(r=>r.firstCorrect).length","'설계도 '+(v.problem+1)+' / 3'");
 s=replace(s,"'설계도 전체를 시계 방향으로 '+(b.turns*90)+'° 돌려 만들어요. 위치와 화살표 방향이 함께 돌아가요.':'설계도와 같은 위치·층수·화살표 방향으로 만들어요.'","'전체를 시계 방향 '+(b.turns*90)+'° 돌려요':'위치 · 층수 · 화살표를 맞춰요'");
 s=replace(s,"'정확해요! 설계도를 복구했어요.'","'완성했어요!'");
 s=replace(s,"'세 번 모두 달랐어요. 다음 문제에서 다시 도전해요.'","'다음 문제에 도전해요.'");
 s=replace(s,"'구조가 달라요. 위치·층수·화살표를 고치고 다시 제출해요.'","'다시 보고 고쳐요.'");
 s=replace(s,"'설계도가 사라지면 블록을 직접 쌓아요.'","'잘 보고 기억해요.'");
 return s;
});
edit('minigames/crystal-mine/game.js',s=>{
 s=replace(s,"listen($('gm-start'),'click',()=>{if(snapshot&&avatar.valid(snapshot))$('gm-rules').showModal();});","listen($('gm-start'),'click',()=>start('challenge'));");
 // The old countdown was presentation-only; beginRound still starts the unchanged clock.
 s=replace(s,"shell.audioStart();countdown();","shell.audioStart();if(engine.beginRound())drawRound();");
 return s;
});
edit('minigames/crystal-mine/graphics.js',s=>{
 const start=s.indexOf('  return `<svg'),end=s.indexOf('`;',start)+2;
 if(start<0||end<2)throw Error('Gem renderer not found');
 return s.slice(0,start)+'  return `<svg class="gm-gem" viewBox="0 0 100 104" aria-hidden="true"><polygon points="${points}" fill="${c[1]}" stroke="#173d5d" stroke-width="4" stroke-linejoin="round"/>${item.star?\'<path d="M50 26L57 41 74 43 62 55 65 72 50 64 35 72 38 55 26 43 43 41Z" fill="#fff9b2" stroke="#6d4a14" stroke-width="3" stroke-linejoin="round"/>\':\'\'}</svg>`;'+s.slice(end);
});
edit('minigames/secret-door/game.js',s=>{
 s=replace(s,"const icons={moon:'☾',star:'★',leaf:'❧'};","const icons={moon:NollpicPlayUI.icon('moon'),star:NollpicPlayUI.icon('star'),leaf:NollpicPlayUI.icon('leaf')};");
 // One live cue for preview/input, while the actual clues and hint response stay visible.
 s=replace(s,"stage===3?'시간 제한 없이 생각해요.':'먼저 보고, 빛이 사라지면 선택해요.'","''");
 s=replace(s,"$('sd-preview').textContent=`${i+1}번째 빛 · ${sequence[i]+1}번 문`","$('sd-instruction').textContent=`${i+1}번째 문을 기억해요`");
 s=replace(s,"$('sd-preview').textContent=stage===1?'기억한 문을 골라요.':'기억한 순서대로 문을 눌러요.'","$('sd-instruction').textContent=stage===1?'기억한 문을 골라요':'순서대로 문을 골라요'");
 return s;
});
// Shorten static UI copy without altering inline game logic.
const copy={
 'nollpic-block-merge.html':[['같은 숫자를 찾아 순서대로 눌러요.','이웃한 같은 숫자를 눌러요.']],
 'nollpic-color-match.html':[['조각을 끌어서 같은 위치에 놓아보세요.','같은 위치에 조각을 놓아요.']],
 'nollpic-shape-connect.html':[['모양에서 손가락을 움직여 선을 그려요.','같은 모양끼리 이어요.']],
 'nollpic-reverse-369.html':[['<b>거꾸로 해요!</b><br>3·6·9가 들어가면 <b>숫자 클릭</b>, 없으면 <b>박수</b>','3·6·9 있으면 숫자 · 없으면 박수']],
 'nollpic-stroop.html':[['글자를 읽지 말고 <b>글자에 칠해진 색깔</b>을 말해요.','<b>칠해진 색</b>을 말해요.']],
 'nollpic-recipe-builder.html':[['드래그해서 위의 모양으로 완성하세요!','그림처럼 재료를 놓아요.']],
 'nollpic-jenga-memory.html':[['예시를 자세히 보고, 사라지면 실제 젠가로 같은 모양을 만들어요.','기억한 모양을 젠가로 만들어요.']]
};
for(const [file,pairs]of Object.entries(copy))edit(file,s=>{for(const [a,b]of pairs)s=replace(s,a,b);return s;});
// Load the presentation helper before controllers that render flat symbols.
for(const c of inventory.filter(c=>c.modern))edit(c.file,s=>{s=replace(s,'<script src="/minigames/play-ui.js" defer></script>','');const gameScript=c.slug==='color-wizard'||c.slug==='cipher-369'?'<script src="../wizard-shared/cards-ui.js" defer></script>':'<script src="game.js" defer></script>';return replace(s,gameScript,'<script src="/minigames/play-ui.js" defer></script>'+gameScript);});
const server=path.join(__dirname,'local-server.cjs');fs.writeFileSync(server,fs.readFileSync(server,'utf8').replace('const port = 8805;','const port = 8806;'));

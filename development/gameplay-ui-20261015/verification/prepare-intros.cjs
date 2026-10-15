const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../public'),base=path.resolve(__dirname,'../../circuit-intro-scene-20261015/public');
const rows=[
 ['memory-kitchen','순서를 기억해 맛있는 요리를 완성해요!','기억력','nextBtn'],
 ['number-focus','숫자 공을 골라 목표 합을 만들어요!','끈기력','overlayBtn'],
 ['jenga-memory','모양을 기억해 실제 블록으로 만들어요!','기억력','overlayBtn'],
 ['color-match','같은 색 조각을 알맞은 자리에 놓아요!','관찰력',null],
 ['hand-sequence','불빛 순서대로 손모양을 따라 해요!','기억력','overlayBtn'],
 ['grid-memory','화면을 보고 종이컵을 같은 자리에 놓아요!','기억력','overlayBtn'],
 ['color-equation','색 블록을 더하고 빼서 판을 완성해요!','끈기력','overlayBtn'],
 ['stroop','글자의 뜻 대신 칠해진 색을 말해요!','충동조절','overlayBtn'],
 ['reverse-369','3·6·9가 있으면 숫자, 없으면 박수!','충동조절','overlayBtn'],
 ['fish-grill','초록 칸에 들어오면 생선을 뒤집어요!','충동조절','start'],
 ['number-hide-seek','숨어 있는 목표 숫자를 찾아요!','관찰력','overlayBtn'],
 ['color-drop','떨어지는 색과 같은 버튼을 눌러요!','순발력','overlayBtn'],
 ['recipe-builder','완성 그림을 보고 재료를 쌓아요!','관찰력','overlayBtn'],
 ['shape-connect','같은 모양끼리 겹치지 않게 이어요!','끈기력','overlayBtn'],
 ['ping-pong-rally','라켓을 움직여 공을 받아쳐요!','순발력','start'],
 ['number-search','이어진 숫자를 순서대로 찾아요!','관찰력','start'],
 ['block-merge','이웃한 같은 숫자 블록을 합쳐요!','끈기력','start'],
 ['tangled-path','점을 옮겨 꼬인 선을 풀어요!','끈기력',null],
 ['crystal-mine','같은 보석을 찾아 보물상자를 열어요!','집중 · 주의','gm-start','ATT-001','GAME 01'],
 ['magic-circuit','같은 수정의 길을 이어 마법탑을 깨워요!','관찰력','gm-start','MAGIC-CIRCUIT','GAME 03'],
 ['direction-wizard','바뀌는 규칙에 맞춰 방향을 골라요!','충동조절','gm-start','REVERSAL-DIRECTION','GAME 02'],
 ['color-wizard','색과 글자 속에서 규칙에 맞게 골라요!','충동조절','gm-start','COLOR-WIZARD','GAME 22'],
 ['cipher-369','숫자 속 3·6·9와 바뀌는 규칙을 찾아요!','충동조절','gm-start','CIPHER-369','GAME 23'],
 ['secret-architecture','설계도를 기억해 블록으로 복구해요!','기억력','gm-start','SECRET-ARCHITECTURE','GAME 06'],
 ['secret-door','문양과 순서를 기억해 비밀의 문을 열어요!','기억력','gm-start','SECRET-DOOR','GAME 25']
];
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'challenge-games.js'),'utf8'),ctx);
const catalog=ctx.window.NOLLPIC_GAME_CATALOG;
const entries=rows.map(([slug,mission,ability,startId,gameId,displayNumber],i)=>({
 slug,mission,ability,startId,gameId:gameId||'LEGACY-'+(i+1),catalogId:i+1,
 title:catalog[i].title,displayNumber:displayNumber||'GAME '+String(i+1).padStart(2,'0'),
 file:gameId?'minigames/'+slug+'/index.html':'nollpic-'+slug+'.html',modern:!!gameId,
 difficultyLabels:{1:'쉬움',2:'보통',3:'어려움'},verifiedDuration:null,
 theme:slug,artwork:{src:slug==='magic-circuit'?'/minigames/magic-circuit/circuit-tower-background-v1.png':'/minigames/intro-backgrounds/'+slug+'.png',alt:catalog[i].title+' 전용 배경'},character:'equipped',instructions:[]
}));
fs.writeFileSync(path.join(root,'minigames/game-intro-config.js'),'/* Start-screen presentation only. Does not assign challenge days or rewards. */\nwindow.NollpicGameIntroConfig='+JSON.stringify(Object.fromEntries(entries.map(e=>[e.gameId,e])),null,2)+';\n');
for(const c of entries){
 const f=path.join(root,c.file);let s=fs.readFileSync(path.join(base,c.file),'utf8');
 if(c.slug==='magic-circuit')continue;
 const prefix=c.modern?'../':'minigames/';
 const tags='<link rel="stylesheet" href="'+prefix+'game-intro.css"><script src="'+prefix+'game-intro-config.js" defer></script><script src="'+prefix+'game-intro.js" defer></script><script src="'+prefix+'game-intro-boot.js" defer></script>';
 if(c.modern){const target=c.slug==='color-wizard'||c.slug==='cipher-369'?'<script src="../wizard-shared/cards-ui.js"':'<script src="game.js"';if(!s.includes(target))throw Error('Missing game entry '+c.file);s=s.replace(target,tags+target);}
 else {const injection='<link rel="stylesheet" href="fonts/jua/jua.css"><script src="minigames/avatar-adapter.js" defer></script>'+tags;s=s.includes('</head>')?s.replace('</head>',injection+'</head>'):s.replace('<body>',injection+'<body>');}
 fs.writeFileSync(f,s);
}
fs.writeFileSync(path.join(root,'minigames/magic-circuit/intro.css'),'/* Circuit intro uses the shared dark presentation. Gameplay styles remain unchanged. */\n');
fs.writeFileSync(path.join(__dirname,'intro-inventory.json'),JSON.stringify(entries,null,2));
console.log('Prepared '+entries.length+' intro entries');

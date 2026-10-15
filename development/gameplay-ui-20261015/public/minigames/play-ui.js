(function(){
 'use strict';
 const config=Object.values(window.NollpicGameIntroConfig||{}).find(c=>location.pathname.endsWith('/'+c.file));
 if(!config)return;
 document.body.classList.add('np-play-ui');document.body.dataset.playGame=config.slug;
 document.body.style.setProperty('--play-art','url("'+config.artwork.src+'")');
 if(!config.modern)document.body.classList.add('np-legacy');
 const drawings={
  back:'<path d="m29 10-14 14 14 14M15 24h27"/>',
  pause:'<path d="M17 10v28M31 10v28" stroke-width="6"/>',
  undo:'<path d="m16 10-9 9 9 9M8 19h20a12 12 0 0 1 0 24"/>',
  reset:'<path d="M12 12a17 17 0 1 1-4 20M12 4v12H2"/>',
  hint:'<path d="M18 33a13 13 0 1 1 12 0v7H18ZM20 45h8" fill="#ffda73"/>',
  clock:'<circle cx="24" cy="24" r="19" fill="#fffbed"/><path d="M24 11v14l9 5"/>',
  star:'<path d="m24 4 6 13 14 2-10 10 2 15-12-7-12 7 2-15L4 19l14-2Z" fill="#ffd475"/>',
  moon:'<path d="M32 5A20 20 0 1 0 43 32 18 18 0 0 1 32 5Z" fill="#fffbed"/>',
  leaf:'<path d="M8 40Q2 10 39 7q9 36-31 33ZM8 40l22-22" fill="#9cddb5"/>',
  key:'<circle cx="15" cy="15" r="10" fill="#ffd475"/><path d="m22 22 20 20m-10-10 6-6m-1 11 6-6"/>',
  check:'<path d="m9 24 10 11L40 12" stroke="#80d6b5" stroke-width="6"/>',
  clear:'<path d="M10 15h28M18 15V8h12v7M13 15l2 28h18l2-28M21 22v14m6-14v14"/>',
  next:'<path d="m20 10 14 14-14 14M6 24h28"/>',
  lock:'<rect x="10" y="21" width="28" height="23" rx="5" fill="#ffcf7a"/><path d="M16 21v-9a8 8 0 0 1 16 0v9M24 30v6"/>',
  numbers:'<rect x="5" y="6" width="38" height="36" rx="8" fill="#c2d8fa"/><path d="m12 19 4-3v17m8-15q12-6 9 3l-9 12h11"/>',
  mic:'<rect x="18" y="4" width="12" height="26" rx="6" fill="#c5b0ee"/><path d="M11 23a13 13 0 0 0 26 0M24 36v8m-8 0h16"/>',
  clap:'<path d="m8 26 7 11q8 10 17 2l8-9-8-10-4 4-8-14q-4-4-6 0l7 17-4 1-5-5q-5-1-4 3Z" fill="#ffcfab"/><path d="m30 5 2 6m10 0-5 4M20 3l1 5"/>',
  finger:'<path d="M15 27V8q3-5 6 0v16l13 2q6 1 4 9l-4 8H17L7 30q-1-6 4-4l4 4Z" fill="#ffcfab"/>',
  peace:'<path d="m17 27-6-18q0-6 5-3l8 17 4-18q4-4 6 1l-3 20 7 3-4 14H17L7 30q0-6 5-3Z" fill="#ffcfab"/>',
  okay:'<path d="M17 25Q8 19 8 29q1 10 12 13h12l7-10V14q-4-5-6 0v12-19q-4-4-6 0v18-17q-5-3-6 2v14q-6-9-11-5Z" fill="#ffcfab"/><circle cx="16" cy="29" r="4" fill="#fffbed"/>',
  thumb:'<path d="M18 23 26 7q8-4 6 5l-2 9h10l-5 21H18ZM7 23h11v19H7Z" fill="#ffcfab"/>'
 };
 function icon(name){return '<span class="np-play-icon" aria-hidden="true"><svg viewBox="0 0 48 48"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">'+drawings[name]+'</g></svg></span>';}
 window.NollpicPlayUI={icon};
 function label(id,text,symbol){const node=document.getElementById(id);if(!node)return;node.innerHTML=(symbol?icon(symbol)+' ':'')+text;node.setAttribute('aria-label',text);}
 const labels={ 'gm-pause-btn':['잠시 쉬기','pause'],'c-undo':['되돌리기','undo'],'c-clear':['선 지우기','clear'],'c-reset':['초기화','reset'],'c-hint':['힌트','hint'],'a-hint':['다시 보기','hint'],'a-submit':['완성!'],'sd-hint':['힌트','hint'] };
 Object.entries(labels).forEach(([id,[text,symbol]])=>{label(id,text,symbol);if(id==='gm-pause-btn'&&document.getElementById(id))document.getElementById(id).innerHTML=icon(symbol);});
 const rules=document.getElementById('c-rules');if(rules)document.querySelector('.c-layout').before(rules);
 if(config.slug==='direction-wizard'){const lives=document.getElementById('w-lives');lives.classList.add('np-lives');document.getElementById('gm-pause-btn').before(lives);}
 // Keep optional measurements accessible after play, without cluttering the action surface.
 const result=document.getElementById('gm-result');if(result){const detailNodes=[...result.querySelectorAll('#w-outcomes,#sd-analysis,#gm-first-time,#gm-active-time')];if(detailNodes.length){const d=document.createElement('details');d.className='np-play-details';const s=document.createElement('summary');s.textContent='자세한 기록';d.append(s,...detailNodes);result.append(d);
  /* 2026-10-15 상세 기록은 관리자만 (아이들 화면에서는 숨김). 관리자 = admin/admin.js의 ADMIN_EMAILS로 로그인한 경우 */
  const ADMIN_EMAILS=['monojjin@gmail.com','nollpic.official@gmail.com'];let email='';try{const o=parent!==window?parent:window;email=String((o.getNollpicUser&&o.getNollpicUser())?.email||'').toLowerCase();}catch(_){}
  const isAdmin=ADMIN_EMAILS.includes(email);d.hidden=!isAdmin;result.querySelectorAll('.gm-details').forEach(x=>{x.hidden=!isAdmin;});}}
 if(!config.modern){
  const choice=document.querySelector('.tabs,.mode-row,.level-strip');if(choice){const d=document.createElement('details');d.className='np-play-details';const s=document.createElement('summary');s.textContent='단계 바꾸기';choice.before(d);d.append(s,choice);}
  const quiet={
   'memory-kitchen':['.mission-sub:not(#resultText)','.mission-text','.title-kicker'],
   'color-match':['.guide'], 'jenga-memory':['#targetTitle'],
   'hand-sequence':['.guide','#turnText'], 'color-equation':['.palette-label'],
   'number-hide-seek':['.hint'], 'number-search':['.target-label','.guide'],
   'ping-pong-rally':['.guide'], 'shape-connect':['.guide'],
   'reverse-369':['.prompt'], 'stroop':['.prompt'], 'block-merge':['.info']
  };
  (quiet[config.slug]||[]).forEach(sel=>document.querySelectorAll(sel).forEach(n=>n.classList.add('np-quiet')));
 }
 // Replace only known UI symbols. Game-specific artwork and colour-coded stimuli remain intact.
 const symbols={'💡':'hint','⏱':'clock','⏱️':'clock','🔒':'lock','🔢':'numbers','🎤':'mic','👏':'clap','☝️':'finger','✌️':'peace','👌':'okay','👍':'thumb','🎉':'star'};
 const tokens=Object.keys(symbols).sort((a,b)=>b.length-a.length);
 const phrases={
  '예시를 자세히 보고, 사라지면 실제 젠가로 같은 모양을 만들어요.':'잘 보고 기억해요.',
  '조각을 끌어서 같은 위치에 놓아보세요.':'같은 위치에 조각을 놓아요.',
  '종이컵 8개를 올려놓고 X 칸만 비워주세요.':'X만 비우고 컵을 놓아요.',
  'X 칸은 비우고 빨간 표시에는 빨간 종이컵을 놓아주세요.':'X는 비워요 · 빨간 곳엔 빨간 컵',
  'X 칸은 비우고 빨간색과 파란색 컵을 표시 위치에 놓아주세요.':'X는 비워요 · 컵과 칸의 색을 맞춰요',
  '떨어지는 비눗방울과 같은 색 버튼을 눌러요!':'같은 색을 눌러요!',
  '모양에서 손가락을 움직여 선을 그려요.':'같은 모양끼리 길을 이어요.',
  '속도가 변하는 리듬을 보고 초록 칸에서 눌러요.':'초록 칸에서 눌러요.',
  '색깔을 소리 내어 말해보세요.':'',
  '알맞은 행동을 골라보세요.':'',
  '↻ 다시 만들기':'초기화', '💡 한 칸 힌트':'💡 힌트'
 };
 function flatten(node){
  if(node.nodeType===1){if(node.closest('script,style,svg,textarea,option,.np-intro,.np-launch,.np-play-icon'))return;[...node.childNodes].forEach(flatten);return;}
  if(node.nodeType!==3||node.parentElement?.closest('script,style,svg,textarea,option,.np-intro,.np-launch,.np-play-icon'))return;
  let value=node.nodeValue;if(Object.hasOwn(phrases,value.trim())){value=phrases[value.trim()];node.nodeValue=value;}
  if(!tokens.some(t=>value.includes(t)))return;
  const fragment=document.createDocumentFragment();
  while(value){let at=value.length,token;for(const t of tokens){const i=value.indexOf(t);if(i>=0&&i<at){at=i;token=t;}}if(!token){fragment.append(value);break;}fragment.append(value.slice(0,at));const holder=document.createElement('span');holder.innerHTML=icon(symbols[token]);fragment.append(holder.firstChild);value=value.slice(at+token.length);}
  node.replaceWith(fragment);
 }
 flatten(document.body);
 new MutationObserver(changes=>changes.forEach(c=>{if(c.type==='characterData')flatten(c.target);else c.addedNodes.forEach(flatten);})).observe(document.body,{childList:true,subtree:true,characterData:true});
})();

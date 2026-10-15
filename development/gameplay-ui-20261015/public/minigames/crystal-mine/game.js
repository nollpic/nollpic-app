(async function () {
 'use strict';
 const $=id=>document.getElementById(id),graphics=window.NollpicCrystalGraphics,avatar=window.NollpicGameAvatar,config=window.NollpicCrystalConfig;
 const results=window.NollpicGameResults.create({getItem:key=>localStorage.getItem('nollpic:dev:mine-day1:'+key),setItem:(key,value)=>localStorage.setItem('nollpic:dev:mine-day1:'+key,value)});
 const lifetime=new AbortController(),timers=new Set();let engine=null,snapshot=null,resultShown=false,screen='intro',disposed=false,flow=null,flowPaused=false,lastMode='challenge';
 const listen=(el,event,fn)=>el.addEventListener(event,fn,{signal:lifetime.signal});
 function later(fn,ms) { const t=setTimeout(()=>{timers.delete(t);if(!disposed)fn();},ms);timers.add(t);return t; }
 function clearTimers(){timers.forEach(clearTimeout);timers.clear();if(flow)clearTimeout(flow.timer);flow=null;flowPaused=false;}
 // One pending presentation step: pause resumes its remaining delay, never repeats a move or chest opening.
 function schedule(fn,ms){flow={fn,remaining:ms,due:performance.now()+ms,timer:null};armFlow();}
 function armFlow(){if(!flow||flowPaused)return;flow.due=performance.now()+flow.remaining;flow.timer=setTimeout(()=>{const fn=flow.fn;flow=null;if(!disposed)fn();},flow.remaining);}
 function show(id){screen=id;['intro','play','result'].forEach(x=>{$('gm-'+x).hidden=x!==id;});document.body.classList.toggle('gm-playing',id==='play');window.scrollTo(0,0);}
 const isActive=()=>!!engine&&(!engine.result()||(screen==='play'&&!resultShown));
 function persist(){const record=engine?.result();if(record)return results.save(record);return null;}
 function close(){if(isActive()){engine.abandon();persist();}shell.dispose();if(avatar.owner!==window)avatar.owner.NollpicMiniGameHost.close();else location.assign('/?page=play');}
 function pause(){engine?.pause();flowPaused=true;if(flow){clearTimeout(flow.timer);flow.remaining=Math.max(0,flow.due-performance.now());}document.body.classList.add('gm-paused');}
 function resume(){if(!engine)return;engine.resume();flowPaused=false;document.body.classList.remove('gm-paused');if(engine.view().phase==='playing'&&!flow)$('gm-board').querySelectorAll('.gm-cell:not(.is-collected)').forEach(tile=>{tile.disabled=false;tile.classList.remove('is-wrong');});armFlow();}
 function dispose(){if(disposed)return;disposed=true;clearTimers();clearInterval(ticker);if(isActive()){engine.abandon();persist();}lifetime.abort();}
 const shell=window.NollpicShell.create({isActive,onPause:pause,onResume:resume,onExit:close,onDispose:dispose});
 const reduced=()=>document.documentElement.classList.contains('gm-reduced-motion');
 function displayStats(){const v=engine.view();drawHearts(v);/* 2026-10-15 남은 시간: 큰 숫자 + 줄어드는 막대, 20초↓ 주황 · 10초↓ 빨강 */ if(v.mode==='practice'){$('gm-time-num').textContent='∞';$('gm-time').dataset.level='';$('gm-timebar-fill').style.width='100%';}else{const sec=Math.ceil(v.remainingMs/1000),total=v.roundLimitMs||1;$('gm-time-num').textContent=sec;$('gm-time').setAttribute('aria-label',`남은 시간 ${sec}초`);$('gm-time').dataset.level=sec<=5?'danger':sec<=10?'warn':'';$('gm-timebar-fill').style.width=(total?v.remainingMs/total*100:0).toFixed(1)+'%';$('gm-timebar-fill').dataset.level=$('gm-time').dataset.level;}$('gm-score').textContent=`놀이 점수 ${v.score.toLocaleString()}점`;$('gm-found').textContent=`찾은 보석 ${v.foundCount} / ${v.targetCount}`;}
 // 2026-10-15 구간 미션 문구 (graphics.label = "파란 마름모 보석")
 function ruleText(v){const L=t=>graphics.label(t),[a,b]=v.allTargets;
  if(v.roundType==='pair')return L(a)+'과 '+L(b)+'을 모두 찾아요!';
  if(v.roundType==='crack')return '금 간 보석은 빼고 '+L(a)+'만 찾아요!';
  if(v.roundType==='flip')return '거꾸로 된 건 빼고 바로 선 '+L(a)+'만!';
  if(v.roundType==='switch')return v.switched?'목표가 바뀌었어요! 이제 '+L(b)+'!':L(a)+'을 찾아요! 중간에 바뀔 수 있어요';
  return L(a)+'을 모두 찾아요!';}
 function drawTarget(v){$('gm-rule').textContent=ruleText(v);$('gm-target-gem').innerHTML=v.targets.map(graphics.gem).join('');$('gm-target-gem').dataset.count=v.targets.length;}
 const bandOfGrade=()=>{let g=null;try{g=Number(avatar.owner?.getSelectedChildProfile?.()?.gradeValue);}catch(_){}return g>=4?'upper':'lower';};
 // 새 규칙이 처음 나오거나 판이 커질 때 알림 (한 판 안에서 한 번씩)
 const NEW_RULE={pair:'새 규칙! 두 가지 보석을 함께 찾아요',crack:'새 규칙! 금 간 보석은 빼요',flip:'새 규칙! 거꾸로 된 보석은 빼요',switch:'새 규칙! 찾는 중에 목표가 바뀌어요'};
 let seenTypes=new Set(),lastSize=0;
 function announce(v){let msg='';if(NEW_RULE[v.roundType]&&!seenTypes.has(v.roundType))msg=NEW_RULE[v.roundType];else if(lastSize&&v.size>lastSize)msg=v.size>=6?'깊은 광산 도착! 보석이 더 많아요':'광산이 더 넓어졌어요!';if(v.timeAttack&&v.completedRounds===v.goal)msg=`목표 ${v.goal}구간 달성! 보물상자가 열렸어요 · 이제 깊은 광산으로!`;seenTypes.add(v.roundType);lastSize=v.size;
  if(msg){$('gm-feedback').textContent=msg;const t=document.querySelector('.gm-target');t.classList.remove('is-switch');void t.offsetWidth;t.classList.add('is-switch');}}
 let seenWhy=new Set(),whyTimer=null;
 $('gm-oops').addEventListener('animationend',e=>e.currentTarget.classList.remove('is-on','is-long'));
 document.querySelector('.gm-target').addEventListener('animationend',e=>{if(e.animationName==='gm-switch')e.currentTarget.classList.remove('is-switch');});
 function showWhy(text){const el=$('gm-why');clearTimeout(whyTimer);if(!text){el.hidden=true;return;}el.textContent=text;el.hidden=false;el.classList.remove('is-on');void el.offsetWidth;el.classList.add('is-on');whyTimer=setTimeout(()=>{el.hidden=true;},3000);}
 const roundLabel=v=>v.timeAttack?`탐험 ${v.round}구간`:`탐험 ${v.round}/${v.totalRounds}`;
 function drawRound(){
  const v=engine.view();$('gm-round').textContent=roundLabel(v);
  drawTarget(v);
  $('gm-board').style.setProperty('--board-size',v.size);
  $('gm-board').innerHTML=v.board.map(gem=>`<button type="button" class="gm-cell" data-tile="${gem.id}" aria-label="${graphics.name(gem)}">${graphics.gem(gem)}</button>`).join('');
  $('gm-countdown').hidden=true;$('gm-feedback').textContent='';showWhy('');announce(v);displayStats();route();
 }
 // 하트 (구간 시간이 다 되면 하나씩 잃음)
 function drawHearts(v){const el=$('gm-hearts');if(!el)return;if(v.maxHearts==null){el.hidden=true;return;}el.hidden=false;el.innerHTML=Array.from({length:v.maxHearts},(_,i)=>`<i class="${i<v.hearts?'on':'off'}">♥</i>`).join('');el.setAttribute('aria-label',`하트 ${v.hearts}개 남음`);}
 // 구간 시간이 다 됐을 때: "시간 초과!" 팝업 → 하트 -1 → 다음 구간(하트 0이거나 마지막 구간이면 결과)
 let handledTimeout=0;
 function onTimeout(){const v=engine.view();if(!v.lastTimeout||handledTimeout===v.lastTimeout)return;handledTimeout=v.lastTimeout;
  $('gm-board').querySelectorAll('.gm-cell').forEach(b=>b.disabled=true);drawHearts(v);route();
  const oops=$('gm-oops');oops.querySelector('b').textContent='시간 초과!';oops.querySelector('small').textContent=v.hearts>0?`하트 -1 · 남은 하트 ${v.hearts}개`:'하트를 다 썼어요';oops.classList.add('is-long');oops.classList.remove('is-on');void oops.offsetWidth;oops.classList.add('is-on');
  $('gm-hearts')?.classList.remove('is-hit');void $('gm-hearts')?.offsetWidth;$('gm-hearts')?.classList.add('is-hit');shell.tone(false);
  schedule(()=>{oops.classList.remove('is-on','is-long');oops.querySelector('b').textContent='땡!';oops.querySelector('small').textContent='';if(engine.result())finish();else if(engine.beginRound())drawRound();},reduced()?700:1400);}
 function route(move=false){const v=engine.view(),steps=v.totalRounds||v.goal,position=Math.min(steps-1,move?v.round:Math.max(0,v.round-1)),res=v.results||[];$('gm-route-steps').innerHTML=Array.from({length:steps},(_,i)=>{const r=res[i];return `<span class="gm-route-step ${r==='ok'?'done':r==='miss'?'miss':i===position?'current':''}" ${i===position&&!r?'aria-current="step"':''} aria-label="${i+1}구간 ${r==='ok'?'완료':r==='miss'?'시간 초과':i===position?'현재':'남음'}">${r==='ok'?'✓':r==='miss'?'✕':i+1}</span>`;}).join('');$('gm-route-steps').style.setProperty('--rounds',steps);$('gm-traveller').style.setProperty('--route-progress',position/steps);}
 function countdown(){
  $('gm-countdown').hidden=false;$('gm-countdown').querySelector('span').textContent='목표 보석을 잘 봐요!';
  let number=3;const next=()=>{$('gm-countdown').querySelector('strong').textContent=number;schedule(()=>{if(--number>0)next();else if(engine.beginRound())drawRound();},1000);};next();
 }
 function start(mode){
  if(disposed||!snapshot||!avatar.valid(snapshot))return;
  clearTimers();lastMode=mode;resultShown=false;seenTypes=new Set();lastSize=0;seenWhy=new Set();handledTimeout=0;$('gm-oops').querySelector('b').textContent='땡!';$('gm-oops').classList.remove('is-on','is-long');document.querySelector('.gm-target').classList.remove('is-switch');showWhy('');document.body.classList.remove('gm-paused');engine=window.NollpicCrystalMine.create({band:window.NollpicCrystalMine.bandOf(document.querySelector('input[name="difficulty"]:checked').value),mode,seed:crypto.getRandomValues(new Uint32Array(1))[0],sessionId:crypto.randomUUID(),childId:snapshot.childId});
  $('gm-result').classList.remove('gm-celebrate');$('gm-chest').src='chest.svg';$('gm-chest').alt='마지막 보물상자';$('gm-chest').classList.remove('is-open');show('play');const v=engine.view();$('gm-round').textContent=v.timeAttack?'탐험 1구간':`탐험 1/${v.totalRounds}`;$('gm-rule').textContent='';$('gm-target-gem').innerHTML='';$('gm-feedback').textContent='';$('gm-board').style.setProperty('--board-size',v.size);$('gm-board').innerHTML=Array.from({length:v.size*v.size},()=>'<span class="gm-cell" aria-hidden="true"></span>').join('');route();displayStats();$('gm-found').textContent='목표 보석을 살펴봐요';shell.audioStart();if(engine.beginRound())drawRound();
 }
 function transition(){
  $('gm-feedback').textContent='이번 구간 보석을 모두 찾았어요!';
  schedule(()=>{route(true);schedule(()=>{
   if(engine.result()?.endReason==='completed'){$('gm-chest').src='chest-open.svg';$('gm-chest').alt='열린 보물상자';$('gm-chest').classList.add('is-open');$('gm-feedback').textContent='보물상자가 열렸어요!';schedule(finish,reduced()?350:650);}
   else { const v=engine.view(); if(v.timeAttack&&v.completedRounds===v.goal){$('gm-chest').src='chest-open.svg';$('gm-chest').classList.add('is-open');$('gm-feedback').textContent=`목표 ${v.goal}구간 달성! 계속 가 볼까요?`;} if(engine.beginRound())drawRound(); }
  },reduced()?100:420);},reduced()?100:180);
 }
 function finish(){
  if(resultShown||!engine?.result()||disposed)return;resultShown=true;clearTimers();const record=engine.result(),saved=persist();
  show('result');const done=record.endReason==='completed';$('gm-result').classList.toggle('gm-celebrate',done);
  $('gm-result-title').textContent=record.timeAttack&&done?(record.attemptedRounds>=30&&record.heartsLeft>0?'광산 정복! 30구간 끝까지!':`${record.completedRounds}구간까지 탐험!`):done?'광산 탐험 성공!':record.endReason==='out-of-hearts'?'하트를 다 썼어요!':'탐험을 마쳤어요';
  if(record.endReason==='out-of-hearts')$('gm-result-message').textContent=`${record.completedRounds}구간 성공! 한 번 더 도전해 볼까요?`;$('gm-result-message').textContent=`보석 ${record.collectedCount}개를 모았어요.`;
  if(record.timeAttack&&done&&record.mode==='challenge'){const key='nollpic:crystal-best:'+(snapshot?.childId||'guest')+':'+record.band;let best=0;try{best=Number(localStorage.getItem(key))||0;if(record.completedRounds>best)localStorage.setItem(key,record.completedRounds);}catch(_){}$('gm-result-message').textContent+=record.completedRounds>best?(best?` 신기록! (전에는 ${best}구간)`:' 첫 기록이에요!'):` 최고 기록 ${best}구간`;}
  $('gm-result-chest').src=done?'chest-open.svg':'chest.svg';$('gm-result-chest').alt=done?'열린 보물상자':'아직 닫힌 보물상자';
  $('gm-stars').hidden=!record.stars;$('gm-stars').textContent=record.stars?'★'.repeat(record.stars)+'☆'.repeat(3-record.stars):'';
  $('gm-stars').setAttribute('aria-label',`완료 별 ${record.stars}개`);
  $('gm-result-score').textContent='놀이 점수 '+record.score.toLocaleString()+'점';$('gm-accuracy').textContent=record.accuracy===null?'선택 기록 없음':(record.accuracy*100).toFixed(1)+'%';
  $('gm-completed').textContent=record.timeAttack?`${record.completedRounds}구간 (목표 ${record.goal})`:`${record.completedRounds}/${record.totalRounds}구간 성공 · 하트 ${record.heartsLeft}개 남음`;
  $('gm-first-time').textContent='첫 보석 찾기 시간 (중앙값): '+(record.firstGemMedianMs===null?'—':(record.firstGemMedianMs/1000).toFixed(2)+'초');
  $('gm-active-time').textContent='실제 놀이 시간: '+(record.activePlayMs/1000).toFixed(1)+'초';
  $('gm-round-records').innerHTML=record.roundRecords.map(r=>`<li>${r.round}구간 · 정답 ${r.correctCount} / 오답 ${r.wrongCount} · 첫 보석 ${r.firstCorrectMs===null?'—':(r.firstCorrectMs/1000).toFixed(2)+'초'}${r.completed?' · 완료':''}</li>`).join('');
  /* 2026-10-15 챌린지 도장·포인트 (avatar-adapter.js NollpicChallengeLink) */ const link=window.NollpicChallengeLink?.claim('ATT-001',{completed:done,practice:record.mode==='practice'});$('gm-result-reward').textContent=window.NollpicChallengeLink?window.NollpicChallengeLink.text(link):'';
  $('gm-save-status').textContent=saved?.saved?'':'기록 저장에 실패했어요. 이번 결과만 확인할 수 있어요.';
  $('gm-result').querySelector('details').open=false;
 }
 listen($('gm-board'),'click',event=>{
  const tile=event.target.closest('[data-tile]');if(!tile||!$('gm-board').contains(tile)||flow||flowPaused||!avatar.valid(snapshot))return;
  const result=engine?.pick(Number(tile.dataset.tile));if(!result){if(engine?.result())finish();return;}
  tile.disabled=true;tile.classList.add(result.correct?'is-collected':'is-wrong');if(result.correct)tile.setAttribute('aria-label',graphics.name(engine.view().board.find(g=>g.id===Number(tile.dataset.tile)))+' · 수집 완료');
  else {const why={crack:'금 간 보석은 빼요!',flip:'거꾸로 된 보석이에요!',switched:'목표가 바뀌었어요!'}[result.reason]||'색과 모양을 다시 봐요.';$('gm-feedback').textContent='';
   /* 2026-10-15 틀리면 "땡!" 팝업(0.7초). 처음 보는 이유면 1.4초 + 이유 글씨. 이유는 목표 카드 알약으로 다음 정답까지(최대 3초) 남김 */ const oops=$('gm-oops'),first=!seenWhy.has(result.reason);seenWhy.add(result.reason);oops.querySelector('small').textContent=first?why:'';oops.classList.toggle('is-long',first);oops.classList.remove('is-on');void oops.offsetWidth;oops.classList.add('is-on');showWhy(result.penaltyMs?`${why} -${result.penaltyMs/1000}초`:why);if(result.timedOut){onTimeout();return;}later(()=>{tile.classList.remove('is-wrong');if(engine.view().phase==='playing'&&!flow)tile.disabled=false;},config.wrongFeedbackMs);}
  if(result.correct)showWhy('');
  if(result.switched){const v=engine.view();drawTarget(v);$('gm-feedback').textContent='목표가 바뀌었어요!';const t=document.querySelector('.gm-target');t.classList.remove('is-switch');void t.offsetWidth;t.classList.add('is-switch');}
  shell.tone(result.correct);displayStats();
  if(result.roundComplete){$('gm-board').querySelectorAll('.gm-cell').forEach(b=>b.disabled=true);transition();}
 });
 // 라디오 값 1 = 저학년, 2 = 고학년 (공통 시작 화면이 숫자로 읽음). 아이 학년으로 자동 선택
 const descriptions={1:config.bands.lower.description,2:config.bands.upper.description};
 {const v=bandOfGrade()==='upper'?'2':'1',r=document.querySelector(`input[name="difficulty"][value="${v}"]`);if(r){r.checked=true;r.dispatchEvent(new Event('change',{bubbles:true}));}$('gm-difficulty-description').textContent=descriptions[v];}
 document.querySelectorAll('input[name="difficulty"]').forEach(input=>listen(input,'change',()=>{$('gm-difficulty-description').textContent=descriptions[input.value];}));
 const challengeEntry=avatar.owner!==window&&avatar.owner.document.querySelector('.page.active')?.id==='page-11';$('gm-return').textContent=challengeEntry?'챌린지로 돌아가기':'다른 놀이 고르기';
 listen($('gm-start'),'click',()=>start('challenge'));
 listen($('gm-rules-back'),'click',()=>$('gm-rules').close());
 listen($('gm-rules-start'),'click',()=>{$('gm-rules').close();start('challenge');});
 listen($('gm-practice'),'click',()=>{$('gm-rules').close();start('practice');});
 listen($('gm-replay'),'click',()=>start(lastMode));listen($('gm-return'),'click',close);
 const ticker=setInterval(()=>{if(!engine||screen!=='play'||flowPaused)return;engine.tick();const v=engine.view();if(v.round)displayStats();if(v.lastTimeout&&handledTimeout!==v.lastTimeout&&!flow)onTimeout();else if(engine.result()&&!flow&&!resultShown&&handledTimeout===v.lastTimeout)finish();},100);
 function identityChanged(){if(!snapshot||avatar.valid(snapshot))return;if(isActive()){engine.abandon();persist();}shell.dispose();document.querySelectorAll('.gm-screen').forEach(el=>el.hidden=true);document.body.classList.remove('gm-playing');$('gm-back').addEventListener('click',close,{once:true});$('gm-error').hidden=false;$('gm-error').textContent='아이 정보가 바뀌었어요. 돌아가서 다시 시작해 주세요.';}
 listen(avatar.owner,'nollpic-storage-context',identityChanged);listen(avatar.owner,'nollpic-challenge-context',identityChanged);
 if(parent===window){history.pushState({nollpicStandaloneGame:true},'',location.href);listen(window,'popstate',()=>{history.pushState({nollpicStandaloneGame:true},'',location.href);shell.requestExit();});}
 try {snapshot=await avatar.capture();if(!disposed&&await avatar.mount(snapshot,[...document.querySelectorAll('[data-avatar]')],lifetime.signal)){$('gm-start').disabled=false;$('gm-start').textContent='탐험 시작 →';$('gm-practice').disabled=false;}}
 catch(error){$('gm-error').hidden=false;$('gm-error').textContent='캐릭터 정보를 확인하지 못했어요. 돌아가서 다시 시도해 주세요.';console.error(error);}
})();

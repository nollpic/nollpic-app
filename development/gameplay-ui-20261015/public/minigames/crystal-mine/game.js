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
 function displayStats(){const v=engine.view();$('gm-time').textContent=v.mode==='practice'?'시간 제한 없음':`전체 남은 ${Math.ceil(v.remainingMs/1000)}초`;$('gm-score').textContent=`놀이 점수 ${v.score.toLocaleString()}점`;$('gm-found').textContent=`찾은 보석 ${v.foundCount} / ${v.targetCount}`;}
 function drawRound(){
  const v=engine.view();$('gm-round').textContent=`탐험 ${v.round}/${v.totalRounds}`;
  $('gm-rule').textContent=v.targetLabel+'을 모두 찾아요!';$('gm-target-gem').innerHTML=graphics.gem(v.target);
  $('gm-board').style.setProperty('--board-size',v.size);
  $('gm-board').innerHTML=v.board.map(gem=>`<button type="button" class="gm-cell" data-tile="${gem.id}" aria-label="${graphics.name(gem)}">${graphics.gem(gem)}</button>`).join('');
  $('gm-countdown').hidden=true;$('gm-feedback').textContent='';displayStats();route();
 }
 function route(move=false){const v=engine.view(),position=move?v.completedRounds:Math.max(0,v.round-1);$('gm-route-steps').innerHTML=Array.from({length:v.totalRounds},(_,i)=>`<span class="gm-route-step ${i<v.completedRounds?'done':i===position?'current':''}" ${i===position?'aria-current="step"':''} aria-label="${i+1}구간 ${i<v.completedRounds?'완료':i===position?'현재':'남음'}">${i<v.completedRounds?'✓':i+1}</span>`).join('');$('gm-route-steps').style.setProperty('--rounds',v.totalRounds);$('gm-traveller').style.setProperty('--route-progress',position/v.totalRounds);}
 function countdown(){
  $('gm-countdown').hidden=false;$('gm-countdown').querySelector('span').textContent=engine.view().targetLabel+'을 모두 찾아요!';
  let number=3;const next=()=>{$('gm-countdown').querySelector('strong').textContent=number;schedule(()=>{if(--number>0)next();else if(engine.beginRound())drawRound();},1000);};next();
 }
 function start(mode){
  if(disposed||!snapshot||!avatar.valid(snapshot))return;
  clearTimers();lastMode=mode;resultShown=false;document.body.classList.remove('gm-paused');engine=window.NollpicCrystalMine.create({difficulty:Number(document.querySelector('input[name="difficulty"]:checked').value),mode,seed:crypto.getRandomValues(new Uint32Array(1))[0],sessionId:crypto.randomUUID(),childId:snapshot.childId});
  $('gm-result').classList.remove('gm-celebrate');$('gm-chest').src='chest.svg';$('gm-chest').alt='마지막 보물상자';$('gm-chest').classList.remove('is-open');show('play');const v=engine.view();$('gm-round').textContent=`탐험 1/${v.totalRounds}`;$('gm-rule').textContent=v.targetLabel+'을 모두 찾아요!';$('gm-target-gem').innerHTML=graphics.gem(v.target);$('gm-feedback').textContent='';$('gm-board').style.setProperty('--board-size',v.size);$('gm-board').innerHTML=Array.from({length:v.size*v.size},()=>'<span class="gm-cell" aria-hidden="true"></span>').join('');route();displayStats();$('gm-found').textContent='목표 보석을 살펴봐요';shell.audioStart();if(engine.beginRound())drawRound();
 }
 function transition(){
  $('gm-feedback').textContent='이번 구간 보석을 모두 찾았어요!';
  schedule(()=>{route(true);schedule(()=>{
   if(engine.result()?.endReason==='completed'){$('gm-chest').src='chest-open.svg';$('gm-chest').alt='열린 보물상자';$('gm-chest').classList.add('is-open');$('gm-feedback').textContent='보물상자가 열렸어요!';schedule(finish,reduced()?350:650);}
   else if(engine.beginRound())drawRound();
  },reduced()?100:420);},reduced()?100:180);
 }
 function finish(){
  if(resultShown||!engine?.result()||disposed)return;resultShown=true;clearTimers();const record=engine.result(),saved=persist();
  show('result');const done=record.endReason==='completed';$('gm-result').classList.toggle('gm-celebrate',done);
  $('gm-result-title').textContent=done?'광산 탐험 성공!':record.endReason==='timeout'?'탐험 시간이 끝났어요':'탐험을 마쳤어요';$('gm-result-message').textContent=`보석 ${record.collectedCount}개를 모았어요.`;
  $('gm-result-chest').src=done?'chest-open.svg':'chest.svg';$('gm-result-chest').alt=done?'열린 보물상자':'아직 닫힌 보물상자';
  $('gm-stars').hidden=!record.stars;$('gm-stars').textContent=record.stars?'★'.repeat(record.stars)+'☆'.repeat(3-record.stars):'';
  $('gm-stars').setAttribute('aria-label',`완료 별 ${record.stars}개`);
  $('gm-result-score').textContent='놀이 점수 '+record.score.toLocaleString()+'점';$('gm-accuracy').textContent=record.accuracy===null?'선택 기록 없음':(record.accuracy*100).toFixed(1)+'%';
  $('gm-completed').textContent=`${record.completedRounds}/${record.totalRounds}구간 완료`;
  $('gm-first-time').textContent='첫 보석 찾기 시간 (중앙값): '+(record.firstGemMedianMs===null?'—':(record.firstGemMedianMs/1000).toFixed(2)+'초');
  $('gm-active-time').textContent='실제 놀이 시간: '+(record.activePlayMs/1000).toFixed(1)+'초';
  $('gm-round-records').innerHTML=record.roundRecords.map(r=>`<li>${r.round}구간 · 정답 ${r.correctCount} / 오답 ${r.wrongCount} · 첫 보석 ${r.firstCorrectMs===null?'—':(r.firstCorrectMs/1000).toFixed(2)+'초'}${r.completed?' · 완료':''}</li>`).join('');
  $('gm-result-reward').textContent=record.simulatedReward?`+${record.simulatedReward}P · 체험 보상 · 실제 적립 없음`:record.mode==='practice'?'연습 모드 · 실제 적립 없음':'미완료 · 실제 적립 없음';
  $('gm-save-status').textContent=saved?.saved?'개발용 기록에만 저장했어요.':'개발용 기록 저장을 확인하지 못했어요. 이번 결과는 화면에서 확인할 수 있어요.';
  $('gm-result').querySelector('details').open=false;
 }
 listen($('gm-board'),'click',event=>{
  const tile=event.target.closest('[data-tile]');if(!tile||!$('gm-board').contains(tile)||flow||flowPaused||!avatar.valid(snapshot))return;
  const result=engine?.pick(Number(tile.dataset.tile));if(!result){if(engine?.result())finish();return;}
  tile.disabled=true;tile.classList.add(result.correct?'is-collected':'is-wrong');if(result.correct)tile.setAttribute('aria-label',graphics.name(engine.view().board.find(g=>g.id===Number(tile.dataset.tile)))+' · 수집 완료');
  else {$('gm-feedback').textContent='색과 모양을 다시 봐요.';later(()=>{tile.classList.remove('is-wrong');if(engine.view().phase==='playing'&&!flow)tile.disabled=false;},config.wrongFeedbackMs);}
  shell.tone(result.correct);displayStats();
  if(result.roundComplete){$('gm-board').querySelectorAll('.gm-cell').forEach(b=>b.disabled=true);transition();}
 });
 const descriptions={1:'1단계 · 보석 9개 중에서 찾아요.',2:'2단계 · 색과 모양을 함께 확인해요.',3:'3단계 · 비슷한 보석 사이에서 별 없는 목표를 찾아요.'};
 document.querySelectorAll('input[name="difficulty"]').forEach(input=>listen(input,'change',()=>{$('gm-difficulty-description').textContent=descriptions[input.value];}));
 const challengeEntry=avatar.owner!==window&&avatar.owner.document.querySelector('.page.active')?.id==='page-11';$('gm-return').textContent=challengeEntry?'챌린지로 돌아가기':'다른 놀이 고르기';
 listen($('gm-start'),'click',()=>start('challenge'));
 listen($('gm-rules-back'),'click',()=>$('gm-rules').close());
 listen($('gm-rules-start'),'click',()=>{$('gm-rules').close();start('challenge');});
 listen($('gm-practice'),'click',()=>{$('gm-rules').close();start('practice');});
 listen($('gm-replay'),'click',()=>start(lastMode));listen($('gm-return'),'click',close);
 const ticker=setInterval(()=>{if(!engine||screen!=='play'||flowPaused)return;const result=engine.tick();if(engine.view().round)displayStats();if(result&&!flow)finish();},100);
 function identityChanged(){if(!snapshot||avatar.valid(snapshot))return;if(isActive()){engine.abandon();persist();}shell.dispose();document.querySelectorAll('.gm-screen').forEach(el=>el.hidden=true);document.body.classList.remove('gm-playing');$('gm-back').addEventListener('click',close,{once:true});$('gm-error').hidden=false;$('gm-error').textContent='아이 정보가 바뀌었어요. 돌아가서 다시 시작해 주세요.';}
 listen(avatar.owner,'nollpic-storage-context',identityChanged);listen(avatar.owner,'nollpic-challenge-context',identityChanged);
 if(parent===window){history.pushState({nollpicStandaloneGame:true},'',location.href);listen(window,'popstate',()=>{history.pushState({nollpicStandaloneGame:true},'',location.href);shell.requestExit();});}
 try {snapshot=await avatar.capture();if(!disposed&&await avatar.mount(snapshot,[...document.querySelectorAll('[data-avatar]')],lifetime.signal)){$('gm-start').disabled=false;$('gm-start').textContent='탐험 시작 →';$('gm-practice').disabled=false;}}
 catch(error){$('gm-error').hidden=false;$('gm-error').textContent='캐릭터 정보를 확인하지 못했어요. 돌아가서 다시 시도해 주세요.';console.error(error);}
})();

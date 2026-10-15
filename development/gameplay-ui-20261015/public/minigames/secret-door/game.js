(async function(){
 'use strict';const $=id=>document.getElementById(id),avatar=NollpicGameAvatar,framework=NollpicGameFramework.create('SECRET-DOOR'),controller=new AbortController();
 let snapshot,engine,stage=1,practice=false,screen='intro',pending=null,paused=false,disposed=false,starting=false,shown=false;
 const listen=(el,name,fn)=>el.addEventListener(name,fn,{signal:controller.signal});
 function show(name){screen=name;['intro','play','result'].forEach(x=>$('gm-'+x).hidden=x!==name);window.scrollTo(0,0);}
 function schedule(fn,ms){clearTimeout(pending?.timer);pending={fn,remaining:ms,due:performance.now()+ms};arm();}
 function arm(){if(!pending||paused)return;pending.due=performance.now()+pending.remaining;pending.timer=setTimeout(()=>{const fn=pending.fn;pending=null;if(!disposed)fn();},pending.remaining);}
 function pause(){engine?.pause();paused=true;if(pending){clearTimeout(pending.timer);pending.remaining=Math.max(0,pending.due-performance.now());}}
 function resume(){engine?.resume();paused=false;arm();}
 function active(){return !!engine&&screen==='play'&&!shown;}
 async function save(){const record=engine?.result();if(!record)return;try{const receipt=await framework.save(record);if(engine?.result()?.sessionId!==record.sessionId)return;$('sd-reward').textContent=framework.status(receipt);$('sd-save').textContent='기록을 저장했어요.';}catch(e){if(engine?.result()?.sessionId===record.sessionId)$('sd-save').textContent='저장 실패: '+e.message;}}
 async function exit(){if(active()){engine.abandon();await save();}shell.dispose();if(avatar.owner!==window)avatar.owner.NollpicMiniGameHost.close();else location.assign('/lab.html');}
 function dispose(){if(disposed)return;disposed=true;clearTimeout(pending?.timer);controller.abort();if(active()){engine.abandon();save();}}
 const shell=NollpicShell.create({isActive:active,onPause:pause,onResume:resume,onExit:exit,onDispose:dispose});
 const icons={moon:NollpicPlayUI.icon('moon'),star:NollpicPlayUI.icon('star'),leaf:NollpicPlayUI.icon('leaf')};
 function draw(){const v=engine.view();$('sd-round').textContent=`${stage}단계 · ${v.round}/3 ${stage===3?'방':'구간'}`;$('sd-progress').textContent=`정답 ${v.correct} · 다시 보기 ${v.wrong}`;
  $('sd-instruction').textContent=stage===1?'문양과 색을 기억해요':stage===2?'빛나는 순서를 기억해요':'모든 단서에 맞는 문을 찾아요';
  $('sd-clues').replaceChildren(...v.clues.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
  $('sd-doors').style.setProperty('--door-count',v.doors.length);
  $('sd-doors').innerHTML=v.doors.map(d=>`<button type="button" class="sd-door" data-door="${d.id}" data-color="${d.color}" aria-label="${d.id+1}번 ${NollpicSecretDoor.names[d.color]} ${NollpicSecretDoor.names[d.symbol]} 문"><span>${icons[d.symbol]}</span><small>${d.id+1}번<br>${NollpicSecretDoor.names[d.color]} ${NollpicSecretDoor.names[d.symbol]}</small></button>`).join('');
  $('sd-preview').textContent='';
  $('sd-feedback').textContent='';$('sd-hint').disabled=v.phase!=='input'||(v.band==='upper'&&v.hints>=1);
  if(v.phase==='preview')preview(v.sequence);else enable();
 }
 function enable(){document.querySelectorAll('[data-door]').forEach(b=>b.disabled=false);$('sd-hint').disabled=engine.view().band==='upper'&&engine.view().hints>=1;}
 function preview(sequence){document.querySelectorAll('[data-door]').forEach(b=>b.disabled=true);let i=0;const next=()=>{const b=document.querySelector(`[data-door="${sequence[i]}"]`);b.classList.add('is-lit');b.setAttribute('aria-current','true');$('sd-instruction').textContent=`${i+1}번째 문을 기억해요`;schedule(()=>{b.classList.remove('is-lit');b.removeAttribute('aria-current');i++;if(i<sequence.length)schedule(next,280);else{engine.revealDone();$('sd-instruction').textContent=stage===1?'기억한 문을 골라요':'순서대로 문을 골라요';enable();}},engine.view().band==='lower'?1100:800);};schedule(next,400);}
 async function start(nextStage=1,isPractice=false){if(starting||disposed||!snapshot||!avatar.valid(snapshot))return;starting=true;try{const attempt=await framework.begin(nextStage,isPractice);if(disposed||!avatar.valid(snapshot))return;stage=nextStage;practice=isPractice;clearTimeout(pending?.timer);pending=null;paused=false;shown=false;engine=NollpicSecretDoor.create({stage,band:attempt.band,mode:attempt.mode,seed:attempt.seed,sessionId:attempt.attemptId,childId:snapshot.childId});engine.beginRound();show('play');draw();shell.audioStart();}catch(e){$('gm-error').hidden=false;$('gm-error').textContent=e.message;}finally{starting=false;}}
 function finish(){if(shown)return;shown=true;show('result');const r=engine.result();$('sd-result-title').textContent=stage===3?'비밀의 문 탈출 성공!':`${stage}단계 성공!`;$('sd-result-metrics').textContent=`정답률 ${Math.round(r.accuracy*100)}% · 3/3 ${stage===3?'방':'구간'} 완료`;$('sd-analysis').textContent=practice?'연습 기록 · 평가·보상 제외':r.mode==='free'?'자유 도전 기록 · 성장 분석 제외':'기본 도전 기록 · 객관적 성장 평가에는 미반영';$('sd-reward').textContent='보상 확인 중';$('sd-save').textContent='이 기기에 기록 저장 중…';framework.completed(r,next=>start(next,practice));save();}
 listen($('sd-doors'),'click',e=>{const b=e.target.closest('[data-door]');if(!b||pending||paused||!avatar.valid(snapshot))return;const r=engine.choose(Number(b.dataset.door));if(!r)return;shell.tone(r.correct);$('sd-feedback').textContent=r.correct?'맞았어요!':stage===2?'처음 순서부터 다시 생각해 봐요.':'단서를 다시 살펴봐요.';$('sd-progress').textContent=`정답 ${engine.view().correct} · 다시 보기 ${engine.view().wrong}`;if(r.roundComplete){document.querySelectorAll('[data-door]').forEach(x=>x.disabled=true);b.classList.add('is-open');schedule(()=>{if(engine.result())finish();else{engine.beginRound();draw();}},650);}});
 listen($('sd-hint'),'click',()=>{const text=engine.hint();if(text)$('sd-feedback').textContent=text;if(engine.view().band==='upper')$('sd-hint').disabled=true;});
 if(avatar.owner.location.pathname==='/lab.html')$('gm-return').textContent='게임 목록으로 돌아가기';
 listen($('gm-start'),'click',()=>start());listen($('gm-practice'),'click',()=>start(1,true));listen($('sd-replay'),'click',()=>start(stage,practice));listen($('gm-return'),'click',exit);
 listen(avatar.owner,'nollpic-challenge-context',()=>{if(snapshot&&!avatar.valid(snapshot)){if(active()){engine.abandon();save();}shell.dispose();show('intro');$('gm-error').hidden=false;$('gm-error').textContent='아이 정보가 바뀌었어요. 돌아가서 다시 시작해 주세요.';}});
 try{snapshot=await avatar.capture();if(await avatar.mount(snapshot,[...document.querySelectorAll('[data-avatar]')],controller.signal)){$('gm-start').disabled=false;$('gm-start').textContent='첫 번째 문 열기 →';$('gm-practice').disabled=false;}}catch(e){$('gm-error').hidden=false;$('gm-error').textContent=e.message;}
})();

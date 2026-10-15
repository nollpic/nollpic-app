(function(root){
 'use strict';
 const mine=typeof module==='object'&&module.exports?require('../crystal-mine/engine.js'):root.NollpicCrystalMine;
 const VERSION='1.0.0',GAME='REVERSAL-DIRECTION',opposite={left:'right',right:'left',up:'down',down:'up'};
 const ruleKey=t=>t.rule+':'+(t.shield?'shield':'arrow');
 const copy=x=>JSON.parse(JSON.stringify(x));
 function config(band,stage,mode='basic'){if(!['lower','upper'].includes(band)||![1,2,3].includes(stage)||!['basic','free','practice'].includes(mode))throw Error('Invalid game configuration');return {directions:band==='lower'&&stage===1?['left','right']:['left','right','up','down'],total:(band==='lower'?[10,12,14]:[14,16,18])[stage-1],lives:band==='lower'?4:3,responseMs:mode==='practice'?null:band==='lower'?5000:3500,shieldMs:band==='lower'?1800:1400,switchEvery:band==='lower'?3:2};}
 function trials(seed,band,stage,mode){const c=config(band,stage,mode),random=mine.randomFrom(seed);return Array.from({length:c.total},(_,i)=>({id:i,direction:c.directions[Math.floor(random()*c.directions.length)],rule:stage===1?'reverse':Math.floor(i/c.switchEvery)%2?'direct':'reverse',shield:stage===3&&i%4===2}));}
 function create({band='lower',stage=1,mode='basic',seed=1,sessionId,childId,now=()=>performance.now(),checkpoint}={}){
  const c=config(band,stage,mode),deck=trials(seed,band,stage,mode);let index=0,phase='rule',correct=0,wrong=0,combo=0,bestCombo=0,events=[],elapsed=0,started=null,was=null,lastRule=null,final=null;
  const active=()=>elapsed+(started===null?0:Math.max(0,now()-started));
  const freeze=()=>{elapsed=active();started=null;};
  const target=()=>deck[index];
  function finish(reason){phase='ended';started=null;final={sessionId,childId,gameId:GAME,gameVersion:VERSION,rulesVersion:VERSION,stage,band,mode,boardSeed:seed>>>0,endReason:reason,correctCount:correct,wrongCount:wrong,accuracy:events.length?correct/events.length:null,bestCombo,score:correct*100,stars:reason==='completed'?(correct/events.length>=.95?3:correct/events.length>=.85?2:1):0,activePlayMs:events.reduce((n,e)=>n+e.elapsedMs,0),events:copy(events),verification:'client_reported',analysisEligible:false};return copy(final);}
  function resolve(event){
   if(final||event.trial!==index||!Number.isFinite(event.elapsedMs)||event.elapsedMs<0||event.elapsedMs>3600000)throw Error('Invalid event');
   const t=target(),limit=t.shield?c.shieldMs:c.responseMs;
   if(!['answer','timeout'].includes(event.kind))throw Error('Invalid input');
   if(event.kind==='answer'&&(!c.directions.includes(event.choice)||(limit!==null&&event.elapsedMs>=limit)))throw Error('Late or unknown input');
   if(event.kind==='timeout'&&(limit===null||event.elapsedMs<limit))throw Error('Invalid timeout');
   if(t.shield&&event.kind==='timeout'&&event.inputCount!==0)throw Error('Shield needs an explicit zero-input observation');
   const ok=t.shield?event.kind==='timeout':event.kind==='answer'&&event.choice===(t.rule==='reverse'?opposite[t.direction]:t.direction);
   const outcome=t.shield?(ok?'withheld':'shield-input'):event.kind==='timeout'?'omission':ok?'correct':'wrong-direction';
   events.push({trial:index,kind:event.kind,...(event.kind==='answer'?{choice:event.choice}:{}),elapsedMs:event.elapsedMs,inputCount:event.kind==='answer'?1:0,outcome});
   if(ok){correct++;combo++;bestCombo=Math.max(bestCombo,combo);}else{wrong++;combo=0;}
   index++;elapsed=0;started=null;phase='feedback';
   if(wrong>=c.lives)finish('failed');else if(index===deck.length)finish('completed');
   return {correct:ok,ended:!!final,outcome};
  }
  function begin(){if(phase!=='rule')return false;lastRule=ruleKey(target());phase='input';started=now();return true;}
  function next(){if(final||phase!=='feedback')return false;phase=lastRule!==ruleKey(target())?'rule':'input';if(phase==='input')started=now();return true;}
  function tick(){if(phase!=='input')return null;const t=target(),limit=t.shield?c.shieldMs:c.responseMs;if(limit!==null&&active()>=limit){freeze();return resolve({trial:index,kind:'timeout',elapsedMs:limit,inputCount:0});}return null;}
  function answer(choice){if(phase!=='input'||!c.directions.includes(choice))return null;const timed=tick();if(timed)return timed;const ms=active();freeze();return resolve({trial:index,kind:'answer',choice,elapsedMs:ms});}
  function pause(){if(!['rule','input','feedback'].includes(phase))return false;freeze();was=phase;phase='paused';return true;}
  function resume(){if(phase!=='paused')return false;phase=was;if(phase==='input')started=now();return true;}
  function checkpointNow(){return {gameId:GAME,version:VERSION,events:copy(events),elapsedMs:active(),phase:phase==='paused'?was:phase,lastRule};}
  if(checkpoint){if(checkpoint.gameId!==GAME||checkpoint.version!==VERSION||!Array.isArray(checkpoint.events)||checkpoint.events.length>c.total)throw Error('Invalid checkpoint');for(const e of checkpoint.events)resolve(e);if(!final){elapsed=checkpoint.elapsedMs;if(!Number.isFinite(elapsed)||elapsed<0||elapsed>3600000)throw Error('Invalid checkpoint time');lastRule=checkpoint.lastRule;if(!['rule','input','feedback'].includes(checkpoint.phase))throw Error('Invalid checkpoint phase');was=checkpoint.phase;phase='paused';}}
  return {begin,next,tick,answer,pause,resume,checkpoint:checkpointNow,apply:resolve,result:()=>final&&copy(final),abandon:()=>final?copy(final):finish('abandoned'),view:()=>({phase,stage,band,mode,index,total:c.total,correct,wrong,lives:c.lives-wrong,combo,bestCombo,trial:target()&&copy(target()),directions:[...c.directions],elapsedMs:active(),remainingMs:target()?(target().shield?Math.max(0,c.shieldMs-active()):c.responseMs===null?null:Math.max(0,c.responseMs-active())):0})};
 }
 function guide(t){const reverse=t.rule==='reverse';return t.shield?{title:'방패 신호!',action:'아무것도 누르지 않고 기다려요',example:'🛡  손을 떼고 잠깐 기다리기',note:'화살표가 다시 나오면 방향을 골라요.'}:{title:reverse?'반대 방향을 골라요':'같은 방향을 골라요',action:reverse?'화살표와 반대로 눌러요':'화살표가 가리키는 쪽을 눌러요',example:reverse?'화살표 →   정답 ←':'화살표 →   정답 →',note:'알겠어요를 누르기 전에는 시간이 멈춰 있어요.'};}
 const api={GAME,VERSION,config,trials,create,opposite,ruleKey,guide};if(typeof module==='object'&&module.exports)module.exports=api;else root.NollpicWizard=api;
})(typeof window==='object'?window:globalThis);

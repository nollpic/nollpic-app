(function(root){
 'use strict';
 const mine=typeof module==='object'&&module.exports?require('../crystal-mine/engine.js'):root.NollpicCrystalMine;
 function make(GAME){if(!['COLOR-WIZARD','CIPHER-369'].includes(GAME))throw Error('Unknown game');
 const VERSION='1.0.0',colors=['red','blue','yellow'];
 const names={red:'빨강',blue:'파랑',yellow:'노랑',seal:'봉인',pass:'통과'},symbols={red:'▲',blue:'●',yellow:'★',seal:'🔒',pass:'→'};
 const clone=x=>JSON.parse(JSON.stringify(x));
 function config(band,stage,mode='basic'){
  if(!['lower','upper'].includes(band)||![1,2,3].includes(stage)||!['basic','free','practice'].includes(mode))throw Error('Invalid configuration');
  return {total:(band==='lower'?[8,10,12]:[12,15,18])[stage-1],required:(band==='lower'?[6,8,9]:[10,12,15])[stage-1],responseMs:null};
 }
 const contains369=n=>/[369]/.test(String(n));
 const swap=color=>({red:'blue',blue:'red',yellow:'yellow'})[color];
 function answerFor(t){if(t.type==='color')return t.rule==='word'?t.word:t.ink;const match=contains369(t.number)&&(!t.compound||t.number%2===0);return (t.rule==='reverse'?!match:match)?'seal':'pass';}
 const ruleKey=t=>t.type+':'+t.rule+':'+!!t.compound;
 function guide(t){if(t.type==='color')return t.rule==='word'?{title:'글자의 뜻을 골라요',action:'칠해진 색 대신 글자를 읽어요',example:'파란색으로 쓴 “빨강” → 빨강 ▲',note:'이번 규칙: 글자의 뜻'}:{title:'실제 칠해진 색을 골라요',action:'글자의 뜻 대신 색과 문양을 봐요',example:t.word===t.ink?'파란 “파랑” ● → 파랑 버튼':'파란색으로 쓴 “빨강” → 파랑 ●',note:'이번 규칙: 실제 색'};
 const condition=t.compound?'369가 있고 짝수':'369가 하나라도 있음';return {title:t.rule==='reverse'?'반대 암호 규칙!':'암호 조건을 찾아요',action:condition+(t.rule==='reverse'?' → 통과':' → 봉인'),example:t.compound?(t.rule==='reverse'?'36 → 통과  /  13·24 → 봉인':'36 → 봉인  /  13·24 → 통과'):(t.rule==='reverse'?'13 → 통과  /  24 → 봉인':'13 → 봉인  /  24 → 통과'),note:t.compound?'3·6·9 포함과 짝수, 두 조건 모두 확인해요.':'3·6·9 중 한 숫자라도 있는지 봐요.'};}
 function instructions(t){const g=guide(t);return g.action+' · '+g.example;}
 function trials(seed,band,stage,mode='basic'){
  const c=config(band,stage,mode),random=mine.randomFrom(seed);let previous=null;
  return Array.from({length:c.total},(_,i)=>{
   const type=GAME==='COLOR-WIZARD'?'color':'number',block=band==='lower'?3:2;
   const rule=type==='color'?(stage===3&&Math.floor(i/block)%2?'word':'ink'):(stage===1?'direct':stage===2?'reverse':Math.floor(i/block)%2?'reverse':'direct');
   const ink=colors[(i+Math.floor(random()*3))%3],word=stage===1?ink:colors[(colors.indexOf(ink)+1+Math.floor(random()*2))%3],compound=type==='number'&&stage===3;
   const pool=Array.from({length:band==='lower'?49:999},(_,n)=>n+1).filter(n=>(contains369(n)&&(!compound||n%2===0))===(i%2===0));
   const t={id:i,type,rule,ink,word,compound,number:pool[Math.floor(random()*pool.length)],options:type==='color'?[...colors]:['seal','pass']};t.switched=previous!==null&&previous!==ruleKey(t);previous=ruleKey(t);return t;
  });
 }
 function create({band='lower',stage=1,mode='basic',seed=1,sessionId,childId,now=()=>performance.now(),checkpoint}={}){
  const c=config(band,stage,mode),deck=trials(seed,band,stage,mode);let index=0,phase='rule',events=[],questions=[],firstCorrect=0,combo=0,bestCombo=0,switchErrors=0,elapsed=0,started=null,was=null,lastRule=null,final=null;
  const target=()=>deck[index],active=()=>elapsed+(started===null?0:Math.max(0,now()-started));
  const freeze=()=>{elapsed=active();started=null;};
  const currentEvents=()=>events.filter(e=>e.trial===index);
  function finish(reason){
   phase='ended';started=null;const answered=questions.length,corrected=questions.filter(q=>q.solved&&!q.firstCorrect).length;
   final={sessionId,childId,gameId:GAME,gameVersion:VERSION,rulesVersion:VERSION,stage,band,mode,boardSeed:seed>>>0,endReason:reason,totalQuestions:c.total,requiredCorrect:c.required,correctCount:firstCorrect,wrongCount:answered-firstCorrect,selectionErrorCount:events.filter(e=>!e.correct).length,solvedCount:index,correctedCount:corrected,unansweredCount:c.total-answered,accuracy:answered?firstCorrect/answered:null,firstChoiceAccuracy:answered?firstCorrect/answered:null,ruleSwitchErrors:switchErrors,ruleSwitchOpportunities:questions.filter(q=>q.switched).length,meanFirstResponseMs:answered?questions.reduce((n,q)=>n+q.firstResponseMs,0)/answered:null,bestCombo,score:firstCorrect*100,stars:reason==='completed'?(firstCorrect===c.total?3:firstCorrect>=c.required+1?2:1):0,activePlayMs:questions.reduce((n,q)=>n+q.resolutionMs,0),events:clone(events),questionRecords:clone(questions),verification:'client_reported',analysisEligible:false};return clone(final);
  }
  function apply(e){
   if(final||e.trial!==index||e.kind!=='answer'||!Number.isFinite(e.elapsedMs)||e.elapsedMs<0||e.elapsedMs>7200000||!target().options.includes(e.choice))throw Error('Invalid card input');
   const previous=currentEvents();if(previous.some(x=>x.choice===e.choice)||e.elapsedMs<(previous.at(-1)?.elapsedMs||0))throw Error('Duplicate or reversed input');
   const first=previous.length===0,t=target(),correct=e.choice===answerFor(t),switchError=first&&t.switched&&!correct;
   events.push({trial:index,kind:'answer',choice:e.choice,elapsedMs:e.elapsedMs,correct,first,ruleKey:ruleKey(t),switchError});
   if(first){if(correct){firstCorrect++;combo++;bestCombo=Math.max(bestCombo,combo);}else combo=0;if(switchError)switchErrors++;questions.push({trial:index,type:t.type,rule:t.rule,switched:t.switched,firstCorrect:correct,firstResponseMs:e.elapsedMs,resolutionMs:e.elapsedMs,attempts:1,solved:correct});}
   else{const q=questions.at(-1);q.attempts++;q.solved=correct;q.resolutionMs=e.elapsedMs;}
   elapsed=e.elapsedMs;started=null;phase='input';
   if(correct){index++;elapsed=0;phase='feedback';if(index===c.total)finish(firstCorrect>=c.required?'completed':'failed');}
   return {correct,first,corrected:correct&&!first,switchError,ended:!!final};
  }
  function begin(){if(phase!=='rule')return false;lastRule=ruleKey(target());phase='input';started=now();return true;}
  function next(){if(phase!=='feedback'||final)return false;phase=lastRule!==ruleKey(target())?'rule':'input';if(phase==='input')started=now();return true;}
  function answer(choice){if(phase!=='input'||!target().options.includes(choice)||currentEvents().some(e=>e.choice===choice))return null;const ms=active();freeze();const r=apply({trial:index,kind:'answer',choice,elapsedMs:ms});if(phase==='input')started=now();return r;}
  function pause(){if(!['input','rule','feedback'].includes(phase))return false;freeze();was=phase;phase='paused';return true;}
  function resume(){if(phase!=='paused')return false;phase=was;if(phase==='input')started=now();return true;}
  const checkpointNow=()=>({gameId:GAME,version:VERSION,events:clone(events),elapsedMs:active(),phase:phase==='paused'?was:phase,lastRule});
  if(checkpoint){if(checkpoint.gameId!==GAME||checkpoint.version!==VERSION||!Array.isArray(checkpoint.events)||checkpoint.events.length>c.total*3)throw Error('Invalid checkpoint');for(const e of checkpoint.events)apply(e);if(!final){if(!['rule','input','feedback'].includes(checkpoint.phase)||!Number.isFinite(checkpoint.elapsedMs)||checkpoint.elapsedMs<elapsed||checkpoint.elapsedMs>7200000)throw Error('Invalid checkpoint state');if(checkpoint.lastRule!==null&&!deck.some(t=>ruleKey(t)===checkpoint.lastRule))throw Error('Invalid rule');elapsed=checkpoint.elapsedMs;lastRule=checkpoint.lastRule;was=checkpoint.phase;phase='paused';}}
  return {begin,next,answer,pause,resume,apply,checkpoint:checkpointNow,result:()=>final&&clone(final),abandon:()=>final?clone(final):finish('abandoned'),view:()=>({phase,stage,band,mode,index,total:c.total,required:c.required,firstCorrect,solved:index,combo,bestCombo,switchErrors,trial:target()&&clone(target()),rejected:currentEvents().filter(e=>!e.correct).map(e=>e.choice),elapsedMs:active()})};
 }
 const api={VERSION,GAME,config,trials,answerFor,contains369,ruleKey,instructions,guide,colors,names,symbols,create};return api; }
 const api={make};if(typeof module==='object'&&module.exports)module.exports=api;else root.NollpicCardGames=api;
})(typeof window==='object'?window:globalThis);

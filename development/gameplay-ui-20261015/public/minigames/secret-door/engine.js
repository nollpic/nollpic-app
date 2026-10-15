(function(root){
 'use strict';
 const mine=typeof module==='object'&&module.exports?require('../crystal-mine/engine.js'):root.NollpicCrystalMine;
 const colors=['blue','rose','gold'],symbols=['moon','star','leaf'];
 const names={blue:'파란',rose:'분홍',gold:'황금',moon:'달',star:'별',leaf:'잎'};
 const copy=x=>JSON.parse(JSON.stringify(x));
 function satisfies(d,c){if(c.kind==='eq')return d[c.field]===c.value;if(c.kind==='neq')return d[c.field]!==c.value;if(c.kind==='left')return d.id<c.value;if(c.kind==='right')return d.id>c.value;if(c.kind==='or')return d.color===c.color||d.symbol===c.symbol;throw Error('Invalid clue');}
 function clueText(c){if(c.kind==='eq')return `${names[c.value]} ${c.field==='color'?'색':'문양'} 문이에요.`;if(c.kind==='neq')return `${names[c.value]} ${c.field==='color'?'색':'문양'} 문은 아니에요.`;if(c.kind==='left')return `${c.value+1}번 문보다 왼쪽이에요.`;if(c.kind==='right')return `${c.value+1}번 문보다 오른쪽이에요.`;return `${names[c.color]} 색이거나 ${names[c.symbol]} 문양이에요.`;}
 function room(band,random){
  const n=band==='lower'?3:5;
  for(let tries=0;tries<500;tries++){
   const doors=Array.from({length:n},(_,id)=>({id,color:colors[Math.floor(random()*3)],symbol:symbols[Math.floor(random()*3)]}));
   const target=doors[Math.floor(random()*n)];
   const otherColor=colors.filter(x=>x!==target.color)[Math.floor(random()*2)],otherSymbol=symbols.filter(x=>x!==target.symbol)[Math.floor(random()*2)];
   const clues=band==='lower'?[{kind:'eq',field:'color',value:target.color},{kind:'neq',field:'symbol',value:otherSymbol}]:[
    {kind:'neq',field:'color',value:otherColor},{kind:'neq',field:'symbol',value:otherSymbol},
    target.id<2?{kind:'left',value:3}:{kind:'right',value:1},{kind:'or',color:target.color,symbol:target.symbol}];
   const matches=doors.filter(d=>clues.every(c=>satisfies(d,c)));
   if(matches.length===1&&matches[0].id===target.id)return {doors,clues,target:target.id};
  }throw Error('Unable to create unique room');
 }
 function create({stage=1,band='lower',mode='basic',seed=1,sessionId,childId,now=()=>performance.now()}={}){
  if(![1,2,3].includes(stage)||!['lower','upper'].includes(band)||!['basic','free','practice'].includes(mode))throw Error('Invalid session');
  const random=mine.randomFrom(seed);let round=0,phase='ready',previous,doors=[],clues=[],sequence=[],index=0,correct=0,wrong=0,hints=0,final=null,started=now(),pausedAt=0,pausedMs=0;
  const events=[];const elapsed=()=>Math.max(0,(phase==='paused'?pausedAt:now())-started-pausedMs);
  function beginRound(){if(!['ready','transition'].includes(phase)||final)return false;round++;index=0;
   if(stage===3){const r=room(band,random);doors=r.doors;clues=r.clues;sequence=[r.target];}
   else {const n=band==='lower'?3:5,pool=colors.flatMap(color=>symbols.map(symbol=>({color,symbol})));
    for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}doors=pool.slice(0,n).map((d,id)=>({...d,id}));
    const length=stage===1?1:(band==='lower'?[2,3,3]:[4,5,6])[round-1];sequence=Array.from({length},()=>Math.floor(random()*n));clues=[];
   }phase=stage===3?'input':'preview';return true;
  }
  function revealDone(){if(phase!=='preview')return false;phase='input';return true;}
  function finish(endReason){if(final)return copy(final);const time=elapsed();phase='ended';final={sessionId,childId,gameId:'SECRET-DOOR',gameVersion:'1.0.0',rulesVersion:'secret-1',stage,band,mode,boardSeed:seed,endReason,correctCount:correct,wrongCount:wrong,accuracy:correct+wrong?correct/(correct+wrong):null,hintCount:hints,completedRounds:endReason==='completed'?3:round-1,totalRounds:3,activePlayMs:time,events:copy(events),verification:'client_reported',analysisEligible:false};return copy(final);}
  function choose(id){if(phase!=='input'||!doors.some(d=>d.id===id))return null;const ok=id===sequence[index];events.push({round,id,at:elapsed()});if(!ok){wrong++;index=0;return {correct:false,roundComplete:false};}correct++;index++;if(index===sequence.length){phase='transition';if(round===3)finish('completed');return {correct:true,roundComplete:true};}return {correct:true,roundComplete:false};}
  function hint(){if(phase!=='input'||(band==='upper'&&hints>=1))return null;hints++;return stage===3?'단서를 하나씩 확인하고, 맞지 않는 문을 제외해 보세요.':`첫 번째 문은 ${sequence[0]+1}번이에요.`;}
  function pause(){if(['ended','paused'].includes(phase))return false;previous=phase;pausedAt=now();phase='paused';return true;}
  function resume(){if(phase!=='paused')return false;pausedMs+=now()-pausedAt;phase=previous;return true;}
  return {beginRound,revealDone,choose,hint,pause,resume,abandon:()=>finish('abandoned'),result:()=>final&&copy(final),view:()=>({stage,band,mode,round,phase,doors:copy(doors),clues:clues.map(clueText),sequence:[...sequence],index,correct,wrong,hints,activeMs:elapsed()})};
 }
 const api={create,room,satisfies,clueText,names};if(typeof module==='object'&&module.exports)module.exports=api;else root.NollpicSecretDoor=api;
})(typeof window==='object'?window:globalThis);

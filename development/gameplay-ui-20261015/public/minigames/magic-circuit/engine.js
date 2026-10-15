(function(root){
 'use strict';
 const mine=typeof module==='object'&&module.exports?require('../crystal-mine/engine.js'):root.NollpicCrystalMine;
 const VERSION='1.0.0',GAME='MAGIC-CIRCUIT',copy=x=>JSON.parse(JSON.stringify(x));
 function config(band,stage,mode='basic'){
  if(!['lower','upper'].includes(band)||![1,2,3].includes(stage)||!['basic','free','practice'].includes(mode))throw Error('Invalid configuration');
  return (band==='lower'?[{size:4,pairs:2,blocks:0,arrows:0,required:false},{size:5,pairs:3,blocks:3,arrows:0,required:false},{size:6,pairs:4,blocks:4,arrows:0,required:true}]:[{size:6,pairs:4,blocks:0,arrows:0,required:false},{size:7,pairs:5,blocks:0,arrows:2,required:false},{size:8,pairs:6,blocks:8,arrows:2,required:false}])[stage-1];
 }
 const adjacent=(a,b,n)=>Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&b>=0&&a<n*n&&b<n*n&&Math.abs(a%n-b%n)+Math.abs(Math.floor(a/n)-Math.floor(b/n))===1;
 function validate(board,paths,complete=false){
  if(!Array.isArray(paths)||paths.length!==board.pairs.length)return false;const used=new Set(),ends=new Map();board.pairs.forEach((p,i)=>{ends.set(p.start,i);ends.set(p.end,i);});
  for(let i=0;i<paths.length;i++){const path=paths[i],p=board.pairs[i];if(!Array.isArray(path)||path.length<1||path[0]!==p.start)return false;
   for(let j=0;j<path.length;j++){const cell=path[j];if(!Number.isInteger(cell)||cell<0||cell>=board.size**2||used.has(cell)||board.blocks.includes(cell)||(ends.has(cell)&&ends.get(cell)!==i)||(board.required[cell]!==undefined&&board.required[cell]!==i))return false;
    if(j&&(path[j-1]===p.end||!adjacent(path[j-1],cell,board.size)||(board.arrows[path[j-1]]!==undefined&&board.arrows[path[j-1]]!==cell)))return false;used.add(cell);
   }
   const done=path.at(-1)===p.end;if((complete&&!done)||(done&&Object.entries(board.required).some(([cell,pair])=>pair===i&&!path.includes(Number(cell)))))return false;
  }return true;
 }
 function generate(seed,band,stage,mode='basic'){
  const c=config(band,stage,mode),n=c.size,r=mine.randomFrom(seed);let walk=[];for(let y=0;y<n;y++)for(let x=0;x<n;x++)walk.push(y*n+(y%2?n-1-x:x));
  // Backbite transforms keep a Hamiltonian path; disjoint segments provide an explicit solution witness.
  for(let k=0;k<n*n*14;k++){if(r()<.5)walk.reverse();const candidates=walk.map((cell,i)=>i>1&&adjacent(walk[0],cell,n)?i:-1).filter(i=>i>=0);if(candidates.length){const j=candidates[Math.floor(r()*candidates.length)];walk=[...walk.slice(0,j).reverse(),...walk.slice(j)];}}
  const length=Math.floor(n*n*.8/c.pairs),solution=Array.from({length:c.pairs},(_,i)=>walk.slice(i*length,(i+1)*length));const unused=walk.slice(c.pairs*length);
  const board={size:n,pairs:solution.map(p=>({start:p[0],end:p.at(-1)})),blocks:unused.slice(0,c.blocks),arrows:{},required:{},solution};
  solution.forEach((p,i)=>{if(c.required)board.required[p[Math.floor(p.length/2)]]=i;for(let j=0;j<c.arrows;j++){const at=1+Math.floor(j*(p.length-3)/Math.max(1,c.arrows-1));board.arrows[p[at]]=p[at+1];}});
  if(!validate(board,solution,true))throw Error('Generated circuit has no valid witness');return board;
 }
 function create({band='lower',stage=1,mode='basic',seed=1,sessionId,childId,now=()=>performance.now(),checkpoint}={}){
  const board=generate(seed,band,stage,mode);let paths=board.pairs.map(p=>[p.start]),history=[],events=[],phase='ready',elapsed=0,started=null,corrections=0,hints=0,rejected=0,final=null;
  const active=()=>elapsed+(started===null?0:Math.max(0,now()-started));const freeze=()=>{elapsed=active();started=null;};
  const completed=()=>paths.filter((p,i)=>p.at(-1)===board.pairs[i].end).length;
  function finish(reason){freeze();phase='ended';final={gameId:GAME,gameVersion:VERSION,rulesVersion:VERSION,sessionId,childId,boardSeed:seed>>>0,band,stage,mode,endReason:reason,activePlayMs:elapsed,completionTimeMs:reason==='completed'?elapsed:null,correctionCount:corrections,hintCount:hints,rejectedCount:rejected,connectedPairs:completed(),totalPairs:board.pairs.length,score:completed()*100,stars:reason==='completed'?(hints?1:corrections?2:3):0,events:copy(events),paths:copy(paths),verification:'client_reported',analysisEligible:false};return copy(final);}
  function apply(e){
   if(final||!e||!['cell','clear','reset','undo','hint'].includes(e.kind)||!Number.isFinite(e.at)||e.at<elapsed||e.at>7200000||events.length>=1800)throw Error('Invalid circuit action');
   const pair=e.pair??null,cell=e.cell??null;if(['cell','clear','hint'].includes(e.kind)&&(!Number.isInteger(pair)||pair<0||pair>=paths.length))throw Error('Invalid pair');if(e.kind==='cell'&&(!Number.isInteger(cell)||cell<0||cell>=board.size**2))throw Error('Invalid cell');
   if(e.kind!=='cell'&&cell!==null)throw Error('Unexpected cell');if(['reset','undo'].includes(e.kind)&&pair!==null)throw Error('Unexpected pair');
   elapsed=e.at;started=null;let next=copy(paths),ok=true,message='',hint=null,changed=false,edit=false;
   if(e.kind==='cell'){const path=next[pair],at=path.indexOf(cell);if(at>=0){if(at<path.length-1){next[pair]=path.slice(0,at+1);changed=edit=true;}}else{path.push(cell);if(!validate(board,next)){ok=false;message='상하좌우, 화살표, 다른 회로와 별 칸을 확인해요.';}else changed=true;}}
   if(e.kind==='clear'){if(next[pair].length>1){next[pair]=[board.pairs[pair].start];changed=edit=true;}}
   if(e.kind==='reset'){next=board.pairs.map(p=>[p.start]);changed=paths.some(p=>p.length>1);edit=changed;}
   if(e.kind==='undo'){if(history.length){paths=history.pop();corrections++;}else{ok=false;message='되돌릴 선이 없어요.';}}
   if(e.kind==='hint'){hints++;const witness=board.solution[pair],current=paths[pair];if(current.every((cell,i)=>cell===witness[i])){hint=witness[current.length]??null;message=hint===null?'이 회로는 연결됐어요.':'반짝이는 다음 칸을 확인해요. 다른 선이 막으면 먼저 고쳐요.';}else{hint=board.pairs[pair].start;message='이 힌트는 한 가지 해법이에요. 선택 회로를 지우고 반짝이는 출발점부터 다시 봐요.';}}
   if(ok&&changed){history.push(copy(paths));paths=next;if(edit)corrections++;}if(!ok)rejected++;
   events.push({kind:e.kind,pair,cell,at:e.at});phase='playing';if(validate(board,paths,true))finish('completed');return {ok,message,hint,completed:!!final,connected:completed()};
  }
  function begin(){if(phase!=='ready')return false;phase='playing';started=now();return true;}
  function action(kind,pair=null,cell=null){if(phase!=='playing')return null;const r=apply({kind,pair,cell,at:active()});if(!final)started=now();return r;}
  function pause(){if(phase!=='playing')return false;freeze();phase='paused';return true;}
  function resume(){if(phase!=='paused')return false;phase='playing';started=now();return true;}
  const checkpointNow=()=>({version:VERSION,events:copy(events),elapsedMs:active(),phase:phase==='paused'?'playing':phase});
  if(checkpoint){if(checkpoint.version!==VERSION||!Array.isArray(checkpoint.events)||checkpoint.events.length>1800)throw Error('Invalid checkpoint');for(const e of checkpoint.events)apply(e);if(!final){if(!['ready','playing'].includes(checkpoint.phase)||!Number.isFinite(checkpoint.elapsedMs)||checkpoint.elapsedMs<elapsed||checkpoint.elapsedMs>7200000)throw Error('Invalid checkpoint state');elapsed=checkpoint.elapsedMs;phase=checkpoint.phase==='ready'?'ready':'paused';}}
  return {begin,action,apply,pause,resume,checkpoint:checkpointNow,result:()=>final&&copy(final),abandon:()=>final?copy(final):finish('abandoned'),view:()=>({board:copy(board),paths:copy(paths),phase,connected:completed(),corrections,hints,rejected,elapsedMs:active(),undo:history.length>0})};
 }
 const api={VERSION,GAME,config,adjacent,generate,validate,create};if(typeof module==='object'&&module.exports)module.exports=api;else root.NollpicCircuit=api;
})(typeof window==='object'?window:globalThis);

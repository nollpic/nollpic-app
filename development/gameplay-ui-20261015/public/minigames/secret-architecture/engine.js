(function(root){
'use strict';
const mine=typeof module==='object'&&module.exports?require('../crystal-mine/engine.js'):root.NollpicCrystalMine;
const VERSION='1.0.0',GAME='SECRET-ARCHITECTURE',copy=x=>JSON.parse(JSON.stringify(x));
function config(band,stage,mode='basic'){
 if(!['lower','upper'].includes(band)||![1,2,3].includes(stage)||!['basic','free','practice'].includes(mode))throw Error('Invalid configuration');
 return {size:band==='lower'?3:4,columns:(band==='lower'?[3,4,5]:[5,6,7])[stage-1],height:(band==='lower'?[1,2,2]:[2,3,3])[stage-1],turns:(band==='lower'?[0,0,1]:[0,1,2])[stage-1],revealMs:(band==='lower'?[6000,5000,4000]:[5000,4000,3000])[stage-1],problems:3,maxSubmissions:3,pass:2};
}
function rotate(cells,n,turns){let out=copy(cells);for(let t=0;t<turns;t++){const next=Array.from({length:n*n},()=>({height:0,dir:0}));out.forEach((c,i)=>{next[(i%n)*n+n-1-Math.floor(i/n)]={height:c.height,dir:c.height?(c.dir+1)%4:0};});out=next;}return out;}
function generate(seed,band,stage,problem=0,mode='basic'){
 const c=config(band,stage,mode),r=mine.randomFrom((seed+problem*7919)>>>0),cells=Array.from({length:c.size**2},()=>({height:0,dir:0})),indices=cells.map((_,i)=>i);
 for(let i=indices.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[indices[i],indices[j]]=[indices[j],indices[i]];}
 indices.slice(0,c.columns).forEach(i=>{cells[i]={height:1+Math.floor(r()*c.height),dir:stage===1?0:Math.floor(r()*4)};});
 return {...c,source:cells,target:rotate(cells,c.size,c.turns)};
}
function compare(actual,target){let position=0,height=0,rotation=0;actual.forEach((c,i)=>{const t=target[i];if(!!c.height!==!!t.height)position++;else if(c.height){if(c.height!==t.height)height++;if(c.dir!==t.dir)rotation++;}});return {correct:position+height+rotation===0,position,height,rotation};}
function create({band='lower',stage=1,mode='basic',seed=1,sessionId,childId,now=()=>performance.now(),checkpoint}={}){
 const c=config(band,stage,mode);let problem=0,board=generate(seed,band,stage,0,mode),cells=board.source.map(()=>({height:0,dir:0})),phase='ready',elapsed=0,started=null,phaseAt=0,paused=false,events=[],records=[],submissions=0,hints=0,edits=0,final=null;
 const active=()=>elapsed+(started===null?0:Math.max(0,now()-started));
 const freeze=()=>{elapsed=active();started=null;};
 function finish(reason){phase='ended';const first=records.filter(r=>r.firstCorrect).length;final={gameId:GAME,gameVersion:VERSION,sessionId,childId,band,stage,mode,seed:seed>>>0,endReason:reason,activePlayMs:elapsed,firstCorrect:first,totalProblems:3,accuracy:first/3,solved:records.filter(r=>r.solved).length,score:first,stars:reason==='completed'?(first===3&&!hints?3:2):1,hintCount:hints,editCount:edits,records:copy(records),events:copy(events),verification:'client_reported',analysisEligible:false};}
 function apply(e){
  if(final||!e||!['begin','hide','add','remove','rotate','submit','next','hint'].includes(e.kind)||!Number.isFinite(e.at)||e.at<elapsed||e.at>7200000||events.length>=1800)throw Error('Invalid building action');
  const cell=e.cell??null;if(['add','remove','rotate'].includes(e.kind)){if(phase!=='input'||!Number.isInteger(cell)||cell<0||cell>=cells.length)throw Error('Invalid block input');}else if(cell!==null)throw Error('Unexpected cell');
  if(e.kind==='begin'&&phase!=='ready'||e.kind==='hide'&&!['reveal','hint'].includes(phase)||e.kind==='submit'&&phase!=='input'||e.kind==='next'&&phase!=='feedback'||e.kind==='hint'&&phase!=='input')throw Error('Wrong phase');
  if(e.kind==='hide'&&e.at-phaseAt<(phase==='hint'?3000:c.revealMs))throw Error('Blueprint hidden too early');
  elapsed=e.at;started=null;let outcome=null;
  if(e.kind==='begin'){phase='reveal';phaseAt=elapsed;}
  if(e.kind==='hide'){phase='input';phaseAt=elapsed;}
  if(e.kind==='add'){if(cells[cell].height<c.height){cells[cell].height++;edits++;}}
  if(e.kind==='remove'){if(cells[cell].height){cells[cell].height--;if(!cells[cell].height)cells[cell].dir=0;edits++;}}
  if(e.kind==='rotate'&&cells[cell].height){cells[cell].dir=(cells[cell].dir+1)%4;edits++;}
  if(e.kind==='hint'){hints++;phase='hint';phaseAt=elapsed;}
  if(e.kind==='submit'){
   const check=compare(cells,board.target);submissions++;outcome=check;
   if(submissions===1)records.push({problem,firstCorrect:check.correct,solved:false,submissions:0,positionErrors:0,heightErrors:0,rotationErrors:0,responseMs:elapsed-phaseAt});
   const rec=records.at(-1);rec.submissions=submissions;rec.solved=check.correct;rec.positionErrors+=check.position;rec.heightErrors+=check.height;rec.rotationErrors+=check.rotation;
   if(check.correct||submissions===c.maxSubmissions)phase='feedback';
  }
  events.push({kind:e.kind,cell,at:e.at});
  if(e.kind==='next'){if(problem===2)finish(records.filter(r=>r.firstCorrect).length>=c.pass?'completed':'failed');else{problem++;board=generate(seed,band,stage,problem,mode);cells=board.source.map(()=>({height:0,dir:0}));submissions=0;phase='reveal';phaseAt=elapsed;}}
  return {phase,outcome};
 }
 function action(kind,cell=null){if(paused||final)return null;const r=apply({kind,cell,at:active()});if(!final)started=now();return r;}
 function tick(){if(!paused&&['reveal','hint'].includes(phase)&&active()-phaseAt>=(phase==='hint'?3000:c.revealMs))return action('hide');return null;}
 function pause(){if(final||paused)return false;freeze();paused=true;return true;}function resume(){if(final||!paused)return false;paused=false;started=now();return true;}
 const getCheckpoint=()=>({version:VERSION,events:copy(events),elapsedMs:active(),phase});
 if(checkpoint){if(checkpoint.version!==VERSION||!Array.isArray(checkpoint.events)||checkpoint.events.length>1800)throw Error('Invalid checkpoint');for(const e of checkpoint.events)apply(e);if(!Number.isFinite(checkpoint.elapsedMs)||checkpoint.elapsedMs<elapsed||checkpoint.elapsedMs>7200000||checkpoint.phase!==phase)throw Error('Invalid checkpoint clock');elapsed=checkpoint.elapsedMs;paused=!final;}
 return {action,apply,tick,pause,resume,checkpoint:getCheckpoint,result:()=>final&&copy(final),abandon:()=>{freeze();if(!final)finish('abandoned');return copy(final);},view:()=>({board:copy(board),cells:copy(cells),phase,paused,problem,submissions,hints,edits,records:copy(records),elapsedMs:active(),remainingMs:Math.max(0,(phase==='hint'?3000:c.revealMs)-(active()-phaseAt))})};
}
const api={VERSION,GAME,config,rotate,generate,compare,create};if(typeof module==='object'&&module.exports)module.exports=api;else root.NollpicArchitecture=api;
})(typeof window==='object'?window:globalThis);

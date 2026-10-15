(function(root){
 'use strict';
 const games=['REVERSAL-DIRECTION','COLOR-WIZARD','CIPHER-369','ATT-001','SECRET-DOOR','REVERSAL-WIZARD','MAGIC-CIRCUIT','SECRET-ARCHITECTURE'];
 function gradeBand(grade){const n=Number(grade);if(!Number.isInteger(n)||n<1||n>6)throw Error('초등 학년을 확인해 주세요.');return n<=3?'lower':'upper';}
 function selection({gameId,grade,mode='basic',band,stage=1}){
  if(!games.includes(gameId)||!['basic','free','practice'].includes(mode)||![1,2,3].includes(stage))throw Error('Invalid game session');
  const recommended=gradeBand(grade);band=mode==='basic'?recommended:band||recommended;
  if(!['lower','upper'].includes(band))throw Error('Invalid grade band');
  return {gameId,mode,band,stage,recommended,analysisEligible:false};
 }
 function create(options){const selected=selection(options);let stage=selected.stage,done=new Set();return {
  get:()=>({...selected,stage}),complete:()=>{done.add(stage);return {stage,next:stage<3?stage+1:null};},
  next:()=>{if(!done.has(stage)||stage===3)return false;stage++;return true;}
 };}
 const api={gradeBand,selection,create};if(typeof module==='object'&&module.exports)module.exports=api;else root.NollpicGameSession=api;
})(typeof window==='object'?window:globalThis);

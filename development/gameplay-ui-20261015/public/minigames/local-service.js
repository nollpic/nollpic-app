(function(root){
 'use strict';
 const games=['ATT-001','MAGIC-CIRCUIT','REVERSAL-DIRECTION','COLOR-WIZARD','CIPHER-369','SECRET-ARCHITECTURE','SECRET-DOOR'];
 // Local play only. No Firebase calls, point awards, or writes to legacy challenge/test keys.
 function create({storage,context,uuid,seed}){
  const prefix='nollpic:game-play:v1:';
  const scope=()=>JSON.stringify(context());
  const key=id=>prefix+encodeURIComponent(scope())+':'+id;
  function read(id,fallback){const raw=storage.getItem(key(id));return raw===null?fallback:JSON.parse(raw);}
  function write(id,value){storage.setItem(key(id),JSON.stringify(value));}
  function saved(id){const value=read('attempt:'+id,null);if(!value||value.attempt.owner!==scope())throw Error('현재 아이의 도전 기록을 찾지 못했어요.');return value;}
  function check(attempt){if(attempt.owner!==scope())throw Error('아이 정보가 바뀌었어요. 월드맵에서 다시 시작해 주세요.');return saved(attempt.attemptId);}
  return {
   storageMode:'device',
   async start(options){
    if(!games.includes(options.gameId)||![1,2,3].includes(options.stage)||!['lower','upper'].includes(options.band)||!['basic','free','practice'].includes(options.mode))throw Error('도전 설정을 확인해 주세요.');
    const attempt={...options,attemptId:uuid(),seed:seed(),childId:context().childId||'guest',owner:scope(),emulator:false};
    write('attempt:'+attempt.attemptId,{attempt,checkpoint:null,result:null});write('latest:'+attempt.gameId,attempt.attemptId);return attempt;
   },
   async checkpoint(attempt,checkpoint){const value=check(attempt);if(value.result)return {saved:false};if((checkpoint.events?.length||0)<(value.checkpoint?.events?.length||0))return {stale:true};write('attempt:'+attempt.attemptId,{...value,checkpoint});return {saved:true};},
   async resume(id){return saved(id);},
   async state(gameId){const id=read('latest:'+gameId,null);return {attempt:id?saved(id).attempt:null,completedStages:read('completed:'+gameId,[])};},
   async finish(attempt,record){
    const value=check(attempt);
    if(record.gameId!==attempt.gameId||record.sessionId!==attempt.attemptId||record.stage!==attempt.stage)throw Error('도전과 결과가 일치하지 않아요.');
    if(!['completed','failed','abandoned','timeout'].includes(record.endReason))throw Error('완료 상태를 확인해 주세요.');
    if(!value.result)write('attempt:'+attempt.attemptId,{...value,result:record});
    const result=value.result||record;
    if(result.endReason==='completed'&&attempt.mode!=='practice')write('completed:'+attempt.gameId,[...new Set([...read('completed:'+attempt.gameId,[]),attempt.stage])].sort());
    return {storageMode:'device',emulator:false,rewardStatus:'not-enabled',awarded:0,duplicate:!!value.result};
   },
   async feedbackStatus(){return {prompt:false};}
  };
 }
 if(typeof module==='object'&&module.exports){module.exports={create};return;}
 if(root.NollpicGameService)return;
 root.NollpicGameService=create({storage:localStorage,uuid:()=>crypto.randomUUID(),seed:()=>crypto.getRandomValues(new Uint32Array(1))[0],context:()=>{
  const signed=root.NollpicChallengeStorage.isSignedIn(),user=signed?root.getNollpicUser():null,child=signed?root.getSelectedChildProfile():null;
  return {uid:user?.uid||'',childId:child?.id||'',guestSession:signed?'':sessionStorage.getItem('nollpic_challenge_guest_session_v1')||''};
 }});
})(typeof window==='object'?window:globalThis);

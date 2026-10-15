(function(){
 'use strict';
 function create(gameId){
  const owner=window.NollpicGameAvatar.owner,service=owner.NollpicGameService;
  let session=null,attempt=null,savePromise=null;
  const controls=document.createElement('fieldset');controls.className='gm-session-controls';
  controls.innerHTML='<legend>도전 방법</legend><label>모드 <select id="gm-mode"><option value="basic">기본 도전 · 내 학년</option><option value="free">자유 도전 · 평가 제외</option></select></label><label>학년 <select id="gm-band"><option value="lower">저학년 · 1~3학년</option><option value="upper">고학년 · 4~6학년</option></select></label><p id="gm-mode-note"></p>';
  document.getElementById('gm-start').before(controls);
  const band=document.getElementById('gm-band'),mode=document.getElementById('gm-mode'),note=document.getElementById('gm-mode-note');
  function grade(){const value=Number(owner.getSelectedChildProfile()?.gradeValue);return Number.isInteger(value)&&value>=1&&value<=6?value:null;}
  function refresh(){const value=grade();if(!value)mode.value='free';mode.querySelector('[value="basic"]').disabled=!value;band.disabled=!!value&&mode.value==='basic';if(band.disabled)band.value=NollpicGameSession.gradeBand(value);note.textContent=value?'기본은 내 학년 기준, 자유·연습은 성장 분석에서 제외해요.':'아이의 초등 학년 정보가 없어 자유 도전으로 시작해요. 학년을 골라 주세요.';}
  mode.addEventListener('change',refresh);if(service)refresh();else controls.hidden=true;
  const next=document.createElement('button');next.id='gm-next-stage';next.className='gm-primary';next.type='button';next.hidden=true;document.getElementById('gm-return').before(next);
  const stageNote=document.createElement('p');stageNote.id='gm-stage-note';stageNote.className='gm-estimate';document.getElementById('gm-play').prepend(stageNote);
  return {
   async begin(stage,practice=false){
    // Existing world-map mine preview remains playable without adopting emulator account state.
    if(!service){attempt={attemptId:crypto.randomUUID(),seed:crypto.getRandomValues(new Uint32Array(1))[0],difficulty:stage,stage,mode:practice?'practice':'basic',band:'lower',emulator:false};savePromise=null;stageNote.textContent=`${stage}단계 · 저장·지급 없는 개발 체험`;return attempt;}
    session=NollpicGameSession.create({gameId,grade:grade()||1,mode:practice?'practice':mode.value,band:band.value,stage});
    attempt=await service.start({...session.get()});savePromise=null;next.hidden=true;
    stageNote.textContent=`${stage}단계 · ${attempt.band==='lower'?'저학년':'고학년'} · ${attempt.mode==='basic'?'기본':attempt.mode==='free'?'자유 도전':'연습'}`;
    return attempt;
   },
   restore(saved){mode.value=saved.mode==='practice'?'free':saved.mode;band.value=saved.band;refresh();attempt=saved;session=NollpicGameSession.create({gameId,grade:grade()||1,mode:saved.mode,band:saved.band,stage:saved.stage});savePromise=null;next.hidden=true;stageNote.textContent=`${saved.stage}단계 · 중단한 도전 이어하기`;},
   save(record){if(!service)return Promise.resolve({attemptId:attempt?.attemptId,rewardStatus:'offline-preview',emulator:false});if(!attempt)return Promise.resolve({status:'not-started'});if(!savePromise)savePromise=service.finish(attempt,record).catch(e=>{savePromise=null;throw e;});return savePromise;},
   completed(record,onNext){next.hidden=record.endReason!=='completed'||!session||session.get().stage===3;if(!next.hidden){session.complete();next.textContent=`${session.get().stage+1}단계 도전하기 →`;next.onclick=()=>{if(session.next()){next.hidden=true;onNext(session.get().stage);}};}},
   status(receipt){return receipt.storageMode==='device'?'이 기기에 놀이 기록 저장 · 포인트 지급 없음':receipt.emulator===false?'기록 저장 및 실제 지급 없음':receipt.rewardStatus==='awarded'?`+${receipt.awarded}P · Emulator 테스트 최초 보상`:receipt.rewardStatus==='duplicate'?'이미 받은 단계 보상 · 추가 지급 없음':receipt.rewardStatus==='legacy-blocked'?'과거 지급 이력 보존 · 추가 지급 보류':'일차·보상액 미확정 · 포인트 지급 보류';}
  };
 }
 window.NollpicGameFramework={create};
})();

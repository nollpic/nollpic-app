(function () {
  'use strict';
  let owner = window;
  try { if (parent !== window && parent.location.origin === location.origin && parent.NollpicAvatar) owner = parent; } catch (_) {}
  function contextNow() {
    if(owner.NollpicStorage)return owner.NollpicStorage.capture();
    const signedIn=owner.NollpicChallengeStorage.isSignedIn();
    const user = signedIn ? (owner.getUser?.() || owner.getNollpicUser?.()) : null;
    const child = signedIn ? (owner.getSelectedChildProfile?.() || owner.getActiveChildProfile?.()) : null;
    return {role:signedIn?'parent':'guest',uid:user?.uid || '',childId:child?.id || '',guestSession:signedIn?'':owner.sessionStorage.getItem('nollpic_challenge_guest_session_v1')};
  }
  async function capture() {
    await owner.NollpicAuthBoot; await owner.NollpicAuth?.ready;
    const context = contextNow();
    if(context.role==='pending')throw Error('Child identity is still loading');
    const state = owner.NollpicAvatar.read(), equip = {};
    for (const [slot, id] of Object.entries(state.equip || {})) if (state.owned.includes(id) && owner.NollpicAvatar.ITEMS.some(x=>x.id===id&&x.slot===slot)) equip[slot] = id;
    return Object.freeze({ context, childId: context.childId || 'dev-guest', equip: Object.freeze(equip) });
  }
  function valid(snapshot) { return owner.NollpicStorage ? owner.NollpicStorage.isCurrent(snapshot.context) : JSON.stringify(contextNow()) === JSON.stringify(snapshot.context); }
  function renderHTML(equip) {
    const template = document.createElement('template'); template.innerHTML = owner.NollpicAvatar.drawAvatar(equip);
    template.content.querySelectorAll('img').forEach(img=>{ img.src = new URL(img.getAttribute('src'), location.origin + '/').href; });
    return template.innerHTML;
  }
  async function mount(snapshot, hosts, signal) {
    hosts.forEach(host=>{host.innerHTML='<span class="gm-avatar-loading" role="status">캐릭터 불러오는 중…</span>';});
    let equip = {...snapshot.equip};
    let markup = renderHTML(equip);
    const template = document.createElement('template'); template.innerHTML = markup;
    const sources = [...template.content.querySelectorAll('img')].map(img=>img.src);
    const failed = await Promise.all(sources.map(src=>new Promise(resolve=>{
      const img = new Image(); let done=false;
      const finish = ok=>{if(done)return;done=true;clearTimeout(timer);img.onload=img.onerror=null;signal?.removeEventListener('abort',abort);resolve(ok?null:src);};
      const abort=()=>finish(false), timer=setTimeout(()=>finish(false),6000);
      img.onload=()=>finish(true);img.onerror=()=>finish(false);signal?.addEventListener('abort',abort,{once:true});img.src=src;
      if(signal?.aborted)abort();
    })));
    if (signal?.aborted || !valid(snapshot)) return false;
    for (const [slot,id] of Object.entries(equip)) {
      const item=owner.NollpicAvatar.ITEMS.find(x=>x.id===id);
      if (item && failed.includes(new URL(item.fit,location.origin+'/').href)) delete equip[slot];
    }
    markup=renderHTML(equip);
    hosts.forEach(host=>{host.innerHTML=markup;host.dataset.equipment=JSON.stringify(equip);});
    // A missing overlay leaves every other valid layer intact.
    const brokenBase=failed.some(src=>/nollpic_base/.test(src));
    if(brokenBase) hosts.forEach(host=>{host.querySelectorAll('img').forEach(img=>{if(/nollpic_base/.test(img.src))img.hidden=true;});host.setAttribute('aria-label','캐릭터 일부 이미지를 불러오지 못했어요');});
    return true;
  }
  window.NollpicGameAvatar = {owner,capture,valid,mount};
})();
/* 2026-10-15 챌린지 도장·포인트 연결 (새 놀이 7개 공통)
   예전 놀이처럼 앱(부모 창)의 claimChallengeStepReward(놀이 번호)를 불러 그날 칸 도장 + 200P.
   놀이 번호 = challenge-games.js의 id. 지도·오늘 카드에서 연 놀이만 그날 칸으로 연결됨(mapChallengeStep) */
(function () {
  'use strict';
  const CATALOG={'ATT-001':19,'MAGIC-CIRCUIT':20,'REVERSAL-DIRECTION':21,'COLOR-WIZARD':22,'CIPHER-369':23,'SECRET-ARCHITECTURE':24,'SECRET-DOOR':25,'REVERSAL-WIZARD':21};
  const owner=window.NollpicGameAvatar?.owner||(window.parent!==window?window.parent:window);
  // record.endReason이 completed이고 연습이 아니면 도장·포인트. 같은 칸은 한 번만 포인트
  function claim(gameId,{completed=true,practice=false}={}){
    const id=CATALOG[gameId];
    if(!completed)return {kind:'incomplete'};
    if(practice)return {kind:'practice'};
    if(!id||owner===window||typeof owner.claimChallengeStepReward!=='function')return {kind:'offline'};
    let day=-1,before=0,after=0,awarded=false;
    try{day=Number(owner.mapChallengeStep?.(id));}catch(_){}
    if(!(day>0))return {kind:'free-play'};
    try{if(owner.isChallengeStepBehindPaywall?.(day))return {kind:'locked',day};}catch(_){}
    try{before=owner.getChallengePoints(owner.readChallengeState());}catch(_){}
    try{awarded=!!owner.claimChallengeStepReward(id);}catch(e){console.error(e);return {kind:'error',day};}
    try{after=owner.getChallengePoints(owner.readChallengeState());}catch(_){}
    return {kind:awarded?'awarded':'already',day,points:Math.max(0,after-before)};
  }
  function text(r){
    if(!r)return '';
    return r.kind==='awarded'?`+${r.points||200}P 받았어요 · ${r.day}일차 도장 완료!`
      :r.kind==='already'?`${r.day}일차 도장은 이미 받았어요`
      :r.kind==='practice'?'연습 모드는 도장·포인트가 없어요'
      :r.kind==='incomplete'?'끝까지 하면 도장과 포인트를 받아요'
      :r.kind==='locked'?'이 칸은 아직 열리지 않았어요'
      :r.kind==='error'?'도장을 찍지 못했어요. 다시 시도해 주세요'
      :'놀이 기록을 저장했어요';
  }
  window.NollpicChallengeLink={claim,text,catalogId:g=>CATALOG[g]};
})();

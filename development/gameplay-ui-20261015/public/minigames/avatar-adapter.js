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

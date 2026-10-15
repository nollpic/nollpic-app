(function () {
  'use strict';
  let entry=null, frame=null, returning=false, backdrop=null, host=null;
  const registry={'REVERSAL-DIRECTION':{title:'반전 마법사의 함정',entry:'direction-wizard'},'COLOR-WIZARD':{title:'컬러 마법사의 시험',entry:'color-wizard'},'CIPHER-369':{title:'369 암호 해독',entry:'cipher-369'},'SECRET-ARCHITECTURE':{title:'비밀 건축 연구소',entry:'secret-architecture'},'MAGIC-CIRCUIT':{title:'마법 회로 복구',entry:'magic-circuit'},'ATT-001':{title:'크리스탈 광산',entry:'crystal-mine'},'SECRET-DOOR':{title:'비밀의 문 탈출',entry:'secret-door'},'REVERSAL-WIZARD':{title:'반전 마법사의 함정',entry:'wizard-cards'}};let activeId='ATT-001';
  function open(gameId='ATT-001') {
    if(!registry[gameId])throw Error('Unknown game');activeId=gameId;
    if(frame)return;
    const page=document.querySelector('.page.active');
    entry={page:Number(page?.id.replace('page-',''))||7,scroll:[page,page?.querySelector('.challenge-home-body'),page?.querySelector('.play-content'),page?.querySelector('.page-body'),document.querySelector('.app-device')].filter(Boolean).map(element=>({element,top:element.scrollTop})),url:location.href};
    entry.audio=[...document.querySelectorAll('audio[data-nollpic-bgm]')].map(audio=>({audio,playing:!audio.paused}));
    entry.stopMusic=()=>entry?.audio.forEach(x=>x.audio.pause());entry.audio.forEach(x=>{x.audio.addEventListener('play',entry.stopMusic);x.audio.pause();});
    backdrop=document.querySelector('.app-device');backdrop.inert=true;
    host=document.createElement('section');host.className='gm-game-host';host.setAttribute('aria-label',registry[activeId].title);
    frame=document.createElement('iframe');frame.title=registry[activeId].title;frame.src='minigames/'+registry[activeId].entry+'/index.html';host.appendChild(frame);document.body.appendChild(host);
    try{sessionStorage.setItem('game-active-entry',JSON.stringify({page:entry.page,gameId:activeId}));}catch(_){}
    if(history.state?.nollpicMiniGame!==activeId)history.pushState({nollpicMiniGame:activeId},'',location.href);
  }
  function restore() {
    if(!frame)return;
    frame.remove();host.remove();frame=host=null;backdrop.inert=false;
    entry.scroll.forEach(x=>{x.element.scrollTop=x.top;});entry.audio.forEach(x=>{x.audio.removeEventListener('play',entry.stopMusic);if(x.playing)x.audio.play().catch(()=>{});});try{sessionStorage.removeItem('game-active-entry');}catch(_){}entry=null;
  }
  function close() {
    if(!frame)return;
    const gameId=activeId;
    // An iframe can consume a history traversal without a parent popstate event.
    restore();returning=false;
    if(history.state?.nollpicMiniGame===gameId)history.back();
  }
  function back(event) {
    if(!frame)return;
    if(returning) {returning=false;restore();return;}
    // Keep the game-specific history entry while its own exit confirmation is open.
    history.pushState({nollpicMiniGame:activeId},'',entry.url);
    frame.contentWindow.NollpicGameShell?.requestExit();
  }
  window.addEventListener('popstate',back);
  window.addEventListener('pagehide',()=>frame?.contentWindow.NollpicGameShell?.dispose());
  window.addEventListener('DOMContentLoaded',async()=>{await window.NollpicAuthBoot;let interrupted;try{interrupted=JSON.parse(sessionStorage.getItem('game-active-entry')||'null');}catch(_){}if(registry[interrupted?.gameId])setTimeout(()=>open(interrupted.gameId),0);});
  window.NollpicMiniGameHost={open,close,restore};
  window.openCrystalMineGame=()=>open('ATT-001');window.openSecretDoorGame=()=>open('SECRET-DOOR');
  window.openMagicCircuitGame=()=>open('MAGIC-CIRCUIT');
  window.openDirectionWizardGame=()=>open('REVERSAL-DIRECTION');
  window.openColorWizardGame=()=>open('COLOR-WIZARD');
  window.openCipher369Game=()=>open('CIPHER-369');
  window.openSecretArchitectureGame=()=>open('SECRET-ARCHITECTURE');
})();

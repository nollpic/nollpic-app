(function () {
  'use strict';
  function create({isActive,onPause,onResume,onExit,onDispose}) {
    const controller=new AbortController(),listen=(el,type,fn)=>el.addEventListener(type,fn,{signal:controller.signal});
    const dialog=document.getElementById('gm-pause'),confirm=document.getElementById('gm-exit-confirm'),menu=document.getElementById('gm-pause-menu');
    const prefsKey='nollpic:dev:mine-day1:preferences',prefs=(()=>{try{return JSON.parse(localStorage.getItem(prefsKey)||'{}');}catch(_){return {};}})();
    let muted=prefs.muted??false, reduced=prefs.reduced??matchMedia('(prefers-reduced-motion: reduce)').matches, audio=null, disposed=false;
    function settings() { document.documentElement.classList.toggle('gm-reduced-motion',reduced);document.getElementById('gm-sound').textContent=muted?'소리 켜기':'소리 끄기';document.getElementById('gm-motion').textContent=reduced?'움직임 줄이기 ✓':'움직임 줄이기';try{localStorage.setItem(prefsKey,JSON.stringify({muted,reduced}));}catch(_){} }
    function pause() { if(!isActive())return;onPause();if(!isActive())return;menu.hidden=false;confirm.hidden=true;if(!dialog.open)dialog.showModal(); }
    function requestExit() { if(!isActive()){onExit();return;}pause();menu.hidden=true;confirm.hidden=false; }
    function resume() {dialog.close();onResume();}
    function audioStart() { if(muted)return;try {audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});}catch(_){} }
    function tone(correct) {if(muted||!audio)return;try {const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.frequency.value=correct?660:220;gain.gain.setValueAtTime(.05,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.12);oscillator.connect(gain);gain.connect(audio.destination);oscillator.start();oscillator.stop(audio.currentTime+.14);}catch(_){} }
    listen(document.getElementById('gm-pause-btn'),'click',pause);
    listen(document.getElementById('gm-continue'),'click',resume);
    listen(document.getElementById('gm-exit'),'click',requestExit);
    listen(document.getElementById('gm-exit-cancel'),'click',resume);
    listen(document.getElementById('gm-exit-accept'),'click',()=>{dialog.close();onExit();});
    listen(document.getElementById('gm-back'),'click',requestExit);
    listen(document.getElementById('gm-sound'),'click',()=>{muted=!muted;settings();if(!muted)audioStart();});
    listen(document.getElementById('gm-motion'),'click',()=>{reduced=!reduced;settings();});
    listen(dialog,'cancel',event=>{event.preventDefault();requestExit();});
    listen(document,'visibilitychange',()=>{if(document.hidden)pause();});
    listen(window,'pagehide',()=>dispose());
    function dispose() {if(disposed)return;disposed=true;controller.abort();onDispose();if(audio){audio.close().catch(()=>{});audio=null;} }
    settings();
    const api={pause,requestExit,resume,audioStart,tone,dispose};window.NollpicGameShell=api;return api;
  }
  window.NollpicShell={create};
})();

(() => {
 // One player across app pages; never keep a media player alive in the background.
 const embedded=window.parent!==window;
 if(embedded) {
   const unlock=()=>{try{window.parent.startNollpicBackgroundMusic?.();}catch(_) {}};
   // 폰에서는 pointerdown 순간엔 소리 허락이 안 나서, 손을 뗄 때(pointerup·touchend)도 시도
   ['pointerdown','pointerup','touchend','click'].forEach(type=>document.addEventListener(type,unlock,{capture:true,passive:true}));
   return;
 }
 // 2026-10-10: 배경음악 기본값 = 켜짐. 예전에 꺼 둔 기기도 이번 한 번만 켜짐으로 되돌림 (이후 끄면 그대로 기억)
 try{
   if(localStorage.getItem('nollpic_bgm_default_on_v162')!=='1'){
     const saved=JSON.parse(localStorage.getItem('nollpic_sound_settings')||'{}');
     localStorage.setItem('nollpic_sound_settings',JSON.stringify({...saved,music:true}));
     localStorage.setItem('nollpic_bgm_default_on_v162','1');
   }
 }catch(_) {}
 const audio=document.createElement('audio');
 const source=new URL('tests/audio/carefree-96k.mp3',document.currentScript.src).href;
 audio.loop=true;audio.preload='auto';audio.volume=.40;audio.dataset.nollpicBgm='true';
 document.body.append(audio);
 let interacted=false, focused=document.hasFocus(), suspended=false, position=0;
 try{position=Math.max(0,Number(sessionStorage.getItem('nollpic_bgm_position'))||0);}catch(_) {}
 const enabled=()=>{try{return JSON.parse(localStorage.getItem('nollpic_sound_settings')||'{}').music!==false;}catch(_){return true;}};
 // document.hasFocus()는 포커스가 안쪽 iframe(미션 화면)에 있어도 true
 const focusInsideApp=()=>!document.hidden&&document.hasFocus();
 const canPlay=()=>interacted&&enabled()&&!document.hidden&&focused&&!suspended;
 function save(){
   if(audio.hasAttribute('src')&&audio.readyState>0&&Number.isFinite(audio.currentTime))position=audio.currentTime;
   try{sessionStorage.setItem('nollpic_bgm_position',String(position));}catch(_) {}
 }
 function clearMediaSession(){
   const media=navigator.mediaSession;if(!media)return;
   try{media.playbackState='none';media.metadata=null;}catch(_) {}
   try{media.setPositionState();}catch(_) {}
   ['play','pause','stop','seekbackward','seekforward','seekto','previoustrack','nexttrack'].forEach(action=>{try{media.setActionHandler(action,null);}catch(_) {}});
 }
 function stop(){
   save();audio.pause();
   // pause() alone can leave Chrome's Android media controls attached to the track.
   if(audio.hasAttribute('src')){audio.removeAttribute('src');audio.load();}
   clearMediaSession();
 }
 audio.addEventListener('loadedmetadata',()=>{
   if(!canPlay()){stop();return;}
   if(position>0&&position<audio.duration)audio.currentTime=position;
 });
 audio.addEventListener('play',()=>{if(!canPlay())stop();});
 audio.addEventListener('playing',()=>{if(!canPlay())stop();});
 function apply(){
   let volume=40;try{volume=JSON.parse(localStorage.getItem('nollpic_sound_settings')||'{}').musicVolume ?? 40;}catch(_){}
   audio.volume=Math.max(0,Math.min(100,Number(volume)))/100;audio.muted=!enabled();
   if(!canPlay()){stop();return;}
   if(!audio.hasAttribute('src'))audio.src=source;
   if(audio.paused)audio.play().then(()=>{if(!canPlay())stop();}).catch(error=>{
     // 소리 허락 전(터치 전)이면 막힘 → 깨끗이 멈추고 다음 터치 때 다시 시도
     if(error&&error.name==='NotAllowedError'&&!navigator.userActivation?.isActive){interacted=false;stop();}
   });
 }
 // 화면을 누른 순간 = 앱이 앞에 보이는 상태 (카톡 인앱 브라우저 등은 hasFocus()가 처음에 false일 때가 있어 직접 켬)
 window.startNollpicBackgroundMusic=()=>{interacted=true;if(!document.hidden)focused=true;apply();};
 window.applyNollpicSoundSettings=()=>{if(enabled())interacted=true;apply();};
 ['pointerdown','pointerup','touchend','click'].forEach(type=>document.addEventListener(type,window.startNollpicBackgroundMusic,{capture:true,passive:true}));
 window.addEventListener('nollpic-sound-change',apply);
 window.addEventListener('storage',event=>{if(event.key==='nollpic_sound_settings')apply();});
 window.addEventListener('message',event=>{if(event.origin===location.origin&&event.data?.type==='nollpic-sound-change')apply();});
 document.addEventListener('visibilitychange',()=>{focused=!document.hidden&&focusInsideApp();apply();});
 // 2026-10-10: 미션(테스트)은 iframe 안에서 돌아서, 아이가 미션 화면을 누르는 순간 바깥 창에 blur가 옴
 // → 예전엔 이때 음악을 껐음(첫 미션 시작 뒤부터 끊김). 포커스가 우리 iframe으로 옮겨 간 것이면 계속 재생
 window.addEventListener('blur',()=>{setTimeout(()=>{focused=focusInsideApp();if(focused)apply();else stop();},60);});
 window.addEventListener('focus',()=>{focused=true;apply();});
 window.addEventListener('pagehide',()=>{suspended=true;stop();});
 window.addEventListener('pageshow',()=>{suspended=false;focused=document.hasFocus();apply();});
 document.addEventListener('freeze',()=>{suspended=true;stop();});
 document.addEventListener('resume',()=>{suspended=false;focused=document.hasFocus();apply();});
 setInterval(save,5000);
 // 2026-10-11: 들어오자마자 배경음악 재생 시도 (홈 화면 설치 앱·소리 허락된 브라우저는 바로 나옴)
 // 폰 브라우저가 막으면 조용히 기다렸다가 첫 터치 때 시작 (첫 화면의 "화면을 눌러 시작해요"와 같은 터치)
 window.tryNollpicMusicAutoplay=()=>{if(!enabled()||document.hidden||!audio.paused)return;interacted=true;focused=true;apply();};
 window.tryNollpicMusicAutoplay();
 window.addEventListener('load',()=>window.tryNollpicMusicAutoplay(),{once:true});
})();

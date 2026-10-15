(() => {
 const key='nollpic_sound_settings';
 // One-time increase requested by the user; later slider adjustments remain saved.
 try {
   if(localStorage.getItem('nollpic_louder_audio_v107')!=='1') {
     const saved=JSON.parse(localStorage.getItem(key)||'{}');
     localStorage.setItem(key,JSON.stringify({...saved,music:true,effects:true,musicVolume:40,effectsVolume:Math.max(90,Number(saved.effectsVolume)||0)}));
     localStorage.setItem('nollpic_louder_audio_v107','1');
   }
 } catch(_) {}

 try {
   if(localStorage.getItem('nollpic_bgm_default40_v118')!=='1') {
     const saved=JSON.parse(localStorage.getItem(key)||'{}');
     localStorage.setItem(key,JSON.stringify({...saved,musicVolume:40}));
     localStorage.setItem('nollpic_bgm_default40_v118','1');
   }
 } catch(_) {}
 const read=()=>{try{return {...{music:true,effects:true,musicVolume:40,effectsVolume:90},...JSON.parse(localStorage.getItem(key)||'{}')};}catch(_){return {music:true,effects:true};}};
 const controls=[];
 const speaker='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>';
 function update(){const state=read();controls.forEach(({button,music,effects,sliders})=>{button.classList.toggle('sound-muted',!state.music&&!state.effects);music.textContent=state.music?'배경 음악 끄기':'배경 음악 켜기';effects.textContent=state.effects?'버튼음 끄기':'버튼음 켜기';music.setAttribute('aria-pressed',String(state.music));effects.setAttribute('aria-pressed',String(state.effects));sliders.forEach(({input,output,setting})=>{input.value=state[setting];output.textContent=state[setting]+'%';});});}
 function apply(){const state=read();if(typeof window.applyNollpicSoundSettings==='function')window.applyNollpicSoundSettings();else document.querySelectorAll('audio[data-nollpic-bgm]').forEach(audio=>{audio.volume=Math.max(0,Math.min(100,state.musicVolume))/100;audio.muted=!state.music;if(!state.music||document.hidden||!document.hasFocus())audio.pause();});window.dispatchEvent(new CustomEvent('nollpic-sound-change',{detail:state}));if(window.parent!==window){try{window.parent.applyNollpicSoundSettings?.();}catch(_) {}}if(window.parent!==window)window.parent.postMessage({type:'nollpic-sound-change',settings:state},location.origin);update();}
 function add(host){if(!host)return;const wrap=document.createElement('div');wrap.className='sound-settings';const button=document.createElement('button');button.type='button';button.className='sound-settings-toggle';button.innerHTML=speaker;button.setAttribute('aria-label','소리 설정');button.setAttribute('aria-expanded','false');const menu=document.createElement('div');menu.className='sound-settings-menu';menu.hidden=true;const music=document.createElement('button'),effects=document.createElement('button');[music,effects].forEach(el=>{el.type='button';menu.append(el);});button.addEventListener('click',()=>{window.getNollpicAudioContext?.();document.querySelectorAll('.sound-settings-menu').forEach(el=>{if(el!==menu)el.hidden=true;});menu.hidden=!menu.hidden;button.setAttribute('aria-expanded',String(!menu.hidden));update();});[[music,'music'],[effects,'effects']].forEach(([el,setting])=>el.addEventListener('click',()=>{const state=read();state[setting]=!state[setting];localStorage.setItem(key,JSON.stringify(state));apply();if(setting==='effects'&&state.effects)window.playNollpicSound?.('demo-click');}));const sliders=[];
 [['배경 음악 음량','musicVolume'],['버튼음 음량','effectsVolume']].forEach(([title,setting])=>{
 const label=document.createElement('label');label.className='sound-volume-control';
 const caption=document.createElement('span');caption.textContent=title;
 const output=document.createElement('output');const input=document.createElement('input');input.type='range';input.min='0';input.max='100';input.step='1';input.setAttribute('aria-label',title);
 input.addEventListener('input',()=>{const state=read();state[setting]=Number(input.value);localStorage.setItem(key,JSON.stringify(state));apply();});
 input.addEventListener('change',()=>{if(setting==='effectsVolume')window.playNollpicSound?.('demo-click');});
 label.append(caption,output,input);menu.append(label);sliders.push({input,output,setting});
 });
 const credit=document.createElement('p');credit.className='sound-music-credit';credit.innerHTML='BGM: <a href="https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400037" target="_blank" rel="noopener">Carefree</a><br>Kevin MacLeod · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a><br>원곡 사용 · 재생 음량 조절';menu.append(credit);wrap.append(button,menu);host.append(wrap);controls.push({button,music,effects,sliders});}
 if(document.querySelector('.app-device') && !document.querySelector('.tests-sticky-header')) {
   const host=document.createElement('div');host.className='app-sound-control';add(host);
   const device=document.querySelector('.app-device');
   function placeControl() {
     const page=device.querySelector('.page.active');
     if(!page)return;
     document.querySelectorAll('.sound-settings-menu').forEach(menu=>menu.hidden=true);
     if(page.id==='page-11'||page.querySelector(':scope > .page-body > iframe')) { host.hidden=true;return; }   // 챌린지: 소리는 하단 메뉴 '설정' 안 (2026-10-11)
     host.hidden=false;host.classList.remove('sound-standalone');
     const content=page.querySelector('.page-body');if(!content)return;
     let row=page.querySelector('.mission-topbar,.child-brand-row');
     if(row?.classList.contains('mission-topbar')) {
       let actions=row.querySelector('.header-sound-actions');
       if(!actions){actions=document.createElement('div');actions.className='header-sound-actions';const help=row.querySelector('.mission-help');if(help)actions.append(help);row.append(actions);}
       actions.append(host);
     } else if(row) row.append(host);
     else if(page.id==='page-6') {
       const tabs=page.querySelector('.result-view-tabs');let toolbar=page.querySelector('.result-sound-toolbar');
       if(!toolbar&&tabs){toolbar=document.createElement('div');toolbar.className='result-sound-toolbar';tabs.before(toolbar);toolbar.append(tabs);}
       if(toolbar)toolbar.append(host);
     } else {
       const header=page.querySelector(':scope > .page-header,.scrolling-sound-header');
       if(header){content.prepend(header);header.classList.add('scrolling-sound-header');header.append(host);}
       else {const title=page.querySelector('.play-header');if(title){title.classList.add('sound-anchor');host.classList.add('sound-standalone');title.append(host);}else{content.classList.add('sound-anchor');host.classList.add('sound-standalone');content.append(host);}}
     }
   }
   const help=document.querySelector('.mission-help');
   if(help)help.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 8a3.5 3.5 0 0 1 7 .3c0 2.2-3.5 2.5-3.5 5"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/></svg>';
   device.querySelectorAll(':scope > .page').forEach(page=>new MutationObserver(placeControl).observe(page,{attributes:true,attributeFilter:['class']}));
   placeControl();
   document.addEventListener('DOMContentLoaded',placeControl);

 }
 document.querySelectorAll('.rn-intro .intro-top').forEach(add);
 const testHeader=document.querySelector('.tests-sticky-header'),testBody=document.querySelector('.test-body');
 if(testHeader&&testBody){testBody.prepend(testHeader);document.body.classList.add('sound-scroll-tests');add(testHeader);}
 if(!document.querySelector('.app-device')&&!testHeader){const toolHeader=document.querySelector('body > .header');if(toolHeader){document.body.classList.add('sound-tool-page');add(toolHeader);}}

 document.addEventListener('click',event=>{if(!event.target.closest('.sound-settings'))document.querySelectorAll('.sound-settings-menu').forEach(el=>el.hidden=true);});
 document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('.sound-settings-menu').forEach(el=>el.hidden=true);});
 window.addEventListener('storage',update);update();
})();

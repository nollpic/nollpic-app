(function(){
 'use strict';
 const config=Object.values(window.NollpicGameIntroConfig).find(c=>location.pathname.endsWith('/'+c.file));
 if(!config)return;
 const make=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text)n.textContent=text;return n;};
 const options=()=>{const d=make('details','np-options'),s=make('summary','','단계 선택 · 연습 · 이어하기');d.append(s);return d;};
 function normalizeStart(button){const sync=()=>{if(!button.disabled&&button.textContent!=='게임 시작하기 →')button.textContent='게임 시작하기 →';};sync();new MutationObserver(sync).observe(button,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['disabled']});}
 if(config.modern){
  const root=document.getElementById('gm-intro'),start=document.getElementById(config.startId),settings=options(),preserved=make('div');
  preserved.hidden=true;preserved.dataset.introPreserved='';
  [...root.childNodes].forEach(n=>preserved.append(n));
  root.classList.add('np-intro');root.setAttribute('aria-labelledby','np-title');
  const content=make('div');content.dataset.introContent='';root.append(content,start,settings,preserved);
  ['.gm-difficulties','#w-stage-choices','#a-stage-choices','#w-recover','#a-recover','#gm-practice','#w-sync'].forEach(sel=>{const n=preserved.querySelector(sel);if(n)settings.append(n);});
  const header=document.querySelector('.gm-header');let number=header.querySelector('.np-game-number');if(!number){number=make('span','np-game-number');header.append(number);}
  const intro=NollpicGameIntro.mount({root,settings,config});
  // The framework inserts its existing controls after this presentation mounts.
  new MutationObserver(()=>{const controls=root.querySelector(':scope > .gm-session-controls');if(controls)settings.prepend(controls);}).observe(root,{childList:true});
  root.addEventListener('change',()=>{const selected=root.querySelector('[name="difficulty"]:checked');if(selected)intro.updateStage(Number(selected.value));});
  normalizeStart(start);
  return;
 }
 // Legacy engines keep their existing DOM, handlers, timers and result overlays.
 // This launch surface delegates the single start action to the original button.
 const launcher=make('section','np-launch'),header=make('header','np-launch-header'),back=make('button','np-back','← 돌아가기'),number=make('span','np-game-number',config.displayNumber);
 back.type='button';back.addEventListener('click',()=>{const original=document.querySelector('.back,.back-btn,.icon-btn[aria-label="뒤로"]');if(original)original.click();else history.back();});header.append(back,number);
 const root=make('div','np-intro'),content=make('div'),start=make('button','','게임 시작하기 →'),settings=options();
 content.dataset.introContent='';start.id='np-start';start.type='button';root.append(content,start,settings);launcher.append(header,root);document.body.append(launcher);
 const intro=NollpicGameIntro.mount({root,settings,config});
 const originals=[...document.body.children].filter(n=>n!==launcher&&!['SCRIPT','STYLE','LINK'].includes(n.tagName));
 const inert=originals.map(n=>[n,n.inert]);inert.forEach(([n])=>n.inert=true);
 const choices=[...document.querySelectorAll('.tabs [data-level],.level-strip [data-mode],.mode-row [data-mode]')];
 const choiceGroup=make('div','np-choice-group');settings.append(choiceGroup);
 function updateDifficulty(){
  const active=choices.find(n=>n.classList.contains('active'));
  const mode=active?.dataset.mode;
  const selected=active?.dataset.level||({easy:1,middle:2,hard:3})[mode];
  const read=document.querySelector('#levelNumber,#levelText,#level,#lv,#round');
  const value=Number(selected)||Number((read?.textContent||'').match(/\d+/)?.[0])||1;
  intro.updateStage(value);
  choiceGroup.querySelectorAll('button').forEach((n,i)=>n.setAttribute('aria-pressed',String(choices[i]===active)));
 }
 choices.forEach(original=>{const b=make('button','',original.textContent.trim());b.type='button';b.addEventListener('click',()=>{original.click();updateDifficulty();});choiceGroup.append(b);});
 if(!choices.length)settings.hidden=true;
 updateDifficulty();window.addEventListener('load',updateDifficulty,{once:true});
 start.addEventListener('click',()=>{launcher.remove();inert.forEach(([n,previous])=>n.inert=previous);const original=config.startId&&document.getElementById(config.startId);if(original)original.click();window.scrollTo(0,0);},{once:true});
 // Reuse the equipped character; this path only reads the active child's appearance.
 (async()=>{try{const snapshot=await NollpicGameAvatar.capture();await NollpicGameAvatar.mount(snapshot,[root.querySelector('[data-avatar]')]);}catch(_){const host=root.querySelector('[data-avatar]'),img=make('img');img.src='/images/Character/fitted/nollpic_base.png';img.alt='기본 놀픽 캐릭터';img.className='np-fallback-avatar';host.replaceChildren(img);}})();
})();

(function(){
 'use strict';
 const drawings={
 memory:'<path d="M9 10h10V8a5 5 0 0 1 10 0v2h10v10h2a5 5 0 0 1 0 10h-2v10H29v-2a5 5 0 0 0-10 0v2H9V30h2a5 5 0 0 0 0-10H9Z" fill="#b692ee"/>',
 reaction:'<path d="m28 4-19 24h13l-3 16 20-25H26Z" fill="#ffd24e"/>',
 visual:'<path d="m30 30 12 12" fill="none" stroke-width="8"/><circle cx="21" cy="21" r="15" fill="#74cda6"/><circle cx="21" cy="21" r="10" fill="#fffbed"/>',
 inhibition:'<path d="M14 25V13a3 3 0 0 1 6 0v10V8a3 3 0 0 1 6 0v15V10a3 3 0 0 1 6 0v14V16a3 3 0 0 1 6 0v15c0 9-5 13-12 13-6 0-10-3-13-8L6 25a3 3 0 0 1 5-3l3 5Z" fill="#f3a7b9"/>',
 target:'<circle cx="24" cy="24" r="18" fill="#f5a8b8"/><circle cx="24" cy="24" r="11" fill="#fffbed"/><circle cx="24" cy="24" r="4" fill="#ffb45e"/><path d="m24 24 17-17m-8 1 8-1-1 8" fill="none"/>',
 level:'<rect x="6" y="26" width="8" height="16" rx="2" fill="#bda0e7"/><rect x="20" y="17" width="8" height="25" rx="2" fill="#bda0e7"/><rect x="34" y="6" width="8" height="36" rx="2" fill="#bda0e7"/>',
 clock:'<circle cx="24" cy="24" r="18" fill="#fffbed"/><path d="M24 11v14l10 5" fill="none"/>',
 bulb:'<circle cx="24" cy="19" r="12" fill="#ffd66e"/><rect x="18" y="31" width="12" height="8" rx="5" fill="#91d0b2"/><path d="M20 44h8M24 2v3M5 18h4m30 0h4" fill="none"/>'};
 function element(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
 function icon(name){const n=element('span','np-icon np-icon-'+name);n.setAttribute('aria-hidden','true');n.innerHTML='<svg viewBox="0 0 48 48"><g stroke="#293344" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">'+drawings[name]+'</g></svg>';return n;}
 function mount({root,settings,config,stage=1}){
  const content=root.querySelector('[data-intro-content]'),banner=element('section','np-banner'),heading=element('div','np-banner-heading'),title=element('h1','np-title',config.title);
  banner.dataset.theme=config.theme;title.id='np-title';heading.append(title,element('p','np-mission',config.mission));
  const scene=element('div','np-scene'),art=element('img','np-scene-object'),artPath=config.artwork.src.replace(/^\/minigames\//,config.modern?'../':'minigames/');art.src=new URL(artPath,document.baseURI).href;art.alt=config.artwork.alt;scene.append(art);
  if(config.character==='equipped'){const avatar=element('div','gm-avatar np-scene-avatar');avatar.dataset.avatar='';scene.append(avatar);}
  banner.append(heading,scene);
  const cards=element('dl','np-info');
  function card(label,value,symbol){const entry=element('div','np-info-card'),copy=element('div','np-info-copy'),node=element('dd','',value);copy.append(element('dt','',label),node);entry.append(icon(symbol),copy);cards.append(entry);return node;}
  card('키우는 능력',config.ability,({'기억력':'memory','관찰력':'visual','충동조절':'inhibition','순발력':'reaction'})[config.ability]||'target');const difficulty=card('현재 난이도','','level');difficulty.id='np-difficulty';
  const duration=card('예상 시간',config.verifiedDuration||'—','clock');if(!config.verifiedDuration)duration.setAttribute('aria-label','검증된 예상 시간 정보 없음');
  const rules=element('div','np-rules np-rules-placeholder');rules.setAttribute('aria-hidden','true');
  content.replaceChildren(banner,cards,rules);document.querySelector('.np-game-number').textContent=config.displayNumber;
  // Move the actual controls, preserving values, listeners and game behavior.
  const controls=root.querySelector('.gm-session-controls');if(controls)settings.prepend(controls);
  function updateStage(value){const label=config.difficultyLabels[value]||(Number.isInteger(value)&&value>0?'단계 '+value:'—');difficulty.textContent=label;difficulty.setAttribute('aria-label',label==='—'?'난이도 정보 없음':value+'단계 난이도: '+label);}
  updateStage(stage);return{updateStage};
 }
 window.NollpicGameIntro={mount};
})();

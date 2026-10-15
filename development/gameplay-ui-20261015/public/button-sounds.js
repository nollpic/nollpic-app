(() => {
 let context=null;
 function clickSound(){
  let settings={};try{settings=JSON.parse(localStorage.getItem('nollpic_sound_settings')||'{}');}catch(_){}
  if(settings.effects===false)return;
  const level=Math.max(0,Math.min(100,Number(settings.effectsVolume ?? 90)))/100;if(!level)return;
  if(typeof window.playNollpicSound==='function'){window.playNollpicSound('demo-click');return;}
  const AudioContextClass=window.AudioContext||window.webkitAudioContext;if(!AudioContextClass)return;
  context ||= new AudioContextClass();if(context.state==='suspended')context.resume().catch(()=>{});
  const tone=(frequency,offset,duration,volume,type)=>{const oscillator=context.createOscillator(),gain=context.createGain(),start=context.currentTime+offset;oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,start);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(Math.max(.0001,volume*9.6*level),start+.012);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);oscillator.connect(gain);gain.connect(context.destination);oscillator.start(start);oscillator.stop(start+duration+.02);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};};
  tone(700,0,.045,.045,'triangle');tone(420,.025,.035,.03,'sine');
 }
 document.addEventListener('click',event=>{
  const target=event.target.closest?.('button,[role="button"],[onclick],a[href]');
  if(!target||target.disabled||target.getAttribute('aria-disabled')==='true'||target.closest('[inert]'))return;
  // Gameplay targets already play their correct/wrong feedback.
  if(target.matches('.schulte-cell,.memory-card,.visual-cell,.flanker-choice,.reaction-circle')||target.closest('.sound-settings-menu'))return;
  clickSound();
 },{capture:true});
})();

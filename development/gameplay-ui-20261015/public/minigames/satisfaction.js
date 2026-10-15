(function(){
 'use strict';
 const labels=['재미없었어','조금 아쉬웠어','보통이야','재미있었어','정말 재미있었어'],reasons={too_easy:'너무 쉬워요',too_hard:'너무 어려워요',again:'또 하고 싶어요',not_fun:'재미없어요'};
 async function show({host,service,context,gameId,gameVersion,valid}){
  host.replaceChildren();const key=['nollpic','emulator-feedback',context.uid,context.childId,gameId,gameVersion].join(':');let pending;try{pending=JSON.parse(localStorage.getItem(key)||'null');}catch(_){}
  if(pending){if(pending.status==='pending'){try{await service.submitFeedback(pending.data);localStorage.setItem(key,JSON.stringify({status:'saved'}));}catch(_){}}return;}
  let status;try{status=await service.feedbackStatus(gameId,gameVersion);}catch(_){return;}
  if(!valid()||!status.prompt)return;
  host.className='w-rating';host.innerHTML='<h2>이번 게임은 얼마나 재미있었어?</h2><p>안 골라도 괜찮아요. 기록과 보상에는 영향이 없어요.</p><fieldset><legend>별점 · 선택 사항</legend><div class="rating-stars">'+labels.map((x,i)=>`<label><input type="radio" name="rating" value="${i+1}" aria-label="${i+1}점 ${x}"><span>${i+1}★</span></label>`).join('')+'</div><output></output></fieldset><fieldset><legend>이유 · 여러 개 선택 가능</legend>'+Object.entries(reasons).map(([k,v])=>`<label><input type="checkbox" name="reason" value="${k}">${v}</label>`).join('')+'</fieldset><button class="gm-primary" data-submit>마음 전하기</button><button class="gm-secondary" data-skip>건너뛰기</button><p data-message role="status"></p>';
  host.onchange=()=>{host.querySelector('output').textContent=labels[Number(host.querySelector('[name=rating]:checked')?.value)-1]||'';};
  let busy=false;
  async function send(skip){if(busy||!valid())return;busy=true;const data={gameId,gameVersion,skip,rating:skip?null:Number(host.querySelector('[name=rating]:checked')?.value)||null,reasons:skip?[]:[...host.querySelectorAll('[name=reason]:checked')].map(x=>x.value)};try{localStorage.setItem(key,JSON.stringify({status:'pending',data}));}catch(_){}
   host.querySelectorAll('button,input').forEach(x=>x.disabled=true);
   try{await service.submitFeedback(data);if(!valid())return;localStorage.setItem(key,JSON.stringify({status:'saved'}));host.replaceChildren(Object.assign(document.createElement('p'),{textContent:skip?'건너뛰었어요. 다음 모험에서 만나요!':'알려줘서 고마워요!'}));}catch(_){host.querySelector('[data-message]').textContent='평가는 나중에 다시 저장할게요. 게임 완료 기록은 그대로예요.';}
  }
  host.querySelector('[data-submit]').onclick=()=>send(false);host.querySelector('[data-skip]').onclick=()=>send(true);
 }
 window.NollpicSatisfaction={show};
})();

(function(){
  "use strict";
  const script=document.currentScript;
  const step=Number(script?.dataset.step||0);
  const style=document.createElement("style");
  style.textContent=`
    html,body{margin:0!important;width:100%!important;max-width:100%!important;overflow-x:hidden!important}
    body{border:0!important;border-radius:0!important;box-shadow:none!important}
    body>.phone,body>.app,body>.app-device{
      width:min(100%,420px)!important;
      max-width:420px!important;
      border:0!important;
      border-radius:0!important;
      box-shadow:none!important;
    }
    .nollpic-common-intro{animation:nollpicIntroIn .42s ease both}
    .nollpic-guide-visual{animation:none!important;transform:none!important}
    .nollpic-final-actions{display:grid!important;grid-template-columns:1fr 1fr;gap:10px;width:100%;margin-top:10px}
    .nollpic-final-actions button{width:100%!important;height:50px!important;margin:0!important;border:0!important;border-radius:16px!important;font-weight:950!important}
    .nollpic-final-actions .nollpic-reward{grid-column:1/-1;background:#ff6818!important;color:#fff!important;box-shadow:0 5px 0 #d7520d!important;display:block!important}
    .nollpic-final-actions .nollpic-retry{background:#fff0e7!important;color:#ed5e12!important;box-shadow:0 4px 0 #ffd4bd!important}
    .nollpic-final-actions .nollpic-home{background:#eef2f7!important;color:#3e4d67!important;box-shadow:0 4px 0 #d8e0e9!important}
    .nollpic-hide-original{display:none!important}
    @keyframes nollpicIntroIn{from{opacity:0;transform:translateY(18px) scale(.96)}to{opacity:1;transform:none}}
  `;
  document.head.appendChild(style);

  function visible(el){if(!el)return false;const s=getComputedStyle(el);return s.display!=="none"&&s.visibility!=="hidden"&&el.getClientRects().length>0}
  function addIntro(){
    const buttons=[...document.querySelectorAll("button")];
    const start=buttons.find(b=>visible(b)&&/^(놀이 시작|시작하기|게임 시작|시작)$/.test(b.textContent.trim()));
    if(!start)return;
    const panel=start.closest(".panel,.overlay-card,.modal-card,.guide-card,.intro-card")||start.parentElement;
    if(!panel||panel.classList.contains("nollpic-common-intro"))return;
    panel.classList.add("nollpic-common-intro");
    const area=start.closest("main,.app,body")||document.body;
    const visual=area.querySelector(".example,.preview,[class*='example'],[class*='preview'],.hero,img");
    if(visual){visual.classList.remove("nollpic-guide-visual");visual.style.animation="none";visual.style.transform="none"}
  }
  // 놀이 마지막 화면의 제목·문구를 30일 챌린지 홈 "오늘의 평가" 카드로 보냄 (놀이가 직접 보낸 결과가 있으면 그게 우선)
  function reportFinalSummary(panel){
    if(!step||!panel)return;
    const pick=(sel)=>{const el=panel.querySelector(sel);return el?(el.innerText||el.textContent).replace(/\s+/g," ").trim():""};
    const title=pick("#overlayTitle,#title,.title,h2,h3");
    const text=pick("#overlayText,#text,.text,p");
    let summary=[title,text].filter(Boolean).join(" ").replace(/🎁?\s*\d+\s*(포인트|P)\s*(받기|받았어요)?/g,"").trim();
    if(summary.length>70){const cut=summary.slice(0,70);const end=Math.max(cut.lastIndexOf("요."),cut.lastIndexOf("!"),cut.lastIndexOf("요"));summary=end>20?cut.slice(0,end+1):cut+"…"}
    if(!summary)return;
    try{parent?.reportChallengeResult?.(step,{summary,source:"auto"})}catch(e){}
  }
  function goHome(){try{if(parent&&parent!==window&&typeof parent.prevPage==="function"){parent.prevPage(11);return}}catch(e){}location.href="/?page=challenge"}
  function ensureFinal(){
    if(document.querySelector(".nollpic-final-actions"))return;
    const reward=[...document.querySelectorAll("#rewardBtn,.reward,[class*='reward']")].find(visible);
    const buttons=[...document.querySelectorAll("button")].filter(visible);
    const original=buttons.find(b=>/^(챌린지로 돌아가기|오늘은 여기까지|처음으로 돌아가기)$/.test(b.textContent.trim()));
    const finalText=(original?.closest(".panel,.overlay-card,.modal-card,.result-card")||original?.parentElement)?.textContent||"";
    if(!reward&&(!original||!/완료|성공|미션끝|끝!/.test(finalText)))return;
    const panel=(reward||original).closest(".panel,.overlay-card,.modal-card,.result-card")||(reward||original).parentElement;
    if(!panel)return;
    const actions=document.createElement("div");actions.className="nollpic-final-actions";
    let rewardButton=reward;
    if(rewardButton){rewardButton.classList.add("nollpic-reward");if(!rewardButton.disabled)rewardButton.textContent="🎁 200포인트 받기"}
    else{rewardButton=document.createElement("button");rewardButton.className="nollpic-reward";rewardButton.textContent="🎁 200포인트 받기";rewardButton.onclick=()=>{try{parent?.claimChallengeStepReward?.(step)}catch(e){}rewardButton.textContent="200포인트 받았어요";rewardButton.disabled=true}}
    const retry=document.createElement("button");retry.className="nollpic-retry";retry.textContent="게임 다시 하기";retry.onclick=()=>location.reload();
    const home=document.createElement("button");home.className="nollpic-home";home.textContent="처음으로 돌아가기";home.onclick=goHome;
    if(original)original.classList.add("nollpic-hide-original");
    actions.append(rewardButton,retry,home);panel.appendChild(actions);panel.classList.add("nollpic-common-intro");
    reportFinalSummary(panel);
  }
  function scan(){addIntro();ensureFinal()}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{scan();new MutationObserver(scan).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class","style"]})});
  else{scan();new MutationObserver(scan).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class","style"]})}
})();

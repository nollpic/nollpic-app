(() => {
  const data = [
    {id:'schulte-countdown-overlay',key:'schulte',name:'첫 번째 미션 · 끈기력',area:'끈기력',pro:'집중 유지력',color:'#dff3e7',description:'흩어진 숫자를 1부터 차례대로 찾으며, 마지막까지 집중을 이어가는 모습을 살펴봐요.',example:'해야 할 일을 순서대로 끝까지 해낼 때 쓰는 힘이에요.',steps:['숫자가 어디에 있는지 살펴봐요.','1부터 차례대로 숫자를 눌러요.','마지막 숫자까지 빠르고 정확하게 찾아요.']},
    {id:'memory-popup',key:'memory',name:'두 번째 미션 · 기억력',area:'기억력',pro:'작업 기억력',color:'#ede3ff',description:'잠깐 본 카드의 위치를 기억하고 다시 찾는 모습을 살펴봐요.',example:'들은 설명을 기억하고 행동으로 옮길 때 쓰는 힘이에요.',steps:['3초 동안 표시된 카드 위치를 기억해요.','카드가 가려지면 기억한 위치를 눌러요.','표시됐던 위치를 모두 찾아요.']},
    {id:'reaction-popup',key:'reaction',name:'세 번째 미션 · 순발력',area:'순발력',pro:'반응 속도',color:'#fff0be',description:'신호를 구별하고 알맞게 빠르게 반응하는 모습을 살펴봐요.',example:'놀이에서 신호에 맞춰 움직일 때 쓰는 힘이에요.',steps:['나타나는 원의 색을 살펴봐요.','초록 원이면 빠르게 눌러요.','빨간 원이면 누르지 않고 기다려요.']},
    {id:'visual-search-popup',key:'visual',name:'네 번째 미션 · 관찰력',area:'관찰력',pro:'시각 탐색',color:'#dff3e7',description:'여러 그림 속에서 필요한 단서를 찾아내는 모습을 살펴봐요.',example:'여러 물건 사이에서 필요한 물건을 찾을 때 쓰는 힘이에요.',steps:['찾아야 할 목표 동물을 확인해요.','여러 그림 중 같은 동물을 눌러요.','제한시간 안에 목표 동물을 모두 찾아요.']},
    {id:'flanker-popup',key:'flanker',name:'다섯 번째 미션 · 충동조절',area:'충동조절',pro:'충동 억제',color:'#ffe2eb',description:'주변의 방해에 휩쓸리지 않고 목표에 맞게 선택하는 모습을 살펴봐요.',example:'바로 행동하기 전에 규칙을 떠올리고 선택할 때 쓰는 힘이에요.',steps:['가운데 있는 목표 그림을 기억해요.','주변 그림에 헷갈리지 않도록 살펴봐요.','선택지에서 기억한 목표를 골라요.']}
  ];
  for (const [index, item] of data.entries()) {
    const overlay=document.getElementById(item.id);
    if(!overlay) continue;
    overlay.classList.add('mission-intro');
    overlay.style.setProperty('--mission-tint',item.color);
    overlay.dataset.step='overview';
    const content=overlay.querySelector('.popup-content');
    const how=document.createElement('div');how.className='intro-how';how.hidden=true;
    while(content.firstChild) how.append(content.firstChild);
    const oldTitle=how.querySelector('h3'); if(oldTitle) oldTitle.remove();
    const oldDescription=how.querySelector(':scope > p'); if(oldDescription) oldDescription.remove();
    const steps=document.createElement('ol');steps.className='intro-steps';
    item.steps.forEach(text=>{const li=document.createElement('li');li.textContent=text;steps.append(li);});
    const demo=how.firstElementChild; if(demo) demo.after(steps);
    // Match the visual-search example to the actual animal target rule.
    if(item.key==='visual') how.querySelectorAll('.visual-target').forEach(el=>{el.textContent='🐶';});
    content.innerHTML=`<div class="intro-top"><button type="button" class="intro-back" aria-label="이전 화면">❮</button><span>미션 ${index+1} / 5</span><img src="../images/nollpic-wordmark-en.png" alt="Nollpic"></div><header class="intro-heading"><span class="intro-area">${item.area} · ${item.pro}</span><h2>${item.name}</h2></header><div class="intro-overview"><div class="intro-mascot"><img src="../images/mission-tiger-round-eyes.png" alt="미션을 안내하는 호랑이 친구"><span>같이 해볼까?</span></div><section class="intro-benefit"><h3>이런 힘을 살펴봐요</h3><p>${item.description}</p><div class="intro-everyday"><strong>일상에서는</strong><p>${item.example}</p></div></section><button type="button" class="intro-show-how">놀이 방법 보기 <span aria-hidden="true">→</span></button></div>`;
    content.append(how);
    const top = content.querySelector('.intro-top');
    top.querySelector('span').remove();
    top.querySelector('img').remove();
    const progress = document.createElement('div');
    progress.className = 'intro-progress';
    progress.setAttribute('role', 'progressbar');
    progress.setAttribute('aria-label', '미션 진행');
    progress.setAttribute('aria-valuemin', '0');
    progress.setAttribute('aria-valuemax', '5');
    progress.setAttribute('aria-valuenow', String(index + 1));
    progress.setAttribute('aria-valuetext', `5개 미션 중 ${index + 1}번째`);
    progress.innerHTML = data.map((_, step) => `<span class="${step < index ? 'done' : step === index ? 'current' : ''}" aria-hidden="true"></span>`).join('');
    const tags = document.createElement('div');
    tags.className = 'intro-tags';
    [item.pro.replaceAll(' ', ''), item.area].forEach(text => {
      const tag = document.createElement('span');
      tag.textContent = text;
      tags.append(tag);
    });
    top.append(tags);
    top.after(progress);
    content.querySelector('.intro-area').remove();
    if (item.key === 'schulte') {
      overlay.classList.add('turtle-intro');
      const mascot = content.querySelector('.intro-mascot img');
      mascot.src = '../images/nollpic-turtle-v4.png';
      mascot.alt = '끈기력 놀이를 안내하는 거북이 친구';
      content.querySelector('.intro-mascot span').textContent = '끝까지 함께 찾아볼까?';
      content.querySelector('.intro-benefit h3').textContent = '끝까지 집중하는 힘, 끈기력';
      const guide = document.createElement('div');
      guide.className = 'turtle-rule-guide';
      guide.innerHTML = '<img src="../images/nollpic-turtle-v4.png" alt="거북이 안내 친구"><p>하나씩 차례대로,<br><strong>끝까지 찾아볼까?</strong></p>';
      how.prepend(guide);
      const startButton = content.querySelector('.intro-show-how');
      startButton.textContent = '게임 시작하기';
      const countdown = how.querySelector('.countdown-display');
      if (countdown) startButton.before(countdown);
    }
    function setStep(step){
      // Memory combines the ability introduction and instructions in one view.
      if (item.key !== 'schulte') step = 'how';
      delete overlay.dataset.starting;
      content.querySelector('.intro-show-how').disabled = false;
      if (item.key === 'schulte') content.querySelector('.countdown-display').style.display = 'none';
      overlay.dataset.step=step;
      content.querySelector('.intro-overview').hidden=step!=='overview';
      how.hidden=step!=='how';
      content.scrollTop=0;
    }
    setStep('overview');
    overlay.resetMissionIntro=()=>setStep('overview');
    content.querySelector('.intro-show-how').addEventListener('click',()=>{
      if (item.key === 'schulte') {
        if (overlay.dataset.starting === 'true') return;
        overlay.dataset.starting = 'true';
        content.querySelector('.intro-show-how').disabled = true;
        window.runSchulteCountdown();
        return;
      }
      setStep('how');how.querySelector('button')?.focus({preventScroll:true});
    });
    content.querySelector('.intro-back').addEventListener('click',()=>{
      const counting=[...content.querySelectorAll('.countdown-display')].some(el=>getComputedStyle(el).display!=='none');
      if(counting)return;
      window.stopTestIntroVoice?.();
      if(overlay.dataset.step==='how' && item.key === 'schulte'){setStep('overview');content.querySelector('.intro-show-how').focus({preventScroll:true});}
      else window.goBackFromTests?.();
    });
    let wasActive=overlay.classList.contains('active');
    new MutationObserver(()=>{const active=overlay.classList.contains('active');if(active&&!wasActive){setStep('overview');}wasActive=active;}).observe(overlay,{attributes:true,attributeFilter:['class']});
  }
})();

/* 미션 준비 화면 리뉴얼 (2026-10-08)
   mission-intro.js가 만든 화면 위에 덧씌움: 캐릭터가 보드를 들고 고개를 내밀고, 보드 안 예시는 "보기"로 표시,
   단계 목록 대신 한 줄 규칙, "이 미션으로 알아보는 힘" 카드. 놀이·점수 코드는 건드리지 않음 */
(() => {
  const TIGER = '../images/mission-tiger-round-eyes.png';
  const META = {
    'schulte-countdown-overlay': { emoji: '🎯', area: '끈기력', pro: '집중 유지력', rule: '1부터 <b>차례대로</b> 빨리 눌러요', bubble: '하나씩 차례대로,<br>끝까지 찾아볼까?', mascot: '../images/nollpic-turtle-v4.png', example: '흩어진 숫자를 끝까지 차례대로 찾으며, 한 가지 일에 집중을 이어가는 힘이에요. 숙제나 정리를 끝까지 해낼 때 써요.', hand: true },
    'memory-popup':        { emoji: '🧩', area: '기억력',   pro: '작업 기억력', rule: '반짝인 카드 자리를 <b>기억했다가</b> 눌러요', bubble: '반짝이는 카드 자리<br>잘 보고 꼭 기억해!', mascot: '../images/nollpic-elephant-gray-ear-flap-v1.gif', example: '잠깐 본 자리를 머릿속에 담아 두었다가 꺼내 쓰는 힘이에요. 들은 설명대로 차근차근 해낼 때 써요.' },
    'reaction-popup':      { emoji: '⚡', area: '순발력',   pro: '반응 속도',   rule: '초록은 <b>톡!</b> 빨강은 <b>꾹</b> 참아요', bubble: '초록이면 톡!<br>빨강이면 잠깐!', mascot: '../images/nollpic-rabbit-ear-fold-v1.gif', example: '신호를 보고 알맞게, 재빨리 움직이는 힘이에요. 놀이에서 신호에 맞춰 움직일 때 써요.' },
    'visual-search-popup': { emoji: '🔍', area: '관찰력',   pro: '시각 탐색',   rule: '목표 동물을 <b>모두</b> 찾아요', bubble: '어디 숨었지?<br>같이 찾자!', mascot: TIGER, example: '여러 그림 속에서 필요한 것을 꼼꼼히 찾아내는 힘이에요. 가방 속 준비물을 찾을 때도 써요.' },
    'flanker-popup':       { emoji: '✋', area: '충동조절', pro: '충동 억제',   rule: '<b>가운데</b> 그림만 보고 골라요', bubble: '옆 그림에<br>속지 마!', mascot: '../images/nollpic-kkuk-bear-full-v1.png', example: '주변에 휩쓸리지 않고 규칙대로 고르는 힘이에요. 하고 싶은 걸 잠깐 참고 차례를 기다릴 때 써요.' },
  };
  const BENEFIT_COPY = {
    'schulte-countdown-overlay': ['숫자를 순서대로 찾으며 목표 수행 중<br>집중을 유지하는 능력을 살펴봅니다.', '과제를 끝까지 수행할 때 활용됩니다.'],
    'memory-popup': ['잠시 기억한 위치 정보를 유지하고<br>다시 떠올리는 능력을 살펴봅니다.', '작업기억력은 일상에서 들은 말이나 본 정보를 잠시 기억하고, 이를 활용해 문제를 해결하거나 행동하는 능력이에요.'],
    'reaction-popup': ['갑작스러운 상황이나 변화하는 자극을 빠르게 인지하고, 적절한 행동을 신속하게 선택하고 실행하는 능력이에요.', '떨어지는 물건을 재빨리 잡거나 위험한 상황에서 빠르게 판단하고 대처할 때 사용되는 능력이에요.'],
    'visual-search-popup': ['여러 자극 속에서 목표를 구별하고<br>찾아내는 능력을 살펴봅니다.', '필요한 정보를 찾을 때 활용됩니다.'],
    'flanker-popup': ['방해 자극에 대한 반응을 억제하고<br>목표에 집중하는 능력을 살펴봅니다.', '규칙에 따라 행동할 때 활용됩니다.']
  };
  // 홈(page-2) 5가지 힘 목록과 같은 아이콘·바탕색
  const SVG = (inner) => `<svg viewBox="0 0 48 48" fill="none" stroke="#293344" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  const ICON = {
    '끈기력':   { bg: '#ffe3df', svg: SVG('<circle cx="24" cy="24" r="17" fill="#ff8c88"/><circle cx="24" cy="24" r="10" fill="#fffbed"/><circle cx="24" cy="24" r="3" fill="#ef655f"/><path d="M24 24 39 9m-7 1 7-1-1 7" fill="none"/>') },
    '기억력':   { bg: '#ece1ff', svg: SVG('<path d="M9 10h10V8a5 5 0 0 1 10 0v2h10v10h2a5 5 0 0 1 0 10h-2v10H29v-2a5 5 0 0 0-10 0v2H9V30h2a5 5 0 0 0 0-10H9Z" fill="#b692ee"/>') },
    '순발력':   { bg: '#fff0be', svg: SVG('<path d="m28 4-19 24h13l-3 16 20-25H26Z" fill="#ffd24e"/>') },
    '관찰력':   { bg: '#d8f5e6', svg: SVG('<path d="m30 30 12 12" fill="none" stroke-width="8"/><path d="m30 30 12 12" fill="none" stroke="#74cda6" stroke-width="3"/><circle cx="21" cy="21" r="15" fill="#74cda6"/><circle cx="21" cy="21" r="10" fill="#fffbed"/>') },
    '충동조절': { bg: '#ffe1e7', svg: SVG('<path d="M14 25V13a3 3 0 0 1 6 0v10V8a3 3 0 0 1 6 0v15V10a3 3 0 0 1 6 0v14V16a3 3 0 0 1 6 0v15c0 9-5 13-12 13-6 0-10-3-13-8L6 25a3 3 0 0 1 5-3l3 5Z" fill="#f3a7b9"/>') },
  };
  const ids = Object.keys(META);
  ['schulte-screen', 'memory-screen', 'reaction-screen', 'visual-search-screen', 'flanker-screen'].forEach((screenId, i) => {
    const badge = document.querySelector('#' + screenId + ' .badge-center > span');
    const m = META[ids[i]];
    if (badge) badge.innerHTML = ICON[m.area].svg + '<span>' + m.area + ' · ' + m.pro + '</span>';
  });

  ids.forEach((id, index) => {
    const overlay = document.getElementById(id);
    const m = META[id];
    if (!overlay || !overlay.classList.contains('mission-intro') || overlay.classList.contains('rn-intro')) return;
    overlay.classList.add('rn-intro');
    const content = overlay.querySelector('.popup-content');
    const how = content?.querySelector('.intro-how');
    const heading = content?.querySelector('.intro-heading');
    if (!content || !how || !heading) return;

    if (id === 'schulte-countdown-overlay') {
      const benefitHeading = content.querySelector('.intro-benefit h3');
      const icon = document.createElement('span');
      icon.className = 'rn-skill-ico';
      icon.setAttribute('aria-hidden', 'true');
      icon.style.background = ICON[m.area].bg;
      icon.innerHTML = ICON[m.area].svg;
      benefitHeading?.prepend(icon);
    }

    // 위 줄: 태그 2개 대신 "미션 n / 5"
    const top = content.querySelector('.intro-top');
    if (top && !top.querySelector('.rn-count')) {
      const count = document.createElement('span');
      count.className = 'rn-count';
      count.innerHTML = `미션 <b>${index + 1}</b> / ${ids.length}`;
      top.append(count);
    }

    // 영역 이름은 아래 "알아보는 힘" 카드에만 (위 칩은 같은 말이라 뺌)

    // 예시 보드: 캐릭터가 보드 뒤에서 고개를 내밀고, 예시는 "보기"
    const demo = how.querySelector(':scope > div[class$="-demo"]');
    const board = document.createElement('div');
    board.className = 'rn-board';
    board.innerHTML = `
      <div class="rn-peek" aria-hidden="true"><img src="${m.mascot}" alt=""><p class="rn-bubble">${m.bubble}</p></div>
      <div class="rn-board-card"><span class="rn-look">보기</span></div>`;
    if (demo) {
      demo.before(board);
      board.querySelector('.rn-board-card').append(demo);
      demo.setAttribute('aria-hidden', 'true');
      if (m.hand) {
        const hand = document.createElement('span');
        hand.className = 'rn-hand';
        hand.innerHTML = '<svg viewBox="0 0 48 56" aria-hidden="true"><path d="M12 31V8c0-7 10-7 10 0v15c3-5 9-3 9 2 4-4 9-1 8 4 6-2 9 2 8 7l-2 10c-1 6-6 9-12 9h-7c-5 0-8-3-11-7L4 34c-4-6 3-11 7-6l6 7" fill="#ffe1a6" stroke="#293344" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        demo.append(hand);
      }
      if (id === 'schulte-countdown-overlay') {
        // Keep the companion asset and markup for reuse; show the sample here.
        const mascot = content.querySelector('.intro-overview .intro-mascot');
        const sample = document.createElement('figure');
        sample.className = 'schulte-overview-sample';
        sample.setAttribute('aria-label', '슐테표 예시: 흩어진 숫자를 1, 2, 3, 4, 5, 6 순서로 눌러요.');
        sample.append(demo.cloneNode(true));
        const caption = document.createElement('figcaption');
        caption.textContent = '1 → 2 → 3 → 4 → 5 → 6 순서로 톡!';
        sample.append(caption);
        if (mascot) {
          mascot.hidden = true;
          mascot.after(sample);
        }
      }
    } else {
      how.prepend(board);
    }

    // 한 줄 규칙 + 알아보는 힘 카드
    const rule = document.createElement('p');
    rule.className = 'rn-rule';
    rule.innerHTML = m.rule;
    board.after(rule);
    const skill = document.createElement('section');
    skill.className = 'rn-skill';
    skill.innerHTML = `<span class="rn-skill-ico" aria-hidden="true" style="background:${ICON[m.area]?.bg || '#fffef9'}">${ICON[m.area]?.svg || m.emoji}</span><div><small>이 미션으로 알아보는 힘</small><strong>${m.area} <em>${m.pro}</em></strong><p>${m.example}</p></div>`;
    if (id !== 'schulte-countdown-overlay') {
      skill.querySelector('small').remove();
      skill.querySelector('strong').textContent = m.pro;
      const examples = m.example.split('. ');
      skill.querySelector('p').textContent = id === 'memory-popup' ? '카드가 가려진 뒤, 기억해 둔 위치를 떠올려 같은 자리를 찾아보는 활동이에요.' : examples[0] + '.';
      const everyday = document.createElement('p');
      everyday.className = 'memory-everyday';
      everyday.innerHTML = '<span>일상에서는</span> ' + (id === 'memory-popup' ? '들은 설명을 기억하고 행동으로 옮길 때 써요.' : examples.slice(1).join('. '));
      skill.querySelector('div').append(everyday);
      const startButton = how.querySelector('.btn-popup-start');
      if (startButton) startButton.textContent = '게임 시작하기';
    }
    if (id !== 'schulte-countdown-overlay') {
      const icon = skill.querySelector('.rn-skill-ico');
      const body = skill.querySelector('div > p').textContent;
      const daily = skill.querySelector('.memory-everyday');
      const dailyText = daily.textContent.replace('일상에서는', '').trim();
      skill.className = 'intro-benefit mission-benefit-card';
      skill.innerHTML = '';
      const heading = document.createElement('h3');
      heading.append(icon, document.createTextNode(m.area + ' · ' + m.pro));
      const description = document.createElement('p'); description.textContent = body;
      const everyday = document.createElement('div'); everyday.className = 'intro-everyday';
      const label = document.createElement('strong'); label.textContent = '일상에서는';
      const example = document.createElement('p'); example.textContent = dailyText;
      everyday.append(label, example); skill.append(heading, description, everyday);
    }
    rule.after(skill);
    const copy = BENEFIT_COPY[id];
    content.querySelectorAll('.intro-benefit').forEach(card => {
      card.querySelector(':scope > p').innerHTML = copy[0];
      card.querySelector('.intro-everyday p').textContent = copy[1];
    });

  });

  // Reuse the flat pointer from the number example for the green-light demo.
  const reactionDemo = document.querySelector('#reaction-popup .reaction-demo');
  const pointerSvg = document.querySelector('.schulte-demo .rn-hand svg');
  if (reactionDemo && pointerSvg) {
    const pointer = document.createElement('span');
    pointer.className = 'reaction-demo-hand';
    pointer.setAttribute('aria-hidden', 'true');
    pointer.append(pointerSvg.cloneNode(true));
    reactionDemo.append(pointer);
  }

  // One clock controls contact, pressed cells and the pointer, in both previews.
  const previews = [...document.querySelectorAll('.rn-intro .schulte-demo')].map(demo => ({
    demo, hand: demo.querySelector('.rn-hand'),
    cells: [...demo.querySelectorAll('.demo-num')].sort((a, b) => Number(a.textContent) - Number(b.textContent)),
    start: null
  }));
  function playPreviewClick() {
    const ctx=window.getNollpicAudioContext?.();
    if(ctx?.state==='running') window.playNollpicSound?.('demo-click');
  }
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function renderSamples(now) {
    for (const preview of previews) {
      const {demo, hand, cells} = preview;
      if (!hand || !demo.getClientRects().length || !demo.closest('.popup-overlay.active') || demo.closest('[data-starting="true"]') || document.hidden) {
        preview.start = null;
        preview.wasPressing = false;
        continue;
      }
      if (preview.start === null) preview.start = now;
      // Run the shared timeline slightly faster: 1.2 seconds per number.
      const time = reducedMotion.matches ? 0 : ((now - preview.start) * (1400 / 1200)) % 11000;
      const step = Math.min(5, Math.floor(time / 1400));
      const phase = time - step * 1400;
      const reset = time >= 10000;
      const pressing = phase >= 700 && phase < 940 && !reset;
      if (pressing && !preview.wasPressing && !reducedMotion.matches) playPreviewClick();
      preview.wasPressing = pressing;
      cells.forEach((cell, index) => {
        cell.classList.toggle('sample-hit', !reset && (index < step || (index === step && phase >= 700)));
        cell.classList.toggle('sample-press', index === step && pressing);
      });
      const point = cell => ({x: cell.offsetLeft + cell.offsetWidth / 2, y: cell.offsetTop + cell.offsetHeight / 2});
      const from = point(cells[Math.max(0, step - 1)]);
      const to = point(cells[step]);
      const progress = Math.min(1, phase / 600);
      const eased = progress * progress * (3 - 2 * progress);
      hand.style.left = `${from.x + (to.x - from.x) * eased}px`;
      hand.style.top = `${from.y + (to.y - from.y) * eased}px`;
      hand.style.opacity = reset || reducedMotion.matches ? '0' : '1';
      hand.classList.toggle('sample-press', pressing);
    }
    requestAnimationFrame(renderSamples);
  }

  // Shared preview: show the task first, then demonstrate the response.
  const guided = [
    ['memory-popup', '.memory-demo', '.memory-card', [1,3,5]],
    ['visual-search-popup', '.visual-demo', ':scope > div', [1,3,8]]
  ].map(([id, selector, cellsSelector, targets]) => {
    const demo = document.querySelector('#' + id + ' ' + selector);
    if (!demo || !pointerSvg) return null;
    const cells = [...demo.querySelectorAll(cellsSelector)];
    const hand = document.createElement('span'); hand.className='mission-demo-pointer';
    hand.append(pointerSvg.cloneNode(true)); demo.append(hand);
    return {id, demo, cells, targets, hand, start:null};
  }).filter(Boolean);
  const reactionPreview = {start:null, soundedCycle:-1, stopCycle:-1};
  function renderReactionGuide(now) {
    if (!reactionDemo) return;
    const hand=reactionDemo.querySelector('.reaction-demo-hand');
    if (!hand) return;
    if (!reactionDemo.getClientRects().length || !reactionDemo.closest('.popup-overlay.active') || document.hidden) {reactionPreview.start=null;reactionPreview.soundedCycle=-1;reactionPreview.stopCycle=-1;return;}
    if(reactionPreview.start===null) reactionPreview.start=now;
    const elapsed=(now-reactionPreview.start)*1.265, cycle=Math.floor(elapsed/6000);
    const time=reducedMotion.matches ? 0 : elapsed%6000;
    const red=time<3000, phase=red?time:time-3000;
    reactionDemo.querySelector('.red').style.opacity=red?'1':'0';
    const green=reactionDemo.querySelector('.green');green.style.opacity=red?'0':'1';
    const visible=phase>=600 && phase<2400 && !reducedMotion.matches;
    const contact=phase>=1400 && phase<1700;
    hand.style.opacity=visible?'1':'0';
    hand.classList.toggle('blocked',red && phase>=1250 && visible);
    hand.style.transform='translate('+Math.max(0,1-(phase-600)/800)*32+'px,'+Math.max(0,1-(phase-600)/800)*28+'px) scale('+(!red && contact?.88:1)+')';
    green.style.transform=!red && contact?'scale(.94)':'none';
    if(red && phase>=1250 && reactionPreview.stopCycle!==cycle) {
      reactionPreview.stopCycle=cycle;
      const ctx=window.getNollpicAudioContext?.();
      if(ctx?.state==='running') window.playNollpicSound?.('demo-stop-beep');
    }
    if(!red && phase>=1400 && reactionPreview.soundedCycle!==cycle) {
      reactionPreview.soundedCycle=cycle;
      const ctx=window.getNollpicAudioContext?.();
      if(ctx?.state==='running') window.playNollpicSound?.('demo-dingdong');
    }
  }
  // 충동조절 예시 (2026-10-10): 실제 미션과 같은 순서
  // ① 5마리 줄을 잠깐 보여 줌 → ② 줄을 가리고 "?" → ③ 아래 보기 2개 중 가운데 있던 곰을 손가락이 누름
  const flankerDemo = document.querySelector('#flanker-popup .flanker-demo');
  const flankerGuide = flankerDemo && pointerSvg && flankerDemo.querySelector('.fd-choices') ? (() => {
    const hand = document.createElement('span'); hand.className = 'mission-demo-pointer';
    hand.append(pointerSvg.cloneNode(true)); flankerDemo.append(hand);
    return { hand, start: null, pressed: false,
      label: flankerDemo.querySelector('.flanker-memory-text'),
      row: flankerDemo.querySelector('.fd-stimulus'),
      choices: flankerDemo.querySelector('.fd-choices'),
      answer: flankerDemo.querySelector('.fd-answer') };
  })() : null;
  function renderFlankerGuide(now) {
    const g = flankerGuide;
    if (!g) return;
    if (!flankerDemo.getClientRects().length || !flankerDemo.closest('.popup-overlay.active') || document.hidden) { g.start = null; g.pressed = false; return; }
    if (g.start === null) g.start = now;
    const time = reducedMotion.matches ? 4200 : (now - g.start) % 6400;
    const showing = time < 2200;              // ① 줄 보여 주기
    const asking = time >= 2200;              // ② 줄 가리고 보기 등장
    const responding = time >= 2900 && time < 5600;
    const hit = time >= 3700;                 // ③ 정답 누름
    g.row.classList.toggle('fd-hidden', asking);
    g.choices.classList.toggle('fd-show', asking);
    g.answer.classList.toggle('guide-hit', hit);
    if (g.label) g.label.textContent = showing ? '가운데 그림을 기억해요' : hit ? '정답! 가운데는 곰이었어요' : '가운데에 있던 그림을 골라요';
    g.hand.style.opacity = responding && !reducedMotion.matches ? '1' : '0';
    const rect = g.answer.getBoundingClientRect(), base = flankerDemo.getBoundingClientRect();
    const approach = Math.max(0, 1 - (time - 2900) / 600);
    g.hand.style.left = (rect.left - base.left + rect.width / 2 + approach * 22) + 'px';
    g.hand.style.top = (rect.top - base.top + rect.height / 2 + approach * 22) + 'px';
    const pressing = time >= 3550 && time < 3850;
    g.hand.classList.toggle('press', pressing);
    if (pressing && !g.pressed && !reducedMotion.matches) playPreviewClick();
    g.pressed = pressing;
  }
  function renderGuides(now) {
    renderReactionGuide(now);
    renderFlankerGuide(now);
    for (const g of guided) {
      if (!g.demo.getClientRects().length || !g.demo.closest('.popup-overlay.active') || document.hidden) {g.start=null;g.wasPressing=false;continue;}
      // Keep the demonstration frozen while the memory countdown runs.
      if (g.id === "memory-popup" && g.demo.closest('[data-starting="true"]')) continue;
      if (g.start===null) g.start=now;
      const speed = g.id === 'memory-popup' ? 1.15 : 1;
      const time = reducedMotion.matches ? 1000 : ((now-g.start)*speed) % (3600+g.targets.length*1200);
      const showing=time<2200, responding=time>=2800 && time<2800+g.targets.length*1200;
      const step=Math.min(g.targets.length-1,Math.max(0,Math.floor((time-2800)/1200)));
      const phase=(time-2800)-step*1200;
      g.cells.forEach((cell,i)=>{
        cell.classList.toggle('guide-reveal',showing && g.targets.includes(i));
        cell.classList.toggle('guide-hit',responding && g.targets.indexOf(i)>=0 && (g.targets.indexOf(i)<step || (g.targets.indexOf(i)===step && phase>=650)));
      });
      g.hand.style.opacity=responding && !reducedMotion.matches ? '1':'0';
      const cell=g.cells[g.targets[step]], rect=cell.getBoundingClientRect(), base=g.demo.getBoundingClientRect();
      const approach=Math.max(0,1-phase/600);
      g.hand.style.left=(rect.left-base.left+rect.width/2+approach*20)+'px';
      g.hand.style.top=(rect.top-base.top+rect.height/2+approach*20)+'px';
      const pressing = responding && phase>=650 && phase<900;
      g.hand.classList.toggle('press',pressing);
      if(g.id==='memory-popup' && pressing && !g.wasPressing && !reducedMotion.matches) playPreviewClick();
      g.wasPressing=pressing;
    }
    requestAnimationFrame(renderGuides);
  }
  requestAnimationFrame(renderGuides);

  requestAnimationFrame(renderSamples);
})();

/* 미션 준비 화면 리뉴얼 (2026-10-08)
   mission-intro.js가 만든 화면 위에 덧씌움: 캐릭터가 보드를 들고 고개를 내밀고, 보드 안 예시는 "보기"로 표시,
   단계 목록 대신 한 줄 규칙, "이 미션으로 알아보는 힘" 카드. 놀이·점수 코드는 건드리지 않음 */
(() => {
  const TIGER = '../images/mission-tiger-round-eyes.png';
  const META = {
    'schulte-countdown-overlay': { emoji: '🎯', area: '끈기력', pro: '집중 유지력', rule: '1부터 <b>차례대로</b> 빨리 눌러요', bubble: '하나씩 차례대로,<br>끝까지 찾아볼까?', mascot: '../images/nollpic-turtle-v4.png', example: '흩어진 숫자를 끝까지 차례대로 찾으며, 한 가지 일에 집중을 이어가는 힘이에요. 숙제나 정리를 끝까지 해낼 때 써요.', hand: true },
    'memory-popup':        { emoji: '🧩', area: '기억력',   pro: '작업 기억력', rule: '반짝인 카드 자리를 <b>기억했다가</b> 눌러요', bubble: '잘 보고<br>꼭꼭 기억해!', mascot: TIGER, example: '잠깐 본 자리를 머릿속에 담아 두었다가 꺼내 쓰는 힘이에요. 들은 설명대로 차근차근 해낼 때 써요.' },
    'reaction-popup':      { emoji: '⚡', area: '순발력',   pro: '반응 속도',   rule: '초록은 <b>톡!</b> 빨강은 <b>꾹</b> 참아요', bubble: '신호를<br>잘 봐!', mascot: TIGER, example: '신호를 보고 알맞게, 재빨리 움직이는 힘이에요. 놀이에서 신호에 맞춰 움직일 때 써요.' },
    'visual-search-popup': { emoji: '🔍', area: '관찰력',   pro: '시각 탐색',   rule: '목표 동물을 <b>모두</b> 찾아요', bubble: '어디 숨었지?<br>같이 찾자!', mascot: TIGER, example: '여러 그림 속에서 필요한 것을 꼼꼼히 찾아내는 힘이에요. 가방 속 준비물을 찾을 때도 써요.' },
    'flanker-popup':       { emoji: '✋', area: '충동조절', pro: '충동 억제',   rule: '<b>가운데</b> 그림만 보고 골라요', bubble: '옆 그림에<br>속지 마!', mascot: TIGER, example: '주변에 휩쓸리지 않고 규칙대로 고르는 힘이에요. 하고 싶은 걸 잠깐 참고 차례를 기다릴 때 써요.' },
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

  ids.forEach((id, index) => {
    const overlay = document.getElementById(id);
    const m = META[id];
    if (!overlay || !overlay.classList.contains('mission-intro') || overlay.classList.contains('rn-intro')) return;
    overlay.classList.add('rn-intro');
    const content = overlay.querySelector('.popup-content');
    const how = content?.querySelector('.intro-how');
    const heading = content?.querySelector('.intro-heading');
    if (!content || !how || !heading) return;

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
        hand.textContent = '👆';
        demo.append(hand);
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
    rule.after(skill);
  });
})();

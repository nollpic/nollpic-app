/* 마이(page-3) 리뉴얼 (2026-10-08)
   - 안내 문장(#child-page-sub)을 거북이 말풍선으로 (id는 그대로라 app.js가 바꾸는 문구도 그대로 반영)
   - 나이 선택: 드롭다운 대신 누르는 칩. 실제 값은 원래 <select id="child-grade">에 넣어서 app.js 저장·검사 코드는 그대로 */
(() => {
  const page = document.getElementById('page-3');
  if (!page) return;

  // 1) 거북이 + 말풍선
  const sub = document.getElementById('child-page-sub');
  const titleBlock = page.querySelector('.child-title-block');
  if (sub && titleBlock && !page.querySelector('.my-peek')) {
    const peek = document.createElement('div');
    peek.className = 'my-peek';
    peek.append(sub);
    titleBlock.after(peek);
  }

  // 말풍선 폭을 실제 글자 줄 길이에 맞춤 (줄바꿈 뒤 오른쪽 빈 공간 없애기)
  // 말풍선 문구 줄바꿈 위치 지정 (app.js가 넣는 문구 기준)
  const BREAKS = { '정확한 분석을 위해 기본 정보를 입력해주세요.': '정확한 분석을 위해<br>기본 정보를 입력해 주세요.' };
  const fitBubble = () => {
    const el = document.getElementById('child-page-sub');
    if (!el || !el.closest('.my-peek')) return;
    const t = el.textContent.trim();
    if (BREAKS[t] && !el.querySelector('br')) el.innerHTML = BREAKS[t];
    if (!el.offsetParent) return;
    el.style.width = '';
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = [...range.getClientRects()];
    if (!rects.length) return;
    const left = Math.min(...rects.map(r => r.left)), right = Math.max(...rects.map(r => r.right));
    const cs = getComputedStyle(el);
    const extra = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
    el.style.width = Math.ceil(right - left + extra + 1) + 'px';
  };
  if (sub) {
    new MutationObserver(() => requestAnimationFrame(fitBubble)).observe(sub, { childList: true, characterData: true, subtree: true });
    new MutationObserver(() => requestAnimationFrame(fitBubble)).observe(page, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', fitBubble);
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(fitBubble);
    if (document.fonts) document.fonts.addEventListener('loadingdone', () => requestAnimationFrame(fitBubble));
  }

  // 2) 나이 칩
  const select = document.getElementById('child-grade');
  if (!select) return;
  const chips = document.createElement('div');
  chips.className = 'grade-chips';
  chips.setAttribute('role', 'radiogroup');
  chips.setAttribute('aria-label', '나이');
  select.after(chips);
  select.classList.add('grade-select-hidden');
  select.setAttribute('tabindex', '-1');
  select.setAttribute('aria-hidden', 'true');

  const shortLabel = (text) => text.replace('초등 ', '').trim();
  let drawnKey = '';
  function draw() {
    const opts = [...select.options].filter(o => o.value !== '');
    const key = opts.map(o => o.value).join(',') + '|' + select.value;
    if (key === drawnKey) return;
    drawnKey = key;
    chips.innerHTML = opts.map(o => `<button type="button" role="radio" class="grade-chip${o.value === select.value ? ' is-on' : ''}${o.value === 'adult' ? ' is-adult' : ''}" aria-checked="${o.value === select.value}" data-v="${o.value}">${shortLabel(o.textContent)}</button>`).join('');
  }
  chips.addEventListener('click', (e) => {
    const btn = e.target.closest('.grade-chip');
    if (!btn) return;
    select.value = btn.dataset.v;
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    draw();
  });
  select.addEventListener('change', draw);
  // app.js가 아이 수정·초기화 때 select 값을 직접 바꾸므로, 마이 화면이 보이는 동안만 가볍게 맞춰 줌
  setInterval(() => { if (page.classList.contains('active')) draw(); }, 300);
  // "나이를 선택해주세요" 경고 때 select.focus()가 불리면 칩으로 포커스
  select.addEventListener('focus', () => chips.querySelector('.grade-chip')?.focus());
  draw();
})();

/* 평소 아이는 어떤가요?(page-4) 타일: 키보드로도 고르기 */
document.querySelectorAll('#page-4 .rn4-tile').forEach(tile => {
  tile.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tile.click(); }
  });
});


/* 성별 아이콘: 이모지 대신 놀픽 2D 얼굴 (굵은 윤곽, 평면 색) — 성별 버튼과 등록된 아이 카드 */
(() => {
  const S = 'stroke="#293344" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
  const face = '<circle cx="20" cy="22" r="11" fill="#ffd9bd" ' + S + '/><circle cx="16.3" cy="22.5" r="1.4" fill="#293344"/><circle cx="23.7" cy="22.5" r="1.4" fill="#293344"/><path d="M17.3 26.3q2.7 2.2 5.4 0" fill="none" ' + S + '/><circle cx="13.6" cy="25.6" r="1.6" fill="#ffb3a7"/><circle cx="26.4" cy="25.6" r="1.6" fill="#ffb3a7"/>';
  const BOY = '<svg class="gender-ico" viewBox="0 0 40 40" aria-hidden="true">' + face + '<path d="M9.2 20.5c0-7 5-10.8 10.8-10.8s10.8 3.8 10.8 10.8c-2.6-.3-5-1.8-6.6-4-2.3 2.5-6.8 4-11.4 4.1-1.3 0-2.5 0-3.6-.1z" fill="#7a5233" ' + S + '/></svg>';
  const GIRL = '<svg class="gender-ico" viewBox="0 0 40 40" aria-hidden="true"><circle cx="8.5" cy="13" r="4.6" fill="#7a5233" ' + S + '/><circle cx="31.5" cy="13" r="4.6" fill="#7a5233" ' + S + '/>' + face + '<path d="M9.2 21.5c0-7.5 5-11.8 10.8-11.8s10.8 4.3 10.8 11.8c-3.3-.4-6.6-2.4-8.3-5.4-1.2 2.6-4.6 5-9.6 5.4z" fill="#7a5233" ' + S + '/><path d="M27.5 12.5l3.2-2.2.4 3.8z" fill="#ff8fb1" ' + S + '/></svg>';
  const KID = '<svg class="gender-ico" viewBox="0 0 40 40" aria-hidden="true">' + face + '<path d="M9.5 20c.8-6.3 5.3-9.6 10.5-9.6s9.7 3.3 10.5 9.6c-3.8-.6-7.6-2.6-10.5-5.6-2.9 3-6.7 5-10.5 5.6z" fill="#7a5233" ' + S + '/></svg>';
  const ADULT = '<svg class="gender-ico" viewBox="0 0 40 40" role="img" aria-label="어른 캐릭터"><path d="M8 40q1-10 12-10t12 10" fill="#91d0b2" ' + S + '/>' + face + '<path d="M9.2 20q0-12 11-12t11 12q-6-1-9-7-4 5-13 7z" fill="#6a5040" ' + S + '/><rect x="12.2" y="20" width="6.8" height="5.3" rx="2" fill="none" ' + S + '/><rect x="21" y="20" width="6.8" height="5.3" rx="2" fill="none" ' + S + '/><path d="M19 22h2" fill="none" ' + S + '/></svg>';
  document.querySelectorAll('#page-3 .gender-radio-btn').forEach(label => {
    const input = label.querySelector('input'); const text = label.querySelector('.gender-btn-text');
    if (!input || !text) return;
    text.innerHTML = (input.value === 'female' ? GIRL : BOY) + '<span>' + (input.value === 'female' ? '여' : '남') + '</span>';
  });
  // 2026-10-10: 얼굴만 잘라 보이던 것 → 몸 전체가 보이게 (그림 투명 영역을 뺀 정사각형 범위)
  //   살피랑은 고개만 내민 그림(mission-tiger-round-eyes) 대신 전신 그림(nollpic-salpi-tiger-full-v1)
  const friends = [
    { key:'turtle', name:'끈북이', file:'nollpic-turtle-v4.png', size:1254, view:'146 197 960 960' },
    { key:'elephant', name:'기억코', file:'nollpic-elephant-gray-ear-flap-v1.gif', size:300, view:'14 14 272 272' },
    { key:'rabbit', name:'톡토리', file:'nollpic-rabbit-ear-fold-v1.gif', size:300, view:'12 10 276 276' },
    { key:'tiger', name:'살피랑', file:'nollpic-salpi-tiger-full-v1.png', size:1254, view:'91 96 1070 1070' },
    { key:'bear', name:'꾹곰이', file:'nollpic-kkuk-bear-full-v1.png', size:1254, view:'111 134 1030 1030' }
  ];
  const list = document.getElementById('saved-child-list');
  function swap() {
    if(!list)return;
    let owner='guest';try{owner=JSON.parse(localStorage.getItem('nollpic_user')||'null')?.uid||localStorage.getItem('nollpic_guest_id')||owner;}catch(_){}
    const storageKey='nollpic_child_mascots_v1:'+owner;
    let assigned={};try{const stored=JSON.parse(localStorage.getItem(storageKey)||'{}');if(stored&&typeof stored==='object'&&!Array.isArray(stored))assigned=stored;}catch(_){}
    const used=new Set();let changed=false;
    [...list.querySelectorAll('.saved-child-avatar')].forEach((av,index)=>{
      if(index%friends.length===0)used.clear();
      const id=av.dataset.childAvatarId || av.closest('.saved-child-card')?.querySelector('.saved-child-info strong')?.textContent || 'child-'+index;
      let friend=friends.find(item=>item.key===assigned[id]&&!used.has(item.key));
      if(!friend){const available=friends.filter(item=>!used.has(item.key));friend=available[Math.floor(Math.random()*available.length)];assigned[id]=friend.key;changed=true;}
      used.add(friend.key);
      if(av.dataset.renderedAvatar===friend.key+'-full'&&av.querySelector('.nollpic-child-face'))return;
      // 전신이 보이도록 그림 주변 빈 곳만 잘라 냄 (원본 그림 파일은 그대로)
      const [x,y,width,height]=friend.view.split(' '),clipId='nollpic-child-head-'+index;
      av.innerHTML=`<svg class="nollpic-child-face" viewBox="${friend.view}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${width}" height="${height}"/></clipPath></defs><image href="images/${friend.file}" width="${friend.size}" height="${friend.size}" clip-path="url(#${clipId})"/></svg>`;
      av.dataset.renderedAvatar=friend.key+'-full';
      av.setAttribute('role','img');av.setAttribute('aria-label','놀픽 '+friend.name);
    });
    if(changed)try{localStorage.setItem(storageKey,JSON.stringify(assigned));}catch(_){}
  }
  if (list) new MutationObserver(swap).observe(list, { childList: true, subtree: true });
  swap();
})();

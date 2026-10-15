/* 스시공방(기억 공방) 리뉴얼 화면 보조 (2026-10-11)
   - 시작 전 "예시": 레벨1 스시는 동그라미 + 번호 + 이름(시안 그림 연어·장어·계란), 김밥·햄버거는 원래 접시 예시
   - "기억 시간" 막대: 시작 전에는 흐르는 예시, 기억할 때는 실제 남은 시간
   - 시작 전 문구 "잘 보고 기억해요"
   - 소리 버튼: 효과음·배경음 함께 켜기/끄기 (nollpic_sound_settings, 앱 설정과 같은 값)
   게임 본문(nollpic-memory-kitchen.html)의 전역 phase·mode·memorySequence·ingredients·rememberSeconds 를 읽기만 함 */
(function () {
  const $ = (id) => document.getElementById(id);
  const board = $('board'), exRow = $('exRow'), memTime = $('memTime'), memBar = $('memTimeBar'), memText = $('memTimeText');
  const label = $('missionLabel'), timerChip = $('timerChip'), soundBtn = $('soundBtn');
  if (!board || !exRow) return;

  const FLAT = [
    { src: 'images/sushi-salmon-flat.png', name: '연어' },
    { src: 'images/sushi-eel-flat.png', name: '장어' },
    { src: 'images/sushi-egg-flat.png', name: '계란' },
  ];
  const get = (fn, fallback) => { try { return fn(); } catch (e) { return fallback; } };
  const curPhase = () => get(() => phase, '');
  const curMode = () => get(() => mode, 'easy');
  const seconds = () => get(() => rememberSeconds(), 3);

  /* 예시 칸 */
  let exKey = '';
  function renderExample() {
    // 동그라미 예시는 레벨1 스시만 (김밥·햄버거 재료 그림은 접시에 맞춰 그려져 있어 원래 접시 예시를 씀)
    const easy = curMode() === 'easy';
    const key = easy ? 'easy' : '';
    if (key === exKey) return;
    exKey = key;
    const items = easy ? FLAT.map(f => ({ html: `<img src="${f.src}" alt="">`, name: f.name })) : [];
    exRow.innerHTML = items.map((it, i) => `<div class="ex-item"><div class="ex-circle"><span class="ex-num">${i + 1}</span>${it.html}</div><b>${it.name}</b></div>`).join('');
  }
  let popTimer = null, popIndex = 0;
  function popLoop(on) {
    clearInterval(popTimer); popTimer = null;
    exRow.querySelectorAll('.ex-item').forEach(n => n.classList.remove('pop'));
    if (!on) return;
    popIndex = 0;
    popTimer = setInterval(() => {
      const nodes = [...exRow.querySelectorAll('.ex-item')];
      if (!nodes.length) return;
      nodes.forEach(n => n.classList.remove('pop'));
      const n = nodes[popIndex % (nodes.length + 1)];   // 한 바퀴 돌고 한 번 쉼
      if (n) { void n.offsetWidth; n.classList.add('pop'); }
      popIndex++;
    }, 760);
  }

  /* 기억 시간 막대 */
  let total = 0;
  function updateMemTime() {
    const ph = curPhase(), sec = seconds();
    const example = board.classList.contains('show-example');
    const show = sec > 0 && (example || ph === 'remember');
    memTime.classList.toggle('show', show);
    if (!show) return;
    if (example) {
      memTime.classList.add('demo');
      memTime.style.setProperty('--mk-sec', sec + 's');
      memText.textContent = sec + '초';
      return;
    }
    memTime.classList.remove('demo');
    const left = Number(timerChip && timerChip.textContent) || 0;
    if (!total || left > total) total = Math.max(sec, left);
    memBar.style.width = Math.max(0, Math.min(100, (left / total) * 100)) + '%';
    memText.textContent = left + '초';
  }

  function sync() {
    const example = board.classList.contains('show-example');
    if (example) {
      renderExample();
      if (!popTimer && exRow.children.length) popLoop(true);
      if (label && label.textContent !== '잘 보고 기억해요') label.textContent = '잘 보고 기억해요';
      total = 0;
    } else {
      exKey = '';
      popLoop(false);
    }
    updateMemTime();
  }
  new MutationObserver(sync).observe(board, { attributes: true, attributeFilter: ['class'] });
  const stack = $('memoryStack');
  if (stack) new MutationObserver(sync).observe(stack, { childList: true });
  if (timerChip) new MutationObserver(updateMemTime).observe(timerChip, { childList: true, characterData: true, subtree: true });
  sync();

  /* 소리 버튼 */
  const KEY = 'nollpic_sound_settings';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } };
  window.nollpicGameMuted = () => read().effects === false;
  function paintSound() {
    const muted = window.nollpicGameMuted();
    soundBtn.classList.toggle('is-muted', muted);
    soundBtn.setAttribute('aria-pressed', String(!muted));
    soundBtn.setAttribute('aria-label', muted ? '소리 켜기' : '소리 끄기');
  }
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      const on = window.nollpicGameMuted();   // 꺼져 있으면 켬
      const next = { ...read(), effects: on, music: on };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) {}
      if (!on && window.speechSynthesis) { try { speechSynthesis.cancel(); } catch (e) {} }
      try { window.parent && window.parent !== window && window.parent.applyNollpicSoundSettings && window.parent.applyNollpicSoundSettings(); } catch (e) {}
      paintSound();
    });
    window.addEventListener('storage', paintSound);
    paintSound();
  }
})();

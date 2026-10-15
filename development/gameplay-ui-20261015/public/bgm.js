/* 배경음악 (2026-10-09)
   - 브라우저는 소리 자동재생을 막으므로, 들어와서 처음 화면을 누르는 순간부터 재생
   - 첫 화면(로그인)·홈에 소리 켜기/끄기 버튼. 선택은 기기에 기억(nollpic_bgm = on/off)
   - 테스트·놀이(화면 안에 iframe이 있는 페이지)를 하는 동안과 앱이 뒤로 가 있을 때는 잠시 멈춤
   - 음악 파일: audio/nollpic-bgm.mp3 (놀픽용으로 새로 만든 오르골 반복 곡, 34초) */
(() => {
  const KEY = 'nollpic_bgm';
  const VOLUME = 0.32;
  const audio = new Audio('audio/nollpic-bgm.mp3');
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0;

  const isOn = () => { try { return localStorage.getItem(KEY) !== 'off'; } catch (e) { return true; } };
  const setOn = (v) => { try { localStorage.setItem(KEY, v ? 'on' : 'off'); } catch (e) {} };
  let unlocked = false;
  let fadeTimer = null;

  function fadeTo(target, ms = 600, done) {
    clearInterval(fadeTimer);
    const start = audio.volume, steps = Math.max(1, Math.round(ms / 40));
    let i = 0;
    fadeTimer = setInterval(() => {
      i += 1;
      audio.volume = Math.max(0, Math.min(1, start + (target - start) * (i / steps)));
      if (i >= steps) { clearInterval(fadeTimer); done && done(); }
    }, 40);
  }
  // 지금 화면이 놀이·테스트 화면인지 (iframe이 들어 있는 페이지)
  function inGame() {
    const page = document.querySelector('.page.active');
    return !!(page && page.querySelector('iframe'));
  }
  function shouldPlay() { return unlocked && isOn() && !inGame() && document.visibilityState === 'visible'; }
  function sync() {
    if (shouldPlay()) {
      if (audio.paused) audio.play().then(() => fadeTo(VOLUME)).catch(() => {});
      else fadeTo(VOLUME);
    } else if (!audio.paused) {
      fadeTo(0, 400, () => audio.pause());
    }
    document.querySelectorAll('.bgm-toggle').forEach(btn => {
      const on = isOn();
      btn.classList.toggle('is-off', !on);
      btn.setAttribute('aria-pressed', String(on));
      btn.setAttribute('aria-label', on ? '배경음악 끄기' : '배경음악 켜기');
    });
  }

  // 처음 누르는 순간 재생 시작 (소리 버튼을 누른 경우는 버튼이 직접 처리)
  function unlock(e) {
    if (unlocked) return;
    unlocked = true;
    if (e && e.target && e.target.closest && e.target.closest('.bgm-toggle')) return;
    sync();
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, unlock, { once: false, passive: true, capture: true }));

  // 소리 버튼
  const ICON_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const ICON_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  function makeButton(extraClass) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'bgm-toggle ' + (extraClass || '');
    btn.innerHTML = `<span class="on">${ICON_ON}</span><span class="off">${ICON_OFF}</span>`;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      unlocked = true;
      setOn(!isOn());
      sync();
    });
    return btn;
  }
  // 첫 화면(로그인): 오른쪽 위
  const login = document.querySelector('#page-1 .page-body');
  if (login) login.append(makeButton('bgm-corner'));
  // 홈: 물음표 버튼 왼쪽
  const help = document.querySelector('#page-2 .mission-help');
  if (help) help.before(makeButton('bgm-inline'));

  // 화면이 바뀔 때마다 (놀이 들어가면 멈춤, 나오면 다시)
  const pages = document.querySelectorAll('.page');
  const mo = new MutationObserver(() => sync());
  pages.forEach(p => mo.observe(p, { attributes: true, attributeFilter: ['class'] }));
  document.addEventListener('visibilitychange', sync);
  sync();
  window.NollpicBgm = { play: () => { unlocked = true; setOn(true); sync(); }, stop: () => { setOn(false); sync(); } };
})();

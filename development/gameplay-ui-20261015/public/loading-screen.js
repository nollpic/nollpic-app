(() => {
  const box = document.getElementById('login-loading');
  if (!box) return;
  const slot = box.parentElement;
  const wrap = box.closest('.social-login-wrap');
  const guest = slot.querySelector('.btn-guest');
  const google = document.querySelector('#page-1 .btn-google-main');
  const page = document.getElementById('page-1');
  const bar = document.getElementById('login-loading-progress');
  const text = document.getElementById('login-loading-percent');
  const caption = box.querySelector('.login-loading-caption > span');
  const fill = box.querySelector('.login-loading-fill');
  const minimumAutoTime = 3500;
  let active = false, value = 0, automatic = false, startedAt = 0, progressTimer = null, completion = null;
  let ready = true, reveal = Promise.resolve(), sequence = 0;
  function update(next) {
    if (!active || !ready) return;
    value = Math.max(value, Math.min(100, next));
    text.textContent = Math.round(value) + '%';
    bar.setAttribute('aria-valuenow', String(Math.round(value)));
    fill.style.width = value + '%';
  }
  function reset() {
    sequence += 1;
    clearInterval(progressTimer);
    progressTimer = null;
    active = false;
    box.hidden = true;
    box.style.height = '';
    slot.classList.remove('is-loading');
    wrap.classList.remove('is-auto-login');
    guest.disabled = false;
    google.disabled = false;
    slot.removeAttribute('aria-busy');
    completion = null;
  }
  function start(options = {}) {
    if (active) return;
    automatic = options.automatic === true;
    startedAt = performance.now();
    active = true; value = 0;
    ready = true;
    const token = ++sequence;
    if (automatic) {
      box.style.height = Math.max(0, guest.getBoundingClientRect().bottom - google.getBoundingClientRect().top) + 'px';
      wrap.classList.add('is-auto-login');
    }
    caption.textContent = automatic ? '로그인 중…' : '로딩 중';
    box.hidden = false;
    slot.classList.add('is-loading');
    slot.setAttribute('aria-busy', 'true');
    guest.disabled = true;
    google.disabled = true;
    update(0);
    reveal = Promise.resolve();
    if (automatic) progressTimer = setInterval(() => update(Math.min(90, (performance.now() - startedAt) / minimumAutoTime * 90)), 60);

  }
  window.NollpicLoginLoading = {
    start, update, reset,
    complete() {
      if (!active) return Promise.resolve();
      if (completion) return completion;
      const token = sequence;
      completion = (async () => {
        await reveal;
        if (!active || token !== sequence) return;
        const remaining = automatic ? Math.max(0, minimumAutoTime - (performance.now() - startedAt)) : 0;
        if (remaining) await new Promise(resolve => setTimeout(resolve, remaining));
        if (automatic) await (window.NollpicLogoVoiceFinished || Promise.resolve());
        if (!active || token !== sequence) return;
        clearInterval(progressTimer);
        update(100);
        await new Promise(resolve => setTimeout(resolve, automatic ? 150 : 400));
        if (active && token === sequence) reset();
      })();
      return completion;
    }
  };
  // Show the returning-user state early without changing authentication or stored data.
  try {
    const stored = JSON.parse(localStorage.getItem('nollpic_user') || 'null');
    if (stored?.uid && page?.classList.contains('active')) start({ automatic: true });
  } catch (_) {}
  if (page) new MutationObserver(() => {
    if (!page.classList.contains('active') && active) reset();
  }).observe(page, { attributes: true, attributeFilter: ['class'] });
})();

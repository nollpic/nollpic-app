/* "놀이를 픽하다, 놀픽" 목소리 + 첫 화면 로고 뿅 (2026-10-10 v2)
   - 예전: <audio>.play()를 부르는 순간 로고가 움직임 → 폰마다 mp3를 읽고 소리를 내기까지 걸리는 시간이 달라 소리가 늦거나 빨랐음
   - 지금: mp3를 미리 받아 풀어 둔 뒤(Web Audio), 소리가 실제로 나오는 시각에 맞춰 로고를 움직임
   - 자동재생이 막힌 폰(브라우저 탭으로 처음 열 때·새로고침): "화면을 눌러 시작해요" 막을 띄우고,
     누르는 그 순간 목소리·배경음악·로고 뿅이 함께 시작 (2026-10-10 v3)
   - 홈 화면에 설치한 앱(PWA)이나 소리를 허락한 브라우저는 막 없이 바로 재생 */
(() => {
  const stage = document.querySelector('#page-1 .login-logo-stage');
  const page = document.getElementById('page-1');
  if (!stage || !page) return;
  const src = new URL('tests/audio/nollpic-logo-voice-v2.mp3', document.currentScript.src).href;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let ctx = null, buffer = null, source = null, gainNode = null, htmlVoice = null;
  let pendingUnlock = false, playToken = 0, animTimer = 0;

  let finishFirstVoice;
  window.NollpicLogoVoiceFinished = new Promise(resolve => { finishFirstVoice = resolve; });
  setTimeout(() => finishFirstVoice(), 25000);   // 안전장치 (터치를 아주 오래 안 해도 자동 로그인은 넘어감)

  // 자동재생이 막혔을 때 띄우는 "눌러서 시작" 막
  let tapLayer = null;
  function showTapLayer() {
    if (tapLayer || !page.classList.contains('active')) return;
    tapLayer = document.createElement('button');
    tapLayer.type = 'button';
    tapLayer.className = 'lp-tap-start';
    tapLayer.setAttribute('aria-label', '화면을 눌러 소리와 함께 시작하기');
    tapLayer.innerHTML = '<span class="lp-tap-chip"><span aria-hidden="true">👆</span> 화면을 눌러 시작해요</span>';
    page.append(tapLayer);
  }
  function hideTapLayer() {
    if (!tapLayer) return;
    const layer = tapLayer; tapLayer = null;
    layer.classList.add('is-leaving');
    setTimeout(() => layer.remove(), 350);   // 사라지는 동안에도 아래 버튼이 눌리지 않게 막이 남아 있음
  }

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  function getContext() {
    if (!ctx && AudioContextClass) { try { ctx = new AudioContextClass({ latencyHint: 'interactive' }); } catch (_) { ctx = new AudioContextClass(); } }
    return ctx;
  }
  // 소리 파일은 화면이 열리자마자 받아서 풀어 둠 (터치 전에도 가능)
  const bufferReady = AudioContextClass
    ? fetch(src).then(r => r.arrayBuffer())
        .then(data => new Promise((resolve, reject) => getContext().decodeAudioData(data, resolve, reject)))
        .then(decoded => { buffer = decoded; return decoded; })
        .catch(() => null)
    : Promise.resolve(null);

  function readVolume() {
    let settings = {};
    try { settings = JSON.parse(localStorage.getItem('nollpic_sound_settings') || '{}'); } catch (_) {}
    if (settings.effects === false) return 0;
    const volume = Number(settings.effectsVolume ?? 90);
    return Number.isFinite(volume) ? Math.max(0, Math.min(100, volume)) / 100 : .9;
  }
  function animate(delayMs) {
    clearTimeout(animTimer);
    const run = () => { stage.classList.remove('lp-play'); void stage.offsetWidth; stage.classList.add('lp-play'); };
    if (delayMs > 0) animTimer = setTimeout(run, delayMs); else run();
  }
  function stopVoice() {
    clearTimeout(animTimer);
    if (source) { try { source.onended = null; source.stop(); } catch (_) {} source.disconnect(); source = null; }
    if (htmlVoice) htmlVoice.pause();
  }
  // Web Audio가 없는 아주 오래된 브라우저용: 소리가 실제로 시작될 때(playing) 로고를 움직임
  function playWithAudioElement(token, volume) {
    if (!htmlVoice) {
      htmlVoice = document.createElement('audio');
      htmlVoice.src = src; htmlVoice.preload = 'auto';
      htmlVoice.dataset.nollpicLogoVoice = 'true';
      htmlVoice.addEventListener('ended', () => finishFirstVoice());
      document.body.append(htmlVoice);
    }
    htmlVoice.volume = volume;
    htmlVoice.currentTime = 0;
    htmlVoice.addEventListener('playing', () => { if (token === playToken) animate(0); }, { once: true });
    htmlVoice.play().then(() => { if (token === playToken) pendingUnlock = false; }).catch(error => {
      if (token !== playToken) return;
      pendingUnlock = error.name === 'NotAllowedError';
      animate(0); finishFirstVoice();
    });
  }

  async function play() {
    const token = ++playToken;
    stopVoice();
    const volume = readVolume();
    if (!volume) { pendingUnlock = false; hideTapLayer(); animate(0); finishFirstVoice(); return; }
    const context = getContext();
    if (!context) { playWithAudioElement(token, volume); return; }
    if (context.state !== 'running') context.resume().catch(() => {});
    // 소리 준비(최대 1.5초)를 기다리는 동안 로고는 가만히 보임
    // 터치 직후면 resume이 끝나는 즉시, 터치 전이면 0.25초만 보고 막혔는지 판단
    const resumeWait = context.state === 'running' ? null
      : (navigator.userActivation?.isActive ? context.resume().catch(() => {}) : wait(250));
    await Promise.race([Promise.all([bufferReady, resumeWait]), wait(1500)]);
    if (token !== playToken || !page.classList.contains('active')) return;
    if (context.state !== 'running') {
      // 자동재생이 막힘 → "눌러서 시작" 막. 로고는 가만히 두었다가 터치와 함께 소리·뿅
      pendingUnlock = true; showTapLayer(); return;
    }
    hideTapLayer();
    if (!buffer) { playWithAudioElement(token, volume); return; }
    pendingUnlock = false;
    gainNode ||= context.createGain();
    gainNode.gain.value = volume;
    gainNode.connect(context.destination);
    source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(gainNode);
    source.onended = () => { if (token === playToken) finishFirstVoice(); };
    const lead = 0.08;   // 모든 폰에서 같은 출발선
    source.start(context.currentTime + lead);
    window.tryNollpicMusicAutoplay?.();   // 목소리가 터치 없이 나왔다면 배경음악도 같이
    // 블루투스 등 기기 출력 지연만큼 로고도 늦춰서 귀와 눈이 맞게
    const outputDelay = Number(context.outputLatency || context.baseLatency || 0);
    animate((lead + (Number.isFinite(outputDelay) ? Math.min(outputDelay, .4) : 0)) * 1000);
  }

  play();
  // 손을 뗄 때(pointerup/touchend)가 폰 브라우저가 소리를 허락하는 순간 (pointerdown은 허락 안 되는 폰이 있음)
  const unlock = event => {
    if (!pendingUnlock || !page.classList.contains('active') || stage.contains(event.target)) return;
    pendingUnlock = false;
    const context = getContext();
    if (context && context.state !== 'running') context.resume().catch(() => {});
    window.startNollpicBackgroundMusic?.();   // 같은 터치로 배경음악도 시작
    hideTapLayer();
    play();
  };
  ['pointerup', 'touchend', 'keydown'].forEach(type => document.addEventListener(type, unlock, { passive: true, capture: true }));
  stage.setAttribute('tabindex', '0');
  stage.setAttribute('role', 'button');
  stage.setAttribute('aria-label', '놀픽 로고와 목소리 다시 듣기');
  stage.addEventListener('click', () => {
    const context = getContext();
    if (context && context.state !== 'running') context.resume().catch(() => {});
    play();
  });
  stage.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); play(); }
  });
  let wasActive = page.classList.contains('active');
  new MutationObserver(() => {
    const active = page.classList.contains('active');
    if (active && !wasActive) play();
    if (!active) { ++playToken; stopVoice(); pendingUnlock = false; hideTapLayer(); }
    wasActive = active;
  }).observe(page, { attributes: true, attributeFilter: ['class'] });
  const applyVolume = () => {
    const volume = readVolume();
    if (gainNode) gainNode.gain.value = volume;
    if (htmlVoice) htmlVoice.volume = volume;
    if (!volume) { stopVoice(); pendingUnlock = false; hideTapLayer(); }
  };
  window.addEventListener('nollpic-sound-change', applyVolume);
  window.addEventListener('storage', event => { if (event.key === 'nollpic_sound_settings') applyVolume(); });
})();

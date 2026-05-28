// Firebase 연동을 위한 설정 예시 (필요시 활성화)
// const firebaseConfig = { apiKey: "...", authDomain: "...", projectId: "..." };
// firebase.initializeApp(firebaseConfig);

document.addEventListener('DOMContentLoaded', async function() {
  const loading = document.getElementById('__bundler_loading');
  function setStatus(msg) { if (loading) loading.textContent = msg; }

  window.addEventListener('error', function(e) {
    var p = document.body || document.documentElement;
    var d = document.getElementById('__bundler_err') || p.appendChild(document.createElement('div'));
    d.id = '__bundler_err';
    d.style.cssText = 'position:fixed;bottom:12px;left:12px;right:12px;font:12px/1.4 ui-monospace,monospace;background:#2a1215;color:#ff8a80;padding:10px 14px;border-radius:8px;border:1px solid #5c2b2e;z-index:99999;white-space:pre-wrap;max-height:40vh;overflow:auto';
    d.textContent = (d.textContent ? d.textContent + String.fromCharCode(10) : '') +
      '[bundle] ' + (e.message || e.type) +
      (e.filename ? ' (' + e.filename.slice(0, 60) + ':' + e.lineno + ')' : '');
  }, true);

  try {
    // 내부 압축 데이터 하드코딩 매니페스트 및 템플릿
    const manifest = {"9a6443ce-be6d-4dad-9400-a601d724aafd":{"mime":"image/png","compressed":false,"data":"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물리적도안데이터..."}};
    
    // 원본 번들러의 템플릿 스트링 (여기에 실제 놀픽 앱 컴포넌트 데이터가 파싱됩니다)
    let template = `<html><head>...</head><body>...</body></html>`; 

    const uuids = Object.keys(manifest);
    setStatus('Unpacking ' + uuids.length + ' assets...');

    const blobUrls = {};
    await Promise.all(uuids.map(async (uuid) => {
      const entry = manifest[uuid];
      try {
        const binaryStr = atob(entry.data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

        let finalBytes = bytes;
        if (entry.compressed && typeof DecompressionStream !== 'undefined') {
          const ds = new DecompressionStream('gzip');
          const writer = ds.writable.getWriter();
          const reader = ds.readable.getReader();
          writer.write(bytes); writer.close();
          const chunks = []; let totalLen = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value); totalLen += value.length;
          }
          finalBytes = new Uint8Array(totalLen);
          let offset = 0;
          for (const chunk of chunks) { finalBytes.set(chunk, offset); offset += chunk.length; }
        }
        blobUrls[uuid] = URL.createObjectURL(new Blob([finalBytes], { type: entry.mime }));
      } catch (err) {
        console.error('Failed to decode asset ' + uuid + ':', err);
      }
    }));

    setStatus('Rendering...');
    for (const uuid of uuids) template = template.split(uuid).join(blobUrls[uuid]);
    template = template.replace(/\s+integrity="[^"]*"/gi, '').replace(/\s+crossorigin="[^"]*"/gi, '');

    const doc = new DOMParser().parseFromString(template, 'text/html');
    document.documentElement.replaceWith(doc.documentElement);
    
    const dead = Array.from(document.scripts);
    for (const old of dead) {
      const s = document.createElement('script');
      for (const a of old.attributes) s.setAttribute(a.name, a.value);
      s.textContent = old.textContent;
      if ((s.type === 'text/babel' || s.type === 'text/jsx') && s.src) {
        const r = await fetch(s.src);
        s.textContent = await r.text();
        s.removeAttribute('src');
      }
      const p = s.src ? new Promise(function(r) { s.onload = s.onerror = r; }) : null;
      old.replaceWith(s);
      if (p) await p;
    }
    if (window.Babel && typeof window.Babel.transformScriptTags === 'function') {
      window.Babel.transformScriptTags();
    }
  } catch (err) {
    setStatus('Error unpacking: ' + err.message);
  }
});
/* NOLLPIC 꾸미기: 새싹 탐험가 (images/Character)
   - 기본 캐릭터(nollpic_base.png = nollpic_character(1)의 검은 배경을 지운 것) 위에 부품 PNG를 겹쳐 입힘
   - 입힐 때: images/Character/fitted (2026-10-07 사용자가 몸에 맞게 다시 그린 500×500 PNG)
     베이스와 아이템을 같은 크기로 (0,0)에 그대로 겹침. 모자나 헤어를 쓰면 새싹 없는 베이스
   - 헤어: images/Character/fitted/hair01~09 (hairstyles_20261007: 여 단발·긴 웨이브·양갈래·올림머리, 남 가르마·댄디컷·곱슬·스파이키 + bald_gray_20261007: 까까머리). 썸네일은 캐릭터 얼굴에 씌워서 보여 줌
   - 상점 썸네일: images/Character/thumb (small/의 단독 상품 그림을 160px로 줄인 것)
   - 포인트는 챌린지 포인트로만 삼 (현금 결제 없음). 저장: 이 기기(localStorage) */
(function () {
    const DIR = 'images/Character/thumb/';   // 상점 썸네일 160px (small/ 512px를 줄인 것, 개당 약 16KB)
    const FIT = 'images/Character/fitted/';
    const NOLLPIC_AVATAR_KEY = 'nollpic_avatar_v3';
    const NOLLPIC_SPENT_KEY = 'nollpic_points_spent';

    // 뒤 → 앞: 베이스 → 신발 → 하의 → 상의 → 헤어 → 모자 → 얼굴 (2026-10-13 사용자).
    const LAYER_ORDER = ['shoes', 'bottom', 'top', 'hair', 'head', 'face'];

    const SLOTS = [
        { key: 'hair', label: '헤어', file: 'hair' }, { key: 'head', label: '모자', file: 'head' }, { key: 'face', label: '얼굴', file: 'face' }, { key: 'top', label: '상의', file: 'top' },
        { key: 'bottom', label: '하의', file: 'bottom' }, { key: 'shoes', label: '신발', file: 'shose' },
    ];
    const NAMES = {
        hair:   ['단발', '긴 웨이브', '양갈래', '올림머리', '가르마', '댄디컷', '곱슬', '스파이키', '까까머리'],   // 9: bald_gray_20261007
        head:   [null, '토끼 후드', '곰 후드', '파란 캡', '탐험 모자', '털모자', '비행 모자', '고양이 헤드폰'],
        face:   ['하트 안경', null, '스키 고글', '동그란 안경', '마스크', '별 안경', '물안경', null],
        top:    ['토끼 후디', '탐험 셔츠', '야구 점퍼', '새싹 티', '별 티', '리본 블라우스', '보라 후디', '니트'],
        bottom: ['남색 반바지', '청반바지', '분홍 치마', '카고 반바지', '하트 치마', '갈색 반바지', '초록 반바지', '하늘 반바지'],
        shoes:  ['파란 운동화', '보라 운동화', '노랑 운동화', '갈색 부츠', '초록 운동화', null, '분홍 운동화', '하늘 운동화'],   // shose06은 shose02와 같은 그림이라 뺌
        // null = 뺀 아이템: 모자 큰 새싹·얼굴 장난 눈·볼터치 (2026-10-07 사용자)
    };
    // 가격: 목록 순서가 아니라 아이템이 얼마나 화려한지로 (기본 100 · 특별 150~200 · 화려 250~300). 헤어는 사용자가 정한 값 (2026-10-08 정리)
    const PRICE_OF = {
        'hair-01': 100, 'hair-02': 150, 'hair-03': 200, 'hair-04': 150, 'hair-05': 250, 'hair-06': 200, 'hair-07': 100, 'hair-08': 200, 'hair-09': 100,
        'head-02': 250, 'head-03': 250, 'head-04': 150, 'head-05': 200, 'head-06': 150, 'head-07': 300, 'head-08': 300,
        'face-01': 150, 'face-03': 200, 'face-04': 100, 'face-05': 100, 'face-06': 150, 'face-07': 150,
        'top-01': 250, 'top-02': 200, 'top-03': 250, 'top-04': 100, 'top-05': 100, 'top-06': 200, 'top-07': 200, 'top-08': 150,
        'bottom-01': 100, 'bottom-02': 100, 'bottom-03': 150, 'bottom-04': 150, 'bottom-05': 200, 'bottom-06': 100, 'bottom-07': 100, 'bottom-08': 100,
        'shoes-01': 100, 'shoes-02': 100, 'shoes-03': 100, 'shoes-04': 200, 'shoes-05': 100, 'shoes-07': 150, 'shoes-08': 100,
    };
    const ITEMS = [];
    SLOTS.forEach(({ key, file }) => NAMES[key].forEach((name, i) => {
        if (!name) return;
        const n = String(i + 1).padStart(2, '0');
        ITEMS.push({ id: `${key}-${n}`, slot: key, name, price: PRICE_OF[`${key}-${n}`] || 150, src: `${DIR}${file}${n}.png${key === 'head' && n === '04' ? '?v=20261007-baseballbrim' : ''}`, fit: `${FIT}${file}${n}.png${key === 'head' && (n === '04' || n === '05' || n === '07' || n === '08') ? (n === '04' ? '?v=20261007-baseballbrim' : n === '05' ? '?v=20261007-deep' : '?v=20261007-front') : key === 'face' && n === '05' ? '?v=20261007-mask' : key === 'top' && ['01', '03', '06', '07', '08'].includes(n) ? '?v=20261007-armwidth' : ''}`, noSprout: key === 'head' || key === 'hair' });   // 모자·헤드폰을 쓰면 새싹 없는 베이스 (헤드폰도 새싹 빼기: 2026-10-07 사용자)
    }));
    ITEMS.push(
        { id: 'top-09', slot: 'top', name: '스키복 풀세트', price: 500, src: `${FIT}top09.png`, fit: `${FIT}top09.png`, fullSet: true, matchingFace: 'face-03' },
        { id: 'top-10', slot: 'top', name: '수영복 풀세트', price: 400, src: `${FIT}top10.png`, fit: `${FIT}top10.png`, fullSet: true, matchingFace: 'face-07' }
    );
    const byId = Object.fromEntries(ITEMS.map(i => [i.id, i]));
    const DEFAULT = { owned: [], equip: { hair: null, head: null, face: null, top: null, bottom: null, shoes: null } };

    function read() {
        try {
            const v = JSON.parse(window.NollpicChallengeStorage.getItem(NOLLPIC_AVATAR_KEY) || 'null');
            if (v && Array.isArray(v.owned) && v.equip) { const equip = { ...DEFAULT.equip }; Object.keys(equip).forEach(k => { if (byId[v.equip[k]]) equip[k] = v.equip[k]; }); return { owned: v.owned.filter(id => byId[id]), equip }; }
        } catch (e) {}
        return JSON.parse(JSON.stringify(DEFAULT));
    }
    function save(v) { window.NollpicChallengeStorage.setItem(NOLLPIC_AVATAR_KEY, JSON.stringify(v)); }
    function spent() { return Math.max(0, Number(window.NollpicChallengeStorage.getItem(NOLLPIC_SPENT_KEY)) || 0); }
    function earned() { try { return getChallengePoints(readChallengeState()); } catch (e) { return 0; } }
    function balance() { return Math.max(0, earned() - spent()); }
    function josa(word, pair) { const c = String(word).charCodeAt(String(word).length - 1) - 0xAC00; const [x, y] = pair.split('/'); return word + (c >= 0 && c <= 11171 && c % 28 ? x : y); }

    // 보이는 영역 (전체 그림 512칸 기준): 몸 가운데로 x 120~392, y -16~496
    const VIEW = { x: 120, y: -16, w: 272, h: 512 };   // 위 16칸 여유: 늘린 토끼 귀가 잘리지 않게
    // k: 새싹 베이스(nollpic_base.png)는 512px 그림이고 아이템·새싹없는 베이스는 500px 캔버스 →
    //    같은 칸에 늘려 그리면 몸이 2.4% 커져 옷이 작아 보임. 그래서 실제 픽셀 크기(512/500배)로 그림
    // s: { sx 가로 배율, sy 세로 배율, oy 세로 기준점(0~1, 그림 위에서부터) } — 가로 기준은 몸 가운데 x≈260/512
    const layer = (src, k = 1, s = {}) => {
        const sx = s.sx || 1, sy = s.sy || 1;
        const tf = sx !== 1 || sy !== 1 ? `;transform:scale(${sx},${sy});transform-origin:50.8% ${((s.oy || 0) * 100).toFixed(1)}%` : '';
        return `<img src="${src}" alt="" draggable="false" style="left:${(-VIEW.x / VIEW.w * 100).toFixed(2)}%;top:${(-VIEW.y / VIEW.h * 100).toFixed(2)}%;width:${(512 * k / VIEW.w * 100).toFixed(2)}%${tf}${s.clip ? `;clip-path:${s.clip}` : ''}">`;
    };
    // 토끼 후드의 추가 확대를 제거해 곰 후드와 폭을 맞춤 (2026-10-13 사용자).
    // 의상 원래 비율을 유지하고 얼굴에 닿는 목선 윗부분만 가림.
    const COLLAR_FIT = { clip: 'inset(51% 0 0)' };
    const FIT_SLOT = { bottom: { sx: 1.08 }, top: { sx: 1.04, sy: 1.03, oy: 0.63, ...COLLAR_FIT } };
    // 원래 크기로 맞춘 긴팔 5종은 확대 없이 목선만 잘라냄.
    const FIT_ITEM = { 'top-01': COLLAR_FIT, 'top-03': COLLAR_FIT, 'top-06': COLLAR_FIT, 'top-07': COLLAR_FIT, 'top-08': COLLAR_FIT, 'top-09': { sx: 1.04, sy: 1.01 }, 'top-10': { sx: 1.04, sy: 1.01 }, 'head-02': {}, 'head-08': { sx: 0.88 }, 'head-04': { sx: 1.05 } };   // 파란 캡: 가로 살짝 넓게 (2026-10-07 사용자)   // 고양이 헤드폰: 얼굴 폭에 맞게 가로 좁게; 파란 캡은 야구모자 챙에 맞춘 PNG 사용
    function drawAvatar(equip = read().equip) {
        const hat = byId[equip.head] || byId[equip.hair];
        const parts = [hat && hat.noSprout ? layer(`${FIT}nollpic_base_no_sprout.png`) : layer(`${FIT}nollpic_base.png`, 512 / 500)];
        LAYER_ORDER.forEach(slot => {
            // 풀세트를 벗으면 이전 하의·신발이 다시 보이도록 장착 기록은 보존.
            if (byId[equip.top]?.fullSet && (slot === 'bottom' || slot === 'shoes')) return;
            const item = byId[equip[slot]];
            // 후드 밖 정수리는 가리고 얼굴 구멍 안 앞머리와 아래쪽 긴 머리는 유지.
            const fit = slot === 'hair' && equip.head === 'head-02' ? { clip: 'inset(26% 0 0)' } : FIT_ITEM[item?.id] || FIT_SLOT[slot];
            if (item) parts.push(layer(item.fit, 1, fit));
            // 전신 의상의 높은 목선은 기존 얼굴 뒤로 가리고 헤어·모자·안경 순서는 유지.
            if (slot === 'top' && item?.fullSet) parts.push(hat && hat.noSprout
                ? layer(`${FIT}nollpic_base_no_sprout.png`, 1, { clip: 'inset(0 0 49% 0)' })
                : layer(`${FIT}nollpic_base.png`, 512 / 500, { clip: 'inset(0 0 49% 0)' }));
        });
        return `<span class="av-doll" role="img" aria-label="내 캐릭터">${parts.join('')}</span>`;
    }

    /* ── 상점 ── */
    let shopSlot = 'hair', tryOn = null, mode = 'shop';   // mode: 'shop' 상점 | 'closet' 내 옷장 (산 것만, 입기/벗기)
    function buy(id) {
        const item = byId[id]; const v = read();
        if (!item || v.owned.includes(id)) return;
        if (balance() < item.price) { window.showChallengeToast?.(`💰 포인트가 ${item.price - balance()}P 모자라요. 놀이를 더 해 볼까요?`); return; }
        window.NollpicChallengeStorage.setItem(NOLLPIC_SPENT_KEY, String(spent() + item.price));
        v.owned.push(id); v.equip[item.slot] = id; save(v); tryOn = null;
        window.showChallengeToast?.(`🎉 ${josa(item.name, '을/를')} 얻었어요!`);
        refresh();
    }
    function equip(id) {
        const item = byId[id]; const v = read();
        if (!item || !v.owned.includes(id)) return;
        v.equip[item.slot] = v.equip[item.slot] === id ? null : id;   // 한 번 더 누르면 벗기
        save(v); tryOn = null; refresh();
    }
    function pick(id) {
        if (read().owned.includes(id)) equip(id); else { tryOn = tryOn === id ? null : id; refresh(); }
    }
    function setSlot(slot) { shopSlot = slot; tryOn = null; refresh(); }
    // 놀이하러 가기: 30일 챌린지 화면 맨 위(오늘의 놀이 카드)로
    function goPlay() {
        try { window.prevPage && window.prevPage(11); } catch (e) {}
        setTimeout(() => { const b = document.querySelector('#page-11 .challenge-home-body'); if (b) b.scrollTo({ top: 0, behavior: 'smooth' }); }, 60);
    }
    function setMode(m) { mode = m; tryOn = null; refresh(); }
    function undressAll() {
        const v = read(); Object.keys(v.equip).forEach(k => { v.equip[k] = null; }); save(v); refresh();
        window.showChallengeToast?.('👕 모두 벗었어요');
    }
    // 내 옷장: 산 아이템만 종류별로 모아서, 누르면 입기 / 한 번 더 누르면 벗기
    const thumb = (i) => i.slot === 'hair'
        ? `<span class="av-thumb av-thumb-hair">${drawAvatar({ hair: i.id })}</span>`
        : i.fullSet ? `<span class="av-thumb av-thumb-hair av-thumb-set">${drawAvatar({ top: i.id, face: i.matchingFace })}</span>`
        : `<span class="av-thumb"><img src="${i.src}" alt="" loading="lazy"></span>`;
    function closetHTML(v) {
        if (!v.owned.length) return `<div class="av-empty"><b>아직 옷장이 비어 있어요</b><small>놀이로 모은 포인트로 상점에서 아이템을 사 보세요</small><button type="button" class="av-buy" onclick="NollpicAvatar.setMode('shop')">상점 가기</button></div>`;
        const worn = Object.values(v.equip).some(Boolean);
        return SLOTS.map(sl => {
            const mine = ITEMS.filter(i => i.slot === sl.key && v.owned.includes(i.id));
            if (!mine.length) return '';
            return `<h4 class="av-group">${sl.label}</h4><div class="av-items">${mine.map(i => {
                const on = v.equip[i.slot] === i.id;
                return `<button type="button" class="av-item${on ? ' is-worn' : ''}" onclick="NollpicAvatar.equip('${i.id}')">${thumb(i)}<b>${i.name}</b><em class="${on ? 'worn' : 'own'}">${on ? '입는 중' : '입기'}</em></button>`;
            }).join('')}</div>`;
        }).join('') + (worn ? '<button type="button" class="av-undress" onclick="NollpicAvatar.undressAll()">모두 벗기</button>' : '');
    }

    function renderShop(container) {
        if (!container) return;
        const v = read(), bal = balance();
        const shown = { ...v.equip };
        const tryItem = tryOn && byId[tryOn];
        if (tryItem) shown[tryItem.slot] = tryItem.id;
        const list = ITEMS.filter(i => i.slot === shopSlot);
        const stage = document.getElementById('av-stage');
        if (stage) stage.innerHTML = drawAvatar(shown);
        container.innerHTML = `
            <section class="cp-card av-shop">
                <div class="av-mode"><button type="button" class="${mode === 'shop' ? 'on' : ''}" onclick="NollpicAvatar.setMode('shop')">🛍️ 상점</button><button type="button" class="${mode === 'closet' ? 'on' : ''}" onclick="NollpicAvatar.setMode('closet')">👕 내 옷장 <em>${v.owned.length}</em></button></div>
                ${mode === 'closet' ? closetHTML(v) : `
                <div class="av-wallet"><span>💰 ${bal.toLocaleString('ko-KR')}P</span>${tryItem ? (bal >= tryItem.price ? `<button type="button" class="av-buy" onclick="NollpicAvatar.buy('${tryItem.id}')">${tryItem.price}P로 사기</button>` : `<button type="button" class="av-buy av-earn" onclick="NollpicAvatar.goPlay()">🎮 놀이하고 ${(tryItem.price - bal).toLocaleString('ko-KR')}P 모으기</button>`) : '<small>아이템을 눌러 입어 보세요</small>'}</div>
                <div class="av-tabs">${SLOTS.map(sl => `<button type="button" class="${sl.key === shopSlot ? 'on' : ''}" onclick="NollpicAvatar.setSlot('${sl.key}')">${sl.label}</button>`).join('')}</div>
                <div class="av-items">${list.map(i => {
                    const owned = v.owned.includes(i.id), on = v.equip[i.slot] === i.id, trying = tryOn === i.id;
                    const tag = on ? '<em class="worn">입는 중</em>' : owned ? '<em class="own">가짐</em>' : `<em>${i.price}P</em>`;
                    return `<button type="button" class="av-item${on ? ' is-worn' : ''}${trying ? ' is-try' : ''}" onclick="NollpicAvatar.pick('${i.id}')">${thumb(i)}<b>${i.name}</b>${tag}</button>`;
                }).join('')}</div>`}
            </section>`;
    }
    function refresh() {
        renderShop(document.getElementById('av-shop'));
        try { renderChallengeState(); } catch (e) {}
        try { if (document.getElementById('page-15')?.classList.contains('active')) renderChallengePanels(); } catch (e) {}
    }

    window.NollpicAvatar = { ITEMS, goPlay, setMode, undressAll, read, balance, spent, drawAvatar, renderShop, buy, equip, pick, setSlot };
    window.addEventListener('nollpic-challenge-context', () => { tryOn = null; refresh(); });
})();

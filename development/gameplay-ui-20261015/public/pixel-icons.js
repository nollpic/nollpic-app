/* NOLLPIC 픽셀 블록 아이콘 (로블록스 느낌): 이모지 대신 16×16 픽셀 그림
   - window.pixIcon('🔥')  → <i class="px-ico" ...></i>  (없는 이모지는 그대로 글자로)
   - 그림은 글자 지도(rows)나 함수(x, y → 색 글자)로 그림. 왼쪽 절반만 그리고 좌우 대칭(mirror)도 됨 */
(function () {
    const mirror = rows => rows.map(r => { r = (r || '').padEnd(8, '.').slice(0, 8); return r + [...r].reverse().join(''); });
    const pad = rows => Array.from({ length: 16 }, (_, y) => (rows[y] || '').padEnd(16, '.').slice(0, 16));
    const fromFn = fn => Array.from({ length: 16 }, (_, y) => Array.from({ length: 16 }, (_, x) => fn(x, y) || '.').join(''));
    const svg = (rows, pal, extra) => {
        const grid = pad(rows).map(r => [...r]);
        if (extra) Object.entries(extra).forEach(([k, ch]) => { const [x, y] = k.split(',').map(Number); grid[y][x] = ch; });
        let s = '';
        grid.forEach((row, y) => row.forEach((ch, x) => { if (pal[ch]) s += `<rect x='${x}' y='${y}' width='1' height='1' fill='${pal[ch]}'/>`; }));
        return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' shape-rendering='crispEdges'>${s}</svg>`;
    };
    // 채운 칸 중 바깥(빈칸)과 맞닿은 칸을 테두리 'o'로
    const outline = rows => rows.map((r, y) => [...r].map((ch, x) => {
        if (ch === '.') return '.';
        const empty = (xx, yy) => xx < 0 || yy < 0 || xx > 15 || yy > 15 || rows[yy][xx] === '.';
        return empty(x - 1, y) || empty(x + 1, y) || empty(x, y - 1) || empty(x, y + 1) ? 'o' : ch;
    }).join(''));
    // 원: 가운데 (cx, cy), 반지름별로 색 글자
    const ring = (cx, cy, bands) => (x, y) => {
        const d = Math.hypot(x + .5 - cx, y + .5 - cy);
        for (const [r, ch] of bands) if (d <= r) return ch;
        return null;
    };
    const GOLD = { o: '#8a5a00', y: '#ffc83d', b: '#fff0a0', c: '#e09a00' };

    const ICONS = {
        '🔥': svg(mirror(['', '', '.......o', '......or', '.....orr', '..o.orrr', '..ororrr', '.orrrrry', '.orrrryy', 'orrrryyy', 'orrryyyw', 'orrryyww', '.orryyww', '..orryyy', '...ooooo', '']),
            { o: '#9a2a0a', r: '#ff5a1f', y: '#ffb020', w: '#fff2a0' }),
        '🏆': svg(mirror(['', '...ooooo', '.ooobyyy', '.o.obyyy', '.o.obyyy', '.oo.obyy', '..ooobyy', '.....oby', '......oy', '......oy', '.....oby', '....oooo', '....obbb', '....occc', '....oooo', '']), GOLD),
        '🥇': null,
        '🧭': svg(fromFn((x, y) => {
            const c = ring(8, 8, [[2.2, 'w'], [5.6, 'w'], [6.6, 'a'], [7.6, 'o']])(x, y);
            if (!c) return null;
            if ((x === 7 || x === 8) && y >= 3 && y <= 7) return 'r';
            if ((x === 7 || x === 8) && y >= 8 && y <= 12) return 'g';
            if ((x === 6 || x === 9) && (y === 7 || y === 8)) return y === 7 ? 'r' : 'g';
            return c;
        }), { o: '#1e3f8a', a: '#4d8df5', w: '#ffffff', r: '#ff4d4f', g: '#9aa6b8' }),
        '📏': svg(['', '', '', '', '', '.oooooooooooooo.', '.oyoyyoyyoyyoyo.', '.oyoyyoyyoyyoyo.', '.oyyyyyyyyyyyyo.', '.oyyyyyyyyyyyyo.', '.occcccccccccco.', '.oooooooooooooo.'],
            { o: '#7a4a00', y: '#ffd23f', c: '#e0a800' }),
        '🌱': svg(mirror(['', '', '', '..ooo...', '.ogggo..', 'oglgggo.', 'ogggggo.', '.ogggggs', '..ooooos', '.......s', '.......s', '...ppppp', '...pbbbb', '....pbbb', '....pppp', '']),
            { o: '#1d5c2e', g: '#4cc95a', l: '#9cf08a', s: '#2e9a40', p: '#7a3e14', b: '#c8763a' }),
        '🎁': svg(mirror(['', '', '...ooo.o', '..oyyyoy', '...oooyy', '.ooooooo', '.obbbbby', '.ooooooy', '..orrrry', '..orrrry', '..orrrry', '..orrrry', '..occccy', '..oooooo', '', '']),
            { o: '#7a1f1f', r: '#f0473f', b: '#ff9a8f', c: '#b8262a', y: '#ffd23f' }),
        '👕': svg(mirror(['', '', '...ooo..', '..oaaaoo', '.oaaaaaa', 'oaaaaaaa', 'obaaaaaa', 'oooaaaaa', '..oaaaaa', '..oaaaaa', '..oaaaaa', '..oaaaaa', '..oaaaaa', '..oooooo', '', '']),
            { o: '#1d5c2e', a: '#4cc95a', b: '#9cf08a', s: '#ffffff' }, { '7,8': 's', '8,8': 's', '6,7': 's', '9,7': 's', '7,9': 's', '8,9': 's' }),
        '🎯': svg(fromFn(ring(8, 8, [[1.6, 'r'], [3.2, 'w'], [4.8, 'r'], [6.4, 'w'], [7.4, 'r'], [8, 'o']])), { o: '#8a1f1f', r: '#ff4d4f', w: '#ffffff' }),
        '🧩': svg(['', '......oooo', '.....obbaao', '.....oaaaao', '..oooooaaooooo', '..obbbaaaaaaao', '..obaaaaaaaaaooo', '..obaaaaaaaaaaao', '..oaaaaaaaaaaaco', '..oaaaaaaaaaacco', '..oaaaaaaaaaaooo', '..oaaaaaaaaaco', '..oaaaaaaaaaco', '..occcccccccco', '..oooooooooooo'],
            { o: '#1e3f8a', a: '#4d8df5', b: '#9cc3ff', c: '#2f63c9' }),
        '⚡': svg(['', '', '........oooo', '.......oyyo', '......oyyo', '.....oyyo', '....oyyyoooo', '...oyyyyyyyo', '...ooooyyyo', '......oyyo', '.....oyyo', '....oyyo', '...oyo', '...oo'],
            { o: '#8a5a00', y: '#ffc83d' }),
        '🔍': svg(fromFn((x, y) => {
            const c = ring(6.5, 6.5, [[3.4, 'w'], [4.6, 'l'], [5.6, 'o']])(x, y);
            if (c) return c === 'w' && x + y < 9 ? 'h' : c;
            if (x >= 9 && y >= 9 && Math.abs(x - y) <= 1 && x <= 14) return 'b';
            return null;
        }), { o: '#3b2a8a', l: '#8b5cf6', w: '#dff4ff', h: '#ffffff', b: '#6b3d1f' }),
        // 손바닥: 손가락 4개 + 엄지 + 손바닥 모양을 채운 뒤 가장자리를 테두리로
        '✋': svg(outline(fromFn((x, y) => {
            const finger = [[3, 3], [5, 1], [8, 1], [10, 3]].some(([fx, top]) => x >= fx && x <= fx + 2 && y >= top && y <= 9);
            const thumb = x >= 1 && x <= 3 && y >= 7 && y <= 11;
            const palm = x >= 3 && x <= 12 && y >= 8 && y <= 14;
            return finger || thumb || palm ? (x === 4 || x === 6 || x === 9 || x === 11) && y < 9 ? 'l' : 's' : null;
        })), { o: '#8a5a2e', s: '#ffc9a0', l: '#ffe0c8' }),
    };


    // ── 메달(금·은·동), 상자, 로켓, 별, 주사위 ──
    const medal = (y, b, c, o) => svg(['................', '...rrr....uuu...', '...rrrr..uuuu...', '....rrr..uuu....', '.....rrruuu.....', '......rruu......', '.....oooooo.....', '....oyyyyyyo....', '...oyybyyyyco...', '...oyyywyyyco...', '...oyywwwyyco...', '...oyyywyyyco...', '....oyyyyyco....', '.....oooooo.....'],
        { o, y, b, c, w: '#ffffff', r: '#ff5a5f', u: '#3b82f6' });
    Object.assign(ICONS, {
        '🥇': medal('#ffc83d', '#fff0a0', '#e09a00', '#8a5a00'),
        '🥈': medal('#c9d2df', '#f2f5f9', '#9aa6b8', '#56627a'),
        '🥉': medal('#e0955a', '#f6c9a2', '#b0662e', '#6a3814'),
        '📦': svg(['', '', '', '..oooooooooooo', '.obbbbbbbbbbbbo', '.obbbbyybbbbbbo', '.oooooyyoooooo.', '.owwwwyywwwwwo', '.owwwwkkwwwwwo', '.owwwwkkwwwwwo', '.owwwwwwwwwwwo', '.occcccccccccco', '.oooooooooooooo'].map(r => r.padEnd(16, '.')),
            { o: '#5a3412', b: '#c8763a', w: '#a8602a', c: '#7a4418', y: '#ffd23f', k: '#5a3a00' }),
        '🚀': svg(['.......oo', '......orro', '.....orrrro', '.....owwwwo', '.....owbbwo', '.....owbbwo', '.....owwwwo', '....oowwwwoo', '...orowwwworo', '..orrowwwworro', '..orroowwoorro', '..ooo.oyyo.ooo', '......oyyo', '.......ff'],
            { o: '#14213d', r: '#ff5a5f', w: '#eef2f8', b: '#4d8df5', y: '#ffd23f', f: '#ff9b2f' }),
        '🌟': svg(outline(fromFn((x, y) => {
            const cx = x + .5 - 8, cy = y + .5 - 8.6, a = Math.atan2(cy, cx), r = Math.hypot(cx, cy);
            const k = Math.cos(5 * (a + Math.PI / 2)) * .5 + .5;   // 별 모양: 꼭짓점 5개
            return r <= 3.4 + 4 * k ** 2 ? (cx < 0 && cy < 0 ? 'l' : 'y') : null;
        })), { o: '#a86a00', y: '#ffc83d', l: '#fff0a0' }),
        '🎲': svg(fromFn((x, y) => {
            if (x < 2 || y < 2 || x > 13 || y > 13) return null;
            if (x === 2 || y === 2 || x === 13 || y === 13) return 'o';
            const dots = [[4, 4], [7, 7], [10, 10], [4, 10], [10, 4]];
            return dots.some(([dx, dy]) => x >= dx && x <= dx + 1 && y >= dy && y <= dy + 1) ? 'd' : 'w';
        }), { o: '#14213d', w: '#ffffff', d: '#ff5a5f' }),
    });

    // 타원 안인지 (x, y 칸 가운데 기준)
    const ell = (cx, cy, rx, ry) => (x, y) => ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1;
    // ── 닉네임 동물 10종 (app.js NICK_ANIMAL): 얼굴 위주 ──
    const E = (x, y, pts) => pts.some(([px, py]) => px === x && py === y);
    const animal = (fn, pal) => svg(outline(fromFn(fn)), { o: '#3a2a1a', e: '#14213d', n: '#3a2a1a', w: '#ffffff', ...pal });
    const eyes = (x, y) => E(x, y, [[5, 8], [10, 8]]) ? 'e' : null;
    Object.assign(ICONS, {
        '🦦': animal((x, y) => {   // 수달: 갈색, 작은 귀, 밝은 주둥이
            if (ell(3.5, 4.5, 1.6, 1.6)(x, y) || ell(12.5, 4.5, 1.6, 1.6)(x, y)) return 'b';
            if (!ell(8, 9, 6.4, 5.6)(x, y)) return null;
            return eyes(x, y) || (E(x, y, [[7, 10], [8, 10]]) ? 'n' : ell(8, 11.4, 3.4, 2.2)(x, y) ? 'l' : 'b');
        }, { b: '#a8682e', l: '#f2d2a8' }),
        '🐧': animal((x, y) => {   // 펭귄: 검은 머리, 흰 얼굴, 주황 부리
            if (!ell(8, 8.5, 6.6, 6.4)(x, y)) return null;
            if (E(x, y, [[7, 10], [8, 10], [7, 11], [8, 11]])) return 'y';
            if (E(x, y, [[5, 8], [10, 8]])) return 'e';
            return ell(5.5, 9.5, 2.6, 3.4)(x, y) || ell(10.5, 9.5, 2.6, 3.4)(x, y) || ell(8, 12, 3, 2.4)(x, y) ? 'w' : 'k';
        }, { k: '#1f2a44', y: '#ff9b2f' }),
        '🐿️': animal((x, y) => {   // 다람쥐: 뾰족 귀, 밝은 볼, 앞니
            if (y >= 1 && y <= 5 && (Math.abs(x + .5 - 3.5) <= (y - 0.5) * 0.45 || Math.abs(x + .5 - 12.5) <= (y - 0.5) * 0.45)) return 'b';
            if (!ell(8, 9.5, 6.4, 5.4)(x, y)) return null;
            if (E(x, y, [[7, 12], [8, 12]])) return 'w';
            return eyes(x, y) || (E(x, y, [[7, 10], [8, 10]]) ? 'n' : ell(4.5, 11, 1.8, 1.6)(x, y) || ell(11.5, 11, 1.8, 1.6)(x, y) ? 'l' : 'b');
        }, { b: '#d9822b', l: '#ffd8a8' }),
        '🐳': animal((x, y) => {   // 고래: 옆모습 + 물줄기
            if (E(x, y, [[6, 1], [8, 1], [7, 2], [7, 3]])) return 'c';
            if (x >= 12 && x <= 15 && y >= 4 && y <= 10 && Math.abs(y + .5 - 7.5) <= (x - 11) * 0.9) return 'b';
            if (!ell(7, 9.5, 6.6, 4.6)(x, y)) return null;
            if (E(x, y, [[4, 9]])) return 'e';
            return y >= 11 ? 'l' : 'b';
        }, { b: '#4d8df5', l: '#cfe2ff', c: '#7fd3ff' }),
        '🦉': animal((x, y) => {   // 부엉이: 귀깃, 큰 눈, 부리
            if (E(x, y, [[3, 2], [3, 3], [4, 3], [12, 2], [12, 3], [11, 3]])) return 'b';
            if (!ell(8, 9, 6.4, 6)(x, y)) return null;
            if (E(x, y, [[5, 8], [10, 8]])) return 'e';
            if (ell(5.5, 8.5, 2.2, 2.2)(x, y) || ell(10.5, 8.5, 2.2, 2.2)(x, y)) return 'w';
            if (E(x, y, [[7, 10], [8, 10], [7, 11], [8, 11]])) return 'y';
            return y >= 12 ? 'l' : 'b';
        }, { b: '#8a5a2e', l: '#d8b088', y: '#ffb020' }),
        '🦊': animal((x, y) => {   // 여우: 세모 귀, 흰 아랫볼
            if (y >= 1 && y <= 6 && (Math.abs(x + .5 - 3.5) <= (y - 0.5) * 0.5 || Math.abs(x + .5 - 12.5) <= (y - 0.5) * 0.5)) return y >= 4 && (x === 3 || x === 12) ? 'k' : 'r';
            if (!ell(8, 9, 6.6, 5.4)(x, y)) return null;
            if (E(x, y, [[7, 12], [8, 12]])) return 'n';
            return eyes(x, y) || (y >= 10 && Math.abs(x + .5 - 8) >= 1.2 ? 'w' : 'r');
        }, { r: '#ff8a2a', k: '#3a2a1a' }),
        '🐼': animal((x, y) => {   // 판다: 검은 귀, 눈 무늬
            if (ell(3.5, 4, 2, 2)(x, y) || ell(12.5, 4, 2, 2)(x, y)) return 'k';
            if (!ell(8, 9, 6.6, 5.8)(x, y)) return null;
            if (E(x, y, [[5, 8], [10, 8]])) return 'w';
            if (ell(5, 8.5, 1.8, 2.1)(x, y) || ell(11, 8.5, 1.8, 2.1)(x, y)) return 'k';
            return E(x, y, [[7, 11], [8, 11]]) ? 'k' : 'w';
        }, { k: '#1f2a44' }),
        '🐰': animal((x, y) => {   // 토끼: 긴 귀(분홍 안쪽)
            if (y <= 6 && (Math.abs(x + .5 - 5) <= 1.5 || Math.abs(x + .5 - 11) <= 1.5)) return (x === 5 || x === 10) && y >= 1 && y <= 5 ? 'p' : 'w';
            if (!ell(8, 10, 6.4, 5.2)(x, y)) return null;
            if (E(x, y, [[5, 9], [10, 9]])) return 'e';
            if (E(x, y, [[7, 11], [8, 11]])) return 'p';
            return ell(4, 11.5, 1.4, 1)(x, y) || ell(12, 11.5, 1.4, 1)(x, y) ? 'c' : 'w';
        }, { p: '#ff9ab8', c: '#ffc2d4' }),
        '🐢': animal((x, y) => {   // 거북이: 위에서 본 등딱지 + 머리
            if (ell(8, 2.6, 2, 2)(x, y)) return E(x, y, [[7, 2], [8, 2]]) ? 'e' : 'g';
            if (ell(3, 6, 1.5, 1.3)(x, y) || ell(13, 6, 1.5, 1.3)(x, y) || ell(3.4, 13, 1.5, 1.3)(x, y) || ell(12.6, 13, 1.5, 1.3)(x, y)) return 'g';
            if (!ell(8, 9.5, 5.6, 5.2)(x, y)) return null;
            const m = Math.abs(x + .5 - 8) + Math.abs(y + .5 - 9.5);
            return m > 2.6 && m < 3.6 ? 'd' : 's';
        }, { g: '#7fd36a', s: '#4cc95a', d: '#2e7a32' }),
        '🦁': animal((x, y) => {   // 사자: 갈기 + 노란 얼굴
            if (!ell(8, 8.5, 7.4, 7.2)(x, y)) return null;
            if (!ell(8, 9, 4.6, 4.4)(x, y)) return (x + y) % 3 ? 'm' : 'M';
            if (E(x, y, [[6, 8], [9, 8]])) return 'e';
            if (E(x, y, [[7, 10], [8, 10]])) return 'n';
            return ell(8, 11.4, 2.4, 1.6)(x, y) ? 'l' : 'y';
        }, { m: '#d9822b', M: '#b0601e', y: '#ffc83d', l: '#fff0c0' }),
    });
    ICONS['🐿'] = ICONS['🐿️'];

    // ── 놀이 18종 그림 (CHALLENGE_GAMES emoji) + 자주 쓰는 장식 ──
    const glass = (lens) => svg(fromFn((x, y) => {
        const c = ring(6.5, 6.5, [[3.4, 'w'], [4.6, 'l'], [5.6, 'o']])(x, y);
        if (c) return c === 'w' && x + y < 9 ? 'h' : c;
        if (x >= 9 && y >= 9 && Math.abs(x - y) <= 1 && x <= 14) return 'b';
        return null;
    }), { o: '#1d4f3a', l: lens, w: '#e8fff2', h: '#ffffff', b: '#6b3d1f' });
    Object.assign(ICONS, {
        // 기억 공방: 연어 초밥
        '🍣': svg(outline(fromFn((x, y) => {
            const salmon = ell(8, 7.2, 7, 2.8)(x, y), rice = ell(8, 10.2, 6.4, 3.6)(x, y);
            if (salmon && y <= 8) return (x - y + 20) % 3 === 0 ? 'l' : 'r';
            if (rice) return x >= 7 && x <= 8 ? 'n' : 'w';
            return null;
        })), { o: '#7a2a1a', r: '#ff8a5c', l: '#ffd0b8', w: '#ffffff', n: '#1f3b2a' }),
        // 숫자더하기: 색 블록 4개 (가운데 점 = 숫자 칸)
        '🔢': svg(fromFn((x, y) => {
            const bx = x < 8 ? 0 : 1, by = y < 8 ? 0 : 1, lx = x % 8, ly = y % 8;
            if (lx < 1 || ly < 1 || lx > 6 || ly > 6) return null;
            const col = ['r', 'b', 'g', 'y'][by * 2 + bx];
            if (lx === 1 || ly === 1 || lx === 6 || ly === 6) return 'o';
            if (lx >= 3 && lx <= 4 && ly >= 3 && ly <= 4) return 'w';
            return col;
        }), { o: '#14213d', r: '#ff5a5f', b: '#4d8df5', g: '#4cc95a', y: '#ffc83d', w: '#ffffff' }),
        // 모양기억(젠가): 나무 블록 쌓기
        '🧱': svg(fromFn((x, y) => {
            if (y < 2 || y > 14 || x < 1 || x > 14) return null;
            const layer = Math.floor((y - 2) / 3), ly = (y - 2) % 3;
            if (ly === 2) return 'o';
            const seams = layer % 2 ? [5, 10] : [7];
            if (x === 1 || x === 14 || seams.includes(x)) return 'o';
            return ly === 0 ? 'l' : 'w';
        }), { o: '#7a4a1e', w: '#e8b878', l: '#f6d7a8' }),
        // 색 조각 맞추기: 팔레트
        '🎨': svg(outline(fromFn((x, y) => {
            if (!ell(8, 8.5, 7.2, 6)(x, y) || ell(11.5, 11, 1.8, 1.6)(x, y)) return null;
            if (ell(5, 6, 1.4, 1.4)(x, y)) return 'r';
            if (ell(8.5, 4.5, 1.4, 1.4)(x, y)) return 'y';
            if (ell(4.5, 10, 1.4, 1.4)(x, y)) return 'b';
            if (ell(12, 6.5, 1.4, 1.4)(x, y)) return 'g';
            return 'w';
        })), { o: '#7a4a1e', w: '#f6d7a8', r: '#ff5a5f', y: '#ffc83d', b: '#4d8df5', g: '#4cc95a' }),
        // 9칸 위치기억: 3×3 칸, 하나가 반짝
        '🔲': svg(fromFn((x, y) => {
            if (x < 1 || y < 1 || x > 14 || y > 14) return null;
            const lx = (x - 1) % 5, ly = (y - 1) % 5, cx = Math.floor((x - 1) / 5), cy = Math.floor((y - 1) / 5);
            if (lx === 4 || ly === 4) return null;
            const on = cx === 2 && cy === 0;
            if (lx === 0 || ly === 0 || lx === 3 || ly === 3) return on ? 'O' : 'o';
            return on ? 'y' : 'w';
        }), { o: '#3b2a8a', w: '#d9ccff', O: '#a86a00', y: '#ffd23f' }),
        // 색깔 블록 연산: 주판
        '🧮': svg(fromFn((x, y) => {
            if (x < 1 || x > 14 || y < 2 || y > 14) return null;
            if (x === 1 || x === 14 || y === 2 || y === 14) return 'f';
            if (y === 5 || y === 8 || y === 11) {
                const beads = { 5: [[3, 6], 'r'], 8: [[7, 10], 'b'], 11: [[4, 8], 'g'] }[y];
                return x >= beads[0][0] && x <= beads[0][1] ? beads[1] : 'k';
            }
            if ((y === 4 || y === 6 || y === 7 || y === 9 || y === 10 || y === 12)) {
                const row = y < 7 ? [[3, 6], 'r'] : y < 10 ? [[7, 10], 'b'] : [[4, 8], 'g'];
                if ((y === 4 || y === 7 || y === 10) ? false : x >= row[0][0] && x <= row[0][1]) return row[1];
            }
            return null;
        }), { f: '#7a4a1e', k: '#c8a070', r: '#ff5a5f', b: '#4d8df5', g: '#4cc95a' }),
        // 색깔대로 말해요: 무지개
        '🌈': svg(fromFn((x, y) => {
            if (y > 12) return null;
            const d = Math.hypot(x + .5 - 8, y + .5 - 12.5);
            const bands = [[7.5, 'r'], [6.3, 'n'], [5.1, 'y'], [3.9, 'g'], [2.7, 'b']];
            if (d > 7.5 || d < 1.6) return null;
            let ch = 'b'; for (const [r, c] of bands) if (d <= r) ch = c;
            return ch;
        }), { r: '#ff5a5f', n: '#ff9b2f', y: '#ffd23f', g: '#4cc95a', b: '#4d8df5' }),
        // 거꾸로 369: 빙글 화살표
        '🔁': svg(fromFn((x, y) => {
            const d = Math.hypot(x + .5 - 8, y + .5 - 8.5);
            const arrow = (x >= 10 && x <= 14 && y >= 1 && y <= 5 && x - 10 >= Math.abs(y - 3) * 0 && (14 - x) >= Math.abs(y - 3) - 0) ;
            if (x >= 10 && x <= 14 && y >= 1 && y <= 5 && Math.abs(y - 3) <= 14 - x) return 'a';
            if (d >= 3.6 && d <= 6.2 && !(x >= 9 && y <= 6)) return d <= 4.6 ? 'l' : 'a';
            return null;
        }), { a: '#7c4dff', l: '#b9a2ff' }),
        // 생선 굽기
        '🐟': svg(outline(fromFn((x, y) => {
            if (ell(7, 8, 6, 4.2)(x, y)) return x === 4 && y === 7 ? 'e' : y <= 7 ? 'b' : 'l';
            if (x >= 12 && x <= 15 && Math.abs(y + .5 - 8) <= (x - 11) * 1.1) return 'b';
            return null;
        })), { o: '#1e3f8a', b: '#4d8df5', l: '#9cc3ff', e: '#14213d' }),
        // 컬러 드롭: 물방울
        '💧': svg(outline(fromFn((x, y) => {
            const drop = ell(8, 10, 5, 4.8)(x, y) || (y >= 1 && y <= 9 && Math.abs(x + .5 - 8) <= (y - 1) * 0.62);
            if (!drop) return null;
            return ell(6, 9.5, 1.2, 2)(x, y) ? 'h' : 'b';
        })), { o: '#1e3f8a', b: '#39b9f2', h: '#e6f8ff' }),
        // 재료 조립하기: 햄버거
        '🍔': svg(fromFn((x, y) => {
            const w = (top, bot, ch, inset) => y >= top && y <= bot && x >= 1 + inset && x <= 14 - inset ? ch : null;
            return w(2, 2, 'B', 4) || w(3, 3, 'B', 2) || w(4, 5, 'B', 1) || w(6, 6, 'g', 0) || w(7, 7, 'c', 1) || w(8, 9, 'm', 1) || w(10, 10, 'g', 1) || w(11, 13, 'B', 1) || (y === 4 && (x === 5 || x === 9) ? 'w' : null);
        }), { B: '#e8a04a', g: '#4cc95a', c: '#ffd23f', m: '#7a3e14', w: '#fff3d6' }),
        // 같은 모양 길 잇기: 세모
        '🔺': svg(outline(fromFn((x, y) => y >= 2 && y <= 13 && Math.abs(x + .5 - 8) <= (y - 1) * 0.6 ? (x < 8 && y > 6 ? 'l' : 'r') : null)),
            { o: '#8a1f1f', r: '#ff5a5f', l: '#ff9a8f' }),
        // 탁구 랠리: 라켓 + 공
        '🏓': svg(outline(fromFn((x, y) => {
            if (ell(7, 6.5, 5.4, 5.4)(x, y)) return 'r';
            if (x >= 9 && x <= 11 && y >= 10 && y <= 14 && Math.abs(x - y + 1) <= 2) return 'h';
            if (ell(13, 3, 1.8, 1.8)(x, y)) return 'w';
            return null;
        })), { o: '#5a1414', r: '#ff4d4f', h: '#c8763a', w: '#fff3a0' }),
        // 숫자로 찾기: 초록 돋보기
        '🔎': glass('#4cc95a'),
        // 블록 합치기: 파란 블록 두 개가 하나로
        '🟦': svg(fromFn((x, y) => {
            const blk = (x0, y0, s) => x >= x0 && x < x0 + s && y >= y0 && y < y0 + s ? (x === x0 || y === y0 || x === x0 + s - 1 || y === y0 + s - 1 ? 'o' : (x === x0 + 1 || y === y0 + 1) ? 'l' : 'b') : null;
            return blk(1, 1, 6) || blk(1, 8, 6) || blk(8, 3, 8);
        }), { o: '#1e3f8a', b: '#4d8df5', l: '#9cc3ff' }),
        // 꼬인 길 작전: 실타래
        '🧵': svg(outline(fromFn((x, y) => {
            if (!ell(8, 8, 6.4, 6.4)(x, y)) return null;
            return (x + y) % 4 === 0 || (x - y + 16) % 5 === 0 ? 'd' : 'p';
        })), { o: '#7a1f4a', p: '#ff8ac0', d: '#d94f8f' }),
        // 축하 폭죽
        '🎉': svg(fromFn((x, y) => {
            const u = x - 1, v = 14 - y;   // 왼쪽 아래 꼭짓점에서 오른쪽 위로 벌어지는 고깔
            if (u >= 0 && v >= 0 && u + v <= 10 && Math.abs(u - v) <= 0.5 * (u + v) + 0.5) return Math.floor((u + v) / 2) % 2 ? 'r' : 'y';
            const conf = { '11,2': 'b', '14,4': 'r', '12,6': 'g', '14,9': 'y', '9,3': 'p', '13,11': 'b', '7,2': 'g', '15,1': 'r', '10,8': 'p' };
            return conf[`${x},${y}`] || null;
        }), { y: '#ffc83d', r: '#ff5a5f', b: '#4d8df5', g: '#4cc95a', p: '#b98cff' }),
        // 자물쇠
        '🔒': svg(fromFn((x, y) => {
            const d = Math.hypot(x + .5 - 8, y + .5 - 7);
            if (y <= 7 && d >= 2.8 && d <= 4.6 && y >= 2) return 'g';
            if (x >= 3 && x <= 12 && y >= 7 && y <= 14) return x === 3 || x === 12 || y === 7 || y === 14 ? 'o' : (x >= 7 && x <= 8 && y >= 9 && y <= 12) ? 'k' : 'y';
            return null;
        }), { g: '#9aa6b8', o: '#8a5a00', y: '#ffc83d', k: '#5a3a00' }),
        // 교구 상자
        '🧰': svg(['', '', '.....oooooo', '.....o....o', '.oooooooooooooo', '.obbbbbbbbbbbbo', '.obaaaaaaaaaaao', '.oaaaaaaaaaaaao', '.ooooooyyoooooo', '.oaaaaayyaaaaao', '.oaaaaaaaaaaaao', '.oaaaaaaaaaaaao', '.occcccccccccco', '.oooooooooooooo'],
            { o: '#7a1f1f', a: '#f0473f', b: '#ff9a8f', c: '#b8262a', y: '#ffd23f' }),
    });
    const url = s => `url('data:image/svg+xml,${encodeURIComponent(s).replace(/'/g, '%27')}')`;   // 작은따옴표: style="..." 속성 안에 넣기 때문
    const CSS = {};
    Object.entries(ICONS).forEach(([k, s]) => { if (s) CSS[k] = url(s); });

    window.PIXEL_ICONS = CSS;
    window.pixIcon = (emoji, cls = '') => CSS[emoji]
        ? `<i class="px-ico ${cls}" style="background-image:${CSS[emoji]}" aria-hidden="true"></i>`
        : String(emoji ?? '');
})();

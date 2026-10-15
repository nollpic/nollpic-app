/* 놀이 난이도 버전: 주소의 ?level=1|2|3 (저학년·중학년·고학년)으로 시작 단계를 정함
   - 앱(index.html gameUrl)이 아이 학년에 맞춰 level을 붙여서 놀이를 엶
   - 놀이도감(_dev/놀이도감.html)에서 버전별로 바로 실행할 때도 같은 주소를 씀
   - 놀이마다 단계를 고르는 함수가 달라서, 파일 이름별로 방법을 정함 (놀이 원래 코드는 그대로) */
(function () {
    const L = Math.max(1, Math.min(3, Number(new URLSearchParams(location.search).get('level')) || 0));
    if (!new URLSearchParams(location.search).get('level')) return;   // level이 없으면 원래대로
    const file = (location.pathname.split('/').pop() || '').replace('.html', '');
    window.NOLLPIC_GAME_LEVEL = L;

    // 처음 한 번만 단계를 바꿔 끼우기 (fn이 첫 번째로 불릴 때 인자/변수를 바꿈)
    function onceBefore(fnName, change) {
        const orig = window[fnName];
        if (typeof orig !== 'function') return false;
        let first = true;
        window[fnName] = function () {
            const args = [...arguments];
            if (first) { first = false; change(args); }
            return orig.apply(this, args);
        };
        return true;
    }
    const setVar = (code) => { try { (0, eval)(code); } catch (e) {} };   // 놀이 파일의 let 변수 바꾸기

    const PLAN = {
        // 난이도 1~3(또는 4) 탭이 있는 놀이: 첫 selectLevel(1)을 selectLevel(L)로
        'nollpic-grid-memory': 'select', 'nollpic-color-equation': 'select', 'nollpic-stroop': 'select',
        'nollpic-reverse-369': 'select', 'nollpic-number-hide-seek': 'select', 'nollpic-recipe-builder': 'select',
        'nollpic-shape-connect': 'select',
        'nollpic-color-drop': 'startLevel',
        'nollpic-jenga-memory': 'jenga',          // 레벨 5단계 중 시작: 1 / 2 / 3
        'nollpic-fish-grill': 'fish',             // 생선 1 / 2 / 3마리부터
        'nollpic-number-search': 'numberSearch',  // 4×4 / 5×5 / 6×6부터
        'nollpic-tangled-path': 'tangled',        // 1 / 4 / 7단계부터
        'nollpic-memory-kitchen': 'kitchen',      // 스시 / 김밥 / 햄버거
        'nollpic-color-match': 'colorMatch',      // 쉬움 / 쉬움 / 어려움
        'nollpic-number-focus': 'numberFocus',    // 기본 / 기본 / 어려움
    };
    const plan = PLAN[file];
    if (!plan) return;   // 손가락 순서·탁구·블록 합치기: 놀이 안에서 자동으로 어려워짐

    const run = () => {
        if (plan === 'select') onceBefore('selectLevel', (a) => { if (Number(a[0]) === 1) a[0] = L; });
        if (plan === 'startLevel') onceBefore('startLevel', (a) => { if (Number(a[0]) === 1) a[0] = L; });
        if (plan === 'jenga') onceBefore('showLevelIntro', () => setVar(`level = ${L - 1}; round = 0;`));
        if (plan === 'fish') onceBefore('beginLevel', () => setVar(`level = ${L}; round = 1;`));
        if (plan === 'numberSearch') onceBefore('setupLevel', () => setVar(`level = ${L};`));
        if (plan === 'tangled') { setVar(`stage = ${1 + (L - 1) * 3};`); }
        if (plan === 'kitchen') {
            const want = ['easy', 'middle', 'hard'][L - 1];
            const chip = document.querySelector(`.level-chip[data-mode="${want}"]`);
            if (chip) chip.click();
        }
        if (plan === 'colorMatch' && L === 3) {
            setVar(`mode = 'hard';`);
            document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === 'hard'));
            if (typeof window.render === 'function') try { window.render(); } catch (e) {}
        }
        if (plan === 'numberFocus' && L === 3) setVar(`currentMode = 'hard';`);
    };
    if (document.readyState === 'complete') run(); else window.addEventListener('load', run);
})();

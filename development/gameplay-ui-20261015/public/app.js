// Keep the current app route in this tab when reloading.
const nollpicReloadNavigation = performance.getEntriesByType('navigation')[0]?.type === 'reload';
let nollpicReloadView = null;
try { if (nollpicReloadNavigation) nollpicReloadView = JSON.parse(sessionStorage.getItem('nollpic_current_view') || 'null'); } catch (_) {}
if (nollpicReloadNavigation && !nollpicReloadView && window.history.state?.nollpicPage === 5) {
    try {
        const child=JSON.parse(localStorage.getItem('nollpic_selected_child') || localStorage.getItem('nollpic_child_profile') || 'null');
        if(child) {
            const params=new URLSearchParams({childId:child.id || '',grade:child.gradeValue || '0',name:child.name || ''});
            nollpicReloadView={page:5,testSrc:'tests/tests.html?' + params.toString()};
        }
    } catch (_) {}
}
let challengeNavContext = nollpicReloadView?.challengeNav === true;
function saveNollpicCurrentView() {
    const page = getActivePageNumber();
    const frame = document.getElementById('test-frame');
    const src = page === 5 ? frame?.getAttribute('src') : '';
    try { sessionStorage.setItem('nollpic_current_view', JSON.stringify({page, challengeNav:challengeNavContext, testSrc:src, checks:[...document.querySelectorAll('#page-4 .check-card.active')].map(el=>[...document.querySelectorAll('#page-4 .check-card')].indexOf(el))})); } catch (_) {}
}
window.addEventListener('beforeunload', saveNollpicCurrentView);
window.addEventListener('pagehide', saveNollpicCurrentView);

﻿// 전역 제어 함수: 이전/다음 변환 처리
function resetAppScrollTop(targetPage = null) {
    const deviceContainer = document.querySelector('.app-device');
    if (deviceContainer) deviceContainer.scrollTop = 0;
    if (targetPage) targetPage.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (targetPage?.id === 'page-11') {
        targetPage.querySelector('.challenge-sticky-actions')?.classList.remove('is-stuck');
        requestAnimationFrame(() => {
            targetPage.scrollTop = 0;
            if (deviceContainer) deviceContainer.scrollTop = 0;
            targetPage.querySelector('.challenge-sticky-actions')?.classList.remove('is-stuck');
        });
    }
}

const PLAY_PAGE_NUMBERS = [8, 9, 10, 12, 34, 35];
const PLAY_FRAME_IDS = ['dice-frame', 'arrow-frame', 'roulette-frame', 'stopwatch-frame', 'shape-dice-frame', 'number-frame'];
let challengeChildReturn = null;

function resetPlayFrames(exceptFrameId = '') {
    PLAY_FRAME_IDS.forEach(frameId => {
        if (frameId === exceptFrameId) return;
        const frame = document.getElementById(frameId);
        if (frame && frame.src && !frame.src.endsWith('about:blank')) {
            frame.src = 'about:blank';
        }
    });
}

function nextPage(pageNumber) {
    if (pageNumber !== 3) challengeChildReturn = null;
    const activePage = document.querySelector('.page.active');
    if (activePage?.id === 'page-5' && pageNumber !== 5) {
        stopAndUnloadTestFrame();
    }
    const activePageNumber = getActivePageNumber();
    if (PLAY_PAGE_NUMBERS.includes(activePageNumber) && !PLAY_PAGE_NUMBERS.includes(pageNumber)) {
        resetPlayFrames();
    }
    if (activePage) activePage.classList.remove('active');
    
    const targetPage = document.getElementById(`page-${pageNumber}`);
    if (targetPage) {
        targetPage.classList.add('active');
        updateBottomNav(pageNumber);
        resetAppScrollTop(targetPage);
    }

    // page-2 홈 화면: 로그인 상태면 뒤로가기 버튼 숨김
    if (pageNumber === 2) {
        const backBtn = document.getElementById('page2-back-btn');
        if (backBtn) {
            const user = getNollpicUser();
            backBtn.style.display = (user && user.uid) ? 'none' : '';
        }
    }

    if (pageNumber === 3) {
        prepareChildPage();
    }
    if (pageNumber === 2 || pageNumber === 7) updateChallengeEntryLabels();
}

function getActivePageNumber() {
    const activePage = document.querySelector('.page.active');
    const match = activePage?.id?.match(/^page-(\d+)$/);
    return match ? Number(match[1]) : 1;
}

function getStoredTestReturnPage(fallback = 4) {
    const stored = Number(sessionStorage.getItem('nollpic_test_return_page'));
    return stored || fallback;
}

function openTestPageFrom(returnPage) {
    sessionStorage.setItem('nollpic_test_return_page', String(returnPage));
    try {
        window.history.pushState({ nollpicPage: 5, returnPage }, '', window.location.href);
    } catch (e) {
        // History state is only used to keep browser back inside the app.
    }
    nextPage(5);
}

function stopAndUnloadTestFrame() {
    const frame = document.getElementById('test-frame');
    if (!frame) return;

    try {
        if (frame.contentWindow && typeof frame.contentWindow.stopNollpicTestAudio === 'function') {
            frame.contentWindow.stopNollpicTestAudio();
        }
    } catch (e) {
        // Cross-frame access can fail while the iframe is unloading.
    }

    frame.src = 'about:blank';
}

function prevPage(pageNumber) {
    const activePage = document.querySelector('.page.active');
    if (activePage) activePage.classList.remove('active');
    
    const targetPage = document.getElementById(`page-${pageNumber}`);
    if (targetPage) {
        targetPage.classList.add('active');
        updateBottomNav(pageNumber);
        resetAppScrollTop(targetPage);
    }
}

// 3페이지 유효성 체크
function updateChallengeEntryLabels(state = readChallengeState()) {
    const continuing = window.NollpicChallengeStorage.isSignedIn() && (state.completedSteps || []).length > 0;
    document.querySelectorAll('[data-challenge-label]').forEach(label => {
        label.textContent = continuing ? label.dataset.continueLabel : label.dataset.startLabel;
    });
}

function validateInfoPage() {
    const nameInput = document.getElementById('child-name');
    const gradeSelect = document.getElementById('child-grade');
    const genderRadio = document.querySelector('input[name="child-gender"]:checked');
    const guardianConsent = document.getElementById('guardian-consent');

    if (!nameInput.value.trim()) {
        alert('이름을 입력해주세요.');
        nameInput.focus();
        return;
    }

    if (!gradeSelect.value) {
        alert('나이를 선택해주세요.');
        gradeSelect.focus();
        return;
    }

    if (!genderRadio) {
        alert('성별을 선택해주세요.');
        return;
    }

    if (guardianConsent && !guardianConsent.checked) {
        alert('보호자 동의 확인이 필요합니다.');
        guardianConsent.focus();
        return;
    }

    const isEditingMode =
        editingChildId ||
        localStorage.getItem('nollpic_editing_child_id');

    saveCurrentChildProfile();

    if (challengeChildReturn) {
        goBottomChallenge();
        return;
    }

    if (isEditingMode) {
        alert('아이 정보가 수정되었어요.');

        prepareChildPage();
        nextPage(3);

        return;
    }

    nextPage(4);
}

// 4페이지 체크리스트 카드 선택 로직
function toggleCheck(card) {
    const noneAbove = document.getElementById('none-above');
    if (noneAbove && noneAbove.classList.contains('active')) {
        noneAbove.classList.remove('active');
    }
    card.classList.toggle('active');
}

// '해당 사항 없음' 단독 예외 처리 로직
function toggleNoneAbove(card) {
    if (!card.classList.contains('active')) {
        const allCards = document.querySelectorAll('.check-card');
        allCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
    } else {
        card.classList.remove('active');
    }
}

// ==========================================================================
// 💡 [수정] 4페이지에서 5페이지 분리형 iframe 호출 및 주소 파라미터 전달
// ==========================================================================
function startFirstTest() {
    // 새 검사를 시작할 때 이전 진행 단계가 남아 있으면 중간 화면으로 잘못 복구될 수 있어 초기화합니다.
    localStorage.removeItem('nollpic_test_progress');
    sessionStorage.setItem('nollpic_mission_attempt_counts', '{}');

    const selectedProfile = getSelectedChildProfile();
    const gradeSelect = document.getElementById('child-grade');
    const nameInput = document.getElementById('child-name');
    const genderRadio = document.querySelector('input[name="child-gender"]:checked');

    // 저장된 아이를 선택해서 검사를 시작하는 경우, 숨겨진 입력칸 값이 아니라
    // 반드시 선택된 아이의 이름/학년을 검사 iframe으로 넘깁니다.
    let rawName = selectedProfile?.name || (nameInput && nameInput.value.trim() ? nameInput.value.trim() : "");
    let gradeVal = selectedProfile?.gradeValue || (gradeSelect ? gradeSelect.value : "0");
    let genderVal = selectedProfile?.gender || (genderRadio ? genderRadio.value : "");

    const childProfile = selectedProfile || {
        id: makeChildIdForProfile(rawName, gradeVal, genderVal),
        name: rawName,
        gradeValue: gradeVal,
        gradeText: getGradeTextForProfile(gradeVal),
        gender: genderVal,
        startedAt: getTodayStringForProfile()
    };

    // 혹시 기존 저장 아이의 gradeText가 비어있으면 보정합니다.
    childProfile.gradeValue = childProfile.gradeValue || gradeVal;
    childProfile.gradeText = childProfile.gradeText || getGradeTextForProfile(childProfile.gradeValue);

    // 새 검사 시작 시 현재 프로필로 반드시 덮어씁니다 (이전 캐시 제거).
    localStorage.setItem('nollpic_selected_child', JSON.stringify(childProfile));
    localStorage.setItem('nollpic_child_profile', JSON.stringify(childProfile));
    localStorage.setItem('nollpic_child_name', childProfile.name || rawName);
    localStorage.setItem('nollpic_child_grade', childProfile.gradeText || '');

    const nameVal = encodeURIComponent(childProfile.name || rawName);
    const childIdVal = encodeURIComponent(childProfile.id || '');

    const frame = document.getElementById('test-frame');
    if (frame) {
        // 주소창 뒤에 아이 id/학년/이름을 안전하게 붙여서 iframe을 로드합니다.
        const targetSrc = `tests/tests.html?childId=${childIdVal}&grade=${childProfile.gradeValue || gradeVal}&name=${nameVal}&intro=1&ts=${Date.now()}`;
        frame.style.visibility = 'hidden';
        frame.addEventListener('load', () => {
            frame.style.visibility = 'visible';
        }, { once: true });
        setTimeout(() => {
            if (frame.style.visibility === 'hidden') frame.style.visibility = 'visible';
        }, 3000);
        frame.src = targetSrc;
    }
    openTestPageFrom(4);
}

function getGradeTextForProfile(gradeValue) {
    if (String(gradeValue) === 'adult') return '어른';
    const gradeNum = parseInt(gradeValue, 10);
    if (gradeNum === 0) return '미취학';
    if (gradeNum >= 1 && gradeNum <= 6) return `초등 ${gradeNum}학년`;
    return '학년 미선택';
}

function getGradeSelectMarkup() {
    return [
        '<option value="">\uB098\uC774\uB97C \uC120\uD0DD\uD574\uC8FC\uC138\uC694</option>',
        '<optgroup label="\uC5B4\uB9B0\uC774">',
        '<option value="0">\uBBF8\uCDE8\uD559</option>',
        '<option value="1">\uCD08\uB4F1 1\uD559\uB144</option>',
        '<option value="2">\uCD08\uB4F1 2\uD559\uB144</option>',
        '<option value="3">\uCD08\uB4F1 3\uD559\uB144</option>',
        '<option value="4">\uCD08\uB4F1 4\uD559\uB144</option>',
        '<option value="5">\uCD08\uB4F1 5\uD559\uB144</option>',
        '<option value="6">\uCD08\uB4F1 6\uD559\uB144</option>',
        '</optgroup>',
        '<optgroup label="\uC131\uC778">',
        '<option value="adult">\uC5B4\uB978</option>',
        '</optgroup>'
    ].join('');
}

function setupGradeSelectOptions(select, selectedValue = '') {
    if (!select) return;

    const value = selectedValue || select.value;
    select.innerHTML = getGradeSelectMarkup();
    if (value) select.value = value;
}

function getTodayStringForProfile() {
    const now = new Date();
    return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
}

// 검사 화면 상단 뒤로가기
// iframe 안의 현재 게임 단계 기준으로 바로 전 게임으로 이동합니다.
// 첫 번째 게임에서 누른 경우에만 '평소 아이는 어떤가요?' 페이지로 돌아갑니다.
function exitTestPage() {
    const frame = document.getElementById('test-frame');

    if (frame && frame.contentWindow && typeof frame.contentWindow.goBackToPreviousTest === 'function') {
        frame.contentWindow.goBackToPreviousTest();
        return;
    }

    const returnPage = getStoredTestReturnPage(4);
    sessionStorage.removeItem('nollpic_test_return_page');
    prevPage(returnPage);
}

function goBackFromTestToSurvey() {
    const returnPage = getStoredTestReturnPage(4);
    sessionStorage.removeItem('nollpic_test_return_page');
    stopAndUnloadTestFrame();
    prevPage(returnPage);
}





// ========================================================================== 
// 로그인 사용자 전환 시 현재 아이/결과 캐시 분리
// ========================================================================== 
function clearActiveChildSession() {
    localStorage.removeItem('nollpic_selected_child');
    localStorage.removeItem('nollpic_child_profile');
    localStorage.removeItem('nollpic_latest_result');
    localStorage.removeItem('nollpic_child_name');
    localStorage.removeItem('nollpic_child_grade');
}

// ========================================================================== 
// 로그인 사용자용 아이 선택 / 아이 추가 관리
// ========================================================================== 
function getNollpicUser() {
    try {
        return JSON.parse(localStorage.getItem('nollpic_user'));
    } catch (e) {
        return null;
    }
}
// 게임 iframe이 부모 앱의 로그인·자녀 상태를 읽을 때 사용하는 최소 공개 어댑터
window.getUser = () => getNollpicUser();

function isNollpicLoggedIn() {
    const user = getNollpicUser();
    return !!(user && user.uid);
}

function clearGuestNollpicHistory() {
    if (isNollpicLoggedIn()) return;

    localStorage.removeItem('nollpic_schulte_records');
    localStorage.removeItem('nollpic_memory_records');
    localStorage.removeItem('nollpic_reaction_records');
    localStorage.removeItem('nollpic_visual_search_records');
    localStorage.removeItem('nollpic_flanker_records');
}

function getChildrenStorageKey() {
    const user = getNollpicUser();
    return user && user.uid ? `nollpic_children_${user.uid}` : 'nollpic_children_guest';
}

function getSavedChildren() {
    if (!isNollpicLoggedIn()) return [];

    try {
        return JSON.parse(localStorage.getItem(getChildrenStorageKey())) || [];
    } catch (e) {
        return [];
    }
}

function setSavedChildren(children) {
    if (!isNollpicLoggedIn()) return;

    localStorage.setItem(getChildrenStorageKey(), JSON.stringify(children));
}


function normalizeChildFromResult(item) {
    const child = item && item.child ? item.child : null;
    if (!child || !child.name) return null;
    return {
        id: child.id || makeChildId(),
        name: child.name || '우리 아이',
        gradeValue: child.gradeValue || '',
        gradeText: child.gradeText || getGradeTextForProfile(child.gradeValue || ''),
        gender: child.gender || '',
        startedAt: child.startedAt || item.date || getTodayStringForProfile()
    };
}

function recoverChildrenFromLocalResults() {
    const children = getSavedChildren();
    const user = getNollpicUser();

    if (!user || !user.uid) {
        return children;
    }

    const map = new Map();

    children.forEach(child => {
        if (!child) return;
        const key = child.id || `${child.name}_${child.gradeText}`;
        map.set(key, child);
    });

    let latest = null;
    let history = [];

    try { latest = JSON.parse(localStorage.getItem('nollpic_latest_result') || 'null'); } catch (e) { latest = null; }
    try { history = JSON.parse(localStorage.getItem('nollpic_result_history') || '[]'); } catch (e) { history = []; }

    [latest, ...history].forEach(item => {
        if (!_resultIsCompleteResult(item)) return;
        const child = normalizeChildFromResult(item);
        if (!child) return;
        const key = child.id || `${child.name}_${child.gradeText}`;
        if (!map.has(key)) map.set(key, child);
    });

    const recovered = Array.from(map.values());
    if (recovered.length !== children.length) {
        setSavedChildren(recovered);
    }
    return recovered;
}

function makeChildId() {
    return `child_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getGuestId() {
    const storageKey = 'nollpic_guest_id';
    let guestId = localStorage.getItem(storageKey);

    if (!guestId) {
        guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        localStorage.setItem(storageKey, guestId);
    }

    return guestId;
}

function normalizeChildIdentityValue(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, '');
}

function hashChildIdentity(value) {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = ((hash << 5) - hash) + value.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

function makeGuestChildId(name, gradeValue, gender) {
    const guestId = getGuestId();
    const identity = [
        guestId,
        normalizeChildIdentityValue(name),
        normalizeChildIdentityValue(gradeValue),
        normalizeChildIdentityValue(gender)
    ].join('|');

    return `child_${hashChildIdentity(guestId)}_${hashChildIdentity(identity)}`;
}

function makeChildIdForProfile(name, gradeValue, gender) {
    if (isNollpicLoggedIn()) return makeChildId();
    return makeGuestChildId(name, gradeValue, gender);
}

function getSelectedChildProfile() {
    try {
        return JSON.parse(localStorage.getItem('nollpic_selected_child'));
    } catch (e) {
        return null;
    }
}

function getActiveChildProfile() {
    const selected = getSelectedChildProfile();
    if (selected && selected.name) return selected;

    try {
        const profile = JSON.parse(localStorage.getItem('nollpic_child_profile'));
        return profile && profile.name ? profile : null;
    } catch (e) {
        return null;
    }
}

function isResultForActiveChild(result, child) {
    if (!result || !child) return false;
    const itemChild = result.child || {};

    if (child.id && (result.childId === child.id || itemChild.id === child.id)) {
        return true;
    }

    return !!(
        child.name &&
        (result.childName === child.name || itemChild.name === child.name) &&
        (!child.gradeText || result.gradeText === child.gradeText || itemChild.gradeText === child.gradeText)
    );
}

async function prepareChildPage() {
    const user = getNollpicUser();
    let children = recoverChildrenFromLocalResults();
    const savedSection = document.getElementById('saved-child-section');
    const formSection = document.getElementById('child-form-section');
    const title = document.getElementById('child-page-title');
    const sub = document.getElementById('child-page-sub');
    const nextBtn = document.getElementById('child-next-btn');

    renderLoginStatus();
    updateChallengeChildSelection();

    if (!savedSection || !formSection) return;

    if (!user && children.length === 0 && !getActiveChildProfile()) {
        clearActiveChildSession();
    }

    if (user && children.length > 0) {
        savedSection.style.display = 'flex';
        formSection.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (title) title.innerText = '우리 아이를 선택해주세요';
        if (sub) sub.innerText = '아이별로 미션 결과와 성장 기록을 따로 저장해요.';
        renderSavedChildren(children);
    } else {
        savedSection.style.display = 'none';
        formSection.style.display = 'flex';
        if (nextBtn) nextBtn.style.display = 'block';
        if (nextBtn) {
      nextBtn.style.display = 'block';
    nextBtn.innerText = '다음';
}
        if (title) title.innerText = user ? '첫 아이를 등록해주세요' : '아이에 대해 알려주세요';
        if (sub) sub.innerText = user ? '처음 한 번만 등록하면 다음부터 자동으로 불러와요.' : '정확한 분석을 위해 기본 정보를 입력해주세요.';
        clearChildForm(false);
    }

    // 로그인 사용자는 Firestore에 저장된 아이/결과를 추가로 불러와 화면을 다시 갱신합니다.
    if (user && user.uid) {
        const synced = await syncNollpicDataFromFirestore();
        if (getNollpicUser()?.uid !== user.uid || getActivePageNumber() !== 3) return;
        children = synced.children || [];

        if (children.length > 0) {
            savedSection.style.display = 'flex';
            formSection.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            if (title) title.innerText = '우리 아이를 선택해주세요';
            if (sub) sub.innerText = '아이별로 미션 결과와 성장 기록을 따로 저장해요.';
            renderSavedChildren(children);
        }
    }
    updateChallengeChildSelection();
}

function startTestForChild(childId) {
    const child = findChildById(childId);
    if (!child) return;

    setActiveChild(child);
    localStorage.removeItem('nollpic_test_progress');

    const nameVal = encodeURIComponent(child.name || '');
    const frame = document.getElementById('test-frame');
    if (frame) {
        const targetSrc = `tests/tests.html?childId=${encodeURIComponent(child.id || '')}&grade=${child.gradeValue || '0'}&name=${nameVal}&intro=1&ts=${Date.now()}`;
        frame.style.visibility = 'hidden';
        frame.addEventListener('load', () => {
            frame.style.visibility = 'visible';
        }, { once: true });
        setTimeout(() => {
            if (frame.style.visibility === 'hidden') frame.style.visibility = 'visible';
        }, 3000);
        frame.src = targetSrc;
    }
    openTestPageFrom(3);
}

function clearNollpicLoginSession() {
    ['nollpic_user', 'nollpic_current_uid', 'nollpic_selected_child', 'nollpic_child_profile', 'nollpic_child_name', 'nollpic_child_grade']
        .forEach(key => localStorage.removeItem(key));
    ['nollpic_login_pending', 'nollpic_after_login_page', 'nollpic_test_return_page']
        .forEach(key => sessionStorage.removeItem(key));
    window.NollpicChallengeStorage?.beginGuestSession();
    document.querySelectorAll?.('.memory-kitchen-host-page iframe')?.forEach(frame => { frame.src = 'about:blank'; });
    sessionStorage.setItem('nollpic_current_view', JSON.stringify({page: 1}));
    window.NollpicLoginLoading?.reset();
    closeChallengeProfile();
    renderLoginStatus();
    const name = document.getElementById('cw-me-name');
    if (name) { name.textContent = ''; name.hidden = true; }
    nextPage(1);
}
window.clearNollpicLoginSession = clearNollpicLoginSession;

async function logoutNollpic() {
    if (window.nollpicLogoutInProgress) return;
    const ok = confirm('로그아웃 하시겠어요?');
    if (!ok) return;
    window.nollpicLogoutInProgress = true;
    try {
        if (typeof window.nollpicSignOut !== 'function') throw new Error('Firebase authentication is not ready');
        await window.nollpicSignOut();
        clearNollpicLoginSession();
    } catch (error) {
        console.error('로그아웃 실패', error);
        alert('로그아웃하지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
        window.nollpicLogoutInProgress = false;
    }
}

function renderLoginStatus() {
    const el = document.getElementById('login-status-bar');
    if (!el) return;
    const user = getNollpicUser();
    if (user && user.uid) {
        const emailShort = user.email
            ? (user.email.length > 22 ? user.email.slice(0, 20) + '…' : user.email)
            : '로그인됨';
        el.innerHTML = `
            <div class="login-status-inner">
                <span class="login-status-icon">G</span>
                <div class="login-status-text">
                    <span class="login-status-label">Google 로그인됨</span>
                    <span class="login-status-email">${emailShort}</span>
                </div>
                <button type="button" class="btn-logout" onclick="logoutNollpic()">로그아웃</button>
            </div>
        `;
        el.style.display = 'block';
    } else {
        el.style.display = 'none';
    }
}

function renderSavedChildren(children) {
    const list = document.getElementById('saved-child-list');
    if (!list) return;

    list.innerHTML = children.map(child => {
        const avatarKind = String(child.gradeValue) === 'adult' || child.gradeText === '어른' ? 'adult' : child.gender === 'female' ? 'girl' : child.gender === 'male' ? 'boy' : 'kid';
        const icon = child.gender === 'female'
            ? '👧'
            : child.gender === 'male'
                ? '👦'
                : '🧒';

        const grade = child.gradeText
            ? child.gradeText.replace('초등 ', '초')
            : '학년 미입력';

        const childId = child.id || '';

        return `
            <div class="saved-child-card"
                 role="button"
                 tabindex="0"
                 onclick="selectSavedChild('${childId}')"
                 onkeydown="if(event.target === this && event.key === 'Enter'){ event.preventDefault(); selectSavedChild('${childId}'); }">

                <div class="saved-child-top">
                    <div class="saved-child-avatar" data-avatar-kind="${avatarKind}" data-child-avatar-id="${childId}">
                        ${icon}
                    </div>
                    <div class="saved-child-info">
                        <strong>${child.name || '우리 아이'}</strong>
                        <span>${grade}</span>
                    </div>
                </div>

                <div class="saved-child-actions"
                     onclick="event.stopPropagation();">

                    <button
                        type="button"
                        class="child-test-btn"
                        onclick="${challengeChildReturn ? 'selectSavedChild' : 'startTestForChild'}('${childId}')">
                        ${challengeChildReturn ? '선택하고 챌린지로' : '🎮 미션하기'}
                    </button>

                    <button
                        type="button"
                        class="child-edit-btn"
                        onclick="editChild('${childId}')">
                        수정
                    </button>

                    <button
                        type="button"
                        class="child-delete-btn"
                        onclick="deleteChild('${childId}')">
                        삭제
                    </button>

                </div>

            </div>
        `;
    }).join('');
}

function selectSavedChild(childId) {
    if (challengeChildReturn) {
        const child = findChildById(childId);
        if (!child) return;
        setActiveChild(child);
        goBottomChallenge();
        return;
    }
    goToChildResult(childId);
}

function openChallengeChildSelection() {
    const page = document.getElementById('page-11');
    // Keep the mounted map and its scroll position; choosing a child must not replay rewards.
    challengeChildReturn = [page, page?.querySelector('.challenge-home-body'), document.querySelector('.app-device'), document.documentElement, document.body]
        .filter(Boolean).map(element => ({element, top: element.scrollTop}));
    closeChallengeProfile();
    nextPage(3);
    updateChallengeChildSelection();
}

function updateChallengeChildSelection() {
    const button = document.getElementById('child-challenge-return');
    if (button) button.style.display = challengeChildReturn ? 'flex' : 'none';
    const prompt = document.querySelector('.saved-child-head p');
    if (prompt) prompt.textContent = challengeChildReturn ? '챌린지에 참여할 아이를 선택해주세요.' : '미션을 진행할 아이를 선택해주세요.';
    if (!challengeChildReturn) return;
    const title = document.getElementById('child-page-title');
    const sub = document.getElementById('child-page-sub');
    const next = document.getElementById('child-next-btn');
    if (title) title.textContent = '챌린지에 참여할 아이를 선택해주세요';
    if (sub) sub.textContent = '아이를 선택하면 챌린지로 바로 돌아가요.';
    if (next) next.textContent = '등록하고 챌린지로';
}

function findChildById(childId) {
    const children = getSavedChildren();
    return children.find(item => item.id === childId) || null;
}

function setActiveChild(child) {
    if (!child) return;
    localStorage.setItem('nollpic_selected_child', JSON.stringify(child));
    localStorage.setItem('nollpic_child_profile', JSON.stringify(child));
    localStorage.setItem('nollpic_child_name', child.name || '우리 아이');
    localStorage.setItem('nollpic_child_grade', child.gradeText || '');
}

function getChildResultHistory(child) {
    if (!child) return [];

    let history = [];
    try {
        history = JSON.parse(localStorage.getItem('nollpic_result_history')) || [];
    } catch (e) {
        history = [];
    }

    return history.filter(item => {
        if (!_resultIsCompleteResult(item)) return false;
        const itemChild = item.child || {};
        if (child.id && itemChild.id && itemChild.id === child.id) return true;
        return (itemChild.name === child.name && itemChild.gradeText === child.gradeText);
    });
}

function goToChildResult(childId) {
    const child = findChildById(childId);
    if (!child) return;

    setActiveChild(child);

    const childHistory = getChildResultHistory(child);
    if (childHistory.length > 0) {
        localStorage.setItem('nollpic_latest_result', JSON.stringify(childHistory[0]));
        goToResultPage(child.id);
        return;
    }

    const startNow = confirm(`${child.name || '우리 아이'}의 저장된 검사 기록이 아직 없어요.\n지금 검사를 시작할까요?`);
    if (startNow) {
        nextPage(4);
    }
}

let editingChildId = null;

function showChildForm() {
    const savedSection = document.getElementById('saved-child-section');
    const formSection = document.getElementById('child-form-section');
    const title = document.getElementById('child-page-title');
    const sub = document.getElementById('child-page-sub');
    const nextBtn = document.getElementById('child-next-btn');

    if (savedSection) savedSection.style.display = 'none';
    if (formSection) formSection.style.display = 'flex';
    if (nextBtn) {
    nextBtn.style.display = 'block';
    nextBtn.innerText = '다음';
    }
    editingChildId = null;
    localStorage.removeItem('nollpic_editing_child_id');

    if (title) title.innerText = '아이를 추가해주세요';
    if (sub) sub.innerText = '한 계정에서 첫째, 둘째, 셋째를 각각 관리할 수 있어요.';

    clearChildForm(true);
    updateChallengeChildSelection();
}

function fillChildForm(child) {
    if (!child) return;
    const nameInput = document.getElementById('child-name');
    const gradeSelect = document.getElementById('child-grade');
    const genderRadios = document.querySelectorAll('input[name="child-gender"]');

    if (nameInput) nameInput.value = child.name || '';
    if (gradeSelect) gradeSelect.value = child.gradeValue || '';
    genderRadios.forEach(radio => {
        radio.checked = radio.value === child.gender;
    });
}

function editChild(childId) {
    const child = findChildById(childId);
    if (!child) {
        alert('수정할 아이 정보를 찾을 수 없어요.');
        return;
    }

    // 팝업 모달로 열기
    let modal = document.getElementById('edit-child-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'edit-child-modal';
        modal.style.cssText = `
            position:fixed; inset:0; z-index:9999;
            background:rgba(0,0,0,0.45);
            display:flex; align-items:center; justify-content:center;
            padding:1.5rem;
        `;
        modal.innerHTML = `
            <div style="
                background:#fff; border-radius:1.25rem;
                padding:1.75rem 1.5rem 1.5rem;
                width:100%; max-width:360px;
                box-shadow:0 8px 40px rgba(0,0,0,0.18);
            ">
                <h2 style="font-size:1.15rem;font-weight:800;color:#0E1D3E;margin-bottom:0.25rem;">아이 정보 수정</h2>
                <p style="font-size:0.82rem;color:#6B7280;margin-bottom:1.25rem;">이름과 성별을 수정할 수 있어요. 나이는 검사 기록 보호를 위해 고정됩니다.</p>

                <div style="margin-bottom:1rem;">
                    <label style="font-size:0.83rem;font-weight:700;color:#374151;display:block;margin-bottom:0.4rem;">이름</label>
                    <input id="modal-child-name" type="text" placeholder="이름을 입력해주세요"
                        style="width:100%;padding:0.7rem 1rem;border:1.5px solid #E5E7EB;border-radius:0.75rem;font-size:0.95rem;outline:none;"/>
                </div>

                <div style="margin-bottom:1rem;">
                    <label style="font-size:0.83rem;font-weight:700;color:#374151;display:block;margin-bottom:0.4rem;">나이</label>
                    <select id="modal-child-grade"
                        style="width:100%;padding:0.7rem 1rem;border:1.5px solid #E5E7EB;border-radius:0.75rem;font-size:0.95rem;background:#fff;outline:none;">
                        <option value="">나이를 선택해주세요</option>
                        <option value="0">미취학</option>
                        <option value="1">초등 1학년</option>
                        <option value="2">초등 2학년</option>
                        <option value="3">초등 3학년</option>
                        <option value="4">초등 4학년</option>
                        <option value="5">초등 5학년</option>
                        <option value="6">초등 6학년</option>
                        <option value="" disabled>────────────</option>
                        <option value="adult">어른</option>
                    </select>
                </div>

                <div style="margin-bottom:1.5rem;">
                    <label style="font-size:0.83rem;font-weight:700;color:#374151;display:block;margin-bottom:0.4rem;">성별</label>
                    <div style="display:flex;gap:0.75rem;">
                        <label style="flex:1;display:flex;align-items:center;justify-content:center;gap:0.4rem;padding:0.65rem;border:1.5px solid #E5E7EB;border-radius:0.75rem;cursor:pointer;font-size:0.9rem;font-weight:600;">
                            <input type="radio" name="modal-child-gender" value="male" style="accent-color:#FF6B00;"> 👦 남
                        </label>
                        <label style="flex:1;display:flex;align-items:center;justify-content:center;gap:0.4rem;padding:0.65rem;border:1.5px solid #E5E7EB;border-radius:0.75rem;cursor:pointer;font-size:0.9rem;font-weight:600;">
                            <input type="radio" name="modal-child-gender" value="female" style="accent-color:#FF6B00;"> 👧 여
                        </label>
                    </div>
                </div>

                <div style="display:flex;gap:0.75rem;">
                    <button onclick="closeEditChildModal()"
                        style="flex:1;padding:0.85rem;border:1.5px solid #E5E7EB;border-radius:0.875rem;background:#fff;font-size:0.9rem;font-weight:700;color:#6B7280;cursor:pointer;">
                        취소
                    </button>
                    <button onclick="saveEditChildModal()"
                        style="flex:2;padding:0.85rem;border:none;border-radius:0.875rem;background:#FF6B00;color:#fff;font-size:0.9rem;font-weight:800;cursor:pointer;">
                        저장하기
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        // 바깥 클릭 시 닫기
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeEditChildModal();
        });
    }

    // 현재 아이 ID 기억
    modal.dataset.editingId = childId;

    // 폼 채우기
    const nameInput = modal.querySelector('#modal-child-name');
    const gradeSelect = modal.querySelector('#modal-child-grade');
    const genderRadios = modal.querySelectorAll('input[name="modal-child-gender"]');
    setupGradeSelectOptions(gradeSelect, child.gradeValue || '');
    if (nameInput) nameInput.value = child.name || '';
    if (gradeSelect) {
        gradeSelect.value = child.gradeValue || '';
        gradeSelect.disabled = true;
        gradeSelect.style.background = '#F3F4F6';
        gradeSelect.style.color = '#6B7280';
        gradeSelect.style.cursor = 'not-allowed';
    }
    genderRadios.forEach(r => { r.checked = r.value === child.gender; });

    modal.style.display = 'flex';
}

function closeEditChildModal() {
    const modal = document.getElementById('edit-child-modal');
    if (modal) modal.style.display = 'none';
}

async function saveEditChildModal() {
    const modal = document.getElementById('edit-child-modal');
    if (!modal) return;
    const childId = modal.dataset.editingId;
    const child = findChildById(childId);
    if (!child) return;

    const nameInput = modal.querySelector('#modal-child-name');
    const gradeSelect = modal.querySelector('#modal-child-grade');
    const genderRadio = modal.querySelector('input[name="modal-child-gender"]:checked');

    if (!nameInput || !nameInput.value.trim()) {
        alert('이름을 입력해주세요.');
        nameInput && nameInput.focus();
        return;
    }
    if (!genderRadio) {
        alert('성별을 선택해주세요.');
        return;
    }

    child.name = nameInput.value.trim();
    child.gender = genderRadio.value;

    // 저장
    const children = getSavedChildren();
    const idx = children.findIndex(c => c.id === childId);
    if (idx !== -1) {
        children[idx] = child;
        setSavedChildren(children);
    }

    const selectedChild = getActiveChildProfile();
    if (selectedChild?.id === child.id) {
        localStorage.setItem('nollpic_selected_child', JSON.stringify(child));
        localStorage.setItem('nollpic_child_profile', JSON.stringify(child));
        localStorage.setItem('nollpic_child_name', child.name || '우리 아이');
        localStorage.setItem('nollpic_child_grade', child.gradeText || '');
    }

    await saveChildToFirestore(child);

    closeEditChildModal();
    alert('아이 정보가 수정되었어요.');
    prepareChildPage();
}

window.closeEditChildModal = closeEditChildModal;
window.saveEditChildModal = saveEditChildModal;

function clearChildForm(reset) {
    if (!reset) return;
    const nameInput = document.getElementById('child-name');
    const gradeSelect = document.getElementById('child-grade');
    const genderRadios = document.querySelectorAll('input[name="child-gender"]');
    if (nameInput) nameInput.value = '';
    if (gradeSelect) gradeSelect.value = '';
    genderRadios.forEach(radio => radio.checked = false);
}

function saveCurrentChildProfile() {
    const nameInput = document.getElementById('child-name');
    const gradeSelect = document.getElementById('child-grade');
    const genderRadio = document.querySelector('input[name="child-gender"]:checked');
    const editId = editingChildId || localStorage.getItem('nollpic_editing_child_id') || '';
    const originalChild = editId ? findChildById(editId) : null;

    const childProfile = {
        id: editId || makeChildIdForProfile(nameInput.value.trim(), gradeSelect.value, genderRadio ? genderRadio.value : ''),
        name: nameInput.value.trim(),
        gradeValue: gradeSelect.value,
        gradeText: getGradeTextForProfile(gradeSelect.value),
        gender: genderRadio ? genderRadio.value : '',
        startedAt: originalChild?.startedAt || getTodayStringForProfile()
    };

    localStorage.setItem('nollpic_selected_child', JSON.stringify(childProfile));
    localStorage.setItem('nollpic_child_profile', JSON.stringify(childProfile));
    localStorage.setItem('nollpic_child_name', childProfile.name || '우리 아이');
    localStorage.setItem('nollpic_child_grade', childProfile.gradeText || '');

    let children = getSavedChildren();

    if (editId) {
        children = children.map(child => child.id === editId ? { ...child, ...childProfile } : child);
        if (!children.some(child => child.id === editId)) children.unshift(childProfile);
        editingChildId = null;
        localStorage.removeItem('nollpic_editing_child_id');
    } else {
        const exists = children.some(child =>
            child.name === childProfile.name &&
            child.gradeValue === childProfile.gradeValue &&
            child.gender === childProfile.gender
        );

        if (!exists) {
            children.unshift(childProfile);
        }
    }

    setSavedChildren(children);

    // 구글 로그인 사용자는 아이 정보를 Firestore에도 저장해 다음 로그인/다른 기기에서도 복구합니다.
    saveChildToFirestore(childProfile);
}


// ==========================================================================
// Firestore 동기화: 아이 목록/검사 결과를 구글 계정 기준으로 복구
// ==========================================================================
const NOLLPIC_FIREBASE_CONFIG = {
    apiKey: "AIzaSyClcGJEbev-OvfBu0sssIorQF-9uFsEvn8",
    authDomain: "nollpic.firebaseapp.com",
    projectId: "nollpic",
    storageBucket: "nollpic.firebasestorage.app",
    messagingSenderId: "136872727133",
    appId: "1:136872727133:web:68e8ec171055beeecbf3b4",
    measurementId: "G-MGB2F1HNJV"
};

let nollpicFirebaseToolsPromise = null;

async function getNollpicFirebaseTools() {
    if (nollpicFirebaseToolsPromise) return nollpicFirebaseToolsPromise;

    nollpicFirebaseToolsPromise = Promise.all([
        import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js")
    ]).then(([appModule, firestoreModule]) => {
        const firebaseApp = appModule.getApps().length
            ? appModule.getApps()[0]
            : appModule.initializeApp(NOLLPIC_FIREBASE_CONFIG);

        return {
            db: firestoreModule.getFirestore(firebaseApp),
            collection: firestoreModule.collection,
            doc: firestoreModule.doc,
            getDocs: firestoreModule.getDocs,
            setDoc: firestoreModule.setDoc,
            deleteDoc: firestoreModule.deleteDoc,
            serverTimestamp: firestoreModule.serverTimestamp
        };
    });

    return nollpicFirebaseToolsPromise;
}

function normalizeFirestoreChild(data = {}, fallbackId = "") {
    if (!data.name && !data.childName) return null;
    const gradeValue = data.gradeValue || "";
    return {
        id: data.id || data.childId || fallbackId || makeChildId(),
        name: data.name || data.childName || "우리 아이",
        gradeValue,
        gradeText: data.gradeText || getGradeTextForProfile(gradeValue),
        gender: data.gender || "",
        startedAt: data.startedAt || data.date || getTodayStringForProfile()
    };
}

function mergeChildrenByKey(...childLists) {
    const map = new Map();

    childLists.flat().forEach(child => {
        if (!child || !child.name) return;
        const key = child.id || `${child.name}_${child.gradeText || ""}_${child.gender || ""}`;
        if (!map.has(key)) {
            map.set(key, child);
        } else {
            map.set(key, { ...map.get(key), ...child });
        }
    });

    return Array.from(map.values());
}

async function saveChildToFirestore(childProfile) {
    const user = getNollpicUser();
    if (!user || !user.uid || !childProfile || !childProfile.id) return;

    try {
        const tools = await getNollpicFirebaseTools();
        await tools.setDoc(
            tools.doc(tools.db, "users", user.uid, "children", childProfile.id),
            {
                ...childProfile,
                uid: user.uid,
                userEmail: user.email || "",
                userName: user.name || "",
                updatedAt: tools.serverTimestamp()
            },
            { merge: true }
        );
        console.log("Firestore 아이 정보 저장 완료", childProfile.name);
    } catch (error) {
        console.error("Firestore 아이 정보 저장 실패", error);
    }
}


function isSameChildData(itemChild = {}, child = {}) {
    if (!child) return false;
    if (child.id && itemChild.id && itemChild.id === child.id) return true;
    return !!(child.name && itemChild.name === child.name && itemChild.gradeText === child.gradeText);
}

async function deleteChildFromFirestore(child) {
    const user = getNollpicUser();
    if (!user || !user.uid || !child || !child.id) return;

    try {
        const tools = await getNollpicFirebaseTools();
        await tools.deleteDoc(tools.doc(tools.db, "users", user.uid, "children", child.id));

        const resultsSnapshot = await tools.getDocs(tools.collection(tools.db, "users", user.uid, "results"));
        const deleteJobs = [];
        resultsSnapshot.forEach(docSnap => {
            const data = docSnap.data() || {};
            const itemChild = data.child || {};
            const sameById = child.id && (data.childId === child.id || itemChild.id === child.id);
            const sameByName = child.name && (data.childName === child.name || itemChild.name === child.name) &&
                (data.gradeText === child.gradeText || itemChild.gradeText === child.gradeText);
            if (sameById || sameByName) {
                deleteJobs.push(tools.deleteDoc(tools.doc(tools.db, "users", user.uid, "results", docSnap.id)));
            }
        });
        await Promise.all(deleteJobs);
        console.log("Firestore 아이/결과 삭제 완료", child.name, deleteJobs.length);
    } catch (error) {
        console.error("Firestore 아이/결과 삭제 실패", error);
    }
}

async function deleteChild(childId) {
    const child = findChildById(childId);
    if (!child) {
        alert('삭제할 아이 정보를 찾을 수 없어요.');
        return;
    }

    const ok = confirm(`${child.name || '우리 아이'}의 정보와 검사 기록을 삭제할까요?
삭제한 기록은 되돌릴 수 없어요.`);
    if (!ok) return;

    const children = getSavedChildren().filter(item => item.id !== childId);
    setSavedChildren(children);

    let history = [];
    try { history = JSON.parse(localStorage.getItem('nollpic_result_history') || '[]'); } catch (e) { history = []; }
    history = history.filter(item => !isSameChildData(item.child || {}, child));
    localStorage.setItem('nollpic_result_history', JSON.stringify(history));

    const selected = getSelectedChildProfile();
    if (selected && selected.id === childId) {
        clearActiveChildSession();
    }

    await deleteChildFromFirestore(child);
    renderSavedChildren(children);

    if (children.length === 0) {
        showChildForm();
    }
}

async function syncNollpicDataFromFirestore() {
    const user = getNollpicUser();
    if (!user || !user.uid) return { children: getSavedChildren(), results: [] };

    try {
        const tools = await getNollpicFirebaseTools();
        if (getNollpicUser()?.uid !== user.uid) return { children: [], results: [] };

        const [childrenSnapshot, resultsSnapshot] = await Promise.all([
            tools.getDocs(tools.collection(tools.db, "users", user.uid, "children")),
            tools.getDocs(tools.collection(tools.db, "users", user.uid, "results"))
        ]);
        if (getNollpicUser()?.uid !== user.uid) return { children: [], results: [] };

        const firestoreChildren = [];
        childrenSnapshot.forEach(docSnap => {
            const child = normalizeFirestoreChild(docSnap.data(), docSnap.id);
            if (child) firestoreChildren.push(child);
        });

        const firestoreResults = [];
        const childrenFromResults = [];
        resultsSnapshot.forEach(docSnap => {
            const data = docSnap.data() || {};
            if (!_resultIsCompleteResult(data)) return;
            const child = normalizeFirestoreChild(data.child || data, data.childId || "");
            if (child) childrenFromResults.push(child);
            firestoreResults.push({ ...data, child: data.child || child || null });
        });

        firestoreResults.sort((a, b) => {
            const aSec = a.savedAt && a.savedAt.seconds ? a.savedAt.seconds : 0;
            const bSec = b.savedAt && b.savedAt.seconds ? b.savedAt.seconds : 0;
            if (aSec !== bSec) return bSec - aSec;
            return String(b.date || "").localeCompare(String(a.date || ""));
        });

        const mergedChildren = mergeChildrenByKey(
            getSavedChildren(),
            firestoreChildren,
            childrenFromResults,
            recoverChildrenFromLocalResults()
        );

        if (mergedChildren.length > 0) {
            setSavedChildren(mergedChildren);
        }

        if (firestoreResults.length > 0) {
            localStorage.setItem("nollpic_result_history", JSON.stringify(firestoreResults));
            const currentLatest = JSON.parse(localStorage.getItem("nollpic_latest_result") || "null");
            if (!currentLatest || !_resultIsCompleteResult(currentLatest)) {
                localStorage.setItem("nollpic_latest_result", JSON.stringify(firestoreResults[0]));
            }
        }

        console.log("Firestore 아이/결과 복구 완료", mergedChildren.length, firestoreResults.length);
        return { children: mergedChildren, results: firestoreResults };
    } catch (error) {
        console.error("Firestore 아이/결과 복구 실패", error);
        return { children: getSavedChildren(), results: [] };
    }
}

window.nollpicSyncFromFirebase = syncNollpicDataFromFirestore;


// 카카오 로그인
function kakaoLogin() {
    alert("카카오 로그인 준비중입니다.");
}

// 네이버 로그인
function naverLogin() {
    alert("네이버 로그인 준비중입니다.");
}

// ==========================================================================
// 하단 고정 메뉴: 홈 / 검사결과 / 마이
// ==========================================================================
let mainBottomNavMarkup = null;
function updateBottomNav(pageNumber) {
    const nav = document.querySelector('.bottom-tab-nav');
    const device = document.querySelector('.app-device');

    if (pageNumber === 11 || (pageNumber >= 13 && pageNumber <= 33)) {
        challengeNavContext = true;
    } else if (![7, ...PLAY_PAGE_NUMBERS].includes(pageNumber)) {
        challengeNavContext = false;
    }
    if (nav) {
        if (mainBottomNavMarkup === null) mainBottomNavMarkup = nav.innerHTML;
        if (challengeNavContext && nav.dataset.context !== 'challenge') {
            const home = nav.querySelector('[data-tab="home"] .bottom-tab-icon').outerHTML;
            const play = nav.querySelector('[data-tab="play"] .bottom-tab-icon').outerHTML;
            const items = [
                [11, 'home', '홈', home],
                [13, 'rank', '랭킹', '<i class="cp-ico cp-ico-rank" aria-hidden="true"></i>'],
                [14, 'achieve', '업적', '<i class="cp-ico cp-ico-achieve" aria-hidden="true"></i>'],
                [15, 'dress', '꾸미기', '<i class="cp-ico cp-ico-dress" aria-hidden="true"></i>'],
                [7, 'play', '놀이터', play]
            ];
            nav.innerHTML = items.map(([page, tab, label, icon]) => '<button type="button" class="bottom-tab" data-tab="'+tab+'" onclick="goChallengeTab('+page+')">'+icon+'<span>'+label+'</span></button>').join('');
            nav.dataset.context = 'challenge';
        } else if (!challengeNavContext && nav.dataset.context === 'challenge') {
            nav.innerHTML = mainBottomNavMarkup;
            nav.dataset.context = 'main';
        }
    }
    const tabs = document.querySelectorAll('.bottom-tab');
    const playLabel = nav?.querySelector('[data-tab="play"] > span');
    if (playLabel) playLabel.textContent = challengeNavContext ? '놀이터' : '플레이';

    // 메인 로그인 화면에서는 하단 메뉴를 숨깁니다.
    if (pageNumber === 1) {
        if (nav) nav.style.display = 'none';
        if (device) device.classList.remove('nav-visible');
        return;
    }

    // 검사 미션 화면만 하단 탭을 숨깁니다. 챌린지 놀이는 하단 메뉴를 유지합니다.
    if (pageNumber === 5) {
        if (nav) nav.style.display = 'none';
        if (device) device.classList.remove('nav-visible');
        return;
    }

    if (nav) nav.style.display = 'grid';
    if (device) device.classList.add('nav-visible');
    if (!tabs.length) return;

    tabs.forEach(tab => { tab.classList.remove('active'); tab.removeAttribute('aria-current'); });

    let activeTab = 'home';
    if (pageNumber === 3 || pageNumber === 4) activeTab = 'mypage';
    if (pageNumber === 5) activeTab = 'home';
    if (pageNumber === 6) activeTab = 'result';
    if ([7, 8, 9, 10, 12, 34, 35].includes(pageNumber)) activeTab = 'play';
    if ([11, 13, 14, 15,16,17,18,19,20,21,22,23,24,25,26,27,28,29].includes(pageNumber)) activeTab = 'challenge';

    if (challengeNavContext) activeTab = ({13:'rank',14:'achieve',15:'dress'})[pageNumber] || ([7, ...PLAY_PAGE_NUMBERS].includes(pageNumber) ? 'play' : 'home');
    const target = document.querySelector(`.bottom-tab[data-tab="${activeTab}"]`);
    if (target) { target.classList.add('active'); target.setAttribute('aria-current', 'page'); }
}

// Scope history to challenge tabs; existing test and account routing remains unchanged.
function goChallengeTab(page) {
    if (![11, 13, 14, 15, 7].includes(page)) return;
    const from = getActivePageNumber();
    if (from !== page) {
        history.replaceState({...history.state, nollpicNavPage:from, challengeNav:challengeNavContext}, '', location.href);
    }
    challengeNavContext = true;
    if (page === 11) goBottomChallenge();
    else if (page === 7) window.goBottomPlay();
    else openChallengePanel(page);
    if (from !== page) history.pushState({nollpicNavPage:page, challengeNav:true}, '', location.href);
}

function goBottomHome() {
    if (challengeNavContext) goBottomChallenge();
    else nextPage(2);
}

function hasSavedResult() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('sharedResult')) return true;
    const user = getNollpicUser();
    const child = getActiveChildProfile();
    if ((!user || !user.uid) && !child) return false;
    return _resultGetChildRecords(user && user.uid ? null : child).length > 0;
}

function goBottomResult() {
    goToResultPage();
}

async function goBottomMypage() {
    challengeChildReturn = null;
    const user = getNollpicUser();
    if (user && user.uid) {
        await syncNollpicDataFromFirestore();
        if (getNollpicUser()?.uid !== user.uid) return;
    }

    nextPage(3);
}

function goBottomChallenge() {
    const childReturn = challengeChildReturn;
    nextPage(11);
    if (childReturn) {
        renderChallengeMe(document.getElementById('page-11'));
        requestAnimationFrame(() => childReturn.forEach(({element, top}) => { element.scrollTop = top; }));
        return;
    }
    if (typeof window.initChallengePreview === 'function') {
        window.initChallengePreview();
    }
}

function openChallengePanel(pageNumber) {
    nextPage(pageNumber);
    try { renderChallengePanels(); } catch (e) { console.warn('챌린지 화면 그리기 실패', e); }
}

/* ── 이번 주 랭킹 · 챌린지 결과 · 선물함 ── */
const CHALLENGE_GIFT_GOAL = 5000;   // 이 포인트를 모으면 쿠폰 열림
const NICK_ADJ = ['용감한', '씩씩한', '반짝이는', '느긋한', '호기심 많은', '꼼꼼한', '재빠른', '다정한', '튼튼한', '빛나는'];
const NICK_ANIMAL = [['수달', '🦦'], ['펭귄', '🐧'], ['다람쥐', '🐿️'], ['고래', '🐳'], ['부엉이', '🦉'], ['여우', '🦊'], ['판다', '🐼'], ['토끼', '🐰'], ['거북이', '🐢'], ['사자', '🦁']];

// 아이마다 고정된 동물 닉네임 (실명 대신 랭킹에 사용)
function getChallengeNickname() {
    let child = null;
    try { child = JSON.parse(localStorage.getItem('nollpic_selected_child') || localStorage.getItem('nollpic_child_profile') || 'null'); } catch (e) {}
    const seed = String(child?.id || child?.name || localStorage.getItem('nollpic_guest_id') || 'nollpic');
    let hash = 0; for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    const [animal, emoji] = NICK_ANIMAL[hash % NICK_ANIMAL.length];
    return { name: `${NICK_ADJ[(hash >>> 4) % NICK_ADJ.length]} ${animal}`, emoji };
}

// 이번 주(월요일 시작) 노력 기록: 참여일 ×100, 놀이 ×50, 연속 참여 ×20
function getWeeklyEffort() {
    const now = new Date();
    const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); monday.setHours(0, 0, 0, 0);
    const mondayKey = getChallengeDateKey(monday);
    const log = _challengeReadJSON(CHALLENGE_DAYLOG_KEY, []).filter(i => i.date >= mondayKey);
    const days = new Set(log.map(i => i.date)).size;
    const plays = log.length;
    const streak = readChallengeStreak().streak;
    return { days, plays, streak, score: days * 100 + plays * 50 + streak * 20, mondayKey };
}

/* ── 업적: 개인 최고 기록 + 단계별 배지 ── */
// 놀이를 한 날짜로 연속 기록 계산 (방문이 아니라 실제로 놀이를 끝낸 날 기준)
function getPlayStreaks() {
    const days = [...new Set(_challengeReadJSON(CHALLENGE_DAYLOG_KEY, []).map(i => i.date))].sort();
    let best = 0, bestEnd = '', run = 0, prev = null;
    days.forEach(d => {
        run = prev && getDateDiffInDays(prev, d) === 1 ? run + 1 : 1;
        if (run > best) { best = run; bestEnd = d; }
        prev = d;
    });
    const today = getChallengeDateKey();
    const last = days[days.length - 1];
    const current = last && getDateDiffInDays(last, today) <= 1 ? run : 0;
    return { best, bestEnd, current, days: days.length };
}

function getAchievementStats() {
    const log = _challengeReadJSON(CHALLENGE_DAYLOG_KEY, []);
    const state = readChallengeState();
    const streak = getPlayStreaks();
    const areaPlays = Object.fromEntries(RESULT_AREAS.map(a => [a.key, log.filter(i => CHALLENGE_GAMES[i.step]?.area === a.key).length]));
    let tests = [];
    try { tests = (_resultGetHistoryResults() || []).filter(_resultIsCompleteResult); } catch (e) {}
    const byTime = tests.slice().reverse();   // 오래된 것 → 최근
    const first = byTime[0], bestTest = tests.reduce((b, r) => (Number(r.overall) || 0) > (Number(b?.overall) || 0) ? r : b, null);
    const growth = first ? Math.max(0, ...RESULT_AREAS.map(a => Math.max(...byTime.map(r => (Number(r.scores?.[a.key]) || 0) - (Number(first.scores?.[a.key]) || 0))))) : 0;
    let items = 0;
    try { items = window.NollpicAvatar ? NollpicAvatar.read().owned.length : 0; } catch (e) {}
    return { log, state, streak, areaPlays, tests: tests.length, bestTest, growth, items, chests: (state.openedChests || []).length, plays: log.length };
}

// 배지: goals = 브론즈·실버·골드 목표 (RESULT_AREAS가 뒤에 선언돼서 그릴 때 만듦)
// 픽셀 블록 아이콘 (pixel-icons.js). 없으면 이모지 글자 그대로
function getAchievementList() { return [
    { id: 'streak',  name: '꾸준함 대장',   emoji: '🔥', color: '#FF7A1A', goals: [3, 7, 21],  unit: '일 연속', value: s => s.streak.best },
    { id: 'plays',   name: '놀이 탐험가',   emoji: '🧭', color: '#3B82F6', goals: [5, 15, 30], unit: '개 놀이', value: s => s.plays },
    { id: 'tests',   name: '생각근육 측정', emoji: '📏', color: '#8B5CF6', goals: [1, 3, 6],   unit: '번 측정', value: s => s.tests },
    { id: 'growth',  name: '쑥쑥 성장',     emoji: '🌱', color: '#10A36B', goals: [5, 15, 30], unit: '점 성장', value: s => s.growth },
    { id: 'chests',  name: '보물 사냥꾼',   emoji: '🎁', color: '#F5A800', goals: [2, 6, 12],  unit: '개 상자', value: s => s.chests },
    { id: 'items',   name: '멋쟁이',        emoji: '👕', color: '#FF6FA0', goals: [2, 6, 12],  unit: '개 아이템', value: s => s.items },
    ...RESULT_AREAS.map(a => ({ id: 'area-' + a.key, name: a.name + ' 친구', emoji: a.emoji, color: a.color, goals: [3, 8, 15], unit: '번 놀이', value: s => s.areaPlays[a.key] || 0 })),
]; }
const TIER = [
    { name: '시작 전', ring: '#D5DAE3' }, { name: '브론즈', ring: '#D08A4E' }, { name: '실버', ring: '#9AA6B8' }, { name: '골드', ring: '#F5B800' },
];
function getAchievementTier(a, stats) {
    const v = a.value(stats);
    const tier = a.goals.filter(g => v >= g).length;
    const next = a.goals[tier];
    return { v, tier, next, prev: tier ? a.goals[tier - 1] : 0 };
}

function renderAchievements() {
    const box = document.getElementById('cp-achieve');
    if (!box) return;
    const s = getAchievementStats();
    const esc = (v) => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const fmt = (d) => d ? d.replace(/(\d{4})[-.](\d{2})[-.](\d{2})/, (m, y, mo, da) => `${Number(mo)}월 ${Number(da)}일`) : '';
    const topArea = RESULT_AREAS.reduce((b, a) => (s.areaPlays[a.key] || 0) > (s.areaPlays[b.key] || 0) ? a : b, RESULT_AREAS[0]);
    const bests = [
        { emoji: '🔥', big: s.streak.best, label: '최고 연속 참여', sub: s.streak.best ? `${fmt(s.streak.bestEnd)}까지` : '오늘부터 시작!', color: '#FF7A1A' },
        { emoji: '🏆', big: s.bestTest ? s.bestTest.overall : '-', label: '최고 생각근육 점수', sub: s.bestTest ? fmt(s.bestTest.date) : '측정 전', color: '#8B5CF6' },
        { emoji: topArea.emoji, big: s.areaPlays[topArea.key] || 0, label: '가장 많이 한 영역', sub: (s.areaPlays[topArea.key] || 0) ? topArea.name : '아직 없어요', color: topArea.color },
    ];
    const list = getAchievementList().map(a => ({ a, t: getAchievementTier(a, s) }));
    const earned = list.reduce((n, x) => n + x.t.tier, 0), total = list.length * 3;
    box.innerHTML = `
        <section class="cp-card">
            <h3>개인 최고 기록</h3>
            <div class="ach-bests">${bests.map(b => `<div><span class="ach-bigicon" style="background:${b.color}1F">${px(b.emoji)}</span><strong style="color:${b.color}">${b.big}</strong><b>${b.label}</b><small>${esc(b.sub)}</small></div>`).join('')}</div>
        </section>
        <section class="cp-card">
            <h3>배지 <small class="ach-count">${earned} / ${total}</small></h3>
            <div class="ach-grid">${list.map(({ a, t }) => {
                const tier = TIER[t.tier], done = t.tier >= 3;
                const pct = done ? 100 : Math.round(((t.v - t.prev) / (t.next - t.prev)) * 100);
                return `<div class="ach ${t.tier ? '' : 'is-locked'}">
                    <span class="ach-badge" style="--ring:${tier.ring};--c:${a.color}"><i>${px(a.emoji)}</i>${t.tier ? `<em>${'★'.repeat(t.tier)}</em>` : ''}</span>
                    <b>${a.name}</b>
                    <small>${done ? '골드 달성!' : `${t.next} 중 ${Math.min(t.v, t.next)}`}</small>
                    <span class="ach-bar"><i style="width:${Math.max(0, Math.min(100, pct))}%;background:${a.color}"></i></span>
                </div>`;
            }).join('')}</div>
            <p class="cp-hint">배지마다 브론즈 → 실버 → 골드 3단계예요. 별이 많을수록 높은 단계예요.</p>
        </section>`;
}

function renderChallengePanels() {
    renderAchievements();
    const esc = (v) => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const nick = getChallengeNickname();
    const week = getWeeklyEffort();
    const state = readChallengeState();
    const log = _challengeReadJSON(CHALLENGE_DAYLOG_KEY, []);
    const points = window.NollpicAvatar ? NollpicAvatar.balance() : getChallengePoints(state);
    if (window.NollpicAvatar) NollpicAvatar.renderShop(document.getElementById('av-shop'));

    // 이번 주 랭킹
    const rank = document.getElementById('cp-ranking');
    if (rank) {
        const badges = [
            { need: 3, icon: '🥉', label: '주 3일 참여' },
            { need: 5, icon: '🥈', label: '주 5일 참여' },
            { need: 7, icon: '🥇', label: '7일 개근' },
        ];
        rank.innerHTML = `
            <section class="cp-card cp-me">
                <div class="cp-me-top"><span class="cp-avatar">${window.NollpicAvatar ? NollpicAvatar.drawAvatar() : nick.emoji}</span>
                    <div><small>랭킹에서는 이렇게 보여요</small><strong class="cp-nick">${px(nick.emoji)} ${esc(nick.name)}</strong></div>
                    <div class="cp-score"><small>이번 주 노력 점수</small><b>${week.score.toLocaleString('ko-KR')}</b></div></div>
                <div class="cp-stats">
                    <div><span>참여한 날</span><strong>${week.days}/7일</strong></div>
                    <div><span>완료한 놀이</span><strong>${week.plays}개</strong></div>
                    <div><span>연속 참여</span><strong>${px('🔥')} ${week.streak}일</strong></div>
                </div>
                <p class="cp-hint">참여한 날 +100 · 놀이 하나 +50 · 연속 하루 +20점</p>
            </section>
            <section class="cp-card">
                <h3>이번 주 배지</h3>
                <div class="cp-badges">${badges.map(b => `<div class="${week.days >= b.need ? 'on' : ''}"><span>${px(b.icon)}</span><b>${b.label}</b><small>${week.days >= b.need ? '받았어요!' : `${b.need - week.days}일 더`}</small></div>`).join('')}</div>
            </section>
            <section class="cp-card cp-soon">
                <h3>친구들 랭킹</h3>
                <p>같은 학년 친구들의 노력 점수는 정식 오픈 때 함께 열려요.<br>순위는 실명 대신 동물 닉네임으로만 보여요.</p>
            </section>`;
    }

    // 챌린지 결과
    const result = document.getElementById('cp-result');
    if (result) {
        const done = new Set(state.completedSteps || []).size;
        const pw = getChallengeWorld(state), pwOff = (pw.n - 1) * CHALLENGE_WORLD_DAYS;
        const pwDone = (state.completedSteps || []).filter(n => n > pwOff && n <= pwOff + CHALLENGE_WORLD_DAYS).length;
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(Date.now() - i * 86400000), key = getChallengeDateKey(d);
            days.push({ label: ['일', '월', '화', '수', '목', '금', '토'][d.getDay()], on: log.some(x => x.date === key), today: i === 0 });
        }
        const areaCount = RESULT_AREAS.map(ar => ({ ...ar, n: log.filter(x => CHALLENGE_GAMES[x.step]?.area === ar.key).length }));
        const maxN = Math.max(1, ...areaCount.map(x => x.n));
        const recent = log.slice().sort((x, y) => (y.at || 0) - (x.at || 0)).slice(0, 5);
        result.innerHTML = `
            <section class="cp-card">
                <h3>월드 ${pw.n} · ${pw.name}</h3>
                <div class="cp-progress"><i style="width:${Math.round(pwDone / CHALLENGE_WORLD_DAYS * 100)}%"></i></div>
                <p class="cp-hint"><b>${pwDone}</b> / ${CHALLENGE_WORLD_DAYS}칸 완료${pw.n > 1 ? ` · 지금까지 모두 <b>${done}</b>칸` : ''} · 받은 포인트 <b>${formatChallengePoints(points)}</b></p>
            </section>
            <section class="cp-card">
                <h3>최근 7일</h3>
                <div class="cp-week">${days.map(d => `<div class="${d.on ? 'on' : ''}${d.today ? ' today' : ''}"><span>${d.label}</span><b>${d.on ? '✓' : ''}</b></div>`).join('')}</div>
            </section>
            <section class="cp-card">
                <h3>어떤 생각근육을 키웠을까?</h3>
                ${areaCount.map(x => `<div class="cp-area"><span>${px(x.emoji)} ${x.name}</span><div class="cp-bar"><i style="width:${x.n / maxN * 100}%;background:${x.color}"></i></div><b>${x.n}번</b></div>`).join('')}
            </section>
            <section class="cp-card">
                <h3>최근 놀이 기록</h3>
                ${recent.length ? recent.map(x => { const g = CHALLENGE_GAMES[x.step] || {}; return `<div class="cp-log"><span>${gameIcon(g)}</span><div><strong>${esc(g.title || x.step + '번 놀이')}</strong>${x.result?.summary ? `<small>${esc(x.result.summary)}</small>` : ''}</div><b class="cp-stamp">완료!</b><em>${esc(x.date.slice(5).replace('-', '/'))}</em></div>`; }).join('') : '<p class="cp-hint">아직 놀이 기록이 없어요. 오늘의 놀이부터 시작해 볼까요?</p>'}
            </section>`;
    }

    // 선물함
    const gift = document.getElementById('cp-gift');
    if (gift) {
        const opened = (state.openedChests || []).map(id => ({ id, n: Number(String(id).replace('chest-', '')), p: Number(state.chestRewards?.[id]) || getChallengeChestReward(Number(String(id).replace('chest-', '')) - 1) })).sort((x, y) => x.n - y.n);
        const left = Math.max(0, CHALLENGE_GIFT_GOAL - points);
        gift.innerHTML = `
            <section class="cp-card cp-me">
                <div class="cp-me-top"><span class="cp-avatar">${px('🎁')}</span><div><small>쓸 수 있는 포인트</small><strong>${formatChallengePoints(points)}</strong></div></div>
                <div class="cp-progress"><i style="width:${Math.min(100, Math.round(points / CHALLENGE_GIFT_GOAL * 100))}%"></i></div>
                <p class="cp-hint">${left ? `<b>${formatChallengePoints(left)}</b> 더 모으면 쿠폰이 열려요!` : `${px('🎉')} 쿠폰이 열렸어요! 보호자에게 알려 주세요.`}</p>
            </section>
            <section class="cp-card">
                <h3>열어 본 보물상자 ${opened.length}개</h3>
                ${opened.length ? `<div class="cp-chests">${opened.map(c => `<div><span>${px('📦')}</span><b>${c.n}번 상자</b><small>+${c.p}P</small></div>`).join('')}</div>` : '<p class="cp-hint">30일 길에서 놀이 2개를 끝낼 때마다 보물상자가 열려요.</p>'}
            </section>
            <section class="cp-card">
                <h3>포인트는 이렇게 모여요</h3>
                <p class="cp-hint">시작 선물 ${CHALLENGE_START_POINTS}P · 놀이 하나 끝내고 받기 ${CHALLENGE_PLAY_POINTS}P · 보물상자 30~100P</p>
            </section>`;
    }
}
window.renderChallengePanels = renderChallengePanels;

function normalizeChallengeLinks() {
    // These shortcuts now live in the fixed challenge navigation.
    document.querySelector('#page-11 .challenge-links')?.remove();
    document.querySelector('#page-11 .cp-quick')?.remove();
}

/* ── 월드(개월) (2026-10-11) ──
   30일(30칸)을 완주할 때마다 다음 월드. 칸 번호는 31, 32 … 로 이어짐(최대 12월드 = 360칸)
   지도 HTML은 30칸 그대로 쓰고, 월드가 바뀌면 칸 숫자·보물상자 번호만 바꿔 그림
   색: challenge-worlds.css의 #page-11[data-world="N"], 장식: 아래 deco */
const CHALLENGE_WORLD_DAYS = 30;
const CHALLENGE_WORLDS = [
    { n: 1,  name: '숲 마을',        deco: [] },   // 1월드는 style.css의 블록 나무·덤불·꽃 그대로
    { n: 2,  name: '우주 기지',      deco: ['🚀', '🪐', '👽', '🌙', '☄️', '🛸', '⭐', '🌟'] },
    { n: 3,  name: '놀이공원',       deco: ['🎠', '🎡', '🎈', '🎪', '🎢', '🎟️', '🍿', '🎯'] },
    { n: 4,  name: '바다 마을',      deco: ['🐠', '🦀', '🐚', '🐙', '🐬', '⛵', '🏝️', '🐳'] },
    { n: 5,  name: '사탕 과자 나라', deco: ['🍭', '🍬', '🧁', '🍪', '🍩', '🍓', '🍫', '🍰'] },
    { n: 6,  name: '정글 탐험',      deco: ['🐒', '🦜', '🍌', '🌿', '🌴', '🐸', '🦎', '🐯'] },
    { n: 7,  name: '공룡 섬',        deco: ['🦕', '🦖', '🥚', '🌋', '🦴', '🌴', '🌿', '🪨'] },
    { n: 8,  name: '마법의 성',      deco: ['🏰', '🦄', '🔮', '✨', '🐉', '🪄', '⭐', '🌙'] },
    { n: 9,  name: '농장 마을',      deco: ['🐄', '🐔', '🚜', '🥕', '🌽', '🐑', '🌻', '🐷'] },
    { n: 10, name: '눈꽃 북극 마을', deco: ['🐧', '❄️', '⛄', '🦭', '🐻‍❄️', '🏔️', '❄️', '🐟'] },
    { n: 11, name: '해적섬',         deco: ['⛵', '⚓', '🗺️', '💰', '🦜', '🦀', '🌴', '🏴‍☠️'] },
    { n: 12, name: '도시 블록 마을', deco: ['🚌', '🚗', '🏢', '🚦', '🚲', '🏪', '🌳', '🚕'] },
];
const CHALLENGE_TOTAL_COUNT = CHALLENGE_WORLD_DAYS * CHALLENGE_WORLDS.length;   // 360
let challengeWorldPreview = 0;   // 개발·확인용: ?worldPreview=N 또는 콘솔 previewChallengeWorld(N)

// 지금 월드: 다음에 할 칸이 들어 있는 월드. 오늘 칸까지 다 했으면 마지막으로 끝낸 칸의 월드
// (30일째를 끝낸 날은 1월드 완주 화면 그대로, 다음 날 31일째 칸이 열리면 2월드)
function getChallengeWorldIndex(state = readChallengeState()) {
    if (challengeWorldPreview) return Math.max(0, Math.min(CHALLENGE_WORLDS.length - 1, challengeWorldPreview - 1));
    const next = getChallengeNextStep(state);
    const ref = next || Math.max(1, isChallengePaid() ? state.completed : Math.min(state.completed, CHALLENGE_FREE_DAYS));
    return Math.max(0, Math.min(CHALLENGE_WORLDS.length - 1, Math.ceil(ref / CHALLENGE_WORLD_DAYS) - 1));
}
function getChallengeWorld(state) { return CHALLENGE_WORLDS[getChallengeWorldIndex(state)]; }
function getChallengeWorldOfDay(day) { return CHALLENGE_WORLDS[Math.max(0, Math.min(CHALLENGE_WORLDS.length - 1, Math.ceil(day / CHALLENGE_WORLD_DAYS) - 1))]; }
function getChallengeChestReward(chestIndex) { return CHALLENGE_CHEST_REWARDS[((chestIndex % CHALLENGE_CHEST_REWARDS.length) + CHALLENGE_CHEST_REWARDS.length) % CHALLENGE_CHEST_REWARDS.length] || 0; }

function renderChallengeWorld(page, state = readChallengeState()) {
    const w = getChallengeWorld(state);
    const offset = (w.n - 1) * CHALLENGE_WORLD_DAYS;
    const head = page.querySelector('.cw-head');
    if (head) head.dataset.world = String(w.n);
    const title = page.querySelector('#cw-title');
    if (title && title.dataset.world !== String(w.n)) {
        title.dataset.world = String(w.n);
        title.classList.toggle('is-long', w.name.length >= 6);   // 사탕 과자 나라·눈꽃 북극 마을처럼 긴 이름은 글자 작게
        title.innerHTML = `<span class="cw-badge" aria-label="월드 ${w.n}"><small>WORLD</small><b>${w.n}</b></span><span class="cw-name">${w.name}</span> <span class="cw-days">${CHALLENGE_WORLD_DAYS}일</span>`;
    }
    const roadmap = page.querySelector('.challenge-roadmap');
    if (!roadmap) return w;
    // 칸 숫자: 처음 그린 번호(1~30)를 기억해 두고 월드만큼 더함
    roadmap.querySelectorAll('.road-node').forEach((node) => {
        const label = node.querySelector('span');
        if (!label) return;
        if (!node.dataset.base) node.dataset.base = label.textContent.trim();
        label.textContent = String(Number(node.dataset.base) + offset);
    });
    // 보물상자: 월드마다 15개 (chest-1~15, chest-16~30 …)
    roadmap.querySelectorAll('.road-chest').forEach((chest) => {
        if (!chest.dataset.baseChest) chest.dataset.baseChest = String(chest.dataset.chestId || '').replace('chest-', '');
        chest.dataset.chestId = `chest-${Number(chest.dataset.baseChest) + offset / 2}`;
    });
    if (page.dataset.world !== String(w.n)) {
        page.dataset.world = String(w.n);
        renderChallengeWorldDecos(roadmap, w);
    }
    return w;
}

// 월드 장식(이모지): 줄 사이 빈자리(가운데 + 세로 길이 없는 쪽)에 놓음. 1월드는 원래 블록 장식
function renderChallengeWorldDecos(roadmap, w) {
    roadmap.querySelector('.cw-decos')?.remove();
    if (!w.deco || !w.deco.length) return;
    const box = document.createElement('div');
    box.className = 'cw-decos';
    box.setAttribute('aria-hidden', 'true');
    const rows = 15, gap = 154, html = [];
    let k = 0;
    for (let r = 0; r < rows - 1; r++) {
        const y = 8 + r * gap + 104;                     // 이 줄과 다음 줄 사이
        const freeSide = r % 2 === 0 ? 13 : 87;          // 세로 길이 없는 쪽 (짝수 줄은 오른쪽에 세로 길)
        const wob = ((r * 37) % 9) - 4;                  // 자리 조금씩 흔들기
        html.push(`<i style="--x:${50 + wob}%;--y:${y + ((r * 13) % 18)}px;--s:${28 + (r % 3) * 3}px">${w.deco[k++ % w.deco.length]}</i>`);
        html.push(`<i style="--x:${freeSide + (r % 2 ? -wob : wob)}%;--y:${y + 14 - ((r * 7) % 14)}px;--s:${24 + ((r + 1) % 3) * 3}px">${w.deco[k++ % w.deco.length]}</i>`);
        if (r % 3 === 1) html.push(`<i style="--x:${r % 2 ? 31 : 69}%;--y:${8 + r * gap + 2}px;--s:22px">${w.deco[k++ % w.deco.length]}</i>`);
    }
    box.innerHTML = html.join('');
    roadmap.prepend(box);
}
function previewChallengeWorld(n) { challengeWorldPreview = Number(n) || 0; renderChallengeState(); }
window.previewChallengeWorld = previewChallengeWorld;
try { const wp = Number(new URLSearchParams(location.search).get('worldPreview')); if (wp) challengeWorldPreview = wp; } catch (e) {}
const CHALLENGE_START_POINTS = 200;
const CHALLENGE_PLAY_POINTS = 200;
const CHALLENGE_CHEST_REWARDS = [30, 40, 40, 50, 50, 60, 70, 80, 80, 100, 100, 120, 120, 150, 200];
const CHALLENGE_CHEST_RANDOM_REWARDS = [30, 40, 50, 60, 70, 80, 100];
const CHALLENGE_DEFAULT_COMPLETED = 0;
const CHALLENGE_DEFAULT_STREAK = 1;
const CHALLENGE_STATE_KEY = 'nollpic_summer_challenge_state_original_v2';
const CHALLENGE_STREAK_KEY = 'nollpic_summer_challenge_streak_original_v2';
let challengeAudioContext = null;

function readChallengeState() {
    try {
        const saved = JSON.parse(window.NollpicChallengeStorage.getItem(CHALLENGE_STATE_KEY) || 'null');
        const completed = Math.max(0, Math.min(CHALLENGE_TOTAL_COUNT, Number(saved?.completed ?? CHALLENGE_DEFAULT_COMPLETED)));
        const migratedCompletedSteps = [
            ...Array.from({ length: completed }, (_, index) => index + 1),
            ...(Array.isArray(saved?.completedSteps) ? saved.completedSteps : []),
            ...(Array.isArray(saved?.claimedSteps) ? saved.claimedSteps : []),
        ];
        return {
            completed,
            completedSteps: [...new Set(migratedCompletedSteps)].map(Number).filter(step => step > 0 && step <= CHALLENGE_TOTAL_COUNT),
            claimedSteps: Array.isArray(saved?.claimedSteps) ? saved.claimedSteps : [],
            openedChests: Array.isArray(saved?.openedChests) ? saved.openedChests : [],
            chestRewards: saved?.chestRewards && typeof saved.chestRewards === 'object' ? saved.chestRewards : {},
        };
    } catch (error) {
        return { completed: CHALLENGE_DEFAULT_COMPLETED, completedSteps: [], claimedSteps: [], openedChests: [], chestRewards: {} };
    }
}

function saveChallengeState(state) {
    window.NollpicChallengeStorage.setItem(CHALLENGE_STATE_KEY, JSON.stringify({
        completed: Math.max(0, Math.min(CHALLENGE_TOTAL_COUNT, Number(state.completed) || 0)),
        completedSteps: [...new Set(state.completedSteps || [])]
            .map(Number)
            .filter(step => step > 0 && step <= CHALLENGE_TOTAL_COUNT),
        claimedSteps: [...new Set(state.claimedSteps || [])]
            .map(Number)
            .filter(step => step > 0 && step <= CHALLENGE_TOTAL_COUNT),
        openedChests: [...new Set(state.openedChests || [])],
        chestRewards: state.chestRewards || {},
    }));
}

function getChallengePoints(state) {
    const chestPoints = (state.openedChests || []).reduce((sum, chestId) => {
        const chestIndex = Number(String(chestId).replace('chest-', '')) - 1;
        if (state.completed < getChallengeChestRequiredCount(chestIndex)) return sum;
        return sum + (Number(state.chestRewards?.[chestId]) || getChallengeChestReward(chestIndex));
    }, 0);

    const claimedPlayPoints = (state.claimedSteps || []).length * CHALLENGE_PLAY_POINTS;
    return CHALLENGE_START_POINTS + claimedPlayPoints + chestPoints;
}

function getChallengeChestRequiredCount(chestIndex) {
    return (Number(chestIndex) + 1) * 2;
}

function formatChallengePoints(points) {
    return `${Number(points || 0).toLocaleString('ko-KR')}P`;
}

function pickChallengeChestReward() {
    return CHALLENGE_CHEST_RANDOM_REWARDS[Math.floor(Math.random() * CHALLENGE_CHEST_RANDOM_REWARDS.length)];
}

function getChallengeAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!challengeAudioContext) challengeAudioContext = new AudioContextClass();
    if (challengeAudioContext.state === 'suspended') challengeAudioContext.resume();
    return challengeAudioContext;
}

function playChallengeChestSound() {
    const ctx = getChallengeAudioContext();
    if (!ctx) return;
    [[740, 0, .09, .045, 1040], [1040, .08, .11, .04, 1480], [1480, .18, .16, .03, 1760]].forEach(([from, offset, duration, volume, to]) => {
        const start = ctx.currentTime + offset;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(from, start);
        oscillator.frequency.exponentialRampToValueAtTime(to, start + duration);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + .012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(start);
        oscillator.stop(start + duration + .03);
    });
}

function showChallengeChestReward(chest, reward) {
    if (!chest) return;
    chest.classList.add('opening');
    chest.querySelectorAll('.chest-reward-pop, .chest-coin').forEach((node) => node.remove());
    document.querySelectorAll('.challenge-chest-fx-layer').forEach((node) => node.remove());

    const rect = chest.getBoundingClientRect();
    const fxLayer = document.createElement('div');
    fxLayer.className = 'challenge-chest-fx-layer';
    fxLayer.style.left = `${rect.left}px`;
    fxLayer.style.top = `${rect.top}px`;
    fxLayer.style.width = `${rect.width}px`;
    fxLayer.style.height = `${rect.height}px`;
    document.body.appendChild(fxLayer);

    const pop = document.createElement('span');
    pop.className = 'chest-reward-pop';
    pop.textContent = `+${reward}P`;
    fxLayer.appendChild(pop);

    for (let i = 0; i < 8; i += 1) {
        const coin = document.createElement('span');
        coin.className = 'chest-coin';
        const angle = (-150 + i * 42) * Math.PI / 180;
        const distance = 42 + (i % 3) * 12;
        coin.style.setProperty('--coin-x', `${Math.cos(angle) * distance}px`);
        coin.style.setProperty('--coin-y', `${Math.sin(angle) * distance - 18}px`);
        coin.style.setProperty('--coin-r', `${80 + i * 32}deg`);
        coin.style.animationDelay = `${i * .025}s`;
        fxLayer.appendChild(coin);
    }

    window.setTimeout(() => {
        chest.classList.remove('opening');
        chest.querySelectorAll('.chest-reward-pop, .chest-coin').forEach((node) => node.remove());
        fxLayer.remove();
    }, 1300);
}

function getChallengeDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getDateDiffInDays(fromDateKey, toDateKey) {
    const fromTime = new Date(`${fromDateKey}T00:00:00`).getTime();
    const toTime = new Date(`${toDateKey}T00:00:00`).getTime();
    if (!Number.isFinite(fromTime) || !Number.isFinite(toTime)) return 0;
    return Math.round((toTime - fromTime) / 86400000);
}

function readChallengeStreak() {
    try {
        const saved = JSON.parse(window.NollpicChallengeStorage.getItem(CHALLENGE_STREAK_KEY) || 'null');
        return {
            lastVisitDate: saved?.lastVisitDate || '',
            streak: Math.max(0, Number(saved?.streak ?? CHALLENGE_DEFAULT_STREAK)),
        };
    } catch (error) {
        return { lastVisitDate: '', streak: CHALLENGE_DEFAULT_STREAK };
    }
}

function saveChallengeStreak(streakState) {
    window.NollpicChallengeStorage.setItem(CHALLENGE_STREAK_KEY, JSON.stringify({
        lastVisitDate: streakState.lastVisitDate || '',
        streak: Math.max(0, Number(streakState.streak) || 0),
    }));
}

function updateChallengeStreakOnVisit() {
    const todayKey = getChallengeDateKey();
    const streakState = readChallengeStreak();

    if (!streakState.lastVisitDate) {
        saveChallengeStreak({ lastVisitDate: todayKey, streak: 1 });
        return 1;
    }

    const diffDays = getDateDiffInDays(streakState.lastVisitDate, todayKey);
    if (diffDays === 0) return streakState.streak;
    if (diffDays === 1) {
        const nextStreak = streakState.streak + 1;
        saveChallengeStreak({ lastVisitDate: todayKey, streak: nextStreak });
        return nextStreak;
    }

    saveChallengeStreak({ lastVisitDate: todayKey, streak: 0 });
    return 0;
}

/* ── 오늘의 놀이 카드 (놀이 전: 오늘 할 놀이 / 놀이 후: 오늘의 평가) ── */
// 챌린지 놀이 목록: area = RESULT_AREAS key, kit = 준비할 교구(없으면 화면만으로 가능)
/* ── 놀이 목록 + 오늘의 맞춤 추천 (2026-10-08) ──
   날짜별 고정 놀이 대신: 놀이마다 영역 점수(challenge-games.js, 관리자 "게임 관리"에서 수정)
   → 아이가 부족한 영역을 보고 그날 칸(N일차)에 놀이 1개를 골라 넣음. 한 번 고른 칸은 그대로 */
const CHALLENGE_PLAN_KEY = 'nollpic_challenge_plan';            // { [day]: { game, area, why, boost, date } }
const CHALLENGE_CATALOG_CACHE_KEY = 'nollpic_challenge_games_override';
const GAME_CATALOG = {};      // 놀이 번호 → 놀이
const CHALLENGE_GAMES = {};   // N일차 → 그날 놀이 (다른 화면이 이 이름으로 씀)
// 옛 고정 순서 (이미 진행한 칸을 새 방식으로 옮길 때만 씀)
const LEGACY_DAY_GAME = { 19: 6, 20: 12, 21: 8, 22: 2, 23: 11, 24: 1, 25: 15, 26: 9, 27: 14, 28: 5, 29: 10, 30: 3 };

function _gameMainArea(g) {
    const w = g.weights || {};
    return (window.NOLLPIC_AREA_KEYS || []).reduce((best, k) => (Number(w[k]) || 0) > (Number(w[best]) || 0) ? k : best, 'attention');
}
function readChallengePlan() {
    const plan = _challengeReadJSON(CHALLENGE_PLAN_KEY, {});
    return plan && typeof plan === 'object' ? plan : {};
}
function saveChallengePlan(plan) {
    try { window.NollpicChallengeStorage.setItem(CHALLENGE_PLAN_KEY, JSON.stringify(plan)); } catch (e) {}
}
function applyGameCatalog(overrides = {}) {
    Object.keys(GAME_CATALOG).forEach(k => delete GAME_CATALOG[k]);
    (window.NOLLPIC_GAME_CATALOG || []).forEach(base => {
        const o = overrides[base.id] || {};
        const g = { ...base, ...o, id: Number(base.id), open: base.open, weights: { ...(base.weights || {}), ...(o.weights || {}) } };
        g.area = _gameMainArea(g);
        GAME_CATALOG[g.id] = g;
    });
    rebuildChallengeDays();
}
function rebuildChallengeDays() {
    Object.keys(CHALLENGE_GAMES).forEach(k => delete CHALLENGE_GAMES[k]);
    const plan = readChallengePlan();
    // 예전 방식으로 이미 끝낸 칸: 그 칸의 원래 놀이를 기록으로 남김 (한 번만)
    let migrated = false;
    try {
        const raw = JSON.parse(window.NollpicChallengeStorage.getItem(CHALLENGE_STATE_KEY) || 'null');
        const done = [...new Set([...(raw?.completedSteps || []), ...(raw?.claimedSteps || [])].map(Number))];
        done.forEach(d => {
            if (d < 1 || d > CHALLENGE_TOTAL_COUNT || plan[d]) return;
            const game = d <= 18 ? d : LEGACY_DAY_GAME[d];
            if (!game) return;
            plan[d] = { game, area: (window.NOLLPIC_GAME_CATALOG || []).find(x => x.id === game) ? _gameMainArea((window.NOLLPIC_GAME_CATALOG || []).find(x => x.id === game)) : 'attention', why: '', boost: d > 18 ? 1 : 0, legacy: true };
            migrated = true;
        });
    } catch (e) {}
    if (migrated) saveChallengePlan(plan);
    Object.entries(plan).forEach(([day, p]) => {
        const g = GAME_CATALOG[p.game];
        if (!g) return;
        CHALLENGE_GAMES[day] = { ...g, base: g.id, boost: Number(p.boost) || 0, area: p.area || g.area, why: p.why || '' };
    });
    // Free-game entry routes must not rewrite a child's historical plan or reward ledger.
    [19, 20, 21, 22, 23, 24, 25].forEach((id, index) => {
        const g = GAME_CATALOG[id];
        if (g) CHALLENGE_GAMES[index + 1] = { ...g, base: id, boost: 0, area: g.area, why: g.desc };
    });
}

// 영역별 "얼마나 필요한가" (낮을수록 먼저 키울 영역): 최근 측정 점수 + 최근 2주 놀이 횟수로 조금씩 보정
function getChallengeAreaNeeds() {
    const keys = window.NOLLPIC_AREA_KEYS || [];
    let latest = null;
    try { latest = _resultGetLatestResult(); } catch (e) {}
    const scores = latest?.scores || (latest?.abilities ? {
        attention: Number(latest.abilities?.[0]?.[3]) || 0, memory: Number(latest.abilities?.[1]?.[3]) || 0,
        reaction: Number(latest.abilities?.[2]?.[3]) || 0, visual: Number(latest.abilities?.[3]?.[3]) || 0,
        inhibition: Number(latest.abilities?.[4]?.[3]) || 0,
    } : null);
    const hasTest = !!scores && keys.some(k => Number(scores[k]) > 0);
    const plan = readChallengePlan();
    const log = _challengeReadJSON(CHALLENGE_DAYLOG_KEY, []);
    const since = getChallengeDateKey(new Date(Date.now() - 14 * 86400000));
    const plays = Object.fromEntries(keys.map(k => [k, 0]));
    log.filter(i => i.date >= since).forEach(i => {
        const g = GAME_CATALOG[plan[i.step]?.game];
        if (!g) return;
        keys.forEach(k => { plays[k] += (Number(g.weights?.[k]) || 0) / 3; });   // 주 영역 1회 = 1, 함께 쓰는 영역은 조금
    });
    const need = keys.map((k, i) => ({
        key: k,
        score: hasTest ? Number(scores[k]) || 0 : null,
        value: (hasTest ? (Number(scores[k]) || 0) : 50) + plays[k] * 4 + i * 0.01,   // 같으면 RESULT_AREAS 순서
    })).sort((a, b) => a.value - b.value);
    return { hasTest, list: need };
}

// N일차 놀이 고르기: 약한 영역 위주, 4일마다 한 번은 두 번째로 필요한 영역. 최근 3칸에 한 놀이·학년에 안 맞는 놀이는 뒤로
function pickChallengeGameForDay(day) {
    if (Number(day) === 1 && GAME_CATALOG[19]) return {
        game: 19, area: 'attention', why: '목표 보석을 찾아 광산을 탐험해요', boost: 0,
        date: getChallengeDateKey(), mineDay1Applied: true, alt: 6, altArea: 'memory', altBoost: 0,
    };
    const fixedGames = { 2: 20, 3: 21, 4: 22, 5: 23, 6: 24, 7: 25 };
    if (fixedGames[Number(day)] && GAME_CATALOG[fixedGames[Number(day)]]) {
        const g = GAME_CATALOG[fixedGames[Number(day)]];
        return { game: g.id, area: Object.keys(g.weights || {})[0] || 'attention', why: `${g.title}에 도전해요`, boost: 0, date: getChallengeDateKey() };
    }
    const plan = readChallengePlan();
    const level = typeof getChildGameLevel === 'function' ? getChildGameLevel() : 1;
    const { hasTest, list } = getChallengeAreaNeeds();
    const variety = day % 4 === 0 && list.length > 1;
    const area = (variety ? list[1] : list[0]).key;
    const played = {};
    Object.entries(plan).forEach(([d, p]) => { if (Number(d) < day) played[p.game] = (played[p.game] || 0) + 1; });
    const recent = new Set([1, 2, 3].map(b => plan[day - b]?.game).filter(Boolean));
    const games = Object.values(GAME_CATALOG).filter(g => g.enabled !== false && level >= (Number(g.minLevel) || 1) && level <= (Number(g.maxLevel) || 3));
    const pool = games.length ? games : Object.values(GAME_CATALOG);
    const rank = (ar) => (g) => {
        let s = (Number(g.weights?.[ar]) || 0) * 10;
        if (recent.has(g.id)) s -= 25;
        s -= (played[g.id] || 0) * 3;
        if (day <= CHALLENGE_FREE_DAYS && g.kit) s -= 6;        // 무료 체험 날은 교구 없이 바로 할 수 있는 놀이
        s += ((g.id * 7 + day * 13) % 10) / 100;               // 점수가 같을 때 날마다 조금씩 다르게
        return s;
    };
    const best = (ar, skip) => pool.filter(g => g.id !== skip).sort((a, b) => rank(ar)(b) - rank(ar)(a))[0];
    const game = best(area);
    if (!game) return null;
    const areaInfo = _challengeArea(area);
    const why = variety ? `오늘은 ${areaInfo.name}도 챙겨요`
        : hasTest ? `${_resultJosa(areaInfo.name, '을/를')} 키우는 날`
        : `${_resultJosa(areaInfo.name, '을/를')} 키우는 날 · 측정하면 더 딱 맞게 골라요`;
    // 고를 거리 (2026-10-12 오늘의 퀘스트): 다른 영역(평소엔 두 번째로 필요한 영역, 4일마다는 첫 번째) 놀이 하나 더
    const altArea = list.length > 1 ? (variety ? list[0] : list[1]).key : area;
    const alt = best(altArea, game.id);
    return {
        game: game.id, area, why, boost: played[game.id] ? 1 : 0, date: getChallengeDateKey(),
        ...(alt ? { alt: alt.id, altArea, altBoost: played[alt.id] ? 1 : 0 } : {}),
    };
}

// 예전에 1개만 골라 둔 칸(오늘·밀린 칸)에 고를 거리 하나 채우기. 이미 끝낸 칸·옛 기록은 그대로
function ensureChallengeDayAlt(day) {
    const plan = readChallengePlan();
    const p = plan[day];
    if (!p || p.legacy || (p.alt && GAME_CATALOG[p.alt]) || isChallengeStepDone(readChallengeState(), day)) return p;
    const fresh = pickChallengeGameForDay(day);
    const altId = fresh && (fresh.game !== p.game ? fresh.game : fresh.alt);
    if (!altId || altId === p.game) return p;
    plan[day] = { ...p, alt: altId, altArea: altId === fresh.game ? fresh.area : fresh.altArea, altBoost: altId === fresh.game ? fresh.boost : fresh.altBoost };
    saveChallengePlan(plan);
    return plan[day];
}

// 오늘의 퀘스트 카드에서 고른 놀이로 시작. 고를 거리를 고르면 그 칸의 놀이를 서로 바꿈 (끝내기 전까지는 다시 바꿀 수 있음)
function chooseTodayChallengeGame(day, gameId) {
    if (isChallengeStepBehindPaywall(day)) { openChallengePaywall(); return; }
    // Recommendation cards may offer an alternative; the numbered map keeps its fixed free-game route.
    if (day >= 1 && day <= 7 && GAME_CATALOG[gameId]) {
        const game = GAME_CATALOG[gameId];
        if (typeof window[game.open] === 'function') {
            activeChallengeDay = { day: Number(day), base: game.id };
            window.__gameLevelBoost = 0;
            window[game.open]();
        }
        return;
    }
    const plan = readChallengePlan();
    const p = plan[day];
    if (p && p.alt === gameId && GAME_CATALOG[gameId] && !isChallengeStepDone(readChallengeState(), day)) {
        plan[day] = { ...p, game: p.alt, area: p.altArea || GAME_CATALOG[gameId].area, boost: Number(p.altBoost) || 0,
            alt: p.game, altArea: p.area, altBoost: Number(p.boost) || 0, why: '' };
        saveChallengePlan(plan);
        rebuildChallengeDays();
    }
    openTodayChallengeGame(day);
}
window.chooseTodayChallengeGame = chooseTodayChallengeGame;

// N일차에 놀이가 없으면 지금 골라 넣음 (오늘 칸·밀린 칸만, 미래 칸은 그날 고름)
function ensureChallengeDayPlanned(day) {
    const plan = readChallengePlan();
    // Preserve completed history and a child's subsequent alternate-game choice.
    const useMine = Number(day) === 1 && GAME_CATALOG[19] && !plan[day]?.mineDay1Applied && !isChallengeStepDone(readChallengeState(), day);
    if (!useMine && plan[day] && GAME_CATALOG[plan[day].game]) return plan[day];
    const picked = pickChallengeGameForDay(day);
    if (!picked) return null;
    plan[day] = picked;
    saveChallengePlan(plan);
    rebuildChallengeDays();
    return picked;
}

// 관리자에서 바꾼 놀이 정보 불러오기 (실패하면 기기에 저장된 값 → 기본값)
async function loadChallengeGameOverrides() {
    try {
        const tools = await getNollpicFirebaseTools();
        const snap = await tools.getDocs(tools.collection(tools.db, 'challengeGames'));
        const o = {};
        snap.docs.forEach(d => { o[Number(d.id)] = d.data(); });
        localStorage.setItem(CHALLENGE_CATALOG_CACHE_KEY, JSON.stringify(o));
        applyGameCatalog(o);
        if (typeof renderChallengeState === 'function') renderChallengeState();
    } catch (e) { /* 기본값 그대로 */ }
}
function _challengeReadJSONSafe(key) { try { return JSON.parse(window.NollpicChallengeStorage.getItem(key) || '{}') || {}; } catch (e) { return {}; } }
const CHALLENGE_DAYLOG_KEY = 'nollpic_challenge_daylog';   // [{ step, date, at, result? }]
const CHALLENGE_TODAY_KEY = 'nollpic_challenge_today';      // { date, steps: [a, b] }

function _challengeReadJSON(key, fallback) {
    try { const v = JSON.parse(window.NollpicChallengeStorage.getItem(key) || 'null'); return v ?? fallback; } catch (e) { return fallback; }
}
function _challengeArea(key) { return RESULT_AREAS.find(a => a.key === key) || RESULT_AREAS[0]; }

// 놀이를 끝낼 때마다 날짜와 함께 기록 (같은 날 같은 놀이는 한 번만)
function logChallengePlay(step, result) {
    const log = _challengeReadJSON(CHALLENGE_DAYLOG_KEY, []);
    const date = getChallengeDateKey();
    let item = log.find(i => i.step === step && i.date === date);
    if (!item) { item = { step, date, at: Date.now() }; log.push(item); }
    // 놀이가 직접 보낸 결과(source 없음)가 자동 요약(source: 'auto')보다 우선
    if (result && !(result.source === 'auto' && item.result && item.result.source !== 'auto')) {
        item.result = { ...(item.result || {}), ...result };
    }
    window.NollpicChallengeStorage.setItem(CHALLENGE_DAYLOG_KEY, JSON.stringify(log.slice(-800)));
}
// 놀이가 결과를 알려줄 때 사용: parent.reportChallengeResult(3, { summary: '3개 중 3개 똑같이 만들었어요', score: 3, total: 3 })
function reportChallengeResult(step, result = {}) {
    const s = mapChallengeStep(step);
    if (!CHALLENGE_GAMES[s] || isChallengeStepBehindPaywall(s)) return;
    logChallengePlay(s, result);
    renderChallengeState();
}
window.reportChallengeResult = reportChallengeResult;

const CHALLENGE_START_KEY = 'nollpic_challenge_start';   // 챌린지 1일째 날짜 (YYYY-MM-DD)

/* ── 무료 체험 ── */
const CHALLENGE_FREE_DAYS = 7;                              // 1~7일째 무료
const CHALLENGE_PAID_KEY = 'nollpic_challenge_paid';        // 결제(이용권) 여부. 지금은 기기에만 저장 — 실제 결제 연결 시 서버 값으로 바꿀 곳
const CHALLENGE_PLANS = [
    { id: 'monthly', name: '월간 이용권', months: 1, monthlyPrice: 9900 },
    { id: 'annual', name: '연간 이용권', months: 12, monthlyPrice: 8900 },
];

function isChallengePaid() {
    try { return window.NollpicChallengeStorage.getItem(CHALLENGE_PAID_KEY) === 'true'; } catch (e) { return false; }
}
// 개발·확인용: 콘솔에서 setChallengePaid(true)
function setChallengePaid(paid) {
    window.NollpicChallengeStorage.setItem(CHALLENGE_PAID_KEY, paid ? 'true' : 'false');
    renderChallengeState();
}
window.setChallengePaid = setChallengePaid;

function isChallengeStepBehindPaywall(n) {
    return !isChallengePaid() && n > CHALLENGE_FREE_DAYS;
}

// 체험 기간에 한 것 요약 (체험 리포트·이어가기 안내에 사용)
function getChallengeTrialSummary() {
    const state = readChallengeState();
    const log = _challengeReadJSON(CHALLENGE_DAYLOG_KEY, []);
    const freeSteps = Array.from({ length: CHALLENGE_FREE_DAYS }, (_, i) => i + 1);
    const done = freeSteps.filter(n => isChallengeStepDone(state, n));
    const areas = [...new Set(done.map(n => CHALLENGE_GAMES[n]?.area).filter(Boolean))].map(_challengeArea);
    const days = new Set(log.filter(i => freeSteps.includes(i.step)).map(i => i.date)).size;
    return { done, areas, days, chest: (state.openedChests || []).includes('chest-1') };
}

function openChallengePaywall() {
    const loggedIn = typeof isNollpicLoggedIn === 'function' && isNollpicLoggedIn();
    let sheet = document.getElementById('challenge-paywall');
    if (!sheet) {
        sheet = document.createElement('dialog');
        sheet.id = 'challenge-paywall';
        sheet.className = 'pw-overlay';
        sheet.setAttribute('aria-labelledby', 'pw-title');
        sheet.addEventListener('click', (e) => { if (e.target === sheet) closeChallengePaywall(); });
        document.body.appendChild(sheet);
    }
    sheet.innerHTML = `
        <section class="pw-sheet">
            <button type="button" class="pw-close" onclick="closeChallengePaywall()" aria-label="이용권 결제 닫기" autofocus>✕</button>
            <h2 id="pw-title">이용권 결제</h2>
            <p class="pw-intro">아이의 매일 놀이를 이어가세요.</p>
            <fieldset class="pw-plans"><legend>이용 기간 선택</legend>
                ${CHALLENGE_PLANS.map((plan, i) => `<label class="pw-plan">
                    <input type="radio" name="challenge-plan" value="${plan.id}" ${i === 0 ? 'checked' : ''} onchange="updateChallengePayment()">
                    <span class="pw-plan-copy"><b>${plan.name}</b><strong>월 ${plan.monthlyPrice.toLocaleString('ko-KR')}<small>원</small></strong><span>${plan.months}개월 이용 · ${plan.months === 12 ? '총 ' : ''}${(plan.months * plan.monthlyPrice).toLocaleString('ko-KR')}원${plan.months === 12 ? ' 한 번에 결제' : ' 결제'}</span></span>
                </label>`).join('')}
            </fieldset>
            <div class="pw-total" aria-live="polite"><span>결제 금액</span><strong id="pw-total"></strong></div>
            <button type="button" class="pw-buy" id="pw-buy" onclick="challengePaywallBuy()"></button>
            <p class="pw-payment-notice">결제 서비스 준비 중으로, 아직 실제 결제는 진행되지 않아요.</p>
            <p class="pw-payment-status" id="pw-payment-status" role="status" hidden></p>
            ${loggedIn ? '' : '<button type="button" class="pw-login" onclick="challengePaywallLogin()">Google 로그인</button>'}
        </section>`;
    updateChallengePayment();
    if (!sheet.open) sheet.showModal();
}
function updateChallengePayment() {
    const selected = document.querySelector('#challenge-paywall input[name="challenge-plan"]:checked');
    const plan = CHALLENGE_PLANS.find(item => item.id === selected?.value);
    const button = document.getElementById('pw-buy');
    const status = document.getElementById('pw-payment-status');
    status.hidden = true;
    status.textContent = '';
    button.disabled = !plan;
    const amount = plan ? (plan.months * plan.monthlyPrice).toLocaleString('ko-KR') + '원' : '';
    document.getElementById('pw-total').textContent = amount || '이용권을 선택해 주세요';
    button.textContent = amount ? amount + ' 결제하기' : '이용권을 선택해 주세요';
    return plan;
}
function closeChallengePaywall() {
    const sheet = document.getElementById('challenge-paywall');
    if (sheet) sheet.close();
}
// shortcut: 결제 서버 연결 전까지 안내만 표시하며 이용권을 활성화하지 않음.
function challengePaywallBuy() {
    const plan = updateChallengePayment();
    if (!plan) return;
    const status = document.getElementById('pw-payment-status');
    status.textContent = `${plan.name} 결제를 준비하고 있어요. 결제 기능이 연결되면 이용할 수 있어요.`;
    status.hidden = false;
}
function challengePaywallLogin() {
    closeChallengePaywall();
    if (typeof googleLogin === 'function') googleLogin();
}

function openChallengeProfile() {
    const esc = (value) => String(value ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const child = getActiveChildProfile();
    const name = child?.name || getNollpicChildName();
    const grade = child?.gradeText || (child?.gradeValue != null ? getGradeTextForProfile(child.gradeValue) : '');
    const gender = child?.gender === 'male' ? '남' : child?.gender === 'female' ? '여' : '';
    const user = getNollpicUser();
    const loggedIn = !!user?.uid;
    const done = getChallengeTrialSummary().done.length;
    const paid = isChallengePaid();
    const status = paid ? '이용권 활성화' : done >= CHALLENGE_FREE_DAYS ? '체험 완료' : '무료 체험 중';
    let dialog = document.getElementById('challenge-profile');
    if (!dialog) {
        dialog = document.createElement('dialog');
        dialog.id = 'challenge-profile';
        dialog.className = 'cw-profile';
        dialog.setAttribute('aria-labelledby', 'cw-profile-title');
        dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
        document.body.appendChild(dialog);
    }
    dialog.innerHTML = `
        <header class="cw-profile-head"><h2 id="cw-profile-title">내 정보</h2><button type="button" onclick="closeChallengeProfile()" aria-label="내 정보 닫기" autofocus>✕</button></header>
        <div class="cw-profile-body">
            <section class="cw-profile-child">
                <div class="cw-profile-person"><span class="cw-profile-face">${window.NollpicAvatar ? NollpicAvatar.drawAvatar() : px('🌱')}</span><div><small>현재 아이</small><h3>${esc(name || '아이를 등록해 주세요')}</h3><p>${esc([grade, gender].filter(Boolean).join(' · ') || (name ? '아이 정보를 확인해 주세요' : '등록 후 아이 정보를 확인할 수 있어요'))}</p></div></div>
                <button type="button" class="cw-profile-button" onclick="openChallengeChildSelection()">${name ? '아이 선택·변경' : '아이 등록·선택'} <span aria-hidden="true">›</span></button>
            </section>
            <section class="cw-profile-section">
                <h3>로그인 계정</h3>
                <p class="cw-profile-account">${esc(loggedIn ? user.email || user.name || 'Google 로그인됨' : '로그인 없이 체험 중이에요')}</p>
                <button type="button" class="cw-profile-button${loggedIn ? ' is-quiet' : ''}" onclick="${loggedIn ? 'closeChallengeProfile(); logoutNollpic()' : 'challengeProfileLogin()'}">${loggedIn ? '로그아웃' : 'Google 로그인'}</button>
            </section>
            <section class="cw-profile-section">
                <h3>이용권 · 결제</h3>
                <dl class="cw-profile-facts"><div><dt>챌린지 상태</dt><dd>${status}</dd></div><div><dt>무료 체험</dt><dd>${done}/${CHALLENGE_FREE_DAYS}일 완료</dd></div></dl>
                <p class="cw-profile-note">현재 기기에 저장된 이용 상태예요.</p>
                ${paid ? '' : '<button type="button" class="cw-profile-button" onclick="closeChallengeProfile(); openChallengePaywall()">이용권 결제 <span aria-hidden="true">›</span></button>'}
                <details class="cw-profile-payments"><summary>결제 내역 <span>조회 준비 중</span></summary><p>결제 기능을 준비하고 있어요. 현재는 결제 내역을 조회할 수 없어요.</p></details>
            </section>
            <button type="button" class="cw-profile-link" onclick="closeChallengeProfile(); openChallengeSettings()">설정 · 도움말 <span aria-hidden="true">›</span></button>
            <a class="cw-profile-link" href="/privacy.html" target="_blank" rel="noopener">개인정보처리방침 <span aria-hidden="true">›</span></a>
        </div>`;
    if (!dialog.open) dialog.showModal();
}
function closeChallengeProfile() {
    document.getElementById('challenge-profile')?.close();
}
function challengeProfileLogin() {
    closeChallengeProfile();
    if (typeof googleLogin !== 'function') { showChallengeToast('로그인을 준비하고 있어요. 잠시 후 다시 눌러 주세요.'); return; }
    googleLogin();
}
/* ── 챌린지 설정 (2026-10-11): 하단 메뉴 '설정' → 소리 · 자주 묻는 질문 · 결제·이용 문의 · 개인정보처리방침 ──
   문의처는 아래 CHALLENGE_SUPPORT에 넣으면 버튼이 그 주소로 열림 (비어 있으면 "준비 중" 안내) */
const CHALLENGE_SUPPORT = {
    kakao: '',   // 카카오톡 채널 1:1 채팅 주소 (예: https://pf.kakao.com/_xxxx/chat)
    email: '',   // 문의 이메일
};
const CHALLENGE_FAQ = [
    ['하루에 몇 칸 할 수 있나요?', '하루에 한 칸씩 열려요. 못 한 날이 있으면 밀린 칸부터 차례대로 따라잡을 수 있어요. 끝낸 칸은 눌러서 언제든 다시 할 수 있어요.'],
    ['월드는 언제 바뀌나요?', '30칸을 모두 완주하면 다음 월드로 넘어가요. 숲 마을에서 시작해 우주 기지, 놀이공원 … 도시 블록 마을까지 12개 월드가 있어요.'],
    ['포인트는 어디에 쓰나요?', '놀이를 끝내고 보물상자를 열면 포인트가 모여요. 모은 포인트로 꾸미기 상점에서 캐릭터 옷과 헤어를 살 수 있어요.'],
    ['무료 체험은 어떻게 되나요?', `${CHALLENGE_FREE_DAYS}일째까지는 무료로 해 볼 수 있어요. ${CHALLENGE_FREE_DAYS + 1}일째부터는 이용권이 있어야 이어서 할 수 있어요.`],
    ['결제·환불은 어떻게 문의하나요?', '결제, 환불, 이용권 관련 내용은 아래 \'결제·이용 문의\'로 남겨 주시면 확인 후 안내해 드려요.'],
    ['기록은 어디에 저장되나요?', '챌린지 진행 기록은 지금 쓰는 기기에 저장돼요. 기기를 바꾸거나 브라우저 데이터를 지우면 기록이 사라질 수 있어요.'],
];
function _readSoundSettings() {
    try { return { music: true, effects: true, musicVolume: 40, effectsVolume: 90, ...JSON.parse(localStorage.getItem('nollpic_sound_settings') || '{}') }; }
    catch (e) { return { music: true, effects: true, musicVolume: 40, effectsVolume: 90 }; }
}
function _saveSoundSettings(patch) {
    const next = { ..._readSoundSettings(), ...patch };
    try { localStorage.setItem('nollpic_sound_settings', JSON.stringify(next)); } catch (e) {}
    try { window.applyNollpicSoundSettings?.(); } catch (e) {}
    window.dispatchEvent(new CustomEvent('nollpic-sound-change', { detail: next }));
    return next;
}
function openChallengeSettings() {
    let sheet = document.getElementById('challenge-settings');
    if (!sheet) {
        sheet = document.createElement('div');
        sheet.id = 'challenge-settings';
        sheet.className = 'cs-overlay';
        sheet.addEventListener('click', (e) => { if (e.target === sheet) closeChallengeSettings(); });
        document.body.appendChild(sheet);
    }
    const esc = (v) => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const snd = _readSoundSettings();
    const icoSpeaker = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
    const icoMusic = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 17V5l11-2v12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><circle cx="6.5" cy="17.5" r="3" fill="currentColor"/><circle cx="17.5" cy="15.5" r="3" fill="currentColor"/></svg>';
    sheet.innerHTML = `
        <section class="cs-sheet" role="dialog" aria-modal="true" aria-labelledby="cs-title">
            <header class="cs-head"><h2 id="cs-title">설정</h2><button type="button" class="cs-close" onclick="closeChallengeSettings()" aria-label="닫기">✕</button></header>
            <h3 class="cs-sec">소리</h3>
            <div class="cs-sound">
                <button type="button" class="cs-toggle${snd.effects !== false ? ' on' : ''}" data-key="effects" aria-pressed="${snd.effects !== false}">${icoSpeaker}<b>효과음</b></button>
                <button type="button" class="cs-toggle${snd.music !== false ? ' on' : ''}" data-key="music" aria-pressed="${snd.music !== false}">${icoMusic}<b>배경음</b></button>
            </div>
            <label class="cs-vol"><span>효과음 크기</span><output>${snd.effectsVolume}%</output><input type="range" min="0" max="100" step="5" value="${snd.effectsVolume}" data-vol="effectsVolume"></label>
            <label class="cs-vol"><span>배경음 크기</span><output>${snd.musicVolume}%</output><input type="range" min="0" max="100" step="5" value="${snd.musicVolume}" data-vol="musicVolume"></label>
            <h3 class="cs-sec">도움말</h3>
            <div class="cs-faq">${CHALLENGE_FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
            <button type="button" class="cs-row" onclick="openChallengeSupport()"><span>결제·이용 문의</span><i>›</i></button>
            <a class="cs-row" href="/privacy.html" target="_blank" rel="noopener"><span>개인정보처리방침</span><i>›</i></a>
        </section>`;
    sheet.querySelectorAll('.cs-toggle').forEach((b) => b.addEventListener('click', () => {
        const key = b.dataset.key;
        const next = _saveSoundSettings({ [key]: _readSoundSettings()[key] === false });
        b.classList.toggle('on', next[key] !== false);
        b.setAttribute('aria-pressed', String(next[key] !== false));
    }));
    sheet.querySelectorAll('input[data-vol]').forEach((input) => input.addEventListener('input', () => {
        input.previousElementSibling.textContent = input.value + '%';
        _saveSoundSettings({ [input.dataset.vol]: Number(input.value) });
    }));
    requestAnimationFrame(() => sheet.classList.add('show'));
}
function closeChallengeSettings() {
    document.getElementById('challenge-settings')?.classList.remove('show');
}
function openChallengeSupport() {
    if (CHALLENGE_SUPPORT.kakao) { window.open(CHALLENGE_SUPPORT.kakao, '_blank', 'noopener'); return; }
    if (CHALLENGE_SUPPORT.email) { location.href = `mailto:${CHALLENGE_SUPPORT.email}?subject=${encodeURIComponent('[놀픽] 결제·이용 문의')}`; return; }
    showChallengeToast('💬 문의 창구를 준비하고 있어요!');
}
window.openChallengeSettings = openChallengeSettings;
window.closeChallengeSettings = closeChallengeSettings;
window.openChallengeSupport = openChallengeSupport;
window.openChallengePaywall = openChallengePaywall;
window.closeChallengePaywall = closeChallengePaywall;
window.challengePaywallBuy = challengePaywallBuy;
window.challengePaywallLogin = challengePaywallLogin;

// 챌린지를 시작한 날. 처음 들어온 날로 정함. 이미 진행한 기록이 있으면 오늘 다음 칸을 할 수 있게 거꾸로 맞춤
function getChallengeStartDate() {
    const saved = window.NollpicChallengeStorage.getItem(CHALLENGE_START_KEY);
    if (saved && /^\d{4}-\d{2}-\d{2}$/.test(saved)) return saved;
    const state = readChallengeState();
    let inOrder = 0;
    const done = new Set(state.completedSteps || []);
    while (done.has(inOrder + 1)) inOrder += 1;
    const start = getChallengeDateKey(new Date(Date.now() - inOrder * 86400000));
    window.NollpicChallengeStorage.setItem(CHALLENGE_START_KEY, start);
    return start;
}

// 오늘이 몇 일째인지 (1~30)
function getChallengeTodayDay() {
    const diff = getDateDiffInDays(getChallengeStartDate(), getChallengeDateKey());
    return Math.max(1, Math.min(CHALLENGE_TOTAL_COUNT, diff + 1));
}

// N일째 칸이 열리는 날짜
function getChallengeDayDate(day) {
    const start = new Date(`${getChallengeStartDate()}T00:00:00`);
    start.setDate(start.getDate() + day - 1);
    return start;
}

function isChallengeStepDone(state, n) {
    return n > 0 && (n <= state.completed || (state.completedSteps || []).includes(n));
}

// 다음에 할 칸: 오늘 날짜 칸까지 중 아직 안 한 첫 칸 (없으면 null = 오늘 도장 완료)
function getChallengeNextStep(state = readChallengeState()) {
    const todayDay = getChallengeTodayDay();
    for (let n = 1; n <= todayDay; n++) {
        if (isChallengeStepBehindPaywall(n)) return n;
        if (isChallengeStepDone(state, n)) continue;
        ensureChallengeDayPlanned(n);   // 그날 놀이는 그 칸에 처음 왔을 때 고름
        return n;
    }
    return null;
}

// 예전 이름 유지 (다른 곳에서 부름): 지금 열려 있는 마지막 칸 = 오늘 날짜 칸
function getChallengeOpenLimit() {
    return getChallengeTodayDay();
}

let activeChallengeDay = null;   // { day, base } 지금 연 칸(N일차)과 그 놀이 번호
function setActiveChallengeDay(step) {
    const g = CHALLENGE_GAMES[step];
    activeChallengeDay = g && g.base ? { day: Number(step), base: g.base } : null;
}
// 놀이가 알려 준 놀이 번호 → 그 놀이가 들어 있는 칸(N일차). 놀이 파일은 자기 번호(1~18)를 보내기 때문
function mapChallengeStep(step) {
    const s = Number(step);
    if (activeChallengeDay && activeChallengeDay.base === s) return activeChallengeDay.day;
    const plan = readChallengePlan();
    const next = getChallengeNextStep();
    if (next && plan[next]?.game === s) return next;           // 오늘 할 칸의 놀이
    const days = Object.keys(plan).map(Number).filter(d => plan[d].game === s).sort((a, b) => b - a);
    return days.length ? days[0] : -1;                         // 이 놀이가 들어간 칸이 없으면 무시
}
function openTodayChallengeGame(step) {
    if (isChallengeStepBehindPaywall(step)) { openChallengePaywall(); return; }
    if (!CHALLENGE_GAMES[step] && step >= 1 && step <= Math.max(7, getChallengeTodayDay())) ensureChallengeDayPlanned(step);
    const g = CHALLENGE_GAMES[step];
    const fn = g && window[g.open];
    if (typeof fn !== 'function') return;
    setActiveChallengeDay(step);
    window.__gameLevelBoost = g.boost || 0;   // gameUrl이 한 번 읽고 지움
    fn();
}
window.openTodayChallengeGame = openTodayChallengeGame;

function showChallengeToast(message) {
    let toast = document.getElementById('challenge-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'challenge-toast';
        toast.className = 'challenge-toast';
        toast.setAttribute('role', 'status');
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showChallengeToast.timer);
    showChallengeToast.timer = setTimeout(() => toast.classList.remove('show'), 2000);
}

// 잠긴 칸을 눌렀을 때 안내 문구
function getChallengeLockedMessage(n) {
    const state = readChallengeState();
    const todayDay = getChallengeTodayDay();
    if (n < 1 || n > CHALLENGE_TOTAL_COUNT) return '🔒 이 칸은 곧 열려요!';
    if (n > todayDay) {
        const diff = n - todayDay;
        if (diff === 1) return getChallengeNextStep(state) ? '🔒 내일 열려요! 오늘 칸부터 해 볼까요?' : '🔒 내일 열려요! 오늘 도장은 이미 받았어요 👏';
        const d = getChallengeDayDate(n);
        return `🔒 ${d.getMonth() + 1}월 ${d.getDate()}일(${n}일차)에 열려요!`;
    }
    return '🔒 앞 칸부터 차례대로 해요!';
}

// 오늘의 퀘스트 카드 "이걸로 시작" 버튼 색 (영역 색을 흰 글자가 읽히게 조금 진하게)
const CW_AREA_BTN = { attention: '#FF7A12', memory: '#2588FF', reaction: '#E09A00', visual: '#8B5CF6', inhibition: '#0E8A5A' };
function renderTodayCard() {
    const card = document.getElementById('today-card');
    if (!card) return;
    card.classList.remove('is-quest');
    const state = readChallengeState();
    const date = getChallengeDateKey();
    const todayDay = getChallengeTodayDay();
    const next = getChallengeNextStep(state);
    const log = _challengeReadJSON(CHALLENGE_DAYLOG_KEY, []);
    const todayLog = log.filter(i => i.date === date && CHALLENGE_GAMES[i.step]);
    const streak = readChallengeStreak().streak;
    const msg = document.getElementById('today-card-message');
    const esc = (v) => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    const gameName = (g) => esc(g.title) + (g.boost ? ' <em class="tc-boost">심화</em>' : '');
    const tile = (s, opts = {}) => {
        const g = CHALLENGE_GAMES[s], area = _challengeArea(g.area);
        const res = todayLog.find(i => i.step === s)?.result;
        return `
        <button type="button" class="tc-tile${opts.done ? ' is-done' : ''}${opts.wide ? ' is-wide' : ''}" onclick="openTodayChallengeGame(${s})" aria-label="${s}일차 ${esc(g.title)} ${opts.done ? '다시 하기' : '시작'}">
            <span class="tc-thumb" style="background:${area.bg}">${gameIcon(g)}${opts.done ? '<i>✓</i>' : ''}</span>
            <span class="tc-tile-text"><strong>${gameName(g)}</strong>
                <small>${opts.done ? esc(res?.summary || '도장 완료!') : `${px(area.emoji)} ${area.name}`}</small></span>
            ${opts.wide ? `<span class="tc-go">${opts.done ? '다시' : '시작'}</span>` : ''}
        </button>`;
    };

    const trial = getChallengeTrialSummary();
    if (!isChallengePaid() && trial.done.length === CHALLENGE_FREE_DAYS) {
        // 무료 체험 끝: 이틀 동안 한 것 + 이어가기
        const t = trial;
        const nextDay = CHALLENGE_FREE_DAYS + 1;
        card.classList.add('is-complete', 'is-trial');
        // 잔액은 상단 한 곳에 표시하고, 여기서는 체험 진행만 표시.
        card.innerHTML = `
            <div class="tc-trial">
                ${Array.from({ length: CHALLENGE_FREE_DAYS }, (_, i) => `<span class="tc-stamp ${t.done.includes(i + 1) ? 'on' : ''}">${t.done.includes(i + 1) ? '✓' : i + 1}</span>`).join('')}
                <span class="tc-stamp is-lock">${px('🔒')}</span>
                <h3 class="tc-trial-title">${px('🌟')} 체험 완료!</h3>
            </div>
            <button type="button" class="tc-continue" onclick="openChallengePaywall()">${nextDay}일차 이어 하기</button>`;
        if (msg) msg.textContent = '';
        return;
    }
    card.classList.remove('is-trial');

    if (next) {
        // 오늘 할 칸 (밀린 칸이 있으면 차례대로 따라잡기)
        const behind = todayDay - next;   // next 뒤로 오늘까지 남은 칸 수
        const missed = log.some(i => i.date < date) && streak === 0 && !todayLog.length;
        const title = next < todayDay ? (todayLog.length ? '하나 더 따라잡기!' : (missed ? '다시 시작해요!' : '밀린 칸 따라잡기')) : '오늘의 놀이';
        const sub = behind > 0 ? `오늘까지 ${behind + 1}칸 남았어요` : esc(CHALLENGE_GAMES[next]?.why || '약 10분');
        const g = CHALLENGE_GAMES[next];
        card.classList.remove('is-complete');
        // 2026-10-12 오늘의 퀘스트: 추천 놀이 + 다른 영역 놀이 하나, 둘 중 골라서 누르면 바로 시작
        const p = ensureChallengeDayAlt(next) || {};
        const g2 = p.alt && GAME_CATALOG[p.alt] ? { ...GAME_CATALOG[p.alt], area: p.altArea || GAME_CATALOG[p.alt].area, boost: Number(p.altBoost) || 0 } : null;
        const plays = new Set(Object.entries(readChallengePlan()).filter(([d]) => Number(d) < next).map(([, x]) => x.game));
        const qcard = (x, tag, tagBg) => {
            const a = _challengeArea(x.area);
            return `
            <button type="button" class="cw-qc" onclick="chooseTodayChallengeGame(${next}, ${x.base || x.id})" aria-label="${next}일차 ${esc(x.title)} 시작">
                <span class="cw-qc-art" style="background:${a.bg}">
                    ${tag ? `<i class="cw-qc-tag" style="background:${tagBg}">${tag}</i>` : ''}
                    ${gameIcon(x)}
                </span>
                <span class="cw-qc-body">
                    <strong>${gameName(x)}</strong>
                    <small>${esc(x.desc || '')}</small>
                    <em class="cw-area" style="color:${a.color};background:${a.bg}">${a.name}</em>
                    <span class="cw-qc-go" style="background:${CW_AREA_BTN[x.area] || '#FF7A12'}">이걸로 시작 ›</span>
                </span>
            </button>`;
        };
        const kits = [g, g2].filter(x => x && x.kit);
        card.classList.add('is-quest');
        card.innerHTML = `
            <div class="cw-q-head"><b>${title === '오늘의 놀이' ? '오늘은 뭐 할까?' : title}</b></div>
            <div class="cw-q-cards${g2 ? '' : ' is-single'}">
                ${qcard(g, '추천', '#FF7A12')}
                ${g2 ? qcard(g2, plays.has(g2.id) ? '' : 'NEW', '#FF4C5E') : ''}
            </div>
            ${kits.map(x => `<div class="tc-prep">${px('🧰')} ${esc(x.title)} 준비물: <b>${esc(x.kit)}</b></div>`).join('')}`;
        if (msg) msg.textContent = '';
        return;
    }

    // 오늘 도장 완료 (또는 다음 칸 놀이가 아직 준비 중)
    let lastDone = 0;
    while (isChallengeStepDone(state, lastDone + 1)) lastDone += 1;
    const waitingForGame = lastDone < todayDay;           // 오늘 칸까지 갔지만 그 칸 놀이가 아직 없음
    const tomorrow = todayDay < CHALLENGE_TOTAL_COUNT ? todayDay + 1 : null;
    const tg = null;   // 내일 놀이는 내일, 오늘 결과까지 보고 고름
    const doneAll = [...new Set(todayLog.map(i => i.step))];
    const doneToday = doneAll.slice(-1);
    card.classList.add('is-complete');
    card.innerHTML = `
        <div class="tc-head"><h3>${px('🎉')} ${waitingForGame ? '지금까지 모두 해냈어요!' : '오늘 도장 완료!'}</h3><span class="tc-sub">${waitingForGame ? `${lastDone + 1}일차는 곧 열려요` : doneAll.length > 1 ? `오늘 ${doneAll.length}칸 해냈어요` : ''}</span><span class="tc-count is-done">✓</span></div>
        ${doneToday.length ? `<div class="tc-tiles${doneToday.length === 1 ? ' is-single' : ''}">${doneToday.map(s => tile(s, { done: true, wide: doneToday.length === 1 })).join('')}</div>` : ''}
        <div class="tc-foot"><span>${px('🔥')} ${streak}일 연속</span>${waitingForGame ? '<span>새 놀이 준비 중</span>' : lastDone % CHALLENGE_WORLD_DAYS === 0 && lastDone > 0 ? `<span>🏆 ${getChallengeWorldOfDay(lastDone).name} 완주!${tomorrow ? ` 내일은 월드 ${getChallengeWorldOfDay(tomorrow).n}` : ''}</span>` : tomorrow ? `<span>내일 놀이는 내일 딱 맞게 골라요</span>` : '<span>🏆 모든 월드 완주!</span>'}</div>`;
    if (msg) msg.textContent = waitingForGame ? '지난 칸은 눌러서 언제든 다시 할 수 있어요!'
        : tomorrow && isChallengeStepBehindPaywall(tomorrow)
        ? '무료 체험 마지막 날 완료! 내일부터는 교구 세트와 함께 이어가요 🧰'
        : '';
}

function renderMapAvatar(page, state) {
    const roadmap = page.querySelector('.challenge-roadmap');
    if (!roadmap || !window.NollpicAvatar) return;
    const nodes = [...roadmap.querySelectorAll('.road-node')];
    const target = nodes.find(n => n.classList.contains('is-next'))
        || nodes.filter(n => n.classList.contains('done')).sort((a, b) => getRoadNodeNumber(b) - getRoadNodeNumber(a))[0]
        || nodes.find(n => getRoadNodeNumber(n) === 1);
    if (!target) return;
    let el = roadmap.querySelector('.map-avatar');
    if (!el) { el = document.createElement('div'); el.className = 'map-avatar'; el.setAttribute('aria-hidden', 'true'); roadmap.appendChild(el); }
    el.innerHTML = NollpicAvatar.drawAvatar();
    el.style.setProperty('--x', target.style.getPropertyValue('--x'));
    el.style.setProperty('--y', target.style.getPropertyValue('--y'));
    // 맨 윗줄 칸(1~2일째 등)은 위에 서면 현황 칩 줄에 가려 머리가 잘림 → 칸 오른쪽 길 위에 섬
    el.classList.toggle('is-top', parseFloat(target.style.getPropertyValue('--y')) < 60);
}

function getRoadNodeNumber(node) {
    return Number(node?.querySelector('span')?.textContent?.trim()) || 0;
}

/* ── 누가 하고 있는지 보이게 (2026-10-11) ──
   챌린지 위 줄: 꾸민 캐릭터 얼굴 + 이름 (누르면 내 정보) */
function getNollpicChildName() {
    const c = getSelectedChildProfile();
    return String(c?.name || '').trim();
}
function renderChallengeMe(page) {
    const face = page.querySelector('#cw-me-face');
    if (face && window.NollpicAvatar) {
        const html = NollpicAvatar.drawAvatar();
        if (face.dataset.html !== html) { face.innerHTML = html; face.dataset.html = html; }
    }
    const nameEl = page.querySelector('#cw-me-name');
    const name = getNollpicChildName();
    if (nameEl) { nameEl.textContent = name; nameEl.hidden = !name; }
    page.querySelector('#cw-me')?.setAttribute('aria-label', `${name ? name + ' ' : ''}내 정보`);
}

function renderChallengeState() {
    updateChallengeEntryLabels();
    const page = document.getElementById('page-11');
    if (!page) return;

    const state = readChallengeState();
    const points = getChallengePoints(state);
    const completedCount = new Set(state.completedSteps || []).size;
    const remaining = Math.max(0, CHALLENGE_TOTAL_COUNT - completedCount);

    // 2026-10-11 월드 헤더: 연속·포인트 칩, 월드 이름, 진행바(이번 월드 30칸 기준, 10·20칸 선물 / 30칸 트로피)
    const streakEl = page.querySelector('#cw-streak');
    if (streakEl) streakEl.textContent = String(readChallengeStreak().streak);
    const pointEl = page.querySelector('#cw-points');
    if (pointEl) pointEl.textContent = Number(window.NollpicAvatar ? NollpicAvatar.balance() : points).toLocaleString('ko-KR');
    const world = renderChallengeWorld(page, state);
    renderChallengeMe(page);
    const worldOffset = (world.n - 1) * CHALLENGE_WORLD_DAYS;
    const worldDone = (state.completedSteps || []).filter(n => n > worldOffset && n <= worldOffset + CHALLENGE_WORLD_DAYS && !isChallengeStepBehindPaywall(n)).length;
    const countEl = page.querySelector('#cw-progress-count');
    if (countEl) countEl.textContent = String(worldDone);
    const progressFill = page.querySelector('.challenge-progress-track span');
    if (progressFill) progressFill.style.width = `${(worldDone / CHALLENGE_WORLD_DAYS) * 100}%`;
    page.querySelectorAll('.cw-mark').forEach((m) => m.classList.toggle('is-on', worldDone >= Number(m.dataset.at)));

    // 칸 상태: 끝낸 칸(done, 다시 하기 가능) / 오늘 할 칸(is-open) / 잠긴 칸(locked: 앞 칸 먼저, 아직 날짜 안 됨, 놀이 준비 중)
    const nextStep = getChallengeNextStep(state);
    page.querySelectorAll('.road-node').forEach((node) => {
        const number = getRoadNodeNumber(node);
        const hasGame = number >= 1 && number <= CHALLENGE_TOTAL_COUNT;   // 모든 칸에 그날 놀이가 들어감
        node.classList.toggle('is-soon', !hasGame);
        const boostTag = node.querySelector('.road-boost');
        if (CHALLENGE_GAMES[number]?.boost) { if (!boostTag) node.insertAdjacentHTML('beforeend', '<em class="road-boost">심화</em>'); }
        else if (boostTag) boostTag.remove();
        const pg = CHALLENGE_GAMES[number];
        node.title = pg ? `${number}일차 · ${pg.title}` : `${number}일차`;
        const isPaywall = isChallengeStepBehindPaywall(number);
        const isDone = !isPaywall && isChallengeStepDone(state, number);
        const isOpen = !isPaywall && !isDone && hasGame && (number === nextStep || (number >= 1 && number <= 7));
        node.classList.toggle('is-paywall', isPaywall && hasGame);

        node.classList.toggle('done', isDone);
        node.classList.toggle('is-open', isOpen);
        node.classList.toggle('locked', !isDone && !isOpen);
        node.classList.toggle('is-next', isOpen && number === nextStep);
        node.setAttribute('role', 'button');
        node.setAttribute('tabindex', (isDone && hasGame) || isOpen ? '0' : '-1');
        node.setAttribute('aria-label', isDone ? `${number}일차 ${pg ? pg.title + ' ' : ''}완료 · 다시 하기` : isOpen ? `${number}일차 ${pg ? pg.title + ' ' : ''}도전` : `${number}일차 잠김`);

        const icon = node.querySelector('i');
        if (icon) icon.textContent = isDone ? '✓' : '';
    });

    renderMapAvatar(page, state);

    page.querySelectorAll('.road-chest[data-chest-id]').forEach((chest) => {
        const chestIndex = Number(String(chest.dataset.chestId).replace('chest-', '')) - 1;
        const reward = Number(state.chestRewards?.[chest.dataset.chestId]) || getChallengeChestReward(chestIndex);
        const requiredCount = getChallengeChestRequiredCount(chestIndex);
        const isUnlocked = state.completed >= requiredCount && !isChallengeStepBehindPaywall(requiredCount);
        const isOpen = isUnlocked && state.openedChests.includes(chest.dataset.chestId);

        chest.classList.toggle('opened', isOpen);
        chest.classList.toggle('is-locked', !isUnlocked);
        chest.disabled = !isUnlocked;
        chest.setAttribute('aria-label', isOpen ? `열린 보물상자 ${reward}P 받음` : isUnlocked ? '보물상자 열기' : '잠긴 보물상자');
        chest.setAttribute('aria-pressed', isOpen ? 'true' : 'false');
    });

    renderTodayCard();
}

function completeChallengeStep(stepNumber) {
    const step = mapChallengeStep(stepNumber);
    if (!Number.isFinite(step) || step < 1 || step > CHALLENGE_TOTAL_COUNT || isChallengeStepBehindPaywall(step)) return;
    const state = readChallengeState();
    state.completedSteps = [...new Set([...(state.completedSteps || []), step])];
    while (state.completedSteps.includes(state.completed + 1)) state.completed += 1;
    saveChallengeState(state);
    if (CHALLENGE_GAMES[step]) logChallengePlay(step);
    renderChallengeState();
}

function claimChallengeStepReward(stepNumber) {
    const step = mapChallengeStep(stepNumber);
    if (!Number.isFinite(step) || step < 1 || step > CHALLENGE_TOTAL_COUNT || isChallengeStepBehindPaywall(step)) return false;

    const state = readChallengeState();
    state.completedSteps = [...new Set([...(state.completedSteps || []), step])];
    while (state.completedSteps.includes(state.completed + 1)) state.completed += 1;
    if (CHALLENGE_GAMES[step]) logChallengePlay(step);

    state.claimedSteps = [...new Set(state.claimedSteps || [])];
    if (!state.claimedSteps.includes(step)) {
        state.claimedSteps.push(step);
        saveChallengeState(state);
        renderChallengeState();
        return true;
    }

    saveChallengeState(state);
    renderChallengeState();
    return false;
}

function openChallengeRewardChest(chestId) {
    const state = readChallengeState();
    const chestIndex = Number(String(chestId).replace('chest-', '')) - 1;
    if (chestIndex < 0 || chestIndex >= CHALLENGE_TOTAL_COUNT / 2) return;

    const requiredCount = getChallengeChestRequiredCount(chestIndex);
    if (isChallengeStepBehindPaywall(requiredCount) || state.completed < requiredCount || state.openedChests.includes(chestId)) {
        renderChallengeState();
        return;
    }

    const reward = pickChallengeChestReward();
    state.chestRewards = state.chestRewards || {};
    state.chestRewards[chestId] = reward;
    state.openedChests.push(chestId);
    saveChallengeState(state);
    renderChallengeState();
    playChallengeChestSound();
    const chest = document.querySelector(`#page-11 .road-chest[data-chest-id="${chestId}"]`);
    showChallengeChestReward(chest, reward);
}

applyGameCatalog(_challengeReadJSONSafe(CHALLENGE_CATALOG_CACHE_KEY));   // 기기에 저장된 관리자 값 → 없으면 기본값

function initChallengeProgress() {
    const page = document.getElementById('page-11');
    if (!page || page.dataset.challengeProgressReady === 'true') {
        renderChallengeState();
        return;
    }

    page.dataset.challengeProgressReady = 'true';
    loadChallengeGameOverrides();   // 관리자 "게임 관리" 값

    const roadmap = page.querySelector('.challenge-roadmap');
    if (roadmap) roadmap.addEventListener('click', (event) => {
        const node = event.target.closest('.road-node');
        if (!node) return;
        if (!node.classList.contains('locked')) {
            // 칸에 적힌 고정 놀이(onclick) 대신 그 칸에 골라 넣은 놀이를 엶
            event.preventDefault(); event.stopPropagation();
            openTodayChallengeGame(getRoadNodeNumber(node));
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        const lockedNumber = getRoadNodeNumber(node);
        if (lockedNumber <= CHALLENGE_TOTAL_COUNT && isChallengeStepBehindPaywall(lockedNumber) && lockedNumber <= getChallengeTodayDay() + 1) { openChallengePaywall(); return; }
        showChallengeToast(getChallengeLockedMessage(lockedNumber));
    }, true);

    // 놀이가 없는 칸(19~30)은 눌러도 완료 처리하지 않음 (예전에는 누르기만 해도 완료됐음)

    page.querySelectorAll('.road-chest[data-chest-id]').forEach((chest) => {
        chest.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            openChallengeRewardChest(chest.dataset.chestId);
        }, true);
    });

    window.openChallengeChest = openChallengeRewardChest;
    window.claimChallengeStepReward = claimChallengeStepReward;
    window.initChallengePreview = renderChallengeState;
    renderChallengeState();
    requestAnimationFrame(renderChallengeState);
}

window.addEventListener('DOMContentLoaded', () => {
    if (!nollpicReloadNavigation) clearGuestNollpicHistory();
    setupGradeSelectOptions(document.getElementById('child-grade'));
    normalizeChallengeLinks();

    const params = new URLSearchParams(window.location.search);
    if (params.get('resetChallenge') === '1') {
        window.NollpicChallengeStorage.removeItem(CHALLENGE_STATE_KEY);
        window.NollpicChallengeStorage.removeItem('nollpic_challenge_opened_chests');
        window.NollpicChallengeStorage.removeItem(CHALLENGE_STREAK_KEY);
        params.delete('resetChallenge');
        const cleanQuery = params.toString();
        const cleanUrl = `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ''}${window.location.hash}`;
        window.history.replaceState({}, '', cleanUrl);
    }

    updateChallengeStreakOnVisit();
    initChallengeProgress();

    const page = params.get('page');
    if (nollpicReloadView && document.getElementById('page-' + nollpicReloadView.page)) {
        const saved = nollpicReloadView;
        const frame = document.getElementById('test-frame');
        if (saved.page === 5 && frame && saved.testSrc) {
            const url = new URL(saved.testSrc, window.location.href);
            if (url.origin === window.location.origin && url.pathname.endsWith('/tests/tests.html')) frame.src = url.href;
        }
        nextPage(saved.page);
        document.querySelectorAll('#page-4 .check-card').forEach((el,index)=>el.classList.toggle('active',(saved.checks || []).includes(index)));
        if (saved.page === 6) requestAnimationFrame(() => initResultPage());
    } else if (page === 'home') {
        nextPage(2);
    } else if (page === 'play') {
        window.goBottomPlay();
    } else if (page === 'mypage') {
        nextPage(3);
    } else if (page === 'result') {
        nextPage(6);
        requestAnimationFrame(() => initResultPage());
    } else if (page === 'challenge') {
        goBottomChallenge();
    } else {
        updateBottomNav(1);
    }
    document.querySelectorAll('.page').forEach(el => new MutationObserver(saveNollpicCurrentView).observe(el,{attributes:true,attributeFilter:['class']}));
    saveNollpicCurrentView();
});

window.addEventListener('popstate', (event) => {
    if (event.state?.nollpicNavPage && getActivePageNumber() !== 5 && !document.querySelector('.gm-game-host')) {
        challengeNavContext = event.state.challengeNav === true;
        const page = event.state.nollpicNavPage;
        if (page === 11) goBottomChallenge();
        else if ([13, 14, 15].includes(page)) openChallengePanel(page);
        else nextPage(page);
        return;
    }
    if (getActivePageNumber() !== 5) return;

    const returnPage =
        Number(event.state?.returnPage) ||
        getStoredTestReturnPage(3);

    sessionStorage.removeItem('nollpic_test_return_page');
    nextPage(returnPage);
});

// Firebase module에서 안정적으로 호출할 수 있도록 전역에 연결합니다.
window.nextPage = nextPage;
window.prevPage = prevPage;
window.editChild = editChild;
window.deleteChild = deleteChild;
window.startTestForChild = startTestForChild;
window.logoutNollpic = logoutNollpic;
window.goBottomChallenge = goBottomChallenge;
window.openChallengePanel = openChallengePanel;

/* ================================================================
   검사결과 page-6 — mypage-result.js 통합
   모든 데이터 읽기/렌더링 로직을 index 내부에서 처리
================================================================ */

// 영역 이름: 대표 이름(홈페이지 카테고리와 같음) + 전문 표기
// Shared by results and icon rendering; keep outside challenge-only code.
function px(e) { return window.pixIcon ? window.pixIcon(e) : e; }
// 놀이 그림: img가 있으면 그림(예: 기억 공방 = 스시), 없으면 이모지 픽셀 아이콘 (2026-10-11)
function gameIcon(g) { return g && g.img ? `<img class="game-ico" src="${g.img}" alt="">` : px((g && g.emoji) || '🎲'); }

const RESULT_AREAS = [
    { key: 'attention',  name: '끈기력',   pro: '집중 유지력', emoji: '🎯', color: '#FF7A1A', bg: '#FFF1E6' },
    { key: 'memory',     name: '기억력',   pro: '작업 기억력', emoji: '🧩', color: '#3B82F6', bg: '#EAF2FF' },
    { key: 'reaction',   name: '순발력',   pro: '반응 속도',   emoji: '⚡', color: '#F5A800', bg: '#FFF7DB' },
    { key: 'visual',     name: '관찰력',   pro: '시각 탐색',   emoji: '🔍', color: '#8B5CF6', bg: '#F1EBFF' },
    { key: 'inhibition', name: '충동조절', pro: '충동 억제',   emoji: '✋', color: '#10A36B', bg: '#E5F7EF' }
];
const _resultScoreLabels = RESULT_AREAS.map(a => [a.key, `${a.emoji} ${a.name}`]);

// 받침에 맞는 조사 (이/가, 은/는, 을/를)
function _resultJosa(word, pair) {
    const code = String(word).charCodeAt(String(word).length - 1) - 0xAC00;
    const has = code >= 0 && code <= 11171 && code % 28 !== 0;
    const [withB, without] = pair.split('/');
    return word + (has ? withB : without);
}

let _resultIndex = 0;
let _resultSamples = [null];
let _resultHistoryOpen = false;


/* ── 유틸 ── */
function _resultSafeJSON(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch(e) { return fallback; }
}

function _resultSafeSessionJSON(key, fallback) {
    try { const v = sessionStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch(e) { return fallback; }
}

function _resultGetLatestResult() {
    if (isNollpicLoggedIn()) {
        return _resultSafeJSON('nollpic_latest_result', null);
    }

    return _resultSafeJSON('nollpic_latest_result', null) || _resultSafeSessionJSON('nollpic_guest_latest_result', null);
}

function _resultGetHistoryResults() {
    return _resultSafeJSON('nollpic_result_history', []);
}

function _resultGetScoreLevel(score) {
    if (score >= 80) return 'strong';
    if (score >= 60) return 'normal';
    return 'need';
}

function _resultGetScoreLevelLabel(score) {
    const l = _resultGetScoreLevel(Number(score) || 0);
    return l === 'strong' ? '✨ 강점 영역' : l === 'normal' ? '👍 보통 영역' : '🌱 연습 필요';
}

function _resultGetAbilityFeedback(key, score) {
    const level = _resultGetScoreLevel(Number(score) || 0);
    const map = {
        attention: { strong:'끈기력은 좋은 편입니다. 목표를 보고 순서대로 찾아가는 힘이 안정적으로 나타났어요.', normal:'끈기력은 보통 수준입니다. 컨디션이나 주변 환경에 따라 집중 시간이 달라질 수 있어요.', need:'끈기력 연습이 필요합니다. 과제를 끝까지 살피기보다 중간에 놓치거나 서두르는 모습이 나타날 수 있어요.' },
        memory:    { strong:'기억력은 좋은 편입니다. 방금 본 정보를 머릿속에 잠시 저장하고 활용하는 힘이 안정적으로 나타났어요.', normal:'기억력은 보통 수준입니다. 규칙이나 위치를 기억하는 놀이를 반복하면 더 안정적으로 좋아질 수 있어요.', need:'기억력 연습이 필요합니다. 설명을 듣고 바로 잊거나, 순서와 위치를 헷갈리는 모습이 나타날 수 있어요.' },
        reaction:  { strong:'순발력은 좋은 편입니다. 자극을 보고 빠르게 반응하는 힘이 안정적으로 나타났어요.', normal:'순발력은 보통 수준입니다. 빠르게 누르는 것보다 정확하게 반응하는 연습을 함께 하면 좋아요.', need:'순발력 연습이 필요합니다. 화면의 변화를 알아차리고 행동으로 옮기는 시간이 다소 걸릴 수 있어요.' },
        inhibition:{ strong:'충동조절은 좋은 편입니다. 하고 싶은 반응을 잠시 멈추고 규칙에 맞게 선택하는 힘이 안정적으로 나타났어요.', normal:'충동조절은 보통 수준입니다. 빨리 하려는 마음이 커질 때 실수가 늘 수 있어요.', need:'충동조절 연습이 필요합니다. 문제를 끝까지 보기 전에 서두르거나, 멈춰야 할 때 반응하는 모습이 나타날 수 있어요.' },
        visual:    { strong:'관찰력은 좋은 편입니다. 여러 정보 속에서 필요한 목표를 빠르게 찾는 힘이 안정적으로 나타났어요.', normal:'관찰력은 보통 수준입니다. 복잡한 화면에서 목표를 찾는 놀이를 반복하면 더 좋아질 수 있어요.', need:'관찰력 연습이 필요합니다. 여러 자극 속에서 필요한 정보를 찾을 때 놓치거나 시간이 걸릴 수 있어요.' }
    };
    return map[key]?.[level] || '오늘 검사 결과가 저장되었어요.';
}

function _resultMakeAnalysis(scores) {
    const labels = RESULT_AREAS;
    // 가장 잘한 영역 / 연습할 영역은 추천 카드와 같은 기준으로 고름 (점수가 같으면 RESULT_AREAS 순서)
    const best = labels.reduce((b, a) => (Number(scores[a.key]) || 0) > (Number(scores[b.key]) || 0) ? a : b, labels[0]);
    const need = labels.find(a => a.key === _resultGetWeakArea(scores)) || labels[0];
    const summary = `오늘 결과에서는 <strong>${_resultJosa(best.name, '이/가')}</strong> 가장 안정적으로 나타났고, <strong>${_resultJosa(need.name, '은/는')}</strong> 다음 놀이에서 조금 더 연습해보면 좋아요.`;
    const detail = labels.map(item => {
        const score = Number(scores[item.key]) || 0;
        return `<div class="analysis-row"><strong>${px(item.emoji)} ${item.name} <b class="analysis-score">${score}점</b> · ${_resultGetScoreLevelLabel(score)}</strong><br><span>${_resultGetAbilityFeedback(item.key, score)}</span></div>`;
    }).join('');
    const guide = `<div class="analysis-guide"><strong>추천 방향</strong><br>점수가 낮게 나온 영역은 하루 5~10분씩 짧게 반복해보세요.</div>`;
    return `${summary}<br><br>${detail}${guide}`;
}

const _resultRecommendConfig = {
    inhibition: {
        area: '충동조절',
        title: '우리 아이는',
        desc: '기다림보다는 즉시 행동하려는 경향이 있습니다.',
        fallback: [
            { title:'컬러 스톱', description:'색깔 신호를 보고 멈추는 연습을 해요.' },
            { title:'신호등 게임', description:'초록불에는 움직이고 빨간불에는 멈춰요.' },
            { title:'플랭커 챌린지', description:'주변 자극을 참고해 정답 방향을 골라요.' }
        ]
    },
    visual: {
        area: '관찰력',
        title: '우리 아이는',
        desc: '여러 정보 속에서 필요한 목표를 찾는 연습이 도움이 됩니다.',
        fallback: [
            { title:'숨은 그림 찾기', description:'정해진 목표를 빠르게 찾아보는 놀이예요.' },
            { title:'숫자 찾기', description:'숫자를 순서대로 찾아 시선을 움직여요.' },
            { title:'같은 모양 찾기', description:'비슷한 자극 사이에서 같은 모양을 찾아요.' }
        ]
    },
    reaction: {
        area: '순발력',
        title: '우리 아이는',
        desc: '신호를 보고 빠르게 반응하는 연습이 도움이 됩니다.',
        fallback: [
            { title:'터치 신호 게임', description:'나오는 신호에 맞춰 빠르게 터치해요.' },
            { title:'박수 따라치기', description:'리듬을 듣고 즉시 따라 반응해요.' },
            { title:'빠른 색깔 고르기', description:'색이 바뀌면 맞는 버튼을 골라요.' }
        ]
    },
    memory: {
        area: '기억력',
        title: '우리 아이는',
        desc: '방금 본 정보를 잠시 기억하고 다시 떠올리는 연습이 도움이 됩니다.',
        fallback: [
            { title:'위치 기억 카드', description:'잠깐 본 위치를 기억해 다시 찾아요.' },
            { title:'순서 따라하기', description:'보여준 순서를 기억해 그대로 눌러요.' },
            { title:'그림 기억 놀이', description:'사라진 그림을 떠올려 골라요.' }
        ]
    },
    attention: {
        area: '끈기력',
        title: '우리 아이는',
        desc: '한 가지 목표에 시선을 유지하는 짧은 반복 놀이가 도움이 됩니다.',
        fallback: [
            { title:'슐테표 놀이', description:'숫자를 순서대로 찾아 집중을 이어가요.' },
            { title:'타이머 미션', description:'짧은 시간 동안 한 가지 과제를 완성해요.' },
            { title:'찾기 집중 게임', description:'정해진 목표만 골라 누르는 놀이예요.' }
        ]
    }
};

let _resultRecommendedPlayCache = null;

function _resultEscape(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[char]));
}

function _resultGetRecommendedPlayLink(item = {}) {
    return String(item.link || item.url || item.href || item.playUrl || item.detailUrl || '').trim();
}

function _resultGetDisplayChildName(value) {
    const childName = String(value || '')
        .split('·')[0]
        .replace(/\s*\([^)]*\)\s*$/g, '')
        .trim();
    return childName === '우리 아이' ? '' : childName;
}

function _resultGetRecommendationSubject(childName) {
    const displayName = _resultGetDisplayChildName(childName);
    return displayName ? `'${displayName}'는` : '우리 아이는';
}

function _resultGetWeakArea(scores = {}) {
    // 가장 낮은 영역. 점수가 같으면 RESULT_AREAS 순서로 앞의 것 (분석 글과 추천 카드가 같은 함수를 씀)
    return RESULT_AREAS.reduce((w, a) => (Number(scores[a.key]) || 0) < (Number(scores[w.key]) || 0) ? a : w, RESULT_AREAS[0]).key;
}

async function _resultFetchRecommendedPlays() {
    if (_resultRecommendedPlayCache) return _resultRecommendedPlayCache;

    try {
        const tools = await getNollpicFirebaseTools();
        const snap = await tools.getDocs(tools.collection(tools.db, 'recommendedPlays'));
        _resultRecommendedPlayCache = snap.docs
            .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
            .filter(item => item.enabled !== false)
            .sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));
    } catch (e) {
        _resultRecommendedPlayCache = [];
    }

    return _resultRecommendedPlayCache;
}

function _resultSetRecommendationContent(areaKey, plays, childName = '') {
    const card = document.getElementById('result-recommend-card');
    const areaEl = document.getElementById('result-recommend-area');
    const titleEl = document.getElementById('result-recommend-title');
    const descEl = document.getElementById('result-recommend-desc');
    const listEl = document.getElementById('result-recommend-list');
    if (!card || !areaEl || !titleEl || !descEl || !listEl) return;

    const config = _resultRecommendConfig[areaKey] || _resultRecommendConfig.inhibition;
    const items = (plays && plays.length ? plays : config.fallback).slice(0, 3);
    areaEl.textContent = config.area;
    titleEl.textContent = '이 놀이를 추천 드려요!';
    descEl.textContent = `${_resultGetRecommendationSubject(childName)} ${config.desc}`;
    listEl.innerHTML = items.map((item, index) => {
        const thumb = item.thumbnail
            ? `<img class="recommend-thumb" src="${_resultEscape(item.thumbnail)}" alt="">`
            : `<div class="recommend-thumb recommend-fallback-thumb">${index + 1}</div>`;
        const title = _resultEscape(item.title || `추천 놀이 ${index + 1}`);
        const description = item.description ? `<p>${_resultEscape(item.description)}</p>` : '';
        const link = _resultGetRecommendedPlayLink(item);
        const content = `${thumb}<div><strong>${title}</strong>${description}</div>`;
        return link
            ? `<a class="recommend-item" href="${_resultEscape(link)}" target="_blank" rel="noopener noreferrer">${content}</a>`
            : `<div class="recommend-item">${content}</div>`;
    }).join('');
}

function openRecommendedPlayDetail() {
    window.open('https://nollpic.com/index.html', '_blank', 'noopener,noreferrer');
}

async function _resultRenderRecommendedPlays(data) {
    const scores = data?.scores || {
        attention: Number(data?.abilities?.[0]?.[3]) || 0,
        memory: Number(data?.abilities?.[1]?.[3]) || 0,
        reaction: Number(data?.abilities?.[2]?.[3]) || 0,
        visual: Number(data?.abilities?.[3]?.[3]) || 0,
        inhibition: Number(data?.abilities?.[4]?.[3]) || 0
    };
    const areaKey = _resultGetWeakArea(scores);
    const config = _resultRecommendConfig[areaKey] || _resultRecommendConfig.inhibition;
    const childName = data?.childName || data?.child || '';

    _resultSetRecommendationContent(areaKey, config.fallback, childName);
    const plays = await _resultFetchRecommendedPlays();
    const areaPlays = plays.filter(item => item.area === areaKey);
    if (areaPlays.length) _resultSetRecommendationContent(areaKey, areaPlays, childName);
}

/* ── 아이 목록 수집 ── */
function _resultNormalizeChild(item) {
    if (!item) return null;
    const c = item.child || item;
    if (!c || !c.name) return null;
    return { id: c.id || item.childId || '', name: c.name || item.childName || '우리 아이', gradeText: c.gradeText || item.gradeText || '', gradeValue: c.gradeValue || '', gender: c.gender || '' };
}

function _resultIsSameChild(item, child) {
    if (!item || !child) return false;
    const ic = item.child || {};
    if (child.id && (item.childId === child.id || ic.id === child.id)) return true;
    return !!(child.name && (item.childName === child.name || ic.name === child.name) && (item.gradeText === child.gradeText || ic.gradeText === child.gradeText));
}

function _resultIsCompleteResult(item) {
    if (!item || item.isComplete === false) return false;
    if (item.isComplete === true || Number(item.finishedTests) === 5) return true;
    const scores = item.scores || {};
    return ['attention', 'memory', 'reaction', 'visual', 'inhibition']
        .every(key => Number.isFinite(Number(scores[key])));
}

function _resultGetAllChildren() {
    const children = _resultSafeJSON(getChildrenStorageKey(), []);
    const history  = _resultGetHistoryResults();
    const latest   = _resultGetLatestResult();
    const profile  = _resultSafeJSON('nollpic_child_profile', null);
    const selected = _resultSafeJSON('nollpic_selected_child', null);
    const user = getNollpicUser();
    const canUseResultHistory = !!(user && user.uid);
    const map = new Map();
    [...children, selected, profile].forEach(c => {
        if (!c || !c.name) return;
        const key = c.id || `${c.name}_${c.gradeText||''}_${c.gender||''}`;
        map.set(key, { ...c, id: c.id || key });
    });
    if (canUseResultHistory) {
        [latest, ...history].forEach(item => {
            if (!_resultIsCompleteResult(item)) return;
            const c = _resultNormalizeChild(item);
            if (!c || !c.name) return;
            const key = c.id || `${c.name}_${c.gradeText||''}_${c.gender||''}`;
            if (!map.has(key)) map.set(key, { ...c, id: c.id || key });
        });
    }
    return Array.from(map.values());
}

function _resultGetRecordKey(item) {
    if (item.resultId) return `id:${item.resultId}`;
    if (item.completedAtMs) return `time:${item.childId || item.child?.id || item.childName || item.child?.name || ''}:${item.completedAtMs}`;
    return JSON.stringify([item.childId || item.child?.id || item.childName || item.child?.name || '', item.date || item.localDate || '', item.overall, RESULT_AREAS.map(a => item.scores?.[a.key])]);
}

function _resultGetChildRecords(child = null) {
    // One read-only list drives both the selector count and displayed results.
    const seen = new Set();
    const history = _resultGetHistoryResults();
    const records = [_resultGetLatestResult(), ...(Array.isArray(history) ? history : [])]
        .filter(item => _resultIsCompleteResult(item) && (!child || _resultIsSameChild(item, child)))
        .filter(item => {
            const key = _resultGetRecordKey(item);
            if (seen.has(key)) return false;
            seen.add(key); return true;
        });
    const time = item => Number(item.completedAtMs) || Number(item.savedAt?.seconds) * 1000 || Date.parse(String(item.date || item.localDate || '').replace(/\./g, '-')) || 0;
    return records.sort((a, b) => time(b) - time(a));
}

function _resultGetChildCount(child) {
    return _resultGetChildRecords(child).length;
}

function _resultBuildAchievements(raw = {}) {
    const schulteTime = raw.schulteTime || raw.attentionTime;
    const memoryLevel = Number(raw.memoryLevel) || 0;
    const reactionLevel = Number(raw.reactionLevel) || 0;
    const visualLevel = Number(raw.visualLevel) || 0;
    const flankerLevel = Number(raw.flankerLevel) || 0;

    return {
        attention: schulteTime ? `${schulteTime}초 완료` : '25칸 완료',
        memory: memoryLevel ? `Lv.${memoryLevel} 달성` : 'Lv.-',
        reaction: reactionLevel ? `Lv.${reactionLevel} 도달` : 'Lv.-',
        visual: visualLevel ? `Lv.${visualLevel} 도달` : 'Lv.-',
        inhibition: flankerLevel ? `Lv.${flankerLevel} 도달` : 'Lv.-'
    };
}

function _resultAchievementText(value) {
    return value && value !== 'Lv.-' ? value : '';
}

function _resultFormatHistoryItem(item, latest, summary) {
    return {
        date: item.date || latest.date,
        summary,
        scores: {
            attention: item.scores?.attention ?? 0,
            memory: item.scores?.memory ?? 0,
            reaction: item.scores?.reaction ?? 0,
            inhibition: item.scores?.inhibition ?? 0,
            visual: item.scores?.visual ?? 0
        }
    };
}

function _resultBuildDisplayHistory(items, latest) {
    const source = items.length ? items : [latest];
    const formatted = [_resultFormatHistoryItem(source[0], latest, '최근 검사')];

    if (source.length === 1) {
        // 기록이 하나뿐이면 같은 기록을 "최근/첫 검사"로 두 번 보여주지 않음
        formatted[0].summary = '첫 검사';
        return formatted;
    }

    const previousEnd = Math.min(source.length - 1, 3);
    for (let idx = 1; idx < previousEnd; idx++) {
        formatted.push(_resultFormatHistoryItem(source[idx], latest, '이전 검사'));
    }

    formatted.push(_resultFormatHistoryItem(source[source.length - 1], latest, '첫 검사'));
    return formatted;
}

/* ── 데이터 조립 ── */
function _resultGetData(selectedChildId) {
    const profile = _resultSafeJSON('nollpic_child_profile', null);
    const selected = _resultSafeJSON('nollpic_selected_child', null);
    const activeChild = selected || profile;
    const childId = selectedChildId || activeChild?.id || '';
    const displayChild = childId ? (_resultGetAllChildren().find(c => c.id === childId) || activeChild) : activeChild;
    const records = _resultGetChildRecords(displayChild);
    const latest = records[0] || null;
    const childName = displayChild?.name || latest?.child?.name || latest?.childName || '우리 아이';
    const gradeText = displayChild?.gradeText || latest?.child?.gradeText || latest?.gradeText || '';
    const childLabel = gradeText ? `${childName} · ${gradeText.replace('초등 ','초')}` : childName;

    if (!latest) {
        return {
            child: childLabel, date: '-', overall: 0,
            comment: '아직 저장된 검사 기록이 없어요. 홈에서 검사를 완료하면 이곳에 기록이 쌓입니다.',
            abilities: RESULT_AREAS.map(a => [a.emoji, a.name, '검사 전', 0, '']),
            history: [{ date:'-', summary:'검사 기록 없음', scores:{attention:0,memory:0,reaction:0,inhibition:0,visual:0} }],
            scores: { attention:0, memory:0, reaction:0, visual:0, inhibition:0 },
            achievements: {},
            analysis: '아직 이 아이의 검사 기록이 없어요. 검사를 완료하면 아이별 성장 기록이 자동으로 표시됩니다.'
        };
    }

    const scores  = latest.scores || {};
    const achievements = _resultBuildAchievements(latest.raw || latest || {});
    const deduped = records;
    const formatted = _resultBuildDisplayHistory(deduped, latest);

    const prev = formatted[1];
    const diff = prev ? (latest.overall - Math.round((prev.scores.attention+prev.scores.memory+prev.scores.reaction+prev.scores.inhibition+prev.scores.visual)/5)) : 0;
    const comment = diff > 0 ? `지난 기록보다 ${diff}점 좋아졌어요.` : diff < 0 ? `지난 기록보다 ${Math.abs(diff)}점 낮아졌지만 다시 연습하면 좋아질 수 있어요.` : '오늘의 기준 기록이 저장되었어요.';

    // 성장 그래프용 (2026-10-11): 점수 규칙이 바뀐 2026-10-10 이후 기록만, 최근 6번 (오래된 것 → 최근 순)
    //   예전 기록은 "날짜별 기록 보기"에는 그대로 남음. ▲▼·회색 점선은 10/10 이후 "첫 미션"과 비교
    const _toSeries = i => ({
        date: i.date || '',
        scores: Object.fromEntries(RESULT_AREAS.map(a => [a.key, Number(i.scores?.[a.key]) || 0]))
    });
    const _rulesFrom = Date.UTC(2026, 9, 9, 15);   // 2026-10-10 00:00 (한국 시간)
    const _recordTime = i => Number(i.createdAtMs) || (i.createdAt?.seconds ? i.createdAt.seconds * 1000 : 0)
        || (([, y, m, d] = String(i.date || i.localDate || '').match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/) || []) => y ? Date.UTC(+y, +m - 1, +d) : 0)();
    let _graphRecords = deduped.filter(i => { const t = _recordTime(i); return !t || t >= _rulesFrom; });
    if (!_graphRecords.length) _graphRecords = deduped;
    // 2026-10-11: 기록이 3개월 이상(서로 다른 달 3개 이상)이면 월별(그달 평균, 최근 3개월)
    //   그 전에는 회차별: 5회 이하면 전부, 넘으면 "처음 1 + 최근 4" (사이 생략 표시)
    const _monthKey = i => { const t = _recordTime(i); if (!t) return ''; const d = new Date(t + 9 * 3600e3); return `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}`; };
    const _months = [...new Set(_graphRecords.map(_monthKey).filter(Boolean))];   // 최근 달부터
    let series, seriesMode = 'session', seriesGap = 0;
    if (_months.length >= 3) {
        seriesMode = 'monthly';
        series = _months.slice(0, 3).reverse().map(mk => {
            const rs = _graphRecords.filter(i => _monthKey(i) === mk);
            return { date: mk, month: Number(mk.split('.')[1]), count: rs.length,
                scores: Object.fromEntries(RESULT_AREAS.map(a => [a.key, Math.round(rs.reduce((t, i) => t + (Number(i.scores?.[a.key]) || 0), 0) / rs.length)])) };
        });
    } else {
        const asc = _graphRecords.slice().reverse().map(_toSeries);
        if (asc.length > 5) { seriesGap = asc.length - 5; series = [asc[0], ...asc.slice(-4)]; }
        else series = asc;
    }
    const prevScores = deduped[1] ? _toSeries(deduped[1]).scores : null;          // 바로 전 미션 (지난번보다 자랐나)
    const recentScores = _graphRecords.slice(0, 5).map(i => _toSeries(i).scores);  // "가장 튼튼한 영역"용 최근 5회
    const firstScores = _graphRecords.length > 1 ? _toSeries(_graphRecords[_graphRecords.length - 1]).scores : null;
    const firstDate = _graphRecords.length > 1 ? (_graphRecords[_graphRecords.length - 1].date || '') : '';

    return {
        child: childLabel, date: latest.date || latest.localDate || '-', overall: latest.overall, comment,
        abilities: RESULT_AREAS.map(a => [a.emoji, a.name, a.pro, scores[a.key] ?? 0, _resultAchievementText(achievements[a.key])]),
        history: formatted,
        series,
        firstScores,
        firstDate,
        seriesMode,
        seriesGap,
        prevScores,
        recentScores,
        missionCount: deduped.length,
        scores,
        achievements,
        analysis: _resultMakeAnalysis(scores)
    };
}

/* ── DOM 렌더 (v2: 성장 카드 + 생각근육 오각형 + 영역별 성장 기록) ── */
function _resultSeries(data) {
    if (Array.isArray(data.series) && data.series.length) return data.series;
    // 공유 링크 등 series가 없는 데이터: history(최근→과거)를 뒤집어 사용
    return (data.history || []).filter(h => h.date && h.date !== '-').slice().reverse()
        .map(h => ({ date: h.date, scores: h.scores || {} }));
}

function _resultRender(data) {
    const series = _resultSeries(data);
    const now = data.scores || {};
    const first = data.firstScores || (series.length > 1 ? series[0].scores : null);
    const prev = data.prevScores !== undefined ? data.prevScores : (series.length > 1 ? series[series.length - 2].scores : null);
    const hasRecord = Number(data.missionCount) > 0 || Boolean(data.date && data.date !== '-');
    const count = data.missionCount || series.length;
    const up = hasRecord && prev ? RESULT_AREAS.filter(a => (Number(now[a.key]) || 0) > (Number(prev[a.key]) || 0)) : [];
    const improvedKeys = new Set(up.map(a => a.key));

    // 1) 성장 카드
    document.getElementById('result-latest-date').innerText = hasRecord ? data.date : '기록 없음';
    document.getElementById('rv2-mission-count').innerText = hasRecord ? `${count}번째 미션` : '첫 미션 전';
    const title = document.getElementById('rv2-hero-title');
    const sub = document.getElementById('result-overall-comment');
    const pill = document.getElementById('rv2-hero-pill');
    if (!hasRecord) {
        title.innerText = '생각근육을 키워 볼까요?';
        sub.innerText = '5가지 미션을 마치면 오늘의 생각근육이 나타나요.';
        pill.hidden = true;
    } else if (!prev) {
        title.innerText = '첫 생각근육 기록 완료!';
        sub.innerText = '오늘이 기준점이에요. 다음 미션부터 얼마나 자랐는지 보여 드릴게요.';
        pill.hidden = true;
    } else {
        title.innerHTML = up.length > 0
            ? `지난번보다 <span class="rv2-growth-count">${up.length}가지</span>가 자랐어요.`
            : '오늘도 끝까지 해냈어요!';
        sub.innerText = up.length > 0 ? `${up.map(a => a.name).join(' · ')} 성장!` : '점수는 날마다 조금씩 달라질 수 있어요. 꾸준히 하는 게 제일 중요해요.';
        const avg = (s) => RESULT_AREAS.reduce((t, a) => t + (Number(s[a.key]) || 0), 0) / 5;
        const gain = Math.round(avg(now) - avg(first));
        pill.innerText = gain > 0 ? `📈 첫 미션보다 평균 +${gain}점` : `🔥 ${count}번째 도전 중`;
        pill.hidden = false;
    }
    document.getElementById('rv2-tiles').innerHTML = RESULT_AREAS.map(a => `
        <div class="rv2-tile${improvedKeys.has(a.key) ? ' is-improved' : ''}" data-area="${a.key}"><span>${px(a.emoji)}</span><b>${a.name}</b><strong>${hasRecord ? (Number(now[a.key]) || 0) : '-'}</strong></div>`).join('');

    // 2) 생각근육 오각형
    document.getElementById('rv2-radar').innerHTML = _resultRadarSvg(hasRecord ? now : null, first);
    document.getElementById('rv2-radar-legend').innerText = first
        ? `주황 = 오늘 · 회색 점선 = 첫 미션 (${_resultShortDate(data.firstDate || series[0].date)})` : '주황 = 오늘';
    const weakKey = _resultGetWeakArea(now);
    const weak = RESULT_AREAS.find(a => a.key === weakKey);
    // 2026-10-11: "가장 튼튼한 영역" = 최근 5회 평균이 가장 높은 영역 (평균이 같으면 점수가 덜 흔들린 영역)
    //   예전엔 오늘 점수만 보고 동점이면 목록 앞(끈기력)이 뽑혔음. 기록이 1회면 오늘 점수, 동점은 함께 보여 줌
    const _recent = (data.recentScores && data.recentScores.length > 1) ? data.recentScores
        : series.length > 1 ? series.slice(-5).map(s => s.scores || {}) : [now];
    const _stats = RESULT_AREAS.map(a => {
        const v = _recent.map(s => Number(s[a.key]) || 0);
        const m = v.reduce((t, x) => t + x, 0) / v.length;
        return { a, m, sd: Math.sqrt(v.reduce((t, x) => t + (x - m) ** 2, 0) / v.length) };
    });
    const _topMean = Math.max(..._stats.map(s => s.m));
    let _bests = _stats.filter(s => _topMean - s.m < 0.5);
    if (_bests.length > 1 && _recent.length > 1) {
        const _minSd = Math.min(..._bests.map(s => s.sd));
        _bests = _bests.filter(s => s.sd - _minSd < 0.5);
    }
    const best = _bests[0].a;
    const _bestNames = _bests.map(s => s.a.name);
    const _bestLabel = _bestNames.length > 1
        ? `${_bestNames.slice(0, -1).join('·')}·${_resultJosa(_bestNames[_bestNames.length - 1], '이/가')}`
        : _resultJosa(best.name, '이/가');
    document.getElementById('rv2-radar-note').innerHTML = hasRecord
        ? `${px('🌟')} <b>${_bestLabel}</b> ${_recent.length > 1 ? '꾸준히 ' : ''}가장 튼튼해요!<br>${px(weak.emoji)} <b>${_resultJosa(weak.name, '을/를')}</b> 키우면 모양이 더 둥글어져요.`
        : '미션을 마치면 5가지 생각근육의 모양이 그려져요.';

    // 3) 영역별 성장 기록
    document.getElementById('rv2-growth-range').innerText = series.length <= 1 ? '미션을 할수록 그래프가 이어져요'
        : data.seriesMode === 'monthly' ? `${series.map(s => `${s.month}월`).join(' → ')} · 월평균`
        : data.seriesGap ? `${_resultShortDate(series[0].date)} ⋯ ${series.slice(1).map(s => _resultShortDate(s.date)).join(' → ')} · 중간 ${data.seriesGap}회 생략`
        : `${series.map(s => _resultShortDate(s.date)).join(' → ')} · ${series.length}번의 미션`;
    const ach = data.achievements || {};
    document.getElementById('result-ability-list').innerHTML = RESULT_AREAS.map(a => {
        const v = Number(now[a.key]) || 0;
        const vals = series.map(s => Number(s.scores?.[a.key]) || 0);
        const diff = first ? v - (Number(first[a.key]) || 0) : null;
        const diffHtml = diff === null ? '<em class="rv2-same">첫 기록</em>'
            : diff > 0 ? `<em class="rv2-up">▲${diff}</em>` : diff < 0 ? `<em class="rv2-down">▼${Math.abs(diff)}</em>` : '<em class="rv2-same">유지</em>';
        const achText = _resultAchievementText(ach[a.key]);
        return `
        <div class="rv2-area">
            <div class="rv2-ic" style="background:${a.bg}">${px(a.emoji)}</div>
            <div class="rv2-area-name"><strong>${a.name}</strong><span>${a.pro}${achText ? ` · ${achText}` : ''}</span></div>
            ${vals.length > 1 ? _resultSparkSvg(vals, a.color, Boolean(data.seriesGap)) : `<div class="rv2-bar"><i style="width:${v}%;background:${a.color}"></i></div>`}
            <div class="rv2-score"><b>${hasRecord ? v : '-'}</b>${hasRecord ? diffHtml : ''}</div>
        </div>`;
    }).join('');

    // 날짜별 기록 (접힌 영역)
    document.getElementById('result-history-list').innerHTML = data.history.map(item => `
        <div class="history-row">
            <div class="history-top"><strong>${item.date}</strong><span>${item.summary}</span></div>
            <div class="history-detail">
                ${_resultScoreLabels.map(([key, label]) => `
                    <div class="history-score-row"><span>${label}</span><em>${item.scores[key]}점</em></div>`).join('')}
            </div>
        </div>`).join('');

    document.getElementById('result-analysis-text').innerHTML = data.analysis;
    _resultRenderRecommendedPlays(data);
}

function rv2ScrollToRecommend() {
    const card = document.getElementById('result-recommend-card');
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── 그래프 (SVG) ── */
function _resultShortDate(d) {
    const p = String(d || '').split('.'); return p.length >= 3 ? `${Number(p[1])}/${Number(p[2])}` : String(d || '');
}

// 오각형: now(오늘, 주황), first(첫 미션, 회색 점선)
function _resultRadarSvg(now, first) {
    const W = 320, H = 300, cx = W / 2, cy = 152, R = 98, n = RESULT_AREAS.length;
    const pt = (i, r) => { const ang = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]; };
    const poly = (s) => RESULT_AREAS.map((a, i) => pt(i, R * Math.max(4, Number(s[a.key]) || 0) / 100).map(v => v.toFixed(1)).join(',')).join(' ');
    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="생각근육 오각형">`;
    [0.25, 0.5, 0.75, 1].forEach(f => {
        svg += `<polygon points="${RESULT_AREAS.map((a, i) => pt(i, R * f).join(',')).join(' ')}" fill="${f === 1 ? '#FAFBFD' : 'none'}" stroke="#E3E7EF" stroke-width="1.2"/>`;
    });
    RESULT_AREAS.forEach((a, i) => { const [x, y] = pt(i, R); svg += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#E3E7EF"/>`; });
    if (first) svg += `<polygon points="${poly(first)}" fill="none" stroke="#B9C1D1" stroke-width="2" stroke-dasharray="5 4"/>`;
    if (now) {
        svg += `<polygon points="${poly(now)}" fill="rgba(255,107,0,.18)" stroke="#FF6B00" stroke-width="2.5" stroke-linejoin="round"/>`;
        RESULT_AREAS.forEach((a, i) => { const [x, y] = pt(i, R * Math.max(4, Number(now[a.key]) || 0) / 100); svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="#fff" stroke="${a.color}" stroke-width="3"/>`; });
    }
    RESULT_AREAS.forEach((a, i) => {
        const [x, y] = pt(i, R + 30);
        svg += `<text x="${x.toFixed(1)}" y="${(y - 2).toFixed(1)}" text-anchor="middle" font-size="12.5" font-weight="800" fill="#0E1D3E">${a.emoji} ${a.name}</text>`;
        if (now) svg += `<text x="${x.toFixed(1)}" y="${(y + 13).toFixed(1)}" text-anchor="middle" font-size="11.5" font-weight="800" fill="${a.color}">${Number(now[a.key]) || 0}</text>`;
    });
    return svg + '</svg>';
}

// 영역별 작은 그래프
// gapAfterFirst: 처음과 다음 점 사이에 생략된 기록이 있으면 그 구간만 점선
function _resultSparkSvg(vals, color, gapAfterFirst = false) {
    const W = 84, H = 30, mn = Math.min(...vals) - 4, mx = Math.max(...vals) + 4;
    const p = vals.map((v, i) => [i * W / (vals.length - 1), H - 3 - (v - mn) / ((mx - mn) || 1) * (H - 8)]);
    const line = pts => `M${pts.map(q => q.map(x => x.toFixed(1)).join(' ')).join('L')}`;
    const solid = gapAfterFirst && p.length > 2 ? p.slice(1) : p;
    return `<svg class="rv2-spark" viewBox="-4 -4 ${W + 8} ${H + 8}" aria-hidden="true">
        ${gapAfterFirst && p.length > 2 ? `<path d="${line(p.slice(0, 2))}" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="2 4" stroke-linecap="round" opacity=".7"/>` : ''}
        <path d="${line(solid)}" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
        ${p.map((q, i) => `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${i === p.length - 1 ? 4 : 2.4}" fill="${i === p.length - 1 ? color : '#fff'}" stroke="${color}" stroke-width="2"/>`).join('')}
    </svg>`;
}

/* ── 아이 셀렉터 ── */
function _resultSetupSelector(selectedChildId) {
    const selector = document.getElementById('result-child-selector');
    if (!selector) return null;

    const children = _resultGetAllChildren();
    selector.innerHTML = '';

    if (children.length === 0) {
        const opt = document.createElement('option');
        opt.value = ''; opt.textContent = '아이 없음';
        selector.appendChild(opt); selector.disabled = true; return null;
    }

    selector.disabled = false;

    children.forEach((child, idx) => {
        const opt = document.createElement('option');
        opt.value = child.id || `${child.name}_${idx}`;
        const cnt = _resultGetChildCount(child);
        opt.textContent = cnt > 0 ? `${child.name || '우리 아이'} (${cnt}회)` : `${child.name || '우리 아이'} (기록 없음)`;
        selector.appendChild(opt);
    });

    const profile = _resultSafeJSON('nollpic_child_profile', null);
    const storedSel = _resultSafeJSON('nollpic_selected_child', null);
    const targetId  = selectedChildId || storedSel?.id || profile?.id || children[0].id;
    const selChild  = children.find(c => c.id === targetId) || children[0];
    selector.value = selChild.id;

    selector.onchange = () => {
        const child = children.find(c => c.id === selector.value) || children[0];
        localStorage.setItem('nollpic_selected_child', JSON.stringify(child));
        localStorage.setItem('nollpic_child_profile', JSON.stringify(child));
        const data = _resultGetData(child.id);
        _resultSamples[0] = data; _resultIndex = 0; _resultRender(data);
    };
    return selChild;
}

/* ── 페이지 진입 (외부에서 호출) ── */
function goToResultPage(selectedChildId) {
    if (!hasSavedResult()) {
        alert('아직 저장된 미션 결과가 없어요. 먼저 5가지 미션을 완료해주세요.');
        return;
    }
    nextPage(6);
    resetAppScrollTop(document.getElementById('page-6'));
    // DOM이 표시된 후 초기화
    requestAnimationFrame(() => initResultPage(selectedChildId));
}

function initResultPage(selectedChildId) {
    // 히스토리 패널 닫기 초기화
    _resultHistoryOpen = false;
    const panel = document.getElementById('result-history-panel');
    const icon  = document.getElementById('result-accordion-icon');
    if (panel) panel.classList.remove('open');
    if (icon)  icon.classList.remove('open');

    const sharedData = _resultGetSharedData();
    if (sharedData) {
        const selector = document.getElementById('result-child-selector');
        if (selector) {
            selector.innerHTML = `<option value="shared">${sharedData.child}</option>`;
            selector.disabled = true;
        }
        _resultSamples[0] = sharedData; _resultIndex = 0;
        _resultRender(sharedData);
        return;
    }

    const selChild = _resultSetupSelector(selectedChildId || '');
    const data     = _resultGetData(selChild?.id || '');
    _resultSamples[0] = data; _resultIndex = 0;
    _resultRender(data);
}

/* ── 아코디언 토글 ── */
function _resultEncodeSharePayload(payload) {
    const json = JSON.stringify(payload);
    return btoa(unescape(encodeURIComponent(json)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}

function _resultDecodeSharePayload(value) {
    try {
        const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
        return JSON.parse(decodeURIComponent(escape(atob(padded))));
    } catch (e) {
        return null;
    }
}

function _resultGetShareUrl() {
    return new URL('/', window.location.origin).href;
}

function _resultGetSharedData() {
    const params = new URLSearchParams(window.location.search);
    const payload = _resultDecodeSharePayload(params.get('sharedResult') || '');
    if (!payload || !payload.scores) return null;

    const scores = {
        attention: Number(payload.scores.attention) || 0,
        memory: Number(payload.scores.memory) || 0,
        reaction: Number(payload.scores.reaction) || 0,
        inhibition: Number(payload.scores.inhibition) || 0,
        visual: Number(payload.scores.visual) || 0
    };
    const achievements = payload.achievements || {};
    const historyItem = {
        date: payload.date || '-',
        summary: '공유된 검사',
        scores
    };

    return {
        child: payload.child || '우리 아이',
        date: payload.date || '-',
        overall: Number(payload.overall) || 0,
        comment: payload.comment || '공유된 놀픽 검사 결과입니다.',
        abilities: [
            ['🎯','끈기력','집중 유지력', scores.attention, achievements.attention || ''],
            ['🧩','기억력','작업 기억력', scores.memory, achievements.memory || ''],
            ['⚡','순발력','반응 속도', scores.reaction, achievements.reaction || ''],
            ['🔍','관찰력','시각 탐색', scores.visual, achievements.visual || ''],
            ['✋','충동조절','충동 억제', scores.inhibition, achievements.inhibition || '']
        ],
        history: [historyItem, { ...historyItem, summary: '공유 기준' }],
        scores,
        achievements,
        analysis: _resultMakeAnalysis(scores)
    };
}

function toggleResultHistory() {
    _resultHistoryOpen = !_resultHistoryOpen;
    const panel = document.getElementById('result-history-panel');
    const icon  = document.getElementById('result-accordion-icon');
    if (panel) panel.classList.toggle('open', _resultHistoryOpen);
    if (icon)  icon.classList.toggle('open', _resultHistoryOpen);
}

/* ── 공유 ── */
function shareResultInline() {
    const data = _resultSamples[_resultIndex];
    if (!data) return;
    const abilityLine = item => `${item[0]} ${item[1]}: ${item[3]}점${item[4] ? ` · ${item[4]}` : ''}`;
    const text = `놀픽 검사 결과\n\n아이: ${data.child}\n검사일: ${data.date}\n종합 결과: ${data.overall}점\n\n${data.abilities.map(abilityLine).join('\n')}\n\n놀픽에서 우리 아이의 성장 기록을 확인해보세요.`;
    const shareUrl = _resultGetShareUrl(data);
    if (navigator.share) {
        navigator.share({ title:'놀픽 검사 결과', text: text.trim(), url: shareUrl });
    } else {
        navigator.clipboard.writeText(`${text.trim()}\n\n${shareUrl}`).then(() => alert('검사 결과 링크가 복사되었습니다.'));
    }
}
window.toggleResultHistory = toggleResultHistory;
window.shareResultInline   = shareResultInline;
window.goToResultPage      = goToResultPage;
window.openRecommendedPlayDetail = openRecommendedPlayDetail;


/* ── 놀이 난이도 버전: 아이 학년에 맞는 시작 단계를 주소에 붙임 (game-level.js가 읽음) ──
   저학년(미취학~초2) 1 · 중학년(초3~4) 2 · 고학년(초5~6·어른) 3 */
function getChildGameLevel() {
    let child = null;
    try { child = JSON.parse(localStorage.getItem('nollpic_selected_child') || localStorage.getItem('nollpic_child_profile') || 'null'); } catch (e) {}
    const g = String(child?.gradeValue ?? child?.grade ?? '');
    if (g === 'adult') return 3;
    const n = parseInt(g, 10);
    if (!Number.isFinite(n)) return 1;
    return n <= 2 ? 1 : n <= 4 ? 2 : 3;
}
function gameUrl(url) {
    if (/[?&]level=/.test(url)) return url;
    const boost = Number(window.__gameLevelBoost) || 0;
    window.__gameLevelBoost = 0;
    return url + (url.includes('?') ? '&' : '?') + 'level=' + Math.min(3, getChildGameLevel() + boost);
}
window.gameUrl = gameUrl;

// 놀이에서 지도로 돌아오면 "심화 칸으로 연 놀이" 기억을 지움 (나중에 같은 놀이를 그냥 열었을 때 잘못 기록되지 않게)
(function () {
    const orig = window.prevPage;
    if (typeof orig !== 'function') return;
    window.prevPage = function (n) {
        if (Number(n) === 11) activeChallengeDay = null;
        return orig.apply(this, arguments);
    };
})();

// Share background-music preferences with mission frames.
window.addEventListener('message',event=>{if(event.origin!==location.origin||event.data?.type!=='nollpic-sound-change')return;document.querySelectorAll('audio[data-nollpic-bgm]').forEach(audio=>{audio.muted=event.data.settings.music===false;if(!audio.muted)audio.play().catch(()=>{});});});

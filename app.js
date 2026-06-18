// 전역 제어 함수: 이전/다음 변환 처리
function resetAppScrollTop(targetPage = null) {
    const deviceContainer = document.querySelector('.app-device');
    if (deviceContainer) deviceContainer.scrollTop = 0;
    if (targetPage) targetPage.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
}

function nextPage(pageNumber) {
    const activePage = document.querySelector('.page.active');
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
function validateInfoPage() {
    const nameInput = document.getElementById('child-name');
    const gradeSelect = document.getElementById('child-grade');
    const genderRadio = document.querySelector('input[name="child-gender"]:checked');

    if (!nameInput.value.trim()) {
        alert('아이 이름을 입력해주세요.');
        nameInput.focus();
        return;
    }

    if (!gradeSelect.value) {
        alert('학년을 선택해주세요.');
        gradeSelect.focus();
        return;
    }

    if (!genderRadio) {
        alert('아이의 성별을 선택해주세요.');
        return;
    }

    const isEditingMode =
        editingChildId ||
        localStorage.getItem('nollpic_editing_child_id');

    saveCurrentChildProfile();

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
        id: makeChildId(),
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
        frame.src = `tests/tests.html?childId=${childIdVal}&grade=${childProfile.gradeValue || gradeVal}&name=${nameVal}&intro=1`;
    }
    nextPage(5);
}

function getGradeTextForProfile(gradeValue) {
    const gradeNum = parseInt(gradeValue, 10);
    if (gradeNum === 0) return '미취학';
    if (gradeNum >= 1 && gradeNum <= 6) return `초등 ${gradeNum}학년`;
    return '학년 미선택';
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

    prevPage(4);
}

function goBackFromTestToSurvey() {
    prevPage(4);
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

function getChildrenStorageKey() {
    const user = getNollpicUser();
    return user && user.uid ? `nollpic_children_${user.uid}` : 'nollpic_children_guest';
}

function getSavedChildren() {
    try {
        return JSON.parse(localStorage.getItem(getChildrenStorageKey())) || [];
    } catch (e) {
        return [];
    }
}

function setSavedChildren(children) {
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

    if (!savedSection || !formSection) return;

    if (!user && children.length === 0 && !getActiveChildProfile()) {
        clearActiveChildSession();
    }

    if (user && children.length > 0) {
        savedSection.style.display = 'flex';
        formSection.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (title) title.innerText = '우리 아이를 선택해주세요';
        if (sub) sub.innerText = '아이별로 검사 결과와 성장 기록을 따로 저장해요.';
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
        children = synced.children || [];

        if (children.length > 0) {
            savedSection.style.display = 'flex';
            formSection.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            if (title) title.innerText = '우리 아이를 선택해주세요';
            if (sub) sub.innerText = '아이별로 검사 결과와 성장 기록을 따로 저장해요.';
            renderSavedChildren(children);
        }
    }
}

function startTestForChild(childId) {
    const child = findChildById(childId);
    if (!child) return;

    setActiveChild(child);
    localStorage.removeItem('nollpic_test_progress');

    const nameVal = encodeURIComponent(child.name || '');
    const frame = document.getElementById('test-frame');
    if (frame) {
        frame.src = `tests/tests.html?childId=${encodeURIComponent(child.id || '')}&grade=${child.gradeValue || '0'}&name=${nameVal}&intro=1`;
    }
    nextPage(5);
}

function logoutNollpic() {
    const ok = confirm('로그아웃 하시겠어요?');
    if (!ok) return;

    localStorage.removeItem('nollpic_user');
    localStorage.removeItem('nollpic_current_uid');
    localStorage.removeItem('nollpic_selected_child');
    localStorage.removeItem('nollpic_child_profile');
    localStorage.removeItem('nollpic_child_name');
    localStorage.removeItem('nollpic_child_grade');

    // Firebase signOut (모듈 로드 후 시도)
    Promise.all([
        import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js")
    ]).then(([appModule, authModule]) => {
        const apps = appModule.getApps();
        if (apps.length > 0) {
            const auth = authModule.getAuth(apps[0]);
            authModule.signOut(auth).catch(() => {});
        }
    }).catch(() => {}).finally(() => {
        nextPage(1);
    });
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
                 onkeydown="if(event.key === 'Enter'){ selectSavedChild('${childId}'); }">

                <div class="saved-child-top">
                    <div class="saved-child-avatar">
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
                        onclick="startTestForChild('${childId}')">
                        🎮 검사하기
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
    goToChildResult(childId);
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
                <p style="font-size:0.82rem;color:#6B7280;margin-bottom:1.25rem;">이름, 학년, 성별을 수정할 수 있어요.</p>

                <div style="margin-bottom:1rem;">
                    <label style="font-size:0.83rem;font-weight:700;color:#374151;display:block;margin-bottom:0.4rem;">아이 이름</label>
                    <input id="modal-child-name" type="text" placeholder="이름을 입력해주세요"
                        style="width:100%;padding:0.7rem 1rem;border:1.5px solid #E5E7EB;border-radius:0.75rem;font-size:0.95rem;outline:none;"/>
                </div>

                <div style="margin-bottom:1rem;">
                    <label style="font-size:0.83rem;font-weight:700;color:#374151;display:block;margin-bottom:0.4rem;">학년</label>
                    <select id="modal-child-grade"
                        style="width:100%;padding:0.7rem 1rem;border:1.5px solid #E5E7EB;border-radius:0.75rem;font-size:0.95rem;background:#fff;outline:none;">
                        <option value="">학년을 선택해주세요</option>
                        <option value="0">미취학</option>
                        <option value="1">초등 1학년</option>
                        <option value="2">초등 2학년</option>
                        <option value="3">초등 3학년</option>
                        <option value="4">초등 4학년</option>
                        <option value="5">초등 5학년</option>
                        <option value="6">초등 6학년</option>
                    </select>
                </div>

                <div style="margin-bottom:1.5rem;">
                    <label style="font-size:0.83rem;font-weight:700;color:#374151;display:block;margin-bottom:0.4rem;">성별</label>
                    <div style="display:flex;gap:0.75rem;">
                        <label style="flex:1;display:flex;align-items:center;justify-content:center;gap:0.4rem;padding:0.65rem;border:1.5px solid #E5E7EB;border-radius:0.75rem;cursor:pointer;font-size:0.9rem;font-weight:600;">
                            <input type="radio" name="modal-child-gender" value="male" style="accent-color:#FF6B00;"> 👦 남자아이
                        </label>
                        <label style="flex:1;display:flex;align-items:center;justify-content:center;gap:0.4rem;padding:0.65rem;border:1.5px solid #E5E7EB;border-radius:0.75rem;cursor:pointer;font-size:0.9rem;font-weight:600;">
                            <input type="radio" name="modal-child-gender" value="female" style="accent-color:#FF6B00;"> 👧 여자아이
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
    if (nameInput) nameInput.value = child.name || '';
    if (gradeSelect) gradeSelect.value = child.gradeValue || '';
    genderRadios.forEach(r => { r.checked = r.value === child.gender; });

    modal.style.display = 'flex';
}

function closeEditChildModal() {
    const modal = document.getElementById('edit-child-modal');
    if (modal) modal.style.display = 'none';
}

function saveEditChildModal() {
    const modal = document.getElementById('edit-child-modal');
    if (!modal) return;
    const childId = modal.dataset.editingId;
    const child = findChildById(childId);
    if (!child) return;

    const nameInput = modal.querySelector('#modal-child-name');
    const gradeSelect = modal.querySelector('#modal-child-grade');
    const genderRadio = modal.querySelector('input[name="modal-child-gender"]:checked');

    if (!nameInput || !nameInput.value.trim()) {
        alert('아이 이름을 입력해주세요.');
        nameInput && nameInput.focus();
        return;
    }
    if (!gradeSelect || !gradeSelect.value) {
        alert('학년을 선택해주세요.');
        return;
    }
    if (!genderRadio) {
        alert('성별을 선택해주세요.');
        return;
    }

    child.name = nameInput.value.trim();
    child.gradeValue = gradeSelect.value;
    child.gradeText = getGradeTextForProfile(gradeSelect.value);
    child.gender = genderRadio.value;

    // 저장
    const children = getSavedChildren();
    const idx = children.findIndex(c => c.id === childId);
    if (idx !== -1) {
        children[idx] = child;
        saveChildrenList(children);
    }

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
        id: editId || makeChildId(),
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

        const [childrenSnapshot, resultsSnapshot] = await Promise.all([
            tools.getDocs(tools.collection(tools.db, "users", user.uid, "children")),
            tools.getDocs(tools.collection(tools.db, "users", user.uid, "results"))
        ]);

        const firestoreChildren = [];
        childrenSnapshot.forEach(docSnap => {
            const child = normalizeFirestoreChild(docSnap.data(), docSnap.id);
            if (child) firestoreChildren.push(child);
        });

        const firestoreResults = [];
        const childrenFromResults = [];
        resultsSnapshot.forEach(docSnap => {
            const data = docSnap.data() || {};
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
            if (!currentLatest) {
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
function updateBottomNav(pageNumber) {
    const nav = document.querySelector('.bottom-tab-nav');
    const device = document.querySelector('.app-device');
    const tabs = document.querySelectorAll('.bottom-tab');

    // 메인 로그인 화면에서는 하단 메뉴를 숨깁니다.
    if (pageNumber === 1) {
        if (nav) nav.style.display = 'none';
        if (device) device.classList.remove('nav-visible');
        return;
    }

    // page-5(테스트)는 하단 탭 숨김 + nav-visible 제거 → iframe 전체화면
    if (pageNumber === 5) {
        if (nav) nav.style.display = 'none';
        if (device) device.classList.remove('nav-visible');
        return;
    }

    if (nav) nav.style.display = 'grid';
    if (device) device.classList.add('nav-visible');
    if (!tabs.length) return;

    tabs.forEach(tab => tab.classList.remove('active'));

    let activeTab = 'home';
    if (pageNumber === 3 || pageNumber === 4) activeTab = 'mypage';
    if (pageNumber === 5) activeTab = 'home';
    if (pageNumber === 6) activeTab = 'result';
    if (pageNumber === 7 || pageNumber === 8 || pageNumber === 9 || pageNumber === 10) activeTab = 'play';

    const target = document.querySelector(`.bottom-tab[data-tab="${activeTab}"]`);
    if (target) target.classList.add('active');
}

function goBottomHome() {
    const user = getNollpicUser();
    nextPage(user && user.uid ? 2 : 1);
}

function hasSavedResult() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('sharedResult')) return true;

    let latest = null;
    try {
        latest = JSON.parse(localStorage.getItem('nollpic_latest_result') || 'null');
    } catch (e) {
        latest = null;
    }
    if (!latest) return false;

    const user = getNollpicUser();
    if (user && user.uid) return true;

    const activeChild = getActiveChildProfile();
    return isResultForActiveChild(latest, activeChild);
}

function goBottomResult() {
    goToResultPage();
}

async function goBottomMypage() {
    const user = getNollpicUser();
    if (user && user.uid) {
        await syncNollpicDataFromFirestore();
    }

    nextPage(3);
}

window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    if (page === 'mypage') {
        nextPage(3);
    } else if (page === 'result') {
        nextPage(6);
        requestAnimationFrame(() => initResultPage());
    } else {
        updateBottomNav(1);
    }
});

// Firebase module에서 안정적으로 호출할 수 있도록 전역에 연결합니다.
window.nextPage = nextPage;
window.prevPage = prevPage;
window.editChild = editChild;
window.deleteChild = deleteChild;
window.startTestForChild = startTestForChild;
window.logoutNollpic = logoutNollpic;

/* ================================================================
   검사결과 page-6 — mypage-result.js 통합
   모든 데이터 읽기/렌더링 로직을 index 내부에서 처리
================================================================ */

const _resultScoreLabels = [
    ['attention', '🎯 집중 유지력'],
    ['memory',    '🧩 작업 기억력'],
    ['reaction',  '⚡ 반응 속도'],
    ['visual',    '🔍 시각 탐색력'],
    ['inhibition','✋ 충동 억제']
];

let _resultIndex = 0;
let _resultSamples = [null];
let _resultHistoryOpen = false;
let _resultGrowthChart = null;

/* ── 유틸 ── */
function _resultSafeJSON(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch(e) { return fallback; }
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
        attention: { strong:'집중 유지력은 좋은 편입니다. 목표를 보고 순서대로 찾아가는 힘이 안정적으로 나타났어요.', normal:'집중 유지력은 보통 수준입니다. 컨디션이나 주변 환경에 따라 집중 시간이 달라질 수 있어요.', need:'집중 유지력 연습이 필요합니다. 과제를 끝까지 살피기보다 중간에 놓치거나 서두르는 모습이 나타날 수 있어요.' },
        memory:    { strong:'작업 기억력은 좋은 편입니다. 방금 본 정보를 머릿속에 잠시 저장하고 활용하는 힘이 안정적으로 나타났어요.', normal:'작업 기억력은 보통 수준입니다. 규칙이나 위치를 기억하는 놀이를 반복하면 더 안정적으로 좋아질 수 있어요.', need:'작업 기억력 연습이 필요합니다. 설명을 듣고 바로 잊거나, 순서와 위치를 헷갈리는 모습이 나타날 수 있어요.' },
        reaction:  { strong:'반응 속도는 좋은 편입니다. 자극을 보고 빠르게 반응하는 힘이 안정적으로 나타났어요.', normal:'반응 속도는 보통 수준입니다. 빠르게 누르는 것보다 정확하게 반응하는 연습을 함께 하면 좋아요.', need:'반응 속도 연습이 필요합니다. 화면의 변화를 알아차리고 행동으로 옮기는 시간이 다소 걸릴 수 있어요.' },
        inhibition:{ strong:'충동 억제는 좋은 편입니다. 하고 싶은 반응을 잠시 멈추고 규칙에 맞게 선택하는 힘이 안정적으로 나타났어요.', normal:'충동 억제는 보통 수준입니다. 빨리 하려는 마음이 커질 때 실수가 늘 수 있어요.', need:'충동 억제 연습이 필요합니다. 문제를 끝까지 보기 전에 서두르거나, 멈춰야 할 때 반응하는 모습이 나타날 수 있어요.' },
        visual:    { strong:'시각 탐색력은 좋은 편입니다. 여러 정보 속에서 필요한 목표를 빠르게 찾는 힘이 안정적으로 나타났어요.', normal:'시각 탐색력은 보통 수준입니다. 복잡한 화면에서 목표를 찾는 놀이를 반복하면 더 좋아질 수 있어요.', need:'시각 탐색력 연습이 필요합니다. 여러 자극 속에서 필요한 정보를 찾을 때 놓치거나 시간이 걸릴 수 있어요.' }
    };
    return map[key]?.[level] || '오늘 검사 결과가 저장되었어요.';
}

function _resultMakeAnalysis(scores) {
    const labels = [
        { key:'attention', name:'집중 유지력', emoji:'🎯' },
        { key:'memory',    name:'작업 기억력', emoji:'🧩' },
        { key:'reaction',  name:'반응 속도',   emoji:'⚡' },
        { key:'visual',    name:'시각 탐색력', emoji:'🔍' },
        { key:'inhibition',name:'충동 억제',   emoji:'✋' }
    ];
    const sorted = labels.map(i => ({ ...i, score: Number(scores[i.key]) || 0 })).sort((a,b) => b.score - a.score);
    const best = sorted[0], need = sorted[sorted.length - 1];
    const summary = `오늘 결과에서는 <strong>${best.name}</strong>이 가장 안정적으로 나타났고, <strong>${need.name}</strong>은 다음 놀이에서 조금 더 연습해보면 좋아요.`;
    const detail = labels.map(item => {
        const score = Number(scores[item.key]) || 0;
        return `<div class="analysis-row"><strong>${item.emoji} ${item.name} ${score}점 · ${_resultGetScoreLevelLabel(score)}</strong><br><span>${_resultGetAbilityFeedback(item.key, score)}</span></div>`;
    }).join('');
    const guide = `<div class="analysis-guide"><strong>추천 방향</strong><br>점수가 낮게 나온 영역은 하루 5~10분씩 짧게 반복해보세요.</div>`;
    return `${summary}<br><br>${detail}${guide}`;
}

const _resultRecommendConfig = {
    inhibition: {
        area: '충동조절',
        title: '우리 아이는',
        desc: '기다림보다 즉시 행동하려는 경향이 있습니다.',
        fallback: [
            { title:'컬러 스톱', description:'색깔 신호를 보고 멈추는 연습을 해요.' },
            { title:'신호등 게임', description:'초록불에는 움직이고 빨간불에는 멈춰요.' },
            { title:'플랭커 챌린지', description:'주변 자극을 참고해 정답 방향을 골라요.' }
        ]
    },
    visual: {
        area: '시각탐색',
        title: '우리 아이는',
        desc: '여러 정보 속에서 필요한 목표를 찾는 연습이 도움이 됩니다.',
        fallback: [
            { title:'숨은 그림 찾기', description:'정해진 목표를 빠르게 찾아보는 놀이예요.' },
            { title:'숫자 찾기', description:'숫자를 순서대로 찾아 시선을 움직여요.' },
            { title:'같은 모양 찾기', description:'비슷한 자극 사이에서 같은 모양을 찾아요.' }
        ]
    },
    reaction: {
        area: '반응속도',
        title: '우리 아이는',
        desc: '신호를 보고 빠르게 반응하는 연습이 도움이 됩니다.',
        fallback: [
            { title:'터치 신호 게임', description:'나오는 신호에 맞춰 빠르게 터치해요.' },
            { title:'박수 따라치기', description:'리듬을 듣고 즉시 따라 반응해요.' },
            { title:'빠른 색깔 고르기', description:'색이 바뀌면 맞는 버튼을 골라요.' }
        ]
    },
    memory: {
        area: '작업기억력',
        title: '우리 아이는',
        desc: '방금 본 정보를 잠시 기억하고 다시 떠올리는 연습이 도움이 됩니다.',
        fallback: [
            { title:'위치 기억 카드', description:'잠깐 본 위치를 기억해 다시 찾아요.' },
            { title:'순서 따라하기', description:'보여준 순서를 기억해 그대로 눌러요.' },
            { title:'그림 기억 놀이', description:'사라진 그림을 떠올려 골라요.' }
        ]
    },
    attention: {
        area: '집중력',
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

function _resultGetWeakArea(scores = {}) {
    const keys = ['attention', 'memory', 'reaction', 'visual', 'inhibition'];
    return keys
        .map(key => ({ key, score: Number(scores[key]) || 0 }))
        .sort((a, b) => a.score - b.score)[0]?.key || 'inhibition';
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

function _resultSetRecommendationContent(areaKey, plays) {
    const card = document.getElementById('result-recommend-card');
    const areaEl = document.getElementById('result-recommend-area');
    const titleEl = document.getElementById('result-recommend-title');
    const descEl = document.getElementById('result-recommend-desc');
    const listEl = document.getElementById('result-recommend-list');
    if (!card || !areaEl || !titleEl || !descEl || !listEl) return;

    const config = _resultRecommendConfig[areaKey] || _resultRecommendConfig.inhibition;
    const items = (plays && plays.length ? plays : config.fallback).slice(0, 3);
    areaEl.textContent = config.area;
    titleEl.textContent = config.title;
    descEl.textContent = config.desc;
    listEl.innerHTML = items.map((item, index) => {
        const thumb = item.thumbnail
            ? `<img class="recommend-thumb" src="${_resultEscape(item.thumbnail)}" alt="">`
            : `<div class="recommend-thumb recommend-fallback-thumb">${index + 1}</div>`;
        const title = _resultEscape(item.title || `추천 놀이 ${index + 1}`);
        const description = item.description ? `<p>${_resultEscape(item.description)}</p>` : '';
        return `<div class="recommend-item">${thumb}<div><strong>${title}</strong>${description}</div></div>`;
    }).join('');
}

function openRecommendedPlayDetail() {
    window.location.href = 'https://nollpic.com/index.html';
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

    _resultSetRecommendationContent(areaKey, config.fallback);
    const plays = await _resultFetchRecommendedPlays();
    const areaPlays = plays.filter(item => item.area === areaKey);
    if (areaPlays.length) _resultSetRecommendationContent(areaKey, areaPlays);
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

function _resultGetAllChildren() {
    const children = _resultSafeJSON(getChildrenStorageKey(), []);
    const history  = _resultSafeJSON('nollpic_result_history', []);
    const latest   = _resultSafeJSON('nollpic_latest_result', null);
    const profile  = _resultSafeJSON('nollpic_child_profile', null);
    const selected = _resultSafeJSON('nollpic_selected_child', null);
    const user = getNollpicUser();
    const canUseResultHistory = !!(user && user.uid) || children.length > 0 || !!(profile && profile.name) || !!(selected && selected.name);
    const map = new Map();
    [...children, selected, profile].forEach(c => {
        if (!c || !c.name) return;
        const key = c.id || `${c.name}_${c.gradeText||''}_${c.gender||''}`;
        map.set(key, { ...c, id: c.id || key });
    });
    if (canUseResultHistory) {
        [latest, ...history].forEach(item => {
            const c = _resultNormalizeChild(item);
            if (!c || !c.name) return;
            const key = c.id || `${c.name}_${c.gradeText||''}_${c.gender||''}`;
            if (!map.has(key)) map.set(key, { ...c, id: c.id || key });
        });
    }
    return Array.from(map.values());
}

function _resultGetChildCount(child) {
    const history = _resultSafeJSON('nollpic_result_history', []);
    const latest  = _resultSafeJSON('nollpic_latest_result', null);
    const matched = [latest, ...history].filter(i => _resultIsSameChild(i, child));
    const keys = new Set(matched.map(i => `${i?.date||''}_${i?.overall||''}_${JSON.stringify(i?.scores||{})}`));
    return keys.size;
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

/* ── 데이터 조립 ── */
function _resultGetData(selectedChildId) {
    let latest  = _resultSafeJSON('nollpic_latest_result', null);
    let history = _resultSafeJSON('nollpic_result_history', []);
    const profile = _resultSafeJSON('nollpic_child_profile', null);
    const selected = _resultSafeJSON('nollpic_selected_child', null);
    const user = getNollpicUser();
    const activeChild = selected || profile;
    const childId = selectedChildId || activeChild?.id || '';

    if ((!user || !user.uid) && !activeChild) {
        latest = null;
        history = [];
    }

    if (childId) {
        const sel = _resultGetAllChildren().find(c => c.id === childId) || activeChild;
        const filtered = history.filter(i => _resultIsSameChild(i, sel) && i.isComplete !== false);
        if (filtered.length > 0) { history = filtered; latest = filtered[0]; }
        else if (latest && !_resultIsSameChild(latest, sel)) { latest = null; }
    }

    const childName  = activeChild?.name || '우리 아이';
    const gradeText  = activeChild?.gradeText || '';
    const childLabel = gradeText ? `${childName} · ${gradeText.replace('초등 ','초')}` : childName;

    if (!latest) {
        return {
            child: childLabel, date: '-', overall: 0,
            comment: '아직 저장된 검사 기록이 없어요. 홈에서 검사를 완료하면 이곳에 기록이 쌓입니다.',
            abilities: [['🎯','집중 유지력','검사 전',0,''],['🧩','작업 기억력','검사 전',0,''],['⚡','반응 속도','검사 전',0,''],['🔍','시각 탐색력','검사 전',0,''],['✋','충동 억제','검사 전',0,'']],
            history: [{ date:'-', summary:'검사 기록 없음', scores:{attention:0,memory:0,reaction:0,inhibition:0,visual:0} }],
            scores: { attention:0, memory:0, reaction:0, visual:0, inhibition:0 },
            achievements: {},
            analysis: '아직 이 아이의 검사 기록이 없어요. 검사를 완료하면 아이별 성장 기록이 자동으로 표시됩니다.'
        };
    }

    const scores  = latest.scores || {};
    const achievements = _resultBuildAchievements(latest.raw || {});
    const items   = history.length ? history : [latest];
    const seen    = new Set();
    const deduped = items.filter(i => {
        const k = `${i.date}_${i.overall}_${i.scores?.attention}_${i.scores?.memory}_${i.scores?.reaction}`;
        if (seen.has(k)) return false; seen.add(k); return true;
    });
    const formatted = deduped.slice(0,5).map((i, idx) => ({
        date: i.date || latest.date,
        summary: idx === 0 ? '최근 검사' : '이전 검사',
        scores: { attention: i.scores?.attention??0, memory: i.scores?.memory??0, reaction: i.scores?.reaction??0, inhibition: i.scores?.inhibition??0, visual: i.scores?.visual??0 }
    }));
    if (formatted.length === 1) formatted.push({ date: formatted[0].date, summary:'첫 검사', scores:{...formatted[0].scores} });

    const prev = formatted[1];
    const diff = prev ? (latest.overall - Math.round((prev.scores.attention+prev.scores.memory+prev.scores.reaction+prev.scores.inhibition+prev.scores.visual)/5)) : 0;
    const comment = diff > 0 ? `지난 기록보다 ${diff}점 좋아졌어요.` : diff < 0 ? `지난 기록보다 ${Math.abs(diff)}점 낮아졌지만 다시 연습하면 좋아질 수 있어요.` : '오늘의 기준 기록이 저장되었어요.';

    return {
        child: childLabel, date: latest.date, overall: latest.overall, comment,
        abilities: [
            ['🎯','집중 유지력','슐테표 수행',    scores.attention??0, _resultAchievementText(achievements.attention)],
            ['🧩','작업 기억력','위치 기억 활동', scores.memory??0, _resultAchievementText(achievements.memory)],
            ['⚡','반응 속도',  '빠른 반응 활동', scores.reaction??0, _resultAchievementText(achievements.reaction)],
            ['🔍','시각 탐색력','목표 빠르게 찾기',scores.visual??0, _resultAchievementText(achievements.visual)],
            ['✋','충동 억제',  '멈추고 선택하기',scores.inhibition??0, _resultAchievementText(achievements.inhibition)]
        ],
        history: formatted,
        scores,
        achievements,
        analysis: _resultMakeAnalysis(scores)
    };
}

/* ── DOM 렌더 ── */
function _resultRender(data) {
    document.getElementById('result-latest-date').innerText    = data.date;
    document.getElementById('result-overall-score').innerText  = data.overall;
    document.getElementById('result-overall-comment').innerText= data.comment;

    document.getElementById('result-ability-list').innerHTML = data.abilities.map(item => `
        <div class="ability-row">
            <div class="ability-icon">${item[0]}</div>
            <div><strong>${item[1]}</strong><p>${item[2]}</p>${item[4] ? `<em class="ability-achievement">${item[4]}</em>` : ''}</div>
            <div class="ability-score">${item[3]}</div>
        </div>`).join('');

    document.getElementById('result-history-list').innerHTML = data.history.map(item => `
        <div class="history-row">
            <div class="history-top"><strong>${item.date}</strong><span>${item.summary}</span></div>
            <div class="history-detail">
                ${_resultScoreLabels.map(([key,label]) => `
                    <div class="history-score-row"><span>${label}</span><em>${item.scores[key]}점</em></div>`).join('')}
            </div>
        </div>`).join('');

    document.getElementById('result-analysis-text').innerHTML = data.analysis;
    _resultRenderChart(data.history);
    _resultRenderRecommendedPlays(data);
}

/* ── 차트 ── */
function _resultShortDate(d) {
    const p = d.split('.'); return p.length >= 3 ? `${Number(p[1])}/${Number(p[2])}` : d;
}

function _resultRenderChart(history) {
    const canvas = document.getElementById('result-growthChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const ordered = [...history].reverse();
    const scoreOf = (item, key) => Number(item?.scores?.[key] ?? 0);
    const labels  = ordered.map(i => _resultShortDate(i.date));
    const first   = ordered[0];
    const last    = ordered[ordered.length-1];

    const growthList = [
        { key:'attention', label:'집중력',  diff: scoreOf(last, 'attention')  - scoreOf(first, 'attention')  },
        { key:'memory',    label:'기억력',  diff: scoreOf(last, 'memory')     - scoreOf(first, 'memory')     },
        { key:'reaction',  label:'반응속도', diff: scoreOf(last, 'reaction')   - scoreOf(first, 'reaction')   },
        { key:'visual',    label:'시각탐색', diff: scoreOf(last, 'visual')     - scoreOf(first, 'visual')     },
        { key:'inhibition',label:'충동억제', diff: scoreOf(last, 'inhibition') - scoreOf(first, 'inhibition') }
    ];
    const best = [...growthList].sort((a,b) => b.diff - a.diff)[0];

    const summary = document.getElementById('result-growth-summary');
    const badge   = document.getElementById('result-growth-badge');
    if (summary) summary.innerHTML = `${best.label}이 가장 크게 성장했어요 <strong>+${best.diff}점</strong>`;
    if (badge)   badge.innerText   = best.diff > 0 ? `+${best.diff}점` : '확인중';

    if (_resultGrowthChart) { _resultGrowthChart.destroy(); _resultGrowthChart = null; }

    _resultGrowthChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label:'집중력',  data: ordered.map(i => scoreOf(i, 'attention')),  borderColor:'#FF6B00', backgroundColor:'rgba(255,107,0,.08)',   tension:.35, pointRadius:4, pointHoverRadius:6 },
                { label:'기억력',  data: ordered.map(i => scoreOf(i, 'memory')),     borderColor:'#0E1D3E', backgroundColor:'rgba(14,29,62,.08)',     tension:.35, pointRadius:4, pointHoverRadius:6 },
                { label:'반응속도',data: ordered.map(i => scoreOf(i, 'reaction')),   borderColor:'#F59E0B', backgroundColor:'rgba(245,158,11,.08)',   tension:.35, pointRadius:4, pointHoverRadius:6 },
                { label:'시각탐색',data: ordered.map(i => scoreOf(i, 'visual')),     borderColor:'#8B5CF6', backgroundColor:'rgba(139,92,246,.08)',   tension:.35, pointRadius:4, pointHoverRadius:6 },
                { label:'충동억제',data: ordered.map(i => scoreOf(i, 'inhibition')), borderColor:'#22C55E', backgroundColor:'rgba(34,197,94,.08)',    tension:.35, pointRadius:4, pointHoverRadius:6 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            layout: { padding: { top:4, bottom:4, left:0, right:4 } },
            plugins: { legend: { position:'bottom', onClick:null, labels: { boxWidth:8, boxHeight:8, padding:12, usePointStyle:true, pointStyle:'circle', font:{ size:10, weight:'700' }, color:'#5b5562' } } },
            scales: {
                y: { min:0, max:100, ticks:{ stepSize:20, font:{size:10}, color:'#8892A0' }, grid:{ color:'rgba(14,29,62,.05)' }, border:{ dash:[4,4] } },
                x: { ticks:{ font:{size:10}, color:'#8892A0' }, grid:{ display:false } }
            }
        }
    });
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

    selector.disabled = children.length <= 1;

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

function _resultGetShareUrl(data) {
    const payload = {
        child: data.child,
        date: data.date,
        overall: data.overall,
        comment: data.comment,
        scores: {
            attention: Number(data.abilities?.[0]?.[3]) || 0,
            memory: Number(data.abilities?.[1]?.[3]) || 0,
            reaction: Number(data.abilities?.[2]?.[3]) || 0,
            visual: Number(data.abilities?.[3]?.[3]) || 0,
            inhibition: Number(data.abilities?.[4]?.[3]) || 0
        },
        achievements: {
            attention: data.abilities?.[0]?.[4] || '',
            memory: data.abilities?.[1]?.[4] || '',
            reaction: data.abilities?.[2]?.[4] || '',
            visual: data.abilities?.[3]?.[4] || '',
            inhibition: data.abilities?.[4]?.[4] || ''
        }
    };
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('page', 'result');
    url.searchParams.set('sharedResult', _resultEncodeSharePayload(payload));
    return url.href;
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
            ['🎯','집중 유지력','선택 집중 수행', scores.attention, achievements.attention || ''],
            ['🧩','작업 기억력','위치 기억 활동', scores.memory, achievements.memory || ''],
            ['⚡','반응 속도','빠른 반응 활동', scores.reaction, achievements.reaction || ''],
            ['🔍','시각 탐색력','목표 빠르게 찾기', scores.visual, achievements.visual || ''],
            ['✋','충동 억제','멈추고 선택하기', scores.inhibition, achievements.inhibition || '']
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

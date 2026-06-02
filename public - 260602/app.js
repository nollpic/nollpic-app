// 전역 제어 함수: 이전/다음 변환 처리
function nextPage(pageNumber) {
    const activePage = document.querySelector('.page.active');
    if (activePage) activePage.classList.remove('active');
    
    const targetPage = document.getElementById(`page-${pageNumber}`);
    if (targetPage) {
        targetPage.classList.add('active');
        const deviceContainer = document.querySelector('.app-device');
        if (deviceContainer) deviceContainer.scrollTop = 0;
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
        const deviceContainer = document.querySelector('.app-device');
        if (deviceContainer) deviceContainer.scrollTop = 0;
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

    saveCurrentChildProfile();

    // 유효성 체크 통과 시 4페이지(체크리스트) 이동
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
    const gradeSelect = document.getElementById('child-grade');
    const nameInput = document.getElementById('child-name');
    const genderRadio = document.querySelector('input[name="child-gender"]:checked');
    
    let gradeVal = gradeSelect ? gradeSelect.value : "0";
    let rawName = nameInput && nameInput.value.trim() ? nameInput.value.trim() : "우리 아이";
    let nameVal = encodeURIComponent(rawName);
    let genderVal = genderRadio ? genderRadio.value : "";

    const selectedProfile = getSelectedChildProfile();
    const childProfile = selectedProfile || {
        id: makeChildId(),
        name: rawName,
        gradeValue: gradeVal,
        gradeText: getGradeTextForProfile(gradeVal),
        gender: genderVal,
        startedAt: getTodayStringForProfile()
    };

    localStorage.setItem('nollpic_child_profile', JSON.stringify(childProfile));

    const frame = document.getElementById('test-frame');
    if (frame) {
        // 주소창 뒤에 학년과 이름을 안전하게 붙여서 iframe을 로드합니다.
        frame.src = `tests/tests.html?grade=${gradeVal}&name=${nameVal}`;
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

// 시험 도중 이탈 시 데이터 초기화
function exitTestPage() {
    prevPage(4);
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

function prepareChildPage() {
    const user = getNollpicUser();
    const children = getSavedChildren();
    const savedSection = document.getElementById('saved-child-section');
    const formSection = document.getElementById('child-form-section');
    const title = document.getElementById('child-page-title');
    const sub = document.getElementById('child-page-sub');
    const nextBtn = document.getElementById('child-next-btn');

    localStorage.removeItem('nollpic_selected_child');

    if (!savedSection || !formSection) return;

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
        if (title) title.innerText = user ? '첫 아이를 등록해주세요' : '아이에 대해 알려주세요';
        if (sub) sub.innerText = user ? '처음 한 번만 등록하면 다음부터 자동으로 불러와요.' : '정확한 분석을 위해 기본 정보를 입력해주세요.';
        clearChildForm(false);
    }
}

function renderSavedChildren(children) {
    const list = document.getElementById('saved-child-list');
    if (!list) return;

    list.innerHTML = children.map(child => {
        const icon = child.gender === 'female' ? '👧' : child.gender === 'male' ? '👦' : '🧒';
        const grade = child.gradeText ? child.gradeText.replace('초등 ', '초') : '학년 미입력';
        return `
            <button class="saved-child-card" onclick="selectSavedChild('${child.id}')">
                <div class="saved-child-avatar">${icon}</div>
                <div class="saved-child-info">
                    <strong>${child.name || '우리 아이'}</strong>
                    <span>${grade} · 검사 기록 이어보기</span>
                </div>
                <div class="saved-child-go">›</div>
            </button>
        `;
    }).join('');
}

function selectSavedChild(childId) {
    const children = getSavedChildren();
    const child = children.find(item => item.id === childId);
    if (!child) return;

    localStorage.setItem('nollpic_selected_child', JSON.stringify(child));
    localStorage.setItem('nollpic_child_profile', JSON.stringify(child));
    nextPage(4);
}

function showChildForm() {
    const savedSection = document.getElementById('saved-child-section');
    const formSection = document.getElementById('child-form-section');
    const title = document.getElementById('child-page-title');
    const sub = document.getElementById('child-page-sub');
    const nextBtn = document.getElementById('child-next-btn');

    if (savedSection) savedSection.style.display = 'none';
    if (formSection) formSection.style.display = 'flex';
    if (nextBtn) nextBtn.style.display = 'block';
    if (title) title.innerText = '아이를 추가해주세요';
    if (sub) sub.innerText = '한 계정에서 첫째, 둘째, 셋째를 각각 관리할 수 있어요.';

    clearChildForm(true);
}

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

    const childProfile = {
        id: makeChildId(),
        name: nameInput.value.trim(),
        gradeValue: gradeSelect.value,
        gradeText: getGradeTextForProfile(gradeSelect.value),
        gender: genderRadio ? genderRadio.value : '',
        startedAt: getTodayStringForProfile()
    };

    localStorage.setItem('nollpic_selected_child', JSON.stringify(childProfile));
    localStorage.setItem('nollpic_child_profile', JSON.stringify(childProfile));

    const user = getNollpicUser();
    if (!user) return;

    const children = getSavedChildren();
    const exists = children.some(child =>
        child.name === childProfile.name &&
        child.gradeValue === childProfile.gradeValue &&
        child.gender === childProfile.gender
    );

    if (!exists) {
        children.unshift(childProfile);
        setSavedChildren(children);
    }
}


// 카카오 로그인
function kakaoLogin() {
    alert("카카오 로그인 준비중입니다.");
}

// 네이버 로그인
function naverLogin() {
    alert("네이버 로그인 준비중입니다.");
}
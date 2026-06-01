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

    const childProfile = {
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


// 카카오 로그인
function kakaoLogin() {
    alert("카카오 로그인 준비중입니다.");
}

// 네이버 로그인
function naverLogin() {
    alert("네이버 로그인 준비중입니다.");
}
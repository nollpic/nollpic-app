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
    
    let gradeVal = gradeSelect ? gradeSelect.value : "0";
    let nameVal = nameInput ? encodeURIComponent(nameInput.value.trim()) : encodeURIComponent("우리 아이");

    const frame = document.getElementById('test-frame');
    if (frame) {
        // 주소창 뒤에 학년과 이름을 안전하게 붙여서 iframe을 로드합니다.
        frame.src = `tests/01_schulte/schulte.html?grade=${gradeVal}&name=${nameVal}`;
    }
    nextPage(5);
}

// 시험 도중 이탈 시 데이터 초기화
function exitTestPage() {
    const frame = document.getElementById('test-frame');
    if (frame) {
        frame.src = ''; 
    }
    prevPage(4);
}

// 향후 다음 테스트 확장용
function loadNextTest(testNumber) {
    const frame = document.getElementById('test-frame');
    if (!frame) return;

    if (testNumber === 2) {
        frame.src = 'tests/02_stroop/stroop.html'; 
    } else {
        alert('모든 테스트 프로세스가 마감되었습니다.');
    }
}
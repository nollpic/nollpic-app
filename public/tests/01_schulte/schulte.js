// ==========================================================================
// 슐테 표(Schulte Table) 집중력 테스트 모듈 - 로컬 스토리지 반영구 저장 버전
// ==========================================================================

let schulteConfig = {
    gridSize: 3,
    maxNumber: 9,
    currentNext: 1,
    timerInterval: null,
    startTime: 0,
    elapsedTime: 0,
    isGaming: false
};

// 💡 로컬 스토리지에 저장된 기록이 있다면 가져오고, 없다면 기본 초기 데이터를 세팅합니다.
let leaderboardData = [];
const savedData = localStorage.getItem('nollpic_schulte_records');

if (savedData) {
    leaderboardData = JSON.parse(savedData);
} else {
    // 최초 실행 시에만 보여줄 기본 더미 데이터셋
    leaderboardData = [
        { grade: "초등 4학년", name: "김민재", time: "35.12", date: "2026.05.28" },
        { grade: "초등 2학년", name: "이서연", time: "22.45", date: "2026.05.28" },
        { grade: "초등 5학년", name: "박준우", time: "42.80", date: "2026.05.27" },
        { grade: "미취학", name: "최예은", time: "19.55", date: "2026.05.25" }
    ];
    // 기본 데이터셋도 로컬스토리지에 선제 저장
    localStorage.setItem('nollpic_schulte_records', JSON.stringify(leaderboardData));
}

let currentChild = {
    name: "우리 아이",
    gradeText: "초등 2학년"
};

// DOM 로드 즉시 파라미터 해석 및 UI 빌드
window.addEventListener('DOMContentLoaded', () => {
    parseUrlParameters();
    renderLeaderboard();
});

// URL 주소창 파라미터 파싱 규칙 (?grade=2&name=홍길동 대응)
function parseUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const gradeParam = urlParams.get('grade');
    const nameParam = urlParams.get('name');

    if (nameParam) {
        currentChild.name = decodeURIComponent(nameParam);
    }

    let size = 3; 
    let levelText = "3×3";
    let descText = "";

    if (gradeParam !== null && gradeParam !== "") {
        const gradeNum = parseInt(gradeParam, 10);

        if (gradeNum >= 0 && gradeNum <= 2) {
            size = 3; levelText = "3×3";
            currentChild.gradeText = gradeNum === 0 ? "미취학" : `초등 ${gradeNum}학년`;
            descText = `${currentChild.gradeText} 맞춤형 3x3 격자판입니다.`;
        } else if (gradeNum >= 3 && gradeNum <= 4) {
            size = 4; levelText = "4×4";
            currentChild.gradeText = `초등 ${gradeNum}학년`;
            descText = `초등 ${gradeNum}학년 맞춤형 4x4 격자판입니다.`;
        } else if (gradeNum >= 5 && gradeNum <= 6) {
            size = 5; levelText = "5×5";
            currentChild.gradeText = `초등 ${gradeNum}학년`;
            descText = `초등 ${gradeNum}학년 맞춤형 5x5 격자판입니다.`;
        }
    } else {
        size = 3; levelText = "3×3";
        currentChild.gradeText = "초등 2학년";
        descText = "맞춤형 3x3 격자판입니다.";
    }

    schulteConfig.gridSize = size;
    schulteConfig.maxNumber = size * size;
    
    document.getElementById('schulte-level').innerText = levelText;
    document.getElementById('schulte-description').innerText = descText;
}

// [시작하기] 버튼 클릭 시 동작하는 카운트다운 인터랙션
function runCountdown() {
    const startBlock = document.getElementById('popup-start-block');
    const countDisplay = document.getElementById('popup-countdown-number');
    
    if (startBlock) startBlock.style.display = 'none';
    if (countDisplay) {
        countDisplay.style.display = 'block';
        let count = 3;
        countDisplay.innerText = count;

        let interval = setInterval(() => {
            count--;
            if (count > 0) {
                countDisplay.innerText = count;
            } else {
                clearInterval(interval);
                const overlay = document.getElementById('schulte-countdown-overlay');
                if (overlay) overlay.classList.remove('active');
                initBoard();
            }
        }, 1000);
    }
}

// 피셔 예이츠 무작위 배열 셔플
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 격자판 렌더링 및 스톱워치 스타트
function initBoard() {
    const board = document.getElementById('schulte-board');
    if (!board) return;
    board.innerHTML = "";
    
    const size = schulteConfig.gridSize;
    board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${size}, 1fr)`;

    let numArr = Array.from({length: schulteConfig.maxNumber}, (_, i) => i + 1);
    numArr = shuffle(numArr);

    numArr.forEach((num, index) => {
        const cell = document.createElement('div');
        cell.classList.add('schulte-cell');
        if ((num + index) % 2 === 0) cell.classList.add('bg-tint');
        cell.innerText = num;
        
        cell.onclick = function() {
            if (!schulteConfig.isGaming) return;
            if (num === schulteConfig.currentNext) {
                cell.classList.add('completed');
                schulteConfig.currentNext++;
                if (schulteConfig.currentNext > schulteConfig.maxNumber) {
                    endGame();
                } else {
                    document.getElementById('schulte-next').innerText = schulteConfig.currentNext;
                }
            } else {
                cell.style.border = "2px solid #EF4444";
                setTimeout(() => cell.style.border = "", 200);
            }
        };
        board.appendChild(cell);
    });

    schulteConfig.currentNext = 1;
    schulteConfig.startTime = performance.now();
    schulteConfig.isGaming = true;
    schulteConfig.timerInterval = setInterval(() => {
        schulteConfig.elapsedTime = ((performance.now() - schulteConfig.startTime) / 1000).toFixed(2);
        document.getElementById('schulte-timer').innerText = `${schulteConfig.elapsedTime}초`;
    }, 10);
}

// 테스트 완료 시 리더보드 데이터 저장 및 로컬 스토리지 동기화
function endGame() {
    clearInterval(schulteConfig.timerInterval);
    schulteConfig.isGaming = false;
    document.getElementById('schulte-next').innerText = "완료";
    
    const nextBtn = document.getElementById('schulte-next-btn');
    if (nextBtn) nextBtn.disabled = false;

    const now = new Date();
    const formattedDate = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

    // 기존의 하이라이트 표시 제거 (새로운 기록만 강조하기 위함)
    leaderboardData.forEach(item => item.isCurrentPlayer = false);

    // 새 기록 추가
    leaderboardData.unshift({
        grade: currentChild.gradeText, 
        name: currentChild.name, 
        time: schulteConfig.elapsedTime, 
        date: formattedDate,
        isCurrentPlayer: true
    });
    
    // 💡 [핵심] 브라우저 로컬 스토리지에 영구적으로 압축 저장합니다.
    localStorage.setItem('nollpic_schulte_records', JSON.stringify(leaderboardData));
    
    renderLeaderboard();
}

function renderLeaderboard() {
    const container = document.getElementById('leaderboard-list');
    if (!container) return;
    
    container.innerHTML = "";
    leaderboardData.forEach(item => {
        const row = document.createElement('div');
        row.classList.add('leaderboard-row');
        if (item.isCurrentPlayer) row.classList.add('highlight');
        
        row.innerHTML = `
            <span>${item.grade}</span>
            <span>${item.name}</span>
            <span>${item.time}초</span>
            <span class="leaderboard-date">${item.date}</span>
        `;
        container.appendChild(row);
    });
}

function goToNextTest() {
    alert('테스트 결과 저장 완료! 다음 단계 검사로 이동합니다.');
    try {
        if (window.parent && typeof window.parent.loadNextTest === 'function') {
            window.parent.loadNextTest(2);
        }
    } catch (e) {}
}
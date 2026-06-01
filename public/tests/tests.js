// ==========================================================================
// 놀픽 통합 테스트: 슐테 표 + 작업 기억력
// iframe / parent 호출 / 상대경로 이동 없이 한 파일 안에서 화면 전환
// ==========================================================================

const testState = {
    child: {
        name: "우리 아이",
        gradeText: "초등 2학년",
        gradeValue: "2"
    },
    schulte: {
        gridSize: 3,
        maxNumber: 9,
        currentNext: 1,
        timerInterval: null,
        startTime: 0,
        elapsedTime: "0.00",
        isGaming: false
    },
    memory: {
        level: 1,
        gameState: "memorize",
        correctCount: 0,
        answerIndices: [],
        showCount: 3,
        totalCount: 8,
        successLevel: 0
    },
    reaction: {
    isGaming: false,
    score: 0,
    level: 1,
    lives: 3,
    round: 0,
    timeoutId: null, // 추가된 부분
    currentCircle: null,
    spawnTimer: null,
    moveTimer: null,
    circleStartTime: 0,
    responseTimes: [],
    correctClicks: 0,
    wrongClicks: 0,
    missedClicks: 0,
    accuracy: 0,
    averageMs: 0
},
    visualSearch: {
        isGaming: false,
        level: 1,
        wrong: 0,
        found: 0,
        target: "",
        timeLeft: 0,
        timer: null,
        startTime: 0,
        levelTimes: [],
        highestLevel: 0,
        accuracy: 0
    },
    flanker: {
        isGaming: false,
        level: 1,
        correct: 0,
        wrong: 0,
        currentAnswer: "",
        answerTimer: null,
        countdownTimer: null,
        roundStart: 0,
        reactionTimes: [],
        totalQuestions: 0,
        accuracy: 0,
        averageSec: "0.00"
    }
};

let schulteRecords = [];
let memoryRecords = [];
let reactionRecords = [];
let visualSearchRecords = [];
let flankerRecords = [];

// ==========================================================================
// 초기 실행
// ==========================================================================
window.addEventListener("DOMContentLoaded", () => {
    parseUrlParameters();
    loadRecords();
    renderSchulteLeaderboard();
    renderMemoryLeaderboard();
    setupSchulteLevel();
    renderReactionLeaderboard();
    renderVisualSearchLeaderboard();
    renderFlankerLeaderboard();

});

function parseUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const gradeParam = urlParams.get("grade");
    const nameParam = urlParams.get("name");

    if (nameParam) {
        testState.child.name = decodeURIComponent(nameParam);
    }

    if (gradeParam !== null && gradeParam !== "") {
        testState.child.gradeValue = gradeParam;
    }
}

function getGradeText(gradeValue) {
    const gradeNum = parseInt(gradeValue, 10);

    if (gradeNum === 0) return "미취학";
    if (gradeNum >= 1 && gradeNum <= 6) return `초등 ${gradeNum}학년`;

    return "초등 2학년";
}

function setupSchulteLevel() {
    const gradeNum = parseInt(testState.child.gradeValue, 10);
    let size = 3;
    let levelText = "3×3";
    let descText = "";

    if (gradeNum >= 0 && gradeNum <= 2) {
        size = 3;
        levelText = "3×3";
    } else if (gradeNum >= 3 && gradeNum <= 4) {
        size = 4;
        levelText = "4×4";
    } else if (gradeNum >= 5 && gradeNum <= 6) {
        size = 5;
        levelText = "5×5";
    }

    testState.child.gradeText = getGradeText(testState.child.gradeValue);
    testState.schulte.gridSize = size;
    testState.schulte.maxNumber = size * size;

    descText = `${testState.child.gradeText} 맞춤형 ${levelText} 격자판입니다.`;

    const levelEl = document.getElementById("schulte-level");
    const descEl = document.getElementById("schulte-description");

    if (levelEl) levelEl.innerText = levelText;
    if (descEl) descEl.innerText = descText;
}

function loadRecords() {
    const savedSchulte = localStorage.getItem("nollpic_schulte_records");
    const savedMemory = localStorage.getItem("nollpic_memory_records");
    const savedReaction = localStorage.getItem("nollpic_reaction_records");
    const savedVisualSearch = localStorage.getItem("nollpic_visual_search_records");
    const savedFlanker = localStorage.getItem("nollpic_flanker_records");

if (savedReaction) {
    try {
        reactionRecords = JSON.parse(savedReaction);
    } catch (e) {
        reactionRecords = [];
    }
}

if (!Array.isArray(reactionRecords)) {
    reactionRecords = [];
}


if (savedVisualSearch) {
    try {
        visualSearchRecords = JSON.parse(savedVisualSearch);
    } catch (e) {
        visualSearchRecords = [];
    }
}

if (!Array.isArray(visualSearchRecords)) {
    visualSearchRecords = [];
}


if (savedFlanker) {
    try {
        flankerRecords = JSON.parse(savedFlanker);
    } catch (e) {
        flankerRecords = [];
    }
}

if (!Array.isArray(flankerRecords)) {
    flankerRecords = [];
}


    if (savedSchulte) {
        try {
            schulteRecords = JSON.parse(savedSchulte);
        } catch (e) {
            schulteRecords = [];
        }
    }

    if (!Array.isArray(schulteRecords) || schulteRecords.length === 0) {
        schulteRecords = [
            { grade: "초등 4학년", name: "김민재", time: "35.12초", date: "2026.05.28" },
            { grade: "초등 2학년", name: "이서연", time: "22.45초", date: "2026.05.28" },
            { grade: "초등 5학년", name: "박준우", time: "42.80초", date: "2026.05.27" },
            { grade: "미취학", name: "최예은", time: "19.55초", date: "2026.05.25" }
        ];
        localStorage.setItem("nollpic_schulte_records", JSON.stringify(schulteRecords));
    }

    if (savedMemory) {
        try {
            memoryRecords = JSON.parse(savedMemory);
        } catch (e) {
            memoryRecords = [];
        }
    }

    if (!Array.isArray(memoryRecords)) {
        memoryRecords = [];
    }
}

function getTodayString() {
    const now = new Date();
    return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
}

function clampScore(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return 0;
    return Math.max(0, Math.min(100, Math.round(num)));
}

function calculateNollpicScores() {
    const schulteSec = parseFloat(testState.schulte.elapsedTime) || 0;
    const memoryLevel = testState.memory.successLevel || 0;
    const reactionAvg = testState.reaction.averageMs || 0;
    const reactionAccuracy = testState.reaction.accuracy || 0;
    const visualAccuracy = testState.visualSearch.accuracy || 0;
    const visualLevel = testState.visualSearch.highestLevel || 0;
    const flankerAccuracy = testState.flanker.accuracy || 0;

    // 점수는 엄마들이 보기 쉽게 100점 기준으로 환산합니다.
    // 실제 진단 점수가 아니라 놀이형 수행 기록 점수입니다.
    const attention = clampScore(100 - (schulteSec * 2));
    const memory = clampScore(memoryLevel * 12);
    const reactionSpeedScore = reactionAvg ? clampScore(110 - (reactionAvg / 10)) : 0;
    const reaction = clampScore((reactionSpeedScore * 0.6) + (reactionAccuracy * 0.4));
    const inhibition = clampScore(flankerAccuracy);
    const visual = clampScore((visualAccuracy * 0.75) + (Math.min(visualLevel, 10) * 2.5));
    const overall = clampScore((attention + memory + reaction + inhibition + visual) / 5);

    return { attention, memory, reaction, inhibition, visual, overall };
}

function makeNollpicAnalysis(scores) {
    const labels = [
        { key: 'attention', name: '집중 유지력' },
        { key: 'memory', name: '작업 기억력' },
        { key: 'reaction', name: '반응 속도' },
        { key: 'inhibition', name: '충동 억제' },
        { key: 'visual', name: '시각 탐색력' }
    ];

    const sorted = labels
        .map(item => ({ ...item, score: scores[item.key] }))
        .sort((a, b) => b.score - a.score);

    const best = sorted[0];
    const need = sorted[sorted.length - 1];

    return `<strong>${best.name}</strong>이 가장 안정적으로 나타났어요. <strong>${need.name}</strong>은 다음 놀이에서 한 번 더 연습해보면 좋아요.`;
}

function saveNollpicResult(scores) {
    const result = {
        child: {
            name: testState.child.name,
            gradeText: testState.child.gradeText,
            gradeValue: testState.child.gradeValue
        },
        date: getTodayString(),
        overall: scores.overall,
        scores: {
            attention: scores.attention,
            memory: scores.memory,
            reaction: scores.reaction,
            inhibition: scores.inhibition,
            visual: scores.visual
        },
        raw: {
            schulteTime: testState.schulte.elapsedTime || '0.00',
            memoryLevel: testState.memory.successLevel || 0,
            reactionAverageMs: testState.reaction.averageMs || 0,
            reactionAccuracy: testState.reaction.accuracy || 0,
            visualLevel: testState.visualSearch.highestLevel || 0,
            visualWrong: testState.visualSearch.wrong || 0,
            visualAccuracy: testState.visualSearch.accuracy || 0,
            flankerLevel: testState.flanker.level || 0,
            flankerWrong: testState.flanker.wrong || 0,
            flankerAccuracy: testState.flanker.accuracy || 0,
            flankerAverageSec: testState.flanker.averageSec || '0.00'
        },
        analysis: makeNollpicAnalysis(scores)
    };

    localStorage.setItem('nollpic_latest_result', JSON.stringify(result));

    let history = [];
    try {
        history = JSON.parse(localStorage.getItem('nollpic_result_history')) || [];
    } catch (e) {
        history = [];
    }

    history.unshift(result);
    localStorage.setItem('nollpic_result_history', JSON.stringify(history.slice(0, 20)));

    return result;
}

function showScreen(screenId) {
    const screens = document.querySelectorAll(".test-screen");
    screens.forEach(screen => screen.classList.remove("active"));

    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add("active");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
}

// ==========================================================================
// 01. 슐테 표
// ==========================================================================
function runSchulteCountdown() {
    const startBlock = document.getElementById("popup-start-block");
    const countDisplay = document.getElementById("popup-countdown-number");

    if (startBlock) startBlock.style.display = "none";

    if (!countDisplay) return;

    countDisplay.style.display = "block";

    let count = 3;
    countDisplay.innerText = count;

    const interval = setInterval(() => {
        count--;

        if (count > 0) {
            countDisplay.innerText = count;
        } else {
            clearInterval(interval);

            const overlay = document.getElementById("schulte-countdown-overlay");
            if (overlay) overlay.classList.remove("active");

            initSchulteBoard();
        }
    }, 1000);
}

function shuffle(array) {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

function initSchulteBoard() {
    const board = document.getElementById("schulte-board");
    if (!board) return;

    const state = testState.schulte;

    board.innerHTML = "";
    board.style.gridTemplateColumns = `repeat(${state.gridSize}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${state.gridSize}, 1fr)`;

    const numbers = shuffle(Array.from({ length: state.maxNumber }, (_, i) => i + 1));

    numbers.forEach((num, index) => {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "schulte-cell";

        if ((num + index) % 2 === 0) {
            cell.classList.add("bg-tint");
        }

        cell.innerText = num;

        cell.addEventListener("click", () => {
            if (!state.isGaming) return;

            if (num === state.currentNext) {
                cell.classList.add("completed");
                state.currentNext++;

                if (state.currentNext > state.maxNumber) {
                    endSchulteGame();
                } else {
                    const nextEl = document.getElementById("schulte-next");
                    if (nextEl) nextEl.innerText = state.currentNext;
                }
            } else {
                cell.style.border = "2px solid #EF4444";
                setTimeout(() => {
                    cell.style.border = "";
                }, 200);
            }
        });

        board.appendChild(cell);
    });

    state.currentNext = 1;
    state.startTime = performance.now();
    state.elapsedTime = "0.00";
    state.isGaming = true;

    const nextEl = document.getElementById("schulte-next");
    const timerEl = document.getElementById("schulte-timer");
    const nextBtn = document.getElementById("schulte-next-btn");

    if (nextEl) nextEl.innerText = "1";
    if (timerEl) timerEl.innerText = "0.00초";
    if (nextBtn) nextBtn.disabled = true;

    const retryBtn = document.getElementById("schulte-retry-btn");
    if (retryBtn) retryBtn.style.display = "none";

    clearInterval(state.timerInterval);

    state.timerInterval = setInterval(() => {
        state.elapsedTime = ((performance.now() - state.startTime) / 1000).toFixed(2);

        const timer = document.getElementById("schulte-timer");
        if (timer) timer.innerText = `${state.elapsedTime}초`;
    }, 10);
}

function endSchulteGame() {
    const state = testState.schulte;

    clearInterval(state.timerInterval);
    state.isGaming = false;

    const nextEl = document.getElementById("schulte-next");
    const nextBtn = document.getElementById("schulte-next-btn");

    if (nextEl) nextEl.innerText = "완료";
    if (nextBtn) nextBtn.disabled = false;

    const retryBtn = document.getElementById("schulte-retry-btn");
    if (retryBtn) retryBtn.style.display = "block";

    schulteRecords.forEach(item => item.isCurrentPlayer = false);

    schulteRecords.unshift({
        grade: testState.child.gradeText,
        name: testState.child.name,
        time: `${state.elapsedTime}초`,
        date: getTodayString(),
        isCurrentPlayer: true
    });

    localStorage.setItem("nollpic_schulte_records", JSON.stringify(schulteRecords));
    renderSchulteLeaderboard();
}

function restartSchulteGame() {
    const overlay = document.getElementById("schulte-countdown-overlay");
    const startBlock = document.getElementById("popup-start-block");
    const countDisplay = document.getElementById("popup-countdown-number");
    const nextBtn = document.getElementById("schulte-next-btn");
    const retryBtn = document.getElementById("schulte-retry-btn");

    clearInterval(testState.schulte.timerInterval);
    testState.schulte.currentNext = 1;
    testState.schulte.elapsedTime = "0.00";
    testState.schulte.isGaming = false;

    if (nextBtn) nextBtn.disabled = true;
    if (retryBtn) retryBtn.style.display = "none";
    if (startBlock) startBlock.style.display = "block";
    if (countDisplay) {
        countDisplay.style.display = "none";
        countDisplay.innerText = "3";
    }
    if (overlay) overlay.classList.add("active");
}

function renderSchulteLeaderboard() {
    const container = document.getElementById("schulte-leaderboard-list");
    if (!container) return;

    container.innerHTML = "";

    schulteRecords.slice(0, 8).forEach(item => {
        const row = document.createElement("div");
        row.className = `leaderboard-row ${item.isCurrentPlayer ? "highlight" : ""}`;

        row.innerHTML = `
            <span>${item.grade}</span>
            <span>${item.name}</span>
            <span>${item.time}</span>
            <span>${item.date}</span>
        `;

        container.appendChild(row);
    });
}

function goToMemoryTest() {
    showScreen("memory-screen");

    const popup = document.getElementById("memory-popup");
    if (popup) popup.classList.add("active");
}

// ==========================================================================
// 02. 작업 기억력
// ==========================================================================
function getMemoryLevelConfig(level) {
    const configs = [
        { show: 3, total: 8, time: 3 },
        { show: 4, total: 8, time: 3 },
        { show: 4, total: 10, time: 3 },
        { show: 5, total: 10, time: 3 },
        { show: 6, total: 12, time: 3 },
        { show: 7, total: 12, time: 3 },
        { show: 8, total: 14, time: 3 },
        { show: 9, total: 14, time: 3 },
        { show: 10, total: 16, time: 3 },
        { show: 12, total: 20, time: 3 }
    ];

    return configs[level - 1] || { show: 12, total: 20, time: 3 };
}

function startMemoryGame() {
    const popup = document.getElementById("memory-popup");
    if (popup) popup.classList.remove("active");

    const retryBtn = document.getElementById("memory-retry-btn");
    const nextBtn = document.getElementById("memory-next-btn");
    if (retryBtn) retryBtn.style.display = "none";
    if (nextBtn) nextBtn.disabled = true;

    const state = testState.memory;
    const config = getMemoryLevelConfig(state.level);

    state.showCount = config.show;
    state.totalCount = config.total;
    state.correctCount = 0;
    state.gameState = "memorize";

    const indices = Array.from({ length: state.totalCount }, (_, i) => i);
    state.answerIndices = shuffle(indices).slice(0, state.showCount);

    renderMemoryCards(true);

    const bar = document.getElementById("memory-progress-bar");
    if (bar) {
        bar.style.width = "100%";
        bar.classList.remove("running-animation");
        void bar.offsetWidth;
        bar.classList.add("running-animation");
    }

    setTimeout(startMemoryGuessing, 3000);
}

function renderMemoryCards(show) {
    const board = document.getElementById("memory-board");
    if (!board) return;

    const state = testState.memory;

    board.innerHTML = "";
    board.style.gridTemplateColumns = "repeat(4, 1fr)";

    for (let i = 0; i < state.totalCount; i++) {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "memory-card";

        const isAnswer = state.answerIndices.includes(i);

        if (show && isAnswer) {
            card.classList.add("reveal");
        }

        card.addEventListener("click", () => {
            handleMemoryCardClick(card, isAnswer);
        });

        board.appendChild(card);
    }
}

function startMemoryGuessing() {
    const state = testState.memory;
    state.gameState = "guess";

    const desc = document.getElementById("memory-desc");
    if (desc) desc.innerText = `Level ${state.level} - 정답을 모두 찾으세요!`;

    renderMemoryCards(false);
}

function handleMemoryCardClick(card, isCorrect) {
    const state = testState.memory;

    if (state.gameState !== "guess" || card.classList.contains("clicked")) {
        return;
    }

    card.classList.add("clicked");

    if (isCorrect) {
        card.classList.add("reveal");
        state.correctCount++;

        if (state.correctCount === state.showCount) {
            state.level++;

            const desc = document.getElementById("memory-desc");
            if (desc) desc.innerText = "성공! 다음 단계로 넘어갑니다.";

            setTimeout(startMemoryGame, 1000);
        }
    } else {
        card.classList.add("wrong");
        endMemoryGame();
    }
}

function endMemoryGame() {
    const state = testState.memory;
    state.gameState = "finished";
    state.successLevel = Math.max(0, state.level - 1);

    memoryRecords.forEach(item => item.isCurrentPlayer = false);

    memoryRecords.unshift({
        grade: testState.child.gradeText,
        name: testState.child.name,
        time: `${state.successLevel}단계 달성`,
        date: getTodayString(),
        isCurrentPlayer: true
    });

    localStorage.setItem("nollpic_memory_records", JSON.stringify(memoryRecords));

    renderMemoryLeaderboard();

    const nextBtn = document.getElementById("memory-next-btn");
    if (nextBtn) nextBtn.disabled = false;

    const retryBtn = document.getElementById("memory-retry-btn");
    if (retryBtn) retryBtn.style.display = "block";

    alert(`게임 종료! 총 ${state.successLevel}단계 성공하였습니다.`);
}

function restartMemoryGame() {
    const state = testState.memory;
    const popup = document.getElementById("memory-popup");
    const nextBtn = document.getElementById("memory-next-btn");
    const retryBtn = document.getElementById("memory-retry-btn");
    const desc = document.getElementById("memory-desc");
    const board = document.getElementById("memory-board");
    const bar = document.getElementById("memory-progress-bar");

    state.level = 1;
    state.gameState = "memorize";
    state.correctCount = 0;
    state.answerIndices = [];
    state.successLevel = 0;

    if (nextBtn) nextBtn.disabled = true;
    if (retryBtn) retryBtn.style.display = "none";
    if (desc) desc.innerText = "카드의 위치를 3초간 기억하세요!";
    if (board) board.innerHTML = "";
    if (bar) {
        bar.classList.remove("running-animation");
        bar.style.width = "100%";
    }
    if (popup) popup.classList.add("active");
}

function renderMemoryLeaderboard() {
    const container = document.getElementById("memory-leaderboard-list");
    if (!container) return;

    container.innerHTML = "";

    memoryRecords.slice(0, 8).forEach(item => {
        const row = document.createElement("div");
        row.className = `leaderboard-row ${item.isCurrentPlayer ? "highlight" : ""}`;

        row.innerHTML = `
            <span>${item.grade}</span>
            <span>${item.name}</span>
            <span>${item.time}</span>
            <span>${item.date}</span>
        `;

        container.appendChild(row);
    });
}

// ==========================================================================
// 결과 / 재시작
// ==========================================================================
function finishAllTests() {
    const schulteTime = testState.schulte.elapsedTime || "0.00";
    const memoryLevel = testState.memory.successLevel || 0;
    const reactionAvg = testState.reaction.averageMs || 0;
    const reactionAccuracy = testState.reaction.accuracy || 0;
    const reactionLevel = testState.reaction.level;
    const visualLevel = testState.visualSearch.highestLevel || 0;
    const visualWrong = testState.visualSearch.wrong || 0;
    const visualAccuracy = testState.visualSearch.accuracy || 0;
    const flankerLevel = testState.flanker.level || 0;
    const flankerWrong = testState.flanker.wrong || 0;
    const flankerAccuracy = testState.flanker.accuracy || 0;
    const flankerAvg = testState.flanker.averageSec || "0.00";
    const scores = calculateNollpicScores();

    saveNollpicResult(scores);

    const summary = document.getElementById("result-summary");
    if (summary) {
        summary.innerHTML = `
            <strong>${testState.child.name}</strong>의 오늘 기록입니다.<br>
            종합 결과: <strong>${scores.overall}점</strong><br><br>
            1. 집중 유지력: <strong>${scores.attention}점</strong> / 원기록 ${schulteTime}초<br>
            2. 작업 기억력: <strong>${scores.memory}점</strong> / ${memoryLevel}단계 달성<br>
            3. 반응 속도: <strong>${scores.reaction}점</strong> / ${reactionAvg}ms · 정답률 ${reactionAccuracy}% · Lv.${reactionLevel}<br>
            4. 시각 탐색: <strong>${scores.visual}점</strong> / Lv.${visualLevel} · 오답 ${visualWrong}회 · 정확도 ${visualAccuracy}%<br>
            5. 충동 억제: <strong>${scores.inhibition}점</strong> / Lv.${flankerLevel} · 오답 ${flankerWrong}회 · 정확도 ${flankerAccuracy}% · 평균 ${flankerAvg}초
        `;
    }

    goToMypageResult();
}

function goToMypageResult() {
    localStorage.setItem("nollpic_child_name", testState.child.name);
    localStorage.setItem("nollpic_child_grade", testState.child.gradeText);

    const targetUrl = new URL("../mypage/mypage-result.html", window.location.href).href;

    if (window.parent && window.parent !== window) {
        window.parent.location.href = targetUrl;
    } else {
        window.location.href = targetUrl;
    }
}

function restartTests() {
    location.reload();
}


// 기억력 끝난 뒤 반응속도 테스트로 이동
function goToReactionTest() {
    showScreen("reaction-screen");

    const popup = document.getElementById("reaction-popup");
    if (popup) popup.classList.add("active");
}

// 원클릭 반응속도 테스트
function startReactionGame() {
    const stage = document.getElementById("reaction-stage");
if (stage) {
    stage.onclick = function () {
        if (!testState.reaction.isGaming) return;
        if (!testState.reaction.currentCircle) return;

        testState.reaction.wrongClicks++;
        testState.reaction.lives--;

        updateReactionDashboard();

        if (testState.reaction.lives <= 0) {
            endReactionGame();
        }
    };
}


    const popup = document.getElementById("reaction-popup");
    if (popup) popup.classList.remove("active");

    const state = testState.reaction;

    clearTimeout(state.spawnTimer);
    clearInterval(state.moveTimer);

    if (state.currentCircle) {
        state.currentCircle.remove();
        state.currentCircle = null;
    }

    state.isGaming = false;
    state.score = 0;
    state.level = 1;
    state.lives = 3;
    state.round = 0;
    state.responseTimes = [];
    state.correctClicks = 0;
    state.wrongClicks = 0;
    state.missedClicks = 0;
    state.accuracy = 0;
    state.averageMs = 0;

    const ready = document.getElementById("reaction-ready");
    if (ready) {
        ready.style.display = "flex";
        ready.innerHTML = "초록색은 정확히 클릭<br> 빨간색은 멈추세요";
    }

    const nextBtn = document.getElementById("reaction-next-btn");
    if (nextBtn) nextBtn.disabled = true;

    const retryBtn = document.getElementById("reaction-retry-btn");
    if (retryBtn) retryBtn.style.display = "none";

    updateReactionDashboard();

    setTimeout(() => {
        if (ready) ready.style.display = "none";

        state.isGaming = true;
        spawnReactionCircle();
    }, 2000);
}


function getReactionSpeed() {
    const level = testState.reaction.level;

    return Math.max(
        700,
        2200 - ((level - 1) * 120)
    );
}

function spawnReactionCircle() {
    const state = testState.reaction;
    const stage = document.getElementById("reaction-stage");
    if (!stage || !state.isGaming) return;

    clearTimeout(state.spawnTimer);
    clearInterval(state.moveTimer);

    if (state.currentCircle) {
        state.currentCircle.remove();
        state.currentCircle = null;
    }

    if (state.lives <= 0) {
        endReactionGame();
        return;
    }

    state.round++;
    state.level = Math.floor((state.round - 1) / 5) + 1;

    const circle = document.createElement("button");
    circle.type = "button";

    const isGreen = Math.random() < 0.8;
    circle.className = `reaction-circle ${isGreen ? "green" : "red"}`;
    circle.dataset.color = isGreen ? "green" : "red";
    circle.dataset.clicked = "false";

    const stageRect = stage.getBoundingClientRect();
    const size = 58;
    const pos = getRandomCirclePosition(stageRect.width, stageRect.height, size);

    circle.style.left = `${pos.x}px`;
    circle.style.top = `${pos.y}px`;

   circle.addEventListener("click", (event) => handleReactionClick(circle, event));
    stage.appendChild(circle);

    state.currentCircle = circle;
    state.circleStartTime = performance.now();

    state.spawnTimer = setTimeout(() => {
        if (!state.isGaming || state.currentCircle !== circle) return;

        if (circle.dataset.clicked === "true") return;

        circle.dataset.clicked = "true";

        if (circle.dataset.color === "green") {
            state.missedClicks++;
            state.lives--;
        }

        circle.remove();
        state.currentCircle = null;

        updateReactionDashboard();

        if (state.lives > 0) {
            setTimeout(spawnReactionCircle, 180);
        } else {
            endReactionGame();
        }
    }, getReactionSpeed());
}


function getRandomCirclePosition(width, height, size) {
    const padding = 12;

    const maxX = Math.max(padding, width - size - padding);
    const maxY = Math.max(padding, height - size - padding);

    return {
        x: Math.floor(Math.random() * (maxX - padding + 1)) + padding,
        y: Math.floor(Math.random() * (maxY - padding + 1)) + padding
    };
}

function handleReactionClick(circle, event) {
    if (event) event.stopPropagation();

    const state = testState.reaction;

    if (!state.isGaming || state.currentCircle !== circle) return;

    if (circle.dataset.clicked === "true") return;
    circle.dataset.clicked = "true";

    clearTimeout(state.spawnTimer);

    const color = circle.dataset.color;
    const reactionMs = Math.round(performance.now() - state.circleStartTime);

    if (color === "green") {
        state.score += 10;
        state.correctClicks++;
        state.responseTimes.push(reactionMs);
    } else {
        state.score = Math.max(0, state.score - 10);
        state.wrongClicks++;
        state.lives--;
    }

    circle.remove();
    state.currentCircle = null;

    updateReactionDashboard();

    if (state.lives > 0) {
        setTimeout(spawnReactionCircle, 180);
    } else {
        endReactionGame();
    }
}

function updateReactionDashboard() {
    const state = testState.reaction;
    const totalActions = state.correctClicks + state.wrongClicks + state.missedClicks;

    state.averageMs = state.responseTimes.length
        ? Math.round(state.responseTimes.reduce((sum, item) => sum + item, 0) / state.responseTimes.length)
        : 0;

    state.accuracy = totalActions
        ? Math.round((state.correctClicks / totalActions) * 100)
        : 0;

    const scoreEl = document.getElementById("reaction-score");
    const levelEl = document.getElementById("reaction-level");
    const livesEl = document.getElementById("reaction-lives");
    const avgEl = document.getElementById("reaction-avg");
    const accEl = document.getElementById("reaction-accuracy");

    if (scoreEl) scoreEl.innerText = state.score;
    if (levelEl) levelEl.innerText = state.level;
    if (livesEl) livesEl.innerText = "❤️ ".repeat(state.lives) + "🖤 ".repeat(Math.max(0, 3 - state.lives));
    if (avgEl) avgEl.innerText = state.averageMs ? `${state.averageMs}ms` : "-";
    if (accEl) accEl.innerText = totalActions ? `${state.accuracy}%` : "-";
}

function endReactionGame() {
    const state = testState.reaction;
    state.isGaming = false;

    clearTimeout(state.spawnTimer);
    clearInterval(state.moveTimer);

    if (state.currentCircle) {
        state.currentCircle.remove();
        state.currentCircle = null;
    }

    updateReactionDashboard();

    reactionRecords.forEach(item => item.isCurrentPlayer = false);

    reactionRecords.unshift({
        grade: testState.child.gradeText,
        name: testState.child.name,
        time: state.averageMs ? `${state.averageMs}ms / ${state.accuracy}%` : `0ms / ${state.accuracy}%`,
        date: getTodayString(),
        isCurrentPlayer: true
    });

    localStorage.setItem("nollpic_reaction_records", JSON.stringify(reactionRecords));
    renderReactionLeaderboard();

    const ready = document.getElementById("reaction-ready");
    if (ready) {
        ready.style.display = "flex";
        ready.innerHTML = `완료!<br>평균 ${state.averageMs || 0}ms · 정답률 ${state.accuracy}%`;
    }

    const nextBtn = document.getElementById("reaction-next-btn");
    if (nextBtn) nextBtn.disabled = false;

    const retryBtn = document.getElementById("reaction-retry-btn");
    if (retryBtn) retryBtn.style.display = "block";
}

function restartReactionGame() {
    const popup = document.getElementById("reaction-popup");
    const stage = document.getElementById("reaction-stage");
    const ready = document.getElementById("reaction-ready");
    const nextBtn = document.getElementById("reaction-next-btn");
    const retryBtn = document.getElementById("reaction-retry-btn");
    const state = testState.reaction;

    clearTimeout(state.spawnTimer);
    clearInterval(state.moveTimer);

    if (state.currentCircle) {
        state.currentCircle.remove();
        state.currentCircle = null;
    }

    state.isGaming = false;
    state.score = 0;
    state.level = 1;
    state.lives = 3;
    state.round = 0;
    state.responseTimes = [];
    state.correctClicks = 0;
    state.wrongClicks = 0;
    state.missedClicks = 0;
    state.accuracy = 0;
    state.averageMs = 0;

    updateReactionDashboard();

    if (nextBtn) nextBtn.disabled = true;
    if (retryBtn) retryBtn.style.display = "none";
    if (ready) {
        ready.style.display = "flex";
        ready.innerHTML = "준비되면 시작 버튼을 눌러주세요.";
    }
    if (stage) stage.onclick = null;
    if (popup) popup.classList.add("active");
}

function renderReactionLeaderboard() {
    const container = document.getElementById("reaction-leaderboard-list");
    if (!container) return;

    container.innerHTML = "";

    reactionRecords.slice(0, 8).forEach(item => {
        const row = document.createElement("div");
        row.className = `leaderboard-row ${item.isCurrentPlayer ? "highlight" : ""}`;

        row.innerHTML = `
            <span>${item.grade}</span>
            <span>${item.name}</span>
            <span>${item.time}</span>
            <span>${item.date}</span>
        `;

        container.appendChild(row);
    });
}


// ==========================================================================
// 04. 시각 탐색 챌린지
// ==========================================================================
const visualSearchLevels = [
    { grid: 3, targetCount: 3, timeLimit: 22, trapRate: 0.10 },
    { grid: 3, targetCount: 4, timeLimit: 20, trapRate: 0.15 },
    { grid: 4, targetCount: 4, timeLimit: 18, trapRate: 0.20 },
    { grid: 4, targetCount: 5, timeLimit: 16, trapRate: 0.25 },
    { grid: 4, targetCount: 6, timeLimit: 15, trapRate: 0.30 },

    { grid: 5, targetCount: 6, timeLimit: 14, trapRate: 0.40 },
    { grid: 5, targetCount: 7, timeLimit: 13, trapRate: 0.50 },
    { grid: 5, targetCount: 8, timeLimit: 12, trapRate: 0.60 },
    { grid: 5, targetCount: 9, timeLimit: 11, trapRate: 0.70 },
    { grid: 5, targetCount: 10, timeLimit: 10, trapRate: 0.80 },

    { grid: 6, targetCount: 10, timeLimit: 9, trapRate: 0.85 },
    { grid: 6, targetCount: 11, timeLimit: 8, trapRate: 0.88 },
    { grid: 6, targetCount: 12, timeLimit: 8, trapRate: 0.90 },
    { grid: 6, targetCount: 13, timeLimit: 7, trapRate: 0.92 },
    { grid: 6, targetCount: 14, timeLimit: 7, trapRate: 0.94 },

    { grid: 7, targetCount: 14, timeLimit: 6, trapRate: 0.95 },
    { grid: 7, targetCount: 15, timeLimit: 6, trapRate: 0.96 },
    { grid: 7, targetCount: 16, timeLimit: 5, trapRate: 0.97 },
    { grid: 7, targetCount: 17, timeLimit: 5, trapRate: 0.98 },
    { grid: 7, targetCount: 18, timeLimit: 4, trapRate: 0.99 }
];

const visualAnimalSets = [
    { target: "🐶", traps: ["🐺", "🦊", "🐕"] },
    { target: "🐱", traps: ["🦁", "🐯", "🐈"] },
    { target: "🐰", traps: ["🐭", "🐹", "🐇"] },
    { target: "🐻", traps: ["🐼", "🦝", "🐨"] },
    { target: "🐸", traps: ["🐢", "🦎", "🐍"] },
    { target: "🐵", traps: ["🦍", "🦧", "🐒"] },
    { target: "🐯", traps: ["🦁", "🐱", "🐅"] },
    { target: "🐼", traps: ["🐻", "🐨", "🦝"] },
    { target: "🐔", traps: ["🐤", "🐣", "🐥"] },
    { target: "🐠", traps: ["🐟", "🐡", "🐬"] },
    { target: "🦆", traps: ["🐦", "🐤", "🦢"] },
    { target: "🐴", traps: ["🦄", "🐮", "🫏"] }
];

const visualFillers = [
    "🐶","🐺","🦊","🐕",
    "🐱","🦁","🐯","🐈",
    "🐰","🐭","🐹","🐇",
    "🐻","🐼","🦝","🐨",
    "🐸","🐢","🦎","🐍",
    "🐵","🦍","🦧","🐒",
    "🐔","🐤","🐣","🐥",
    "🐠","🐟","🐡","🐬",
    "🦆","🐦","🦢","🐴","🦄","🫏"
];

function goToVisualSearchTest() {
    showScreen("visual-search-screen");

    const popup = document.getElementById("visual-search-popup");
    if (popup) popup.classList.add("active");
}

function startVisualSearchGame() {
    const popup = document.getElementById("visual-search-popup");
    if (popup) popup.classList.remove("active");

    const state = testState.visualSearch;

    clearInterval(state.timer);

    state.isGaming = true;
    state.level = 1;
    state.wrong = 0;
    state.found = 0;
    state.target = "";
    state.timeLeft = 0;
    state.levelTimes = [];
    state.highestLevel = 0;
    state.accuracy = 0;

    const nextBtn = document.getElementById("visual-next-btn");
    if (nextBtn) nextBtn.disabled = true;

    const retryBtn = document.getElementById("visual-retry-btn");
    if (retryBtn) retryBtn.style.display = "none";

    updateVisualDashboard();
    startVisualLevel();
}

function startVisualLevel() {
    const state = testState.visualSearch;
    const cfg = visualSearchLevels[state.level - 1];

    if (!cfg) {
        endVisualSearchGame("🏆 모든 레벨을 완료했어요!");
        return;
    }

    const set = visualAnimalSets[Math.floor(Math.random() * visualAnimalSets.length)];
    state.target = set.target;
    state.found = 0;
    state.timeLeft = cfg.timeLimit;
    state.startTime = performance.now();

    const targetEl = document.getElementById("visual-target");
    const countEl = document.getElementById("visual-target-count");
    const msgEl = document.getElementById("visual-message");
    const board = document.getElementById("visual-board");

    if (targetEl) targetEl.innerText = state.target;
    if (countEl) countEl.innerText = `${state.target} ${cfg.targetCount}마리를 찾아보세요`;
    if (msgEl) msgEl.innerText = "목표 동물을 모두 찾아요!";

    board.innerHTML = "";
    board.style.gridTemplateColumns = `repeat(${cfg.grid}, 1fr)`;

    let items = [];

    for (let i = 0; i < cfg.targetCount; i++) {
        items.push(state.target);
    }

    const totalCells = cfg.grid * cfg.grid;

    while (items.length < totalCells) {
        const useTrap = Math.random() < cfg.trapRate;
        let item;

        if (useTrap) {
            item = set.traps[Math.floor(Math.random() * set.traps.length)];
        } else {
            item = visualFillers[Math.floor(Math.random() * visualFillers.length)];
        }

        if (item === state.target) continue;
        items.push(item);
    }

    items = shuffle(items);

    items.forEach(item => {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "visual-cell";
        cell.innerText = item;

        cell.addEventListener("click", () => {
            handleVisualCellClick(cell, item, cfg);
        });

        board.appendChild(cell);
    });

    clearInterval(state.timer);

    state.timer = setInterval(() => {
        state.timeLeft--;
        updateVisualDashboard();

        if (state.timeLeft <= 0) {
            clearInterval(state.timer);
            endVisualSearchGame(`⏰ 시간 종료! Lv.${state.level}까지 도전했어요.`);
        }
    }, 1000);

    updateVisualDashboard();
}

function handleVisualCellClick(cell, item, cfg) {
    const state = testState.visualSearch;

    if (!state.isGaming || state.timeLeft <= 0) return;
    if (cell.classList.contains("found")) return;

    if (item === state.target) {
        cell.classList.add("found");
        state.found++;

        if (state.found === cfg.targetCount) {
            clearInterval(state.timer);

            const spent = ((performance.now() - state.startTime) / 1000).toFixed(2);
            state.levelTimes.push(Number(spent));
            state.highestLevel = Math.max(state.highestLevel, state.level);

            const msgEl = document.getElementById("visual-message");
            if (msgEl) msgEl.innerText = `🎉 Lv.${state.level} 성공! ${spent}초`;

            if (state.level < visualSearchLevels.length) {
                state.level++;
                updateVisualDashboard();
                setTimeout(startVisualLevel, 800);
            } else {
                endVisualSearchGame("🏆 모든 레벨을 완료했어요!");
            }
        }
    } else {
        state.wrong++;
        cell.classList.add("wrong");

        setTimeout(() => {
            cell.classList.remove("wrong");
        }, 180);

        updateVisualDashboard();
    }
}

function updateVisualDashboard() {
    const state = testState.visualSearch;

    const levelEl = document.getElementById("visual-level");
    const timeEl = document.getElementById("visual-time");
    const wrongEl = document.getElementById("visual-wrong");

    if (levelEl) levelEl.innerText = state.level;
    if (timeEl) timeEl.innerText = `${Math.max(0, state.timeLeft)}초`;
    if (wrongEl) wrongEl.innerText = state.wrong;
}

function endVisualSearchGame(message) {
    const state = testState.visualSearch;
    state.isGaming = false;

    clearInterval(state.timer);

    const board = document.getElementById("visual-board");
    if (board) {
        board.querySelectorAll("button").forEach(btn => btn.disabled = true);
    }

    const totalCorrect = state.levelTimes.length
        ? visualSearchLevels.slice(0, state.levelTimes.length).reduce((sum, cfg) => sum + cfg.targetCount, 0)
        : 0;
    const totalActions = totalCorrect + state.wrong;
    state.accuracy = totalActions ? Math.round((totalCorrect / totalActions) * 100) : 0;

    const avgTime = state.levelTimes.length
        ? (state.levelTimes.reduce((a, b) => a + b, 0) / state.levelTimes.length).toFixed(2)
        : "0.00";

    const msgEl = document.getElementById("visual-message");
    if (msgEl) {
        msgEl.innerHTML = `
            ${message}<br>
            평균 성공 시간 ${avgTime}초 · 정확도 ${state.accuracy}%
        `;
    }

    visualSearchRecords.forEach(item => item.isCurrentPlayer = false);

    visualSearchRecords.unshift({
        grade: testState.child.gradeText,
        name: testState.child.name,
        time: `Lv.${state.highestLevel || state.level} / ${state.accuracy}%`,
        date: getTodayString(),
        isCurrentPlayer: true
    });

    localStorage.setItem("nollpic_visual_search_records", JSON.stringify(visualSearchRecords));
    renderVisualSearchLeaderboard();

    const nextBtn = document.getElementById("visual-next-btn");
    if (nextBtn) nextBtn.disabled = false;

    const retryBtn = document.getElementById("visual-retry-btn");
    if (retryBtn) retryBtn.style.display = "block";
}

function restartVisualSearchGame() {
    const state = testState.visualSearch;
    const popup = document.getElementById("visual-search-popup");
    const board = document.getElementById("visual-board");
    const msgEl = document.getElementById("visual-message");
    const nextBtn = document.getElementById("visual-next-btn");
    const retryBtn = document.getElementById("visual-retry-btn");

    clearInterval(state.timer);

    state.isGaming = false;
    state.level = 1;
    state.wrong = 0;
    state.found = 0;
    state.target = "";
    state.timeLeft = 0;
    state.levelTimes = [];
    state.highestLevel = 0;
    state.accuracy = 0;

    if (board) board.innerHTML = "";
    if (msgEl) msgEl.innerText = "시작 버튼을 눌러주세요.";
    if (nextBtn) nextBtn.disabled = true;
    if (retryBtn) retryBtn.style.display = "none";

    updateVisualDashboard();

    if (popup) popup.classList.add("active");
}

function renderVisualSearchLeaderboard() {
    const container = document.getElementById("visual-leaderboard-list");
    if (!container) return;

    container.innerHTML = "";

    visualSearchRecords.slice(0, 8).forEach(item => {
        const row = document.createElement("div");
        row.className = `leaderboard-row ${item.isCurrentPlayer ? "highlight" : ""}`;

        row.innerHTML = `
            <span>${item.grade}</span>
            <span>${item.name}</span>
            <span>${item.time}</span>
            <span>${item.date}</span>
        `;

        container.appendChild(row);
    });
}



// ==========================================================================
// 05. Flanker 충동억제 챌린지
// ==========================================================================
const flankerLevels = [
    { length: 5, showMs: 1800, answerTime: 2.7, items: ["🐶", "🐱"] },
    { length: 5, showMs: 1700, answerTime: 2.5, items: ["🐸", "🐻"] },
    { length: 5, showMs: 1600, answerTime: 2.3, items: ["🐶", "🐺"] },
    { length: 5, showMs: 1500, answerTime: 2.1, items: ["🐱", "🦁"] },
    { length: 7, showMs: 1400, answerTime: 2.0, items: ["🐰", "🐹"] },

    { length: 7, showMs: 1300, answerTime: 1.8, items: ["🍓", "🍒"] },
    { length: 7, showMs: 1200, answerTime: 1.7, items: ["🔷", "🔹"] },
    { length: 7, showMs: 1100, answerTime: 1.6, items: ["🔴", "🟠"] },
    { length: 7, showMs: 1000, answerTime: 1.5, items: ["▲", "△"] },
    { length: 7, showMs: 950, answerTime: 1.4, items: ["●", "○"] },

    { length: 7, showMs: 900, answerTime: 1.3, items: ["◆", "◇"] },
    { length: 7, showMs: 850, answerTime: 1.2, items: ["☆", "★"] },
    { length: 7, showMs: 800, answerTime: 1.1, items: ["◎", "○"] },
    { length: 9, showMs: 750, answerTime: 1.0, items: ["↖", "↘"] },
    { length: 9, showMs: 700, answerTime: 0.95, items: ["☞", "☜"] },

    { length: 9, showMs: 650, answerTime: 0.9, items: ["▤", "▥"] },
    { length: 9, showMs: 600, answerTime: 0.85, items: ["▨", "▧"] },
    { length: 9, showMs: 550, answerTime: 0.8, items: ["↗", "↘"] },
    { length: 9, showMs: 500, answerTime: 0.75, items: ["▥", "▤"] },
    { length: 9, showMs: 450, answerTime: 0.7, items: ["▧", "▨"] }
];

function goToFlankerTest() {
    showScreen("flanker-screen");

    const popup = document.getElementById("flanker-popup");
    if (popup) popup.classList.add("active");
}

function startFlankerGame() {
    const popup = document.getElementById("flanker-popup");
    if (popup) popup.classList.remove("active");

    const state = testState.flanker;

    clearTimeout(state.answerTimer);
    clearInterval(state.countdownTimer);

    state.isGaming = true;
    state.level = 1;
    state.correct = 0;
    state.wrong = 0;
    state.currentAnswer = "";
    state.reactionTimes = [];
    state.totalQuestions = 0;
    state.accuracy = 0;
    state.averageSec = "0.00";

    const nextBtn = document.getElementById("flanker-next-btn");
    if (nextBtn) nextBtn.disabled = true;

    const retryBtn = document.getElementById("flanker-retry-btn");
    if (retryBtn) retryBtn.style.display = "none";

    updateFlankerDashboard();
    startFlankerRound();
}

function startFlankerRound() {
    const state = testState.flanker;

    clearTimeout(state.answerTimer);
    clearInterval(state.countdownTimer);

    if (!state.isGaming) return;

    const cfg = flankerLevels[state.level - 1];

    if (!cfg) {
        endFlankerGame("🏆 모든 레벨을 완료했어요!");
        return;
    }

    const target = cfg.items[Math.floor(Math.random() * cfg.items.length)];
    const distractor = cfg.items.find(item => item !== target);
    const centerIndex = Math.floor(cfg.length / 2);
    const sequence = Array.from({ length: cfg.length }, (_, i) => i === centerIndex ? target : distractor);

    state.currentAnswer = target;

    const missionEl = document.getElementById("flanker-mission");
    const stimulusEl = document.getElementById("flanker-stimulus");
    const choicesEl = document.getElementById("flanker-choices");
    const messageEl = document.getElementById("flanker-message");

    if (missionEl) missionEl.innerText = "가운데 목표를 기억하세요";
    if (messageEl) messageEl.innerText = state.level >= 12 ? "아주 짧게 보여요. 집중!" : "잠깐 보여준 뒤 선택지가 나타나요";
    if (choicesEl) choicesEl.innerHTML = "";

    if (stimulusEl) {
        stimulusEl.className = "flanker-stimulus flash";
        if (cfg.length >= 9) stimulusEl.classList.add("tiny");
        else if (cfg.length >= 7) stimulusEl.classList.add("small");

        stimulusEl.innerHTML = sequence.map(item => `<span>${item}</span>`).join("");
    }

    updateFlankerDashboard();

    setTimeout(() => {
        showFlankerChoices(cfg);
    }, cfg.showMs);
}

function showFlankerChoices(cfg) {
    const state = testState.flanker;

    if (!state.isGaming) return;

    const missionEl = document.getElementById("flanker-mission");
    const stimulusEl = document.getElementById("flanker-stimulus");
    const choicesEl = document.getElementById("flanker-choices");
    const messageEl = document.getElementById("flanker-message");
    const timeEl = document.getElementById("flanker-time");

    if (missionEl) missionEl.innerText = "가운데에 있던 목표를 고르세요";
    if (messageEl) messageEl.innerText = "빠르고 정확하게 선택하세요";

    if (stimulusEl) {
        stimulusEl.className = "flanker-stimulus";
        if (cfg.length >= 9) stimulusEl.classList.add("tiny");
        else if (cfg.length >= 7) stimulusEl.classList.add("small");
        stimulusEl.innerHTML = "<span>?</span>";
    }

    if (choicesEl) {
        choicesEl.innerHTML = "";
        shuffle([...cfg.items]).forEach(item => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "flanker-choice";
            btn.innerText = item;
            btn.addEventListener("click", () => handleFlankerChoice(item));
            choicesEl.appendChild(btn);
        });
    }

    state.roundStart = performance.now();

    let remain = cfg.answerTime;
    if (timeEl) timeEl.innerText = remain.toFixed(1);

    clearInterval(state.countdownTimer);
    state.countdownTimer = setInterval(() => {
        remain -= 0.1;
        if (timeEl) timeEl.innerText = Math.max(0, remain).toFixed(1);
    }, 100);

    clearTimeout(state.answerTimer);
    state.answerTimer = setTimeout(() => {
        if (!state.isGaming) return;

        state.wrong++;
        state.totalQuestions++;
        updateFlankerDashboard();

        const msgEl = document.getElementById("flanker-message");
        if (msgEl) msgEl.innerText = "⏰ 시간 초과!";

        endFlankerGame(`⏰ 시간 초과! Lv.${state.level}까지 도전했어요.`);
    }, cfg.answerTime * 1000);
}

function handleFlankerChoice(choice) {
    const state = testState.flanker;

    if (!state.isGaming) return;

    clearTimeout(state.answerTimer);
    clearInterval(state.countdownTimer);

    const reaction = (performance.now() - state.roundStart) / 1000;
    state.totalQuestions++;

    const buttons = document.querySelectorAll(".flanker-choice");
    buttons.forEach(btn => btn.disabled = true);

    const msgEl = document.getElementById("flanker-message");

    if (choice === state.currentAnswer) {
        state.correct++;
        state.reactionTimes.push(reaction);

        if (msgEl) msgEl.innerText = `정답! ${reaction.toFixed(2)}초`;

        state.level++;
        updateFlankerDashboard();

        setTimeout(startFlankerRound, 650);
    } else {
        state.wrong++;
        updateFlankerDashboard();

        if (msgEl) msgEl.innerText = "오답! 방해 자극에 속지 마세요";

        setTimeout(() => {
            endFlankerGame(`오답! Lv.${state.level}까지 도전했어요.`);
        }, 750);
    }
}

function updateFlankerDashboard() {
    const state = testState.flanker;

    const levelEl = document.getElementById("flanker-level");
    const wrongEl = document.getElementById("flanker-wrong");
    const correctEl = document.getElementById("flanker-correct");
    const avgEl = document.getElementById("flanker-avg");

    state.averageSec = state.reactionTimes.length
        ? (state.reactionTimes.reduce((sum, item) => sum + item, 0) / state.reactionTimes.length).toFixed(2)
        : "0.00";

    state.accuracy = state.totalQuestions
        ? Math.round((state.correct / state.totalQuestions) * 100)
        : 0;

    if (levelEl) levelEl.innerText = Math.min(state.level, flankerLevels.length);
    if (wrongEl) wrongEl.innerText = state.wrong;
    if (correctEl) correctEl.innerText = state.correct;
    if (avgEl) avgEl.innerText = state.reactionTimes.length ? `${state.averageSec}초` : "-";
}

function endFlankerGame(message) {
    const state = testState.flanker;
    state.isGaming = false;

    clearTimeout(state.answerTimer);
    clearInterval(state.countdownTimer);

    updateFlankerDashboard();

    const msgEl = document.getElementById("flanker-message");
    if (msgEl) {
        msgEl.innerHTML = `
            ${message}<br>
            평균 반응 ${state.averageSec}초 · 정확도 ${state.accuracy}%
        `;
    }

    const choicesEl = document.getElementById("flanker-choices");
    if (choicesEl) {
        choicesEl.querySelectorAll("button").forEach(btn => btn.disabled = true);
    }

    flankerRecords.forEach(item => item.isCurrentPlayer = false);

    flankerRecords.unshift({
        grade: testState.child.gradeText,
        name: testState.child.name,
        time: `Lv.${Math.min(state.level, flankerLevels.length)} / ${state.accuracy}%`,
        date: getTodayString(),
        isCurrentPlayer: true
    });

    localStorage.setItem("nollpic_flanker_records", JSON.stringify(flankerRecords));
    renderFlankerLeaderboard();

    const nextBtn = document.getElementById("flanker-next-btn");
    if (nextBtn) nextBtn.disabled = false;

    const retryBtn = document.getElementById("flanker-retry-btn");
    if (retryBtn) retryBtn.style.display = "block";
}

function restartFlankerGame() {
    const state = testState.flanker;
    const popup = document.getElementById("flanker-popup");
    const stimulus = document.getElementById("flanker-stimulus");
    const choices = document.getElementById("flanker-choices");
    const message = document.getElementById("flanker-message");
    const nextBtn = document.getElementById("flanker-next-btn");
    const retryBtn = document.getElementById("flanker-retry-btn");

    clearTimeout(state.answerTimer);
    clearInterval(state.countdownTimer);

    state.isGaming = false;
    state.level = 1;
    state.correct = 0;
    state.wrong = 0;
    state.currentAnswer = "";
    state.reactionTimes = [];
    state.totalQuestions = 0;
    state.accuracy = 0;
    state.averageSec = "0.00";

    if (stimulus) stimulus.innerHTML = "";
    if (choices) choices.innerHTML = "";
    if (message) message.innerText = "시작 버튼을 눌러주세요.";
    if (nextBtn) nextBtn.disabled = true;
    if (retryBtn) retryBtn.style.display = "none";

    updateFlankerDashboard();

    if (popup) popup.classList.add("active");
}

function renderFlankerLeaderboard() {
    const container = document.getElementById("flanker-leaderboard-list");
    if (!container) return;

    container.innerHTML = "";

    flankerRecords.slice(0, 8).forEach(item => {
        const row = document.createElement("div");
        row.className = `leaderboard-row ${item.isCurrentPlayer ? "highlight" : ""}`;

        row.innerHTML = `
            <span>${item.grade}</span>
            <span>${item.name}</span>
            <span>${item.time}</span>
            <span>${item.date}</span>
        `;

        container.appendChild(row);
    });
}

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
}
};

let schulteRecords = [];
let memoryRecords = [];
let reactionRecords = [];

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

    alert(`게임 종료! 총 ${state.successLevel}단계 성공하였습니다.`);
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

     const summary = document.getElementById("result-summary");
    if (summary) {
        summary.innerHTML = `
            <strong>${testState.child.name}</strong>의 오늘 기록입니다.<br>
            1. 집중 유지력: <strong>${schulteTime}초</strong><br>
            2. 작업 기억력: <strong>${memoryLevel}단계 달성</strong><br>
            3.반응 속도: <strong>${reactionAvg}ms / 정답률 ${reactionAccuracy}% / Lv.${reactionLevel} </strong>
        `;
    }

    showScreen("result-screen");
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
        ready.innerHTML = "준비하세요!<br> 곧 시작합니다.";
    }

    const nextBtn = document.getElementById("reaction-next-btn");
    if (nextBtn) nextBtn.disabled = true;

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

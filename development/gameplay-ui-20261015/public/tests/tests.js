// ==========================================================================
// 놀픽 통합 미션: 슐테 표 + 작업 기억력
// iframe / parent 호출 / 상대경로 이동 없이 한 파일 안에서 화면 전환
// ==========================================================================

const testState = {
    child: {
        name: "",
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
        successLevel: 0,
        attemptsAtLevel: 0,
        showTimer: null,
        nextLevelTimer: null
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

function getMissionAttemptCounts() {
    try { return JSON.parse(sessionStorage.getItem('nollpic_mission_attempt_counts') || '{}'); }
    catch (e) { return {}; }
}

function recordMissionAttempt(type) {
    if (!type) return 0;
    const counts = getMissionAttemptCounts();
    counts[type] = (Number(counts[type]) || 0) + 1;
    sessionStorage.setItem('nollpic_mission_attempt_counts', JSON.stringify(counts));
    return counts[type];
}

function getActiveChildProfileForResult() {
    try {
        return JSON.parse(localStorage.getItem('nollpic_child_profile')) || null;
    } catch (e) {
        return null;
    }
}

function getNollpicLoggedInUserForTests() {
    try {
        const user = JSON.parse(localStorage.getItem('nollpic_user') || 'null');
        return user && user.uid ? user : null;
    } catch (e) {
        return null;
    }
}

function shouldPersistNollpicTestRecords() {
    return true;
}

function clearGuestNollpicResultStorage() {
    // Guest records intentionally stay in this browser so non-members can see
    // their results until the device/site cache is cleared.
}

function saveCompletedNollpicResultToLocal(result) {
    if (!result || result.isComplete !== true) return;

    localStorage.setItem('nollpic_latest_result', JSON.stringify(result));
    sessionStorage.setItem('nollpic_guest_latest_result', JSON.stringify(result));

    let history = [];
    try {
        history = JSON.parse(localStorage.getItem('nollpic_result_history')) || [];
    } catch (e) {
        history = [];
    }

    history = history.filter(item => item && item.isComplete === true);

    const isDuplicate = history.some(item => {
        const sameChild = item.child?.id
            ? item.child.id === result.child.id
            : item.child?.name === result.child.name;
        const sameDate = item.date === result.date;
        const sameScore = item.overall === result.overall &&
            item.scores?.attention === result.scores.attention &&
            item.scores?.memory === result.scores.memory &&
            item.scores?.reaction === result.scores.reaction;
        return sameChild && sameDate && sameScore;
    });

    if (!isDuplicate) {
        history.unshift(result);
        localStorage.setItem('nollpic_result_history', JSON.stringify(history.slice(0, 30)));
    }
}

// ==========================================================================
// 놀픽 효과음 / 결과 팝업
// - 별도 mp3 파일 없이 브라우저 Web Audio로 짧은 효과음을 재생합니다.
// - 모바일에서는 사용자가 시작 버튼/화면을 한 번 누른 뒤 정상 재생됩니다.
// ==========================================================================
let nollpicAudioCtx = null;
let gameResultConfirmAction = null;
let gameResultRetryAction = null;
const NOLLPIC_SOUND_VOLUME_MULTIPLIER = 9.6;

function getNollpicAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!nollpicAudioCtx) {
        nollpicAudioCtx = new AudioContextClass();
    }

    if (nollpicAudioCtx.state === "suspended") {
        nollpicAudioCtx.resume().catch(() => {});
    }

    return nollpicAudioCtx;
}

function playTone(frequency, startOffset, duration, type = "sine", volume = 0.08) {
    const ctx = getNollpicAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + startOffset;
    const end = start + duration;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);

    let userVolume = 90;
    try { userVolume = JSON.parse(localStorage.getItem("nollpic_sound_settings") || "{}").effectsVolume ?? 90; } catch (_) {}
    const level = Math.max(0, Math.min(100, Number(userVolume))) / 100;
    if (level === 0) return;
    const adjustedVolume = Math.max(0.0001, Math.min(volume * NOLLPIC_SOUND_VOLUME_MULTIPLIER * level, 1));

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(adjustedVolume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
}

function playNollpicSound(type) {
    try { if (JSON.parse(localStorage.getItem("nollpic_sound_settings") || "{}").effects === false) return; } catch (_) {}
    getNollpicAudioContext();

    switch (type) {
        case "countdown-beep":
            playTone(880, 0, 0.16, "sine", 0.09);
            break;
        case "countdown-start":
            playTone(1046, 0, 0.55, "sine", 0.1);
            playTone(1318, 0.12, 0.42, "sine", 0.065);
            break;
        case "schulte-correct":
            playTone(880, 0, 0.07, "sine", 0.07);
            playTone(1320, 0.055, 0.08, "sine", 0.055);
            break;
        case "memory-correct":
            playTone(660, 0, 0.08, "triangle", 0.06);
            playTone(990, 0.085, 0.10, "triangle", 0.055);
            break;
        case "demo-click":
            playTone(700, 0, 0.045, "triangle", 0.045);
            playTone(420, 0.025, 0.035, "sine", 0.03);
            break;
        case "demo-stop-beep":
            playTone(880, 0, 0.22, "square", 0.035);
            break;
        case "demo-dingdong":
            playTone(1046, 0, 0.45, "sine", 0.055);
            playTone(784, 0.30, 0.85, "sine", 0.05);
            break;
        case "reaction-correct":
            playTone(150, 0, 0.035, "square", 0.06);
            playTone(520, 0.025, 0.08, "sine", 0.075);
            break;
        case "visual-correct":
            playTone(1046, 0, 0.07, "sine", 0.055);
            playTone(1568, 0.07, 0.08, "sine", 0.05);
            break;
        case "flanker-correct":
            playTone(740, 0, 0.055, "triangle", 0.055);
            break;
        case "wrong":
            playTone(260, 0, 0.10, "sine", 0.055);
            playTone(180, 0.075, 0.12, "sine", 0.045);
            break;
        case "finish":
            playTone(523, 0, 0.09, "triangle", 0.06);
            playTone(659, 0.09, 0.09, "triangle", 0.06);
            playTone(784, 0.18, 0.12, "triangle", 0.065);
            playTone(1046, 0.32, 0.16, "sine", 0.055);
            break;
        default:
            playTone(700, 0, 0.08, "sine", 0.05);
    }
}

function unlockNollpicSound() {
    getNollpicAudioContext();
}

document.addEventListener("pointerdown", unlockNollpicSound, { capture: true });
document.addEventListener("touchstart", unlockNollpicSound, { capture: true, passive: true });
document.addEventListener("click", unlockNollpicSound, { capture: true });
document.addEventListener("pointerdown", () => { hasUserInteractedForIntro = true; }, { once: true });
document.addEventListener("touchstart", () => { hasUserInteractedForIntro = true; }, { once: true });

const testIntroVoiceText = {
    schulte: "첫번째 끈기력 미션입니다! 화면에 무작위로 배치된 숫자를 1부터 순서대로 눌러주세요!",
    memory: "두번째 기억력 미션입니다! 반짝이는 카드의 위치를 3초 동안 잘 기억한 다음, 같은 카드를 찾아주세요!",
    reaction: "세번째 순발력 미션입니다! 초록색 동그라미는 빠르게 누르고, 빨간색 동그라미는 누르지 마세요!",
    visual: "네번째 관찰력 미션입니다! 목표 그림을 잘 보고, 시간 안에 같은 그림을 모두 찾아주세요!",
    flanker: "다섯번째 충동조절 미션입니다! 가운데 목표 그림을 잘 기억하고, 방해 그림에 속지 말고 골라주세요!"
};

const testIntroAudioSrc = {
    schulte: "audio/intro-schulte-child-v2-20261010.mp3",
    memory: "audio/intro-memory-child-v1.mp3",
    reaction: "audio/intro-reaction-child-v1.mp3",
    visual: "audio/intro-visual-child-v1.mp3",
    flanker: "audio/intro-flanker-child-v1.mp3"
};

const testIntroPopupIds = { schulte: 'schulte-countdown-overlay', memory: 'memory-popup', reaction: 'reaction-popup', visual: 'visual-search-popup', flanker: 'flanker-popup' };

let nollpicIntroVoice = null;
let nollpicIntroAudio = null;
let nollpicCompleteAudio = null;
let hasUserInteractedForIntro = false;
let nollpicIntroTimer = null;
let nollpicIntroPlayToken = 0;
let pendingTestIntroType = null;

function getNollpicKidVoice() {
    if (!window.speechSynthesis) return null;

    const voices = window.speechSynthesis.getVoices();
    return voices.find(voice => /ko/i.test(voice.lang) && /female|woman|girl|yuna|sora|kyung/i.test(voice.name))
        || voices.find(voice => /ko/i.test(voice.lang))
        || voices.find(voice => /female|woman|girl/i.test(voice.name))
        || voices[0]
        || null;
}

function stopTestIntroVoice() {
    pendingTestIntroType = null;
    nollpicIntroPlayToken += 1;

    if (nollpicIntroTimer) {
        clearTimeout(nollpicIntroTimer);
        nollpicIntroTimer = null;
    }

    if (nollpicIntroAudio) {
        nollpicIntroAudio.pause();
        nollpicIntroAudio.currentTime = 0;
        nollpicIntroAudio = null;
    }

    nollpicIntroVoice = null;
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
}

function stopTestCompleteVoice() {
    if (!nollpicCompleteAudio) return;
    nollpicCompleteAudio.pause();
    nollpicCompleteAudio.currentTime = 0;
    nollpicCompleteAudio = null;
}

function playTestCompleteVoice() {
    stopTestCompleteVoice();

    nollpicCompleteAudio = new Audio("audio/test-complete.mp3");
    nollpicCompleteAudio.volume = 1;
    nollpicCompleteAudio.play().catch(() => {});
}

function shouldAutoplayInitialIntro() {
    const params = new URLSearchParams(window.location.search);
    return params.get("intro") === "1";
}

function playTestIntroVoice(type) {
    stopTestIntroVoice();
    const playToken = ++nollpicIntroPlayToken;

    const audioSrc = testIntroAudioSrc[type];
    if (audioSrc) {
        const audio = new Audio(audioSrc);
        nollpicIntroAudio = audio;
        let settings = {};
        try { settings = JSON.parse(localStorage.getItem('nollpic_sound_settings') || '{}'); } catch (_) {}
        if (settings.effects === false) { nollpicIntroAudio = null; return; }
        const volume = Number(settings.effectsVolume ?? 90);
        audio.volume = Number.isFinite(volume) ? Math.max(0, Math.min(100, volume)) / 100 : .9;
        nollpicIntroAudio.play().catch((error) => {
            if (playToken !== nollpicIntroPlayToken || nollpicIntroAudio !== audio) return;
            // Preserve the uploaded voices. Retry blocked autoplay with a touch.
            pendingTestIntroType = error.name === 'NotAllowedError' ? type : null;
        });
        return;
    }

    playTestIntroFallbackVoice(type, playToken);
}

document.addEventListener('pointerdown', event => {
    const type = pendingTestIntroType;
    const popup = document.getElementById(testIntroPopupIds[type]);
    if (!type || !popup?.classList.contains('active') || popup.dataset.starting === 'true') return;
    if (event.target.closest?.('button')) return;
    hasUserInteractedForIntro = true;
    playTestIntroVoice(type);
}, { capture: true, passive: true });

function playTestIntroFallbackVoice(type, playToken = nollpicIntroPlayToken) {
    if (playToken !== nollpicIntroPlayToken) return;
    if (!window.speechSynthesis) return;

    const text = testIntroVoiceText[type];
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getNollpicKidVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || "ko-KR";
    utterance.pitch = 1.65;
    utterance.rate = 1.08;
    utterance.volume = 1;
    nollpicIntroVoice = utterance;

    window.speechSynthesis.speak(utterance);
}

function showTestIntroPopup(popupId, voiceType) {
    resetIntroCountdownControls(popupId);
    const popup = document.getElementById(popupId);
    if (popup) popup.classList.add("active");
    if (popup?.classList.contains("mission-intro")) {
        stopTestIntroVoice();
        popup.resetMissionIntro?.();
        // The popup entry owns narration; observers and initial timers only update UI.
        playTestIntroVoice(voiceType);
        return;
    }

    if (nollpicIntroTimer) clearTimeout(nollpicIntroTimer);
    const playToken = ++nollpicIntroPlayToken;
    nollpicIntroTimer = setTimeout(() => {
        nollpicIntroTimer = null;
        if (playToken !== nollpicIntroPlayToken) return;
        playTestIntroVoice(voiceType);
    }, 120);
}

const INTRO_COUNTDOWN_CONTROLS = {
    "memory-popup": ["memory-start-block", "memory-countdown-number"],
    "reaction-popup": ["reaction-start-block", "reaction-countdown-number"],
    "visual-search-popup": ["visual-start-block", "visual-countdown-number"],
    "flanker-popup": ["flanker-start-block", "flanker-start-countdown-number"]
};

function resetIntroCountdownControls(popupId) {
    const controls = INTRO_COUNTDOWN_CONTROLS[popupId];
    if (!controls) return;

    const [startBlockId, countDisplayId] = controls;
    const startBlock = document.getElementById(startBlockId);
    const countDisplay = document.getElementById(countDisplayId);

    if (startBlock) startBlock.style.display = "block";
    if (countDisplay) {
        countDisplay.style.display = "none";
        countDisplay.innerText = "3";
    }
}

function runStartButtonCountdown(startBlockId, countDisplayId, onComplete = null) {
    stopTestIntroVoice();

    const startBlock = document.getElementById(startBlockId);
    const countDisplay = document.getElementById(countDisplayId);

    if (startBlockId === "memory-start-block") {
        const popup = document.getElementById("memory-popup");
        if (popup) popup.dataset.starting = "true";
    }

    if (startBlock) startBlock.style.display = "none";

    if (!countDisplay) {
        if (typeof onComplete === "function") onComplete();
        return;
    }

    let count = 3;
    countDisplay.style.display = "block";
    countDisplay.innerText = count;
    playNollpicSound("countdown-beep");

    const interval = setInterval(() => {
        count--;

        if (count > 0) {
            countDisplay.innerText = count;
            playNollpicSound("countdown-beep");
            return;
        }

        clearInterval(interval);
        countDisplay.style.display = "none";
        countDisplay.innerText = "3";
        playNollpicSound("countdown-start");

        if (typeof onComplete === "function") onComplete();
    }, 1000);
}

function isPageReload() {
    const nav = performance.getEntriesByType?.("navigation")?.[0];
    return nav?.type === "reload";
}

function showGameResultPopup(title, message, emoji = "🎉", buttonText = "확인", onConfirm = null, options = {}) {
    const titleEl = document.getElementById("game-result-title");
    const textEl = document.getElementById("game-result-text");
    const emojiEl = document.getElementById("game-result-emoji");
    const buttonEl = document.getElementById("game-result-button");
    const retryButtonEl = document.getElementById("game-result-retry-button");
    const actionsEl = document.getElementById("game-result-actions");
    const liveBoardEl = document.getElementById("game-result-live-board");
    const popup = document.getElementById("game-result-popup");

    gameResultConfirmAction = typeof onConfirm === "function" ? onConfirm : null;
    const attemptCount = recordMissionAttempt(options.resultType);
    const canRetry = typeof options.onRetry === "function" && attemptCount < 2;
    gameResultRetryAction = canRetry ? options.onRetry : null;

    if (popup) popup.dataset.resultMode = options.resultType || 'overall';
    if (titleEl) titleEl.innerHTML = title.replace(/^[^\p{L}\p{N}<]+/u, '');
    if (textEl) {
        const mascots = {
            schulte: ['nollpic-turtle-bounce-v1.gif', '끈기력 거북이 친구'],
            memory: ['nollpic-elephant-gray-ear-flap-v1.gif', '기억력 코끼리 친구'],
            reaction: ['nollpic-rabbit-ear-fold-v1.gif', '순발력 토끼 친구'],
            visual: ['nollpic-salpi-tiger-full-v1.png', '관찰력 살피랑'],
            flanker: ['nollpic-kkuk-bear-full-v1.png', '충동조절 꾹곰이']
        };
        const mascot = mascots[options.resultType];
        const match = message.match(/((?:최고 )?기록:|반응 시간:|도달 레벨:|맞힌 문제:)\s*<strong>(.*?)<\/strong>/);
        if (match && mascot) {
            textEl.innerHTML = '<span class="result-record"><span class="result-record-label">기록:</span><strong>' + match[2] + '</strong><img class="result-record-mascot" src="../images/' + mascot[0] + '" alt="' + mascot[1] + '"></span>';
        } else if (!options.resultType) {
            const score = message.match(/종합 결과:\s*<strong>(.*?)<\/strong>/);
            textEl.innerHTML = '<span class="overall-complete-note">5가지 미션 결과가 저장되었습니다.</span><span class="result-record"><span class="result-record-label">종합 결과:</span><strong>' + (score?.[1] || '-') + '</strong></span><span class="overall-complete-note">결과 페이지에서 자세한 기록을 확인하세요.</span>';
        } else {
            textEl.innerHTML = message.replace('다음 미션으로 넘어갈 수 있어요.', '');
        }
    }
    document.querySelector('#game-result-popup .result-next-note-bottom')?.remove();
    if (liveBoardEl) {
        const guide = liveBoardEl.querySelector('.popup-result-guide');
        const card = liveBoardEl.querySelector('.popup-result-card');
        if (guide && card) liveBoardEl.append(card, guide);
    }
    if (emojiEl) emojiEl.innerHTML = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="m13 24 8 8 15-17" fill="none" stroke="#ff6b00" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    if (buttonEl) buttonEl.innerText = buttonText;
    if (retryButtonEl) {
        retryButtonEl.innerText = options.retryButtonText || "다시하기 (1회 남음)";
        retryButtonEl.style.display = gameResultRetryAction ? "" : "none";
    }
    if (actionsEl) actionsEl.classList.toggle("single-action", !gameResultRetryAction);
    if (liveBoardEl) {
        if (options.resultType) {
            liveBoardEl.hidden = false;
            renderPopupResultBoard(options.resultType);
        } else {
            liveBoardEl.hidden = true;
        }
    }

    if (options.completeVoice) {
        playTestCompleteVoice();
    } else if (!options.noSound) {
        playNollpicSound("finish");
    }

    if (popup) popup.classList.add("active");
    if (popup?.classList.contains("mission-intro")) {
        stopTestIntroVoice();
        popup.resetMissionIntro?.();
        return;
    }
}

function closeGameResultPopup() {
    stopTestIntroVoice();

    const popup = document.getElementById("game-result-popup");
    if (popup) popup.classList.remove("active");

    const action = gameResultConfirmAction;
    gameResultConfirmAction = null;
    gameResultRetryAction = null;

    if (typeof action === "function") action();
}

function retryFromGameResultPopup() {
    stopTestIntroVoice();

    const popup = document.getElementById("game-result-popup");
    if (popup) popup.classList.remove("active");

    const action = gameResultRetryAction;
    gameResultConfirmAction = null;
    gameResultRetryAction = null;

    if (typeof action === "function") {
        action();
    }
}

// ==========================================================================
// 초기 실행
// ==========================================================================
window.addEventListener("DOMContentLoaded", () => {
    parseUrlParameters();
    clearGuestNollpicResultStorage();
    loadRecords();
    renderSchulteLeaderboard();
    renderMemoryLeaderboard();
    setupSchulteLevel();
    renderReactionLeaderboard();
    renderVisualSearchLeaderboard();
    renderFlankerLeaderboard();

    restoreTestProgress();
    setTimeout(() => {
        const intro = document.getElementById('schulte-countdown-overlay');
        // Modern mission popups already narrated from showTestIntroPopup().
        if (intro?.classList.contains('mission-intro')) return;
        if (!shouldAutoplayInitialIntro() || isPageReload()) return;
        if (document.getElementById("schulte-countdown-overlay")?.classList.contains("active")) {
            playTestIntroVoice("schulte");
        }
    }, 350);
});

function parseUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const childIdParam = urlParams.get("childId");
    const gradeParam = urlParams.get("grade");
    const nameParam = urlParams.get("name");
    const activeProfile = getActiveChildProfileForResult();

    // URL에 childId가 있고 저장된 프로필의 id와 일치하는 경우에만 localStorage를 우선합니다.
    // childId가 없거나 다르면 URL 파라미터(실제 입력한 이름)를 사용합니다.
    if (activeProfile && childIdParam && activeProfile.id === childIdParam) {
        testState.child.id = activeProfile.id;
        testState.child.name = activeProfile.name || (nameParam ? decodeURIComponent(nameParam) : testState.child.name);
        testState.child.gradeValue = activeProfile.gradeValue || gradeParam || testState.child.gradeValue;
        testState.child.gradeText = activeProfile.gradeText || getGradeText(testState.child.gradeValue);
        testState.child.gender = activeProfile.gender || '';
        return;
    }

    // URL 파라미터 우선 적용 (새로 입력한 아이 정보)
    if (childIdParam) {
        testState.child.id = childIdParam;
    }

    if (nameParam) {
        testState.child.name = decodeURIComponent(nameParam);
    }

    if (gradeParam !== null && gradeParam !== "") {
        testState.child.gradeValue = gradeParam;
    }

    // gradeText 동기화
    if (testState.child.gradeValue) {
        testState.child.gradeText = getGradeText(testState.child.gradeValue);
    }
}

function getGradeText(gradeValue) {
    if (String(gradeValue) === "adult") return "어른";
    const gradeNum = parseInt(gradeValue, 10);

    if (gradeNum === 0) return "미취학";
    if (gradeNum >= 1 && gradeNum <= 6) return `초등 ${gradeNum}학년`;

    return "초등 2학년";
}

function setupSchulteLevel() {
    const isAdult = String(testState.child.gradeValue) === "adult";
    const gradeNum = parseInt(testState.child.gradeValue, 10);

    let size = 3;
    let levelText = "3×3";
    let gradeGroup = "저학년";
    let descText = "";

    if (isAdult) {
        size = 5;
        levelText = "5×5";
        gradeGroup = "고학년";
    } else if (gradeNum >= 0 && gradeNum <= 2) {
        size = 3;
        levelText = "3×3";
        gradeGroup = "저학년";
    } else if (gradeNum >= 3 && gradeNum <= 4) {
        size = 4;
        levelText = "4×4";
        gradeGroup = "중학년";
    } else if (gradeNum >= 5 && gradeNum <= 6) {
        size = 5;
        levelText = "5×5";
        gradeGroup = "고학년";
    }

    testState.child.gradeText = getGradeText(testState.child.gradeValue);
    testState.child.gradeGroup = gradeGroup;

    testState.schulte.gridSize = size;
    testState.schulte.maxNumber = size * size;

    descText = `${testState.child.gradeText} 기준 ${levelText} 끈기력 미션이에요.\n같은 학년대에 맞춰 결과가 분석됩니다.`;

    const levelEl = document.getElementById("schulte-level");
    const descEl = document.getElementById("schulte-description");

    if (levelEl) levelEl.innerText = levelText;
    if (descEl) descEl.innerText = descText;
}

function removeSeedRecords(records) {
    const seedNames = new Set(["김민재", "이서연", "박준우", "최예은"]);
    const seedDates = new Set(["2026.05.25", "2026.05.27", "2026.05.28"]);

    return records.filter(record => {
        const isSeedName = seedNames.has(record?.name);
        const isSeedDate = seedDates.has(record?.date);
        return !(isSeedName && isSeedDate);
    });
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

    if (!Array.isArray(schulteRecords)) {
        schulteRecords = [];
    }

    schulteRecords = removeSeedRecords(schulteRecords);
    if (shouldPersistNollpicTestRecords()) {
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
function getGradeGroupForScore() {
    if (String(testState.child.gradeValue) === "adult") return "high";
    const gradeNum = parseInt(testState.child.gradeValue, 10);

    if (gradeNum >= 0 && gradeNum <= 2) return "low";
    if (gradeNum >= 3 && gradeNum <= 4) return "mid";
    if (gradeNum >= 5 && gradeNum <= 6) return "high";

    return "low";
}

function getLevelScoreByGrade(level, gradeGroup, gameType) {
    const safeLevel = Math.max(0, Number(level) || 0);

    // ---------------------------------------------------------------
    // 게임별 · 학년군별 레벨 → 점수 변환 테이블
    // low : 미취학(0) ~ 초2(2)   mid : 초3~4   high : 초5~6
    //
    // 설계 원칙:
    //  - 같은 레벨을 달성했을 때 어린 학년군이 더 높은 점수를 받음
    //  - 각 학년군의 "보통" 기대치: low=12레벨, mid=16레벨, high=20레벨
    // ---------------------------------------------------------------

    const tables = {

        // 반응속도 (24레벨까지)
        reaction: {
            low:  [0,6,12,18,24,30,35,40,45,50,55,59,63,66,70,73,76,79,82,85,88,91,93,96,98],
            mid:  [0,4,8,12,16,20,25,30,35,40,45,49,54,58,62,66,69,73,76,80,83,87,90,93,96],
            high: [0,3,6,9,12,15,20,24,29,33,38,42,47,51,55,59,63,66,70,74,78,82,86,90,94]
        },

        // 작업 기억력 (12레벨까지)
        memory: {
            low:  [0,20,40,50,60,68,75,81,86,90,94,97,100],
            mid:  [0,15,30,40,50,58,66,72,78,84,90,95,100],
            high: [0,11,22,32,42,50,58,65,72,79,86,93,100]
        },

        // 시각 탐색 (15레벨까지)
        visual: {
            low:  [0,8,16,25,33,41,49,56,63,69,75,81,86,91,96,100],
            mid:  [0,7,14,22,30,38,46,53,60,66,72,78,84,90,95,100],
            high: [0,6,12,19,26,34,42,49,56,63,70,76,82,88,94,100]
        },

        // 충동 억제 (12레벨까지)
        flanker: {
            low:  [0,19,38,48,58,66,74,80,86,90,94,97,100],
            mid:  [0,14,28,38,48,56,64,71,78,84,90,95,100],
            high: [0,10,20,30,40,48,56,63,70,78,86,93,100]
        }
    };

    // gameType 없이 구 방식 호출 시 구버전 테이블 fallback
    const legacyTable = {
        low:  [0,35,55,70,82,90,96,100],
        mid:  [0,25,45,62,76,86,94,100],
        high: [0,18,35,52,68,80,90,100]
    };

    const gameTable = tables[gameType] || legacyTable;
    const scores = gameTable[gradeGroup] || gameTable.low;
    const index = Math.min(safeLevel, scores.length - 1);

    return scores[index];
}

function getAccuracyPenalty(accuracy) {
    const safeAccuracy = Number(accuracy) || 0;

    if (safeAccuracy < 40) return 0;
    if (safeAccuracy < 60) return 0.45;
    if (safeAccuracy < 75) return 0.7;
    if (safeAccuracy < 90) return 0.9;

    return 1;
}

function getVisualSpeedScore(levelTimes = []) {
    if (!Array.isArray(levelTimes) || levelTimes.length === 0) return 0;

    const ratios = levelTimes.map((spent, index) => {
        const limit = visualSearchLevels[index]?.timeLimit || 1;
        return Number(spent) / limit;
    }).filter(ratio => Number.isFinite(ratio) && ratio > 0);

    if (!ratios.length) return 0;

    const avgRatio = ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length;

    if (avgRatio <= 0.35) return 100;
    if (avgRatio <= 0.50) return 90;
    if (avgRatio <= 0.65) return 78;
    if (avgRatio <= 0.80) return 65;
    if (avgRatio <= 0.95) return 50;
    return 35;
}

function calculateNollpicScores() {
    const gradeGroup = getGradeGroupForScore();

    const schulteSec = parseFloat(testState.schulte.elapsedTime) || 0;
    const memoryLevel = testState.memory.successLevel || 0;

    const reactionAvg = testState.reaction.averageMs || 0;
    const reactionAccuracy = testState.reaction.accuracy || 0;
    const reactionCorrect = testState.reaction.correctClicks || 0;
    const reactionWrong = testState.reaction.wrongClicks || 0;
    const reactionMissed = testState.reaction.missedClicks || 0;

    const visualAccuracy = testState.visualSearch.accuracy || 0;
    const visualLevel = testState.visualSearch.highestLevel || 0;
    const visualWrong = testState.visualSearch.wrong || 0;
    const visualSpeedScore = getVisualSpeedScore(testState.visualSearch.levelTimes);

    const flankerAccuracy = testState.flanker.accuracy || 0;
    const flankerLevel = Math.max(0, (testState.flanker.level || 1) - 1);
    const flankerWrong = testState.flanker.wrong || 0;

    // ── 점수 원칙 ──
    // · 끝까지 참여하면 최소 MIN_SCORE (0점 없음)
    // · 0~1 사이 "수행 비율"을 MIN_SCORE~100으로 바꿈
    // · 아래 학년별 기준(좋음/아쉬움)은 임시값 → 관리자 페이지에 쌓인 학년별 기록으로 나중에 맞출 것
    const MIN_SCORE = 20;
    const toScore = (ratio) => clampScore(MIN_SCORE + (100 - MIN_SCORE) * Math.max(0, Math.min(1, ratio)));
    const between = (value, good, poor) => Math.max(0, Math.min(1, (poor - value) / (poor - good)));   // good이면 1, poor면 0

    // 1. 끈기력: 슐테표 시간 (학년별 판 크기에 맞춘 기준 시간)
    const SCHULTE_NORM = { low: [6, 22], mid: [14, 45], high: [22, 65] };   // [좋음 초, 아쉬움 초]
    const [sGood, sPoor] = SCHULTE_NORM[gradeGroup] || SCHULTE_NORM.low;
    const attention = schulteSec > 0 ? toScore(between(schulteSec, sGood, sPoor)) : MIN_SCORE;

    // 2. 기억력: 학년별 단계 기준 (2026-10-10부터 재도전 없음 — 틀리면 그 단계에서 끝)
    const memory = Math.max(MIN_SCORE, clampScore(getLevelScoreByGrade(memoryLevel, gradeGroup, 'memory')));

    // 3. 순발력 (2026-10-10): 도달 단계 50% + 반응 시간 중간값 30% + 정답률 20%
    //    하트 3개 방식이라 단계가 곧 "빨라져도 버틴 정도". 정답률 = (초록 누름 + 빨강 참음) / 지나간 원
    const REACTION_NORM = { low: [550, 1150], mid: [480, 1000], high: [420, 900] };   // [좋음 ms, 아쉬움 ms]
    const REACTION_LEVEL_GOAL = { low: 15, mid: 20, high: 25 };   // 이 단계까지 가면 단계 점수 만점 (임시)
    const [rGood, rPoor] = REACTION_NORM[gradeGroup] || REACTION_NORM.low;
    const rs = testState.reaction;
    const median = rs.medianMs || getMedian(rs.responseTimes || []);
    const reactionLevelRatio = Math.min(1, (Number(rs.level) || 0) / (REACTION_LEVEL_GOAL[gradeGroup] || 20));
    const reaction = median
        ? toScore(0.50 * reactionLevelRatio + 0.30 * between(median, rGood, rPoor) + 0.20 * (reactionAccuracy / 100))
        : MIN_SCORE;

    // 5. 충동조절 (2026-10-11 예전 방식 복원): 정확도 55% + 도달 단계 45% (학년별 단계표 flanker), 오답 1번당 -3
    //    한 번 틀리면 끝나는 방식이라 "몇 단계까지 갔나"가 핵심. 끝까지 참여하면 최소 20점
    let inhibition = MIN_SCORE;
    if (flankerLevel > 0 && flankerAccuracy >= 40) {
        const levelScore = getLevelScoreByGrade(flankerLevel, gradeGroup, 'flanker');
        inhibition = Math.max(MIN_SCORE, clampScore(
            ((flankerAccuracy * 0.55) + (levelScore * 0.45)) * getAccuracyPenalty(flankerAccuracy) - (flankerWrong * 3)
        ));
    }

    // 4. 관찰력
    // 2026-10-10 수정: 예전 공식은 오답을 두 번 깎음(정확도에 이미 들어간 오답 × 4점을 또 뺌)
    //   → 초4가 Lv.17(20단계 중)까지 가고 오답 12번이면 38점이 나왔음
    // 지금: 도달 단계 65% + 정확도 20% + 속도 15%. 단계가 올라갈수록 제한 시간이 짧아져서 단계 자체에 속도가 들어 있음
    const VISUAL_LEVEL_GOAL = { low: 12, mid: 16, high: 18 };   // 이 단계까지 가면 단계 점수 만점 (학년별 "잘함" 기준, 임시)
    let visual = MIN_SCORE;
    if (visualLevel > 0) {
        const visualLevelRatio = Math.min(1, visualLevel / (VISUAL_LEVEL_GOAL[gradeGroup] || 16));
        const visualAccuracyRatio = between(visualAccuracy, 97, 60);   // 97% 이상 만점, 60% 이하 0
        visual = toScore(0.65 * visualLevelRatio + 0.20 * visualAccuracyRatio + 0.15 * (visualSpeedScore / 100));
    }

    const overall = clampScore(
        (attention + memory + reaction + inhibition + visual) / 5
    );

    return { attention, memory, reaction, visual, inhibition, overall };
}

function getScoreLevel(score) {
    if (score >= 80) return 'strong';
    if (score >= 60) return 'normal';
    return 'need';
}

function getScoreLevelLabel(score) {
    const level = getScoreLevel(score);
    if (level === 'strong') return '✨ 강점 영역';
    if (level === 'normal') return '👍 보통 영역';
    return '연습 필요';
}

function getAbilityFeedback(key, score) {
    const level = getScoreLevel(score);

    const feedbackMap = {
        attention: {
            strong: '끈기력은 좋은 편입니다. 목표를 보고 순서대로 찾아가는 힘이 안정적으로 나타났어요.',
            normal: '끈기력은 보통 수준입니다. 컨디션이나 주변 환경에 따라 집중 시간이 달라질 수 있어요.',
            need: '끈기력 연습이 필요합니다. 과제를 끝까지 살피기보다 중간에 놓치거나 서두르는 모습이 나타날 수 있어요.'
        },
        memory: {
            strong: '기억력은 좋은 편입니다. 방금 본 정보를 머릿속에 잠시 저장하고 활용하는 힘이 안정적으로 나타났어요.',
            normal: '기억력은 보통 수준입니다. 규칙이나 위치를 기억하는 놀이를 반복하면 더 안정적으로 좋아질 수 있어요.',
            need: '기억력 연습이 필요합니다. 설명을 듣고 바로 잊거나, 순서와 위치를 헷갈리는 모습이 나타날 수 있어요.'
        },
        reaction: {
            strong: '순발력은 좋은 편입니다. 자극을 보고 빠르게 반응하는 힘이 안정적으로 나타났어요.',
            normal: '순발력은 보통 수준입니다. 빠르게 누르는 것보다 정확하게 반응하는 연습을 함께 하면 좋아요.',
            need: '순발력 연습이 필요합니다. 화면의 변화를 알아차리고 행동으로 옮기는 시간이 다소 걸릴 수 있어요.'
        },
        inhibition: {
            strong: '충동조절은 좋은 편입니다. 하고 싶은 반응을 잠시 멈추고 규칙에 맞게 선택하는 힘이 안정적으로 나타났어요.',
            normal: '충동조절은 보통 수준입니다. 빨리 하려는 마음이 커질 때 실수가 늘 수 있어요.',
            need: '충동조절 연습이 필요합니다. 문제를 끝까지 보기 전에 서두르거나, 멈춰야 할 때 반응하는 모습이 나타날 수 있어요.'
        },
        visual: {
            strong: '관찰력은 좋은 편입니다. 여러 정보 속에서 필요한 목표를 빠르게 찾는 힘이 안정적으로 나타났어요.',
            normal: '관찰력은 보통 수준입니다. 복잡한 화면에서 목표를 찾는 놀이를 반복하면 더 좋아질 수 있어요.',
            need: '관찰력 연습이 필요합니다. 여러 자극 속에서 필요한 정보를 찾을 때 놓치거나 시간이 걸릴 수 있어요.'
        }
    };

    return feedbackMap[key]?.[level] || '오늘 미션 결과가 저장되었어요.';
}

function makeNollpicAnalysis(scores) {
    const labels = [
        { key: 'attention', name: '끈기력', emoji: '🎯' },
        { key: 'memory', name: '기억력', emoji: '🧩' },
        { key: 'reaction', name: '순발력', emoji: '⚡' },
        { key: 'visual', name: '관찰력', emoji: '🔍' },
        { key: 'inhibition', name: '충동조절', emoji: '✋' }
    ];
    const scoreOf = (item) => Number(scores[item.key]) || 0;
    const best = labels.reduce((b, a) => scoreOf(a) > scoreOf(b) ? a : b, labels[0]);
    const need = labels.reduce((w, a) => scoreOf(a) < scoreOf(w) ? a : w, labels[0]);
    const josa = (word, pair) => { const c = word.charCodeAt(word.length - 1) - 0xAC00; const [x, y] = pair.split('/'); return word + (c >= 0 && c <= 11171 && c % 28 ? x : y); };

    const summary = `오늘 결과에서는 <strong>${josa(best.name, '이/가')}</strong> 가장 안정적으로 나타났고, <strong>${josa(need.name, '은/는')}</strong> 다음 놀이에서 조금 더 연습해보면 좋아요.`;

    const detail = labels.map(item => `
        <div class="analysis-row">
            <strong>${item.emoji} ${item.name} ${scores[item.key]}점 · ${getScoreLevelLabel(scores[item.key])}</strong><br>
            <span>${getAbilityFeedback(item.key, scores[item.key])}</span>
        </div>
    `).join('');

    const guide = `<div class="analysis-guide"><strong>추천 방향</strong><br>점수가 낮게 나온 영역은 하루 5~10분씩 짧게 반복해보세요.</div>`;

    return `${summary}<br><br>${detail}${guide}`;
}

function saveNollpicResult(scores) {
    const completedAtMs = Date.now();
    const result = {
        resultId: `result_${completedAtMs}_${Math.random().toString(36).slice(2, 8)}`,
        child: {
            id: getActiveChildProfileForResult()?.id || testState.child.id || '',
            name: getActiveChildProfileForResult()?.name || testState.child.name,
            gradeText: getActiveChildProfileForResult()?.gradeText || testState.child.gradeText,
            gradeValue: getActiveChildProfileForResult()?.gradeValue || testState.child.gradeValue,
            gender: getActiveChildProfileForResult()?.gender || testState.child.gender || ''
        },
        date: getTodayString(),
        completedAtMs,
        overall: scores.overall,
        finishedTests: 5,
        isComplete: true,
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
            reactionLevel: testState.reaction.level || 0,
            reactionAccuracy: testState.reaction.accuracy || 0,
            visualLevel: testState.visualSearch.highestLevel || 0,
            visualWrong: testState.visualSearch.wrong || 0,
            visualAccuracy: testState.visualSearch.accuracy || 0,
            visualAverageSec: testState.visualSearch.levelTimes?.length
                ? (testState.visualSearch.levelTimes.reduce((sum, item) => sum + item, 0) / testState.visualSearch.levelTimes.length).toFixed(2)
                : '0.00',
            visualSpeedScore: getVisualSpeedScore(testState.visualSearch.levelTimes),
            flankerLevel: testState.flanker.level || 0,
            flankerWrong: testState.flanker.wrong || 0,
            flankerAccuracy: testState.flanker.accuracy || 0,
            flankerAverageSec: testState.flanker.averageSec || '0.00'
        },
        analysis: makeNollpicAnalysis(scores)
    };

    if (!shouldPersistNollpicTestRecords()) {
        saveCompletedNollpicResultToLocal(result);
        return result;
    }

    saveCompletedNollpicResultToLocal(result);

    let history = [];
    try {
        history = JSON.parse(localStorage.getItem('nollpic_result_history')) || [];
    } catch (e) {
        history = [];
    }

    // 완료된 결과(isComplete:true)만 히스토리에 누적합니다.
    history = history.filter(item => item.isComplete === true);

    // 중복 저장 방지: 같은 날짜 + 같은 아이 + 동일 점수는 저장하지 않습니다.
    const isDuplicate = history.some(item => {
        const sameChild = item.child?.id
            ? item.child.id === result.child.id
            : item.child?.name === result.child.name;
        const sameDate = item.date === result.date;
        const sameScore = item.overall === result.overall &&
            item.scores?.attention === result.scores.attention &&
            item.scores?.memory === result.scores.memory &&
            item.scores?.reaction === result.scores.reaction;
        return sameChild && sameDate && sameScore;
    });

    if (!isDuplicate) {
        history.unshift(result);
        localStorage.setItem('nollpic_result_history', JSON.stringify(history.slice(0, 30)));
    } else {
        console.log('중복 미션 결과 — 히스토리 저장 건너뜀');
    }

    return result;
}

function scrollTestViewportTop(target = null) {
    window.scrollTo({ top: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const testBody = document.querySelector(".test-body");
    if (testBody) testBody.scrollTop = 0;
    const activeScreen = document.querySelector(".test-screen.active");
    if (activeScreen) activeScreen.scrollTop = 0;
    if (target) target.scrollTop = 0;
}

function scrollCurrentTestToTop() {
    const activeScreen = document.querySelector(".test-screen.active");
    scrollTestViewportTop(activeScreen);
}

function bindFastPress(el, handler) {
    if (!el || typeof handler !== "function") return;

    let handledByPointer = false;
    el.addEventListener("pointerdown", event => {
        handledByPointer = true;
        handler(event);
    });
    el.addEventListener("click", event => {
        if (handledByPointer) {
            handledByPointer = false;
            return;
        }
        handler(event);
    });
}

function showScreen(screenId) {
    const screens = document.querySelectorAll(".test-screen");
    screens.forEach(screen => screen.classList.remove("active"));

    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add("active");
        scrollTestViewportTop(target);
    }
}

// ==========================================================================
// 01. 슐테 표
// ==========================================================================
function resetSchulteIntroPopup() {
    const startBlock = document.getElementById("popup-start-block");
    const countDisplay = document.getElementById("popup-countdown-number");
    const nextEl = document.getElementById("schulte-next");
    const timerEl = document.getElementById("schulte-timer");
    const nextBtn = document.getElementById("schulte-next-btn");
    const retryBtn = document.getElementById("schulte-retry-btn");

    clearInterval(testState.schulte.timerInterval);
    testState.schulte.currentNext = 1;
    testState.schulte.elapsedTime = "0.00";
    testState.schulte.isGaming = false;

    if (startBlock) startBlock.style.display = "block";
    if (countDisplay) {
        countDisplay.style.display = "none";
        countDisplay.innerText = "3";
    }
    if (nextEl) nextEl.innerText = "1";
    if (timerEl) timerEl.innerText = "0.00초";
    if (nextBtn) nextBtn.disabled = true;
    if (retryBtn) retryBtn.style.display = "none";
}

function runSchulteCountdown() {
    stopTestIntroVoice();
    const introOverlay = document.getElementById("schulte-countdown-overlay");
    if (introOverlay?.classList.contains("board-countdown")) return;
    initSchulteBoard({ paused: true });
    if (!introOverlay?.classList.contains("mission-intro")) introOverlay?.classList.add("board-countdown");

    const startBlock = document.getElementById("popup-start-block");
    const countDisplay = document.getElementById("popup-countdown-number");

    if (startBlock) startBlock.style.display = "none";

    if (!countDisplay) return;

    countDisplay.style.display = "block";

    const deadline = performance.now() + 3000;
    let shownCount = 3;
    countDisplay.innerText = shownCount;
    playNollpicSound("countdown-beep");
    let countdownTimer;
    function updateCountdown() {
        const remaining = deadline - performance.now();
        if (remaining <= 0) {
            clearTimeout(countdownTimer);
            introOverlay?.classList.remove("active", "board-countdown");
            startSchulteClock();
            playNollpicSound("countdown-start");
            return;
        }
        const count = Math.ceil(remaining / 1000);
        if (count !== shownCount) {
            shownCount = count;
            countDisplay.innerText = count;
            playNollpicSound("countdown-beep");
        }
        countdownTimer = setTimeout(updateCountdown, Math.min(100, remaining));
    }
    countdownTimer = setTimeout(updateCountdown, 100);
}

function shuffle(array) {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

function initSchulteBoard({ paused = false } = {}) {
    const board = document.getElementById("schulte-board");
    if (!board) return;

    const state = testState.schulte;

    board.innerHTML = "";
    board.style.gridTemplateColumns = `repeat(${state.gridSize}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${state.gridSize}, 1fr)`;

    const numbers = shuffle(Array.from({ length: state.maxNumber }, (_, i) => i + 1));

    const tintedCells = new Set(shuffle(Array.from({ length: state.maxNumber }, (_, i) => i)).slice(0, Math.floor(state.maxNumber / 2)));
    numbers.forEach((num, index) => {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "schulte-cell";
        cell.disabled = paused;

        if (tintedCells.has(index)) {
            cell.classList.add("bg-tint");
        }

        cell.innerText = num;

        let handledByPointer = false;
        const handleCellPress = (event) => {
            if (event) event.preventDefault();
            if (!state.isGaming) return;

            if (num === state.currentNext) {
                playNollpicSound("schulte-correct");
                cell.classList.add("completed");
                state.currentNext++;

                if (state.currentNext > state.maxNumber) {
                    endSchulteGame();
                } else {
                    const nextEl = document.getElementById("schulte-next");
                    if (nextEl) nextEl.innerText = state.currentNext;
                }
            } else {
                playNollpicSound("wrong");
                cell.style.border = "2px solid #EF4444";
                setTimeout(() => {
                    cell.style.border = "";
                }, 250);
            }
        };

        cell.addEventListener("pointerdown", event => {
            handledByPointer = true;
            handleCellPress(event);
        });
        cell.addEventListener("click", event => {
            if (handledByPointer) {
                handledByPointer = false;
                return;
            }
            handleCellPress(event);
        });

        board.appendChild(cell);
    });

    state.currentNext = 1;
    state.startTime = performance.now();
    state.elapsedTime = "0.00";
    state.isGaming = false;

    const nextEl = document.getElementById("schulte-next");
    const timerEl = document.getElementById("schulte-timer");
    const nextBtn = document.getElementById("schulte-next-btn");

    if (nextEl) nextEl.innerText = "1";
    if (timerEl) timerEl.innerText = "0.00초";
    if (nextBtn) nextBtn.disabled = true;

    const retryBtn = document.getElementById("schulte-retry-btn");
    if (retryBtn) retryBtn.style.display = "none";

    clearInterval(state.timerInterval);
    if (!paused) startSchulteClock();
}

function startSchulteClock() {
    const state = testState.schulte;
    state.startTime = performance.now();
    state.isGaming = true;
    document.querySelectorAll('#schulte-board .schulte-cell').forEach(cell => { cell.disabled = false; });
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
    if (retryBtn) retryBtn.style.display = "none";

    schulteRecords.forEach(item => item.isCurrentPlayer = false);

    schulteRecords.unshift({
        grade: testState.child.gradeText,
        name: testState.child.name,
        time: `${state.elapsedTime}초`,
        date: getTodayString(),
        createdAtMs: Date.now(),
        isCurrentPlayer: true
    });

    if (shouldPersistNollpicTestRecords()) {
        localStorage.setItem("nollpic_schulte_records", JSON.stringify(schulteRecords));
        publishTestResult("schulte", schulteRecords[0]);
    }
    renderSchulteLeaderboard();

    showGameResultPopup(
        "🎯 끈기력 미션 완료!",
        `기록: <strong>${state.elapsedTime}초</strong><br>다음 미션으로 넘어갈 수 있어요.`,
        "⚡",
        "다음 미션 도전",
        goToMemoryTest,
        { resultType: "schulte", onRetry: restartSchulteGame }
    );
}

function restartSchulteGame() {
    const overlay = document.getElementById("schulte-countdown-overlay");

    scrollCurrentTestToTop();
    resetSchulteIntroPopup();
    showTestIntroPopup("schulte-countdown-overlay", "schulte");
}

function getCurrentGradeRankingList(records) {
    const currentGrade = testState.child.gradeText;

    return records.filter(item => item.grade === currentGrade);
}

function renderSchulteLeaderboard() {
    const container = document.getElementById("schulte-leaderboard-list");
    if (!container) return;

    container.innerHTML = "";

    const gradeRecords = getCurrentGradeRankingList(schulteRecords);

    gradeRecords.slice(0, 10).forEach((item, index) => {
        const row = document.createElement("div");
        row.className = `leaderboard-row ${item.isCurrentPlayer ? "highlight" : ""}`;

        row.innerHTML = `
            <span>${index + 1}위</span>
            <span>${item.name}</span>
            <span>${item.time}</span>
            <span>${item.date}</span>
        `;

        container.appendChild(row);
    });
}

// ==========================================================================
// 02. 작업 기억력
// ==========================================================================
function isHighGradeMemoryPlayer() {
    if (String(testState.child.gradeValue) === "adult") return true;
    const gradeNum = parseInt(testState.child.gradeValue, 10);
    return gradeNum >= 5 && gradeNum <= 6;
}

function getMemoryLevelConfig(level) {
    const configs = [
        // 카드 수는 빈칸 없이 꽉 찬 격자(3×3, 4×3, 4×4, 5×4, 5×5)가 되게 맞춤
        { show: 3, total: 9, time: 3 },
        { show: 4, total: 9, time: 3 },
        { show: 4, total: 12, time: 3 },
        { show: 5, total: 12, time: 3 },
        { show: 6, total: 12, time: 3 },
        { show: 7, total: 16, time: 3 },
        { show: 8, total: 16, time: 3 },
        { show: 9, total: 16, time: 3 },
        { show: 10, total: 16, time: 3 },
        { show: 12, total: 20, time: 3 }
    ];

    if (isHighGradeMemoryPlayer() && level >= 15) {
        return { show: 12, total: 25, time: 3 };
    }

    return configs[level - 1] || { show: 12, total: 20, time: 3 };
}

function runMemoryCountdown() {
    runStartButtonCountdown("memory-start-block", "memory-countdown-number", startMemoryGame);
}

function startMemoryGame() {
    stopTestIntroVoice();

    const popup = document.getElementById("memory-popup");
    if (popup) popup.classList.remove("active");

    const retryBtn = document.getElementById("memory-retry-btn");
    const nextBtn = document.getElementById("memory-next-btn");
    if (retryBtn) retryBtn.style.display = "none";
    if (nextBtn) nextBtn.disabled = true;

    const state = testState.memory;
    clearTimeout(state.showTimer);
    clearTimeout(state.nextLevelTimer);

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

    state.showTimer = setTimeout(startMemoryGuessing, 3000);
}

function renderMemoryCards(show) {
    const board = document.getElementById("memory-board");
    if (!board) return;

    const state = testState.memory;
    board.innerHTML = "";

    // 1페이지 유지를 위해 총 카드 수(totalCount)에 맞춰 동적으로 열(Column) 계산
    let memoryColumns = 3;
    if (state.totalCount > 16) {
        memoryColumns = 5;
    } else if (state.totalCount > 9) {
        memoryColumns = 4;
    }
    
    // JS에서는 오직 열 개수만 지정 (크기는 CSS가 완전히 통제)
    board.style.gridTemplateColumns = `repeat(${memoryColumns}, 1fr)`;

    for (let i = 0; i < state.totalCount; i++) {
        // button 대신 원래 스타일인 div로 생성하여 원치 않는 테두리 제거
        const card = document.createElement("div");
        card.className = "memory-card";
        const isAnswer = state.answerIndices.includes(i);

        if (show && isAnswer) {
            card.classList.add("reveal");
        }

        bindFastPress(card, () => handleMemoryCardClick(card, isAnswer));
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
        playNollpicSound("memory-correct");
        card.classList.add("reveal");
        state.correctCount++;

        if (state.correctCount === state.showCount) {
            state.level++;
            state.attemptsAtLevel = 0;

            const desc = document.getElementById("memory-desc");
            if (desc) desc.innerText = `성공! ${state.level}단계로 넘어갑니다.`;

            clearTimeout(state.nextLevelTimer);
            state.nextLevelTimer = setTimeout(startMemoryGame, 1000);
        }
    } else {
        playNollpicSound("wrong");
        card.classList.add("wrong");
        // 같은 단계 재도전 없음 (2026-10-10): 틀리면 바로 끝
        state.gameState = "finished";
        state.answerIndices.forEach((answerIndex) => {
            const answerCard = document.getElementById("memory-board")?.children[answerIndex];
            if (answerCard && !answerCard.classList.contains("reveal")) answerCard.classList.add("reveal", "missed");
        });
        const desc = document.getElementById("memory-desc");
        if (desc) desc.innerText = `${state.level}단계에서 멈췄어요`;
        clearTimeout(state.nextLevelTimer);
        state.nextLevelTimer = setTimeout(endMemoryGame, 900);
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
        time: `${state.successLevel}단계`,
        date: getTodayString(),
        createdAtMs: Date.now(),
        isCurrentPlayer: true
    });

    if (shouldPersistNollpicTestRecords()) {
        localStorage.setItem("nollpic_memory_records", JSON.stringify(memoryRecords));
        publishTestResult("memory", memoryRecords[0]);
    }

    renderMemoryLeaderboard();

    const nextBtn = document.getElementById("memory-next-btn");
    if (nextBtn) nextBtn.disabled = false;

    const retryBtn = document.getElementById("memory-retry-btn");
    if (retryBtn) retryBtn.style.display = "none";

    showGameResultPopup(
        "🧠 기억력 미션 완료!",
        `<strong>${testState.child.name}</strong>의 기억력 기록이 저장되었어요.<br><br>최고 기록: <strong>${state.successLevel}단계</strong><br>다음 미션으로 넘어갈 수 있어요.`,
        "🧩",
        "다음 미션 도전",
        goToReactionTest,
        { resultType: "memory", onRetry: restartMemoryGame }
    );
}

function resetMemoryIntroPopup(options = {}) {
    const state = testState.memory;
    const popup = document.getElementById("memory-popup");
    const nextBtn = document.getElementById("memory-next-btn");
    const retryBtn = document.getElementById("memory-retry-btn");
    const desc = document.getElementById("memory-desc");
    const board = document.getElementById("memory-board");
    const bar = document.getElementById("memory-progress-bar");

    clearTimeout(state.showTimer);
    clearTimeout(state.nextLevelTimer);

    state.level = 1;
    state.gameState = "memorize";
    state.correctCount = 0;
    state.answerIndices = [];
    state.showCount = 3;
    state.totalCount = 8;
    state.successLevel = 0;
    state.attemptsAtLevel = 0;
    state.showTimer = null;
    state.nextLevelTimer = null;

    if (nextBtn) nextBtn.disabled = true;
    if (retryBtn) retryBtn.style.display = options.showRetry ? "block" : "none";
    if (desc) desc.innerText = "카드 위치를 기억하세요";
    if (board) board.innerHTML = "";
    if (bar) {
        bar.classList.remove("running-animation");
        bar.style.width = "100%";
    }
    if (popup) popup.classList.add("active");
    if (popup?.classList.contains("mission-intro")) {
        stopTestIntroVoice();
        popup.resetMissionIntro?.();
        return;
    }
}

function restartMemoryGame() {
    scrollCurrentTestToTop();
    resetMemoryIntroPopup({ showRetry: false });
    showTestIntroPopup("memory-popup", "memory");
}

function renderMemoryLeaderboard() {
    const container = document.getElementById("memory-leaderboard-list");
    if (!container) return;

    container.innerHTML = "";

    const gradeRecords = getCurrentGradeRankingList(memoryRecords);

    gradeRecords.slice(0, 10).forEach((item, index) => {
        const row = document.createElement("div");
        row.className = `leaderboard-row ${item.isCurrentPlayer ? "highlight" : ""}`;

        row.innerHTML = `
            <span>${index + 1}위</span>
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
    // 중복 클릭 방지
    const finishBtn = document.getElementById('flanker-next-btn');
    if (finishBtn) finishBtn.disabled = true;

    clearProgress();
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

    const result = saveNollpicResult(scores);
    window.dispatchEvent(new CustomEvent("nollpic-result-saved", { detail: result }));

    const summary = document.getElementById("result-summary");
    if (summary) {
        summary.innerHTML = `
            <strong>${testState.child.name}</strong>의 오늘 기록입니다.<br>
            종합 결과: <strong>${scores.overall}점</strong><br><br>
            1. 끈기력: <strong>${scores.attention}점</strong> / 원기록 ${schulteTime}초<br>
            2. 기억력: <strong>${scores.memory}점</strong> / ${memoryLevel}단계 달성<br>
            3. 순발력: <strong>${scores.reaction}점</strong> / ${reactionAvg ? `${reactionAvg}ms` : "-"} · 정답률 ${reactionAccuracy}% · Lv.${reactionLevel}<br>
            4. 관찰력: <strong>${scores.visual}점</strong> / Lv.${visualLevel} · 오답 ${visualWrong}회 · 정확도 ${visualAccuracy}%<br>
            5. 충동조절: <strong>${scores.inhibition}점</strong> / Lv.${flankerLevel} · 오답 ${flankerWrong}회 · 정확도 ${flankerAccuracy}% · 평균 ${flankerAvg}초
        `;
    }

    showGameResultPopup(
        "🎉 5가지 미션 완료!",
        `<strong>${testState.child.name}</strong>의 5가지 미션 결과가 모두 저장되었어요.<br><br>종합 결과: <strong>${scores.overall}점</strong><br>결과 페이지에서 자세한 기록을 확인해보세요.`,
        "🏆",
        "결과 보러가기",
        goToMypageResult
    );
}

function goToMypageResult() {
    localStorage.setItem("nollpic_child_name", testState.child.name);
    localStorage.setItem("nollpic_child_grade", testState.child.gradeText);

    if (window.parent && window.parent !== window && typeof window.parent.goToResultPage === 'function') {
        // index.html 안에 통합된 page-6으로 이동
        window.parent.goToResultPage();
    } else {
        // fallback: 기존 외부 페이지
        const targetUrl = new URL("../mypage/mypage-result.html", window.location.href).href;
        window.location.href = targetUrl;
    }
}
// =========================
// 미션 진행상태 저장
// =========================

function saveProgress(step) {
    const progressLabel = document.getElementById("tests-mission-progress");
    if (progressLabel) progressLabel.textContent = `${step}/5 미션`;
    localStorage.setItem(
        "nollpic_test_progress",
        JSON.stringify({
            currentStep: step,
            updatedAt: Date.now()
        })
    );
}

function getProgress() {
    try {
        return JSON.parse(
            localStorage.getItem("nollpic_test_progress")
        );
    } catch (e) {
        return null;
    }
}

function clearProgress() {
    localStorage.removeItem("nollpic_test_progress");
}

function resetReactionCountdownPopup() {
    const startBlock = document.getElementById("reaction-start-block");
    const countDisplay = document.getElementById("reaction-countdown-number");

    if (startBlock) startBlock.style.display = "block";
    if (countDisplay) {
        countDisplay.style.display = "none";
        countDisplay.innerText = "3";
    }
}

function runReactionCountdown() {
    stopTestIntroVoice();

    const startBlock = document.getElementById("reaction-start-block");
    const countDisplay = document.getElementById("reaction-countdown-number");

    if (startBlock) startBlock.style.display = "none";
    if (!countDisplay) {
        startReactionGame();
        return;
    }

    countDisplay.style.display = "block";

    let count = 3;
    countDisplay.innerText = count;
    playNollpicSound("countdown-beep");

    const interval = setInterval(() => {
        count--;

        if (count > 0) {
            countDisplay.innerText = count;
            playNollpicSound("countdown-beep");
        } else {
            clearInterval(interval);
            playNollpicSound("countdown-start");
            startReactionGame();
        }
    }, 1000);
}

// 원클릭 반응속도 미션
function startReactionGame() {
    stopTestIntroVoice();

    const stage = document.getElementById("reaction-stage");
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
    state.greenShown = 0;
    state.redShown = 0;
    state.redAvoided = 0;
    state.accuracy = 0;
    state.averageMs = 0;
    state.medianMs = 0;

    if (stage) {
        stage.onclick = function () {
            const s = testState.reaction;
            if (!s.isGaming || !s.currentCircle) return;
            // 원 밖을 누름: 기록만 하고 계속 (예전에는 목숨이 줄어 일찍 끝났음)
            playNollpicSound("wrong");
            if (!isReactionPractice()) s.wrongClicks++;
            updateReactionDashboard();
        };
    }

    const ready = document.getElementById("reaction-ready");
    if (ready) ready.style.display = "none";

    const nextBtn = document.getElementById("reaction-next-btn");
    if (nextBtn) nextBtn.disabled = true;

    const retryBtn = document.getElementById("reaction-retry-btn");
    if (retryBtn) retryBtn.style.display = "none";

    updateReactionDashboard();

    state.isGaming = true;
    spawnReactionCircle();
}

// 순발력 (2026-10-10 다시 바꿈): 연습 3번(기록·하트 안 씀) 뒤, 하트 3개를 다 잃을 때까지 계속.
// 5번마다 1단계씩 올라가며 원이 떠 있는 시간이 짧아짐 (예전 배포판처럼 30단계 이상 가능)
// 하트가 줄어드는 때: 초록을 놓침 · 빨강을 누름 (빈 곳을 누르면 기록만 하고 하트는 그대로)
const REACTION_PRACTICE = 3;
const REACTION_LIVES = 3;
const REACTION_MAX_ROUNDS = 250;   // 안전장치: 50단계쯤에서 끝
function loseReactionLife() {
    const state = testState.reaction;
    if (isReactionPractice()) return;
    state.lives = Math.max(0, (state.lives ?? REACTION_LIVES) - 1);
}
function isReactionPractice() {
    return testState.reaction.round <= REACTION_PRACTICE;
}
function showReactionPracticeBadge(show) {
    const stage = document.getElementById("reaction-stage");
    if (!stage) return;
    let badge = stage.querySelector(".practice-badge");
    if (!badge) {
        badge = document.createElement("div");
        badge.className = "practice-badge";
        badge.innerHTML = "연습이에요!<br>아직 기록 안해요!";
        stage.appendChild(badge);
    }
    badge.style.display = show ? "block" : "none";
}

function getReactionSpeed() {
    const level = testState.reaction.level;
    const extraHighLevelSpeedUp = level >= 30 ? (level - 29) * 12 : 0;

    return Math.max(
        level >= 30 ? 560 : 700,
        2200 - ((level - 1) * 120) - extraHighLevelSpeedUp
    );
}

function getReactionCircleSize(level) {
    if (level > 30) return 56;
    if (level > 20) return 64;
    return 74;
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

    if ((state.lives ?? REACTION_LIVES) <= 0 || state.round >= REACTION_PRACTICE + REACTION_MAX_ROUNDS) {
        endReactionGame();
        return;
    }

    state.round++;
    const counted = !isReactionPractice();
    showReactionPracticeBadge(!counted);
    // 단계(속도)는 기록하는 판부터 5번마다 올라감
    state.level = counted ? Math.floor((state.round - REACTION_PRACTICE - 1) / 5) + 1 : 1;

    const circle = document.createElement("button");
    circle.type = "button";

    // 연습 판은 초록만, 기록 판은 초록 75% · 빨강 25%
    const isGreen = !counted || Math.random() < 0.75;
    if (counted) { if (isGreen) state.greenShown++; else state.redShown++; }
    circle.className = `reaction-circle ${isGreen ? "green" : "red"}`;
    circle.dataset.color = isGreen ? "green" : "red";
    circle.dataset.clicked = "false";

    const stageRect = stage.getBoundingClientRect();
    const size = getReactionCircleSize(state.level);
    const pos = getRandomCirclePosition(stageRect.width, stageRect.height, size);

    circle.style.width = `${size}px`;
    circle.style.height = `${size}px`;
    circle.style.left = `${pos.x}px`;
    circle.style.top = `${pos.y}px`;

   bindFastPress(circle, event => handleReactionClick(circle, event));
    stage.appendChild(circle);

    state.currentCircle = circle;
    state.circleStartTime = performance.now();

    state.spawnTimer = setTimeout(() => {
        if (!state.isGaming || state.currentCircle !== circle) return;

        if (circle.dataset.clicked === "true") return;

        circle.dataset.clicked = "true";

        if (circle.dataset.color === "green") {
            playNollpicSound("wrong");
            if (counted) { state.missedClicks++; loseReactionLife(); }
        } else if (counted) {
            state.redAvoided++;   // 빨간 원을 끝까지 참음
        }

        circle.remove();
        state.currentCircle = null;

        updateReactionDashboard();
        setTimeout(spawnReactionCircle, 180);
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
    const counted = !isReactionPractice();

    if (color === "green") {
        playNollpicSound("reaction-correct");
        if (counted) {
            state.score += 10;
            state.correctClicks++;
            state.responseTimes.push(reactionMs);
        }
    } else {
        playNollpicSound("wrong");
        if (counted) {
            state.score = Math.max(0, state.score - 10);
            state.wrongClicks++;
            loseReactionLife();
        }
    }

    circle.remove();
    state.currentCircle = null;

    updateReactionDashboard();
    setTimeout(spawnReactionCircle, 180);
}

function getMedian(values = []) {
    const list = values.filter(v => Number.isFinite(v)).sort((a, b) => a - b);
    if (!list.length) return 0;
    const mid = Math.floor(list.length / 2);
    return list.length % 2 ? list[mid] : (list[mid - 1] + list[mid]) / 2;
}

function updateReactionDashboard() {
    const state = testState.reaction;
    // 정답률 = (초록 누름 + 빨강 참음) / 지나간 원 수
    const passed = (state.correctClicks || 0) + (state.missedClicks || 0) + (state.redAvoided || 0) + (state.wrongClicks || 0);
    const totalActions = passed;

    state.averageMs = state.responseTimes.length
        ? Math.round(state.responseTimes.reduce((sum, item) => sum + item, 0) / state.responseTimes.length)
        : 0;
    state.medianMs = Math.round(getMedian(state.responseTimes));

    state.accuracy = totalActions
        ? Math.round((((state.correctClicks || 0) + (state.redAvoided || 0)) / totalActions) * 100)
        : 0;

    const scoreEl = document.getElementById("reaction-score");
    const levelEl = document.getElementById("reaction-level");
    const livesEl = document.getElementById("reaction-lives");
    const avgEl = document.getElementById("reaction-avg");
    const accEl = document.getElementById("reaction-accuracy");

    if (scoreEl) scoreEl.innerText = state.score;
    if (levelEl) levelEl.innerText = state.level;
    // 하트 (연습 중에는 "연습")
    const lives = Math.max(0, state.lives ?? REACTION_LIVES);
    if (livesEl) livesEl.innerText = state.round <= REACTION_PRACTICE ? "연습" : "❤️".repeat(lives) + "🤍".repeat(REACTION_LIVES - lives);
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
    showReactionPracticeBadge(false);

    updateReactionDashboard();

    reactionRecords.forEach(item => item.isCurrentPlayer = false);

    reactionRecords.unshift({
        grade: testState.child.gradeText,
        name: testState.child.name,
        time: `${state.level}단계 / ${state.accuracy}%`,
        date: getTodayString(),
        createdAtMs: Date.now(),
        isCurrentPlayer: true
    });

    if (shouldPersistNollpicTestRecords()) {
        localStorage.setItem("nollpic_reaction_records", JSON.stringify(reactionRecords));
        publishTestResult("reaction", reactionRecords[0]);
    }
    renderReactionLeaderboard();

    const ready = document.getElementById("reaction-ready");
    if (ready) {
        ready.style.display = "flex";
        ready.innerHTML = `완료!<br>평균 ${state.averageMs ? `${state.averageMs}ms` : "-"} · 정답률 ${state.accuracy}%`;
    }

    const nextBtn = document.getElementById("reaction-next-btn");
    if (nextBtn) nextBtn.disabled = false;

    const retryBtn = document.getElementById("reaction-retry-btn");
    if (retryBtn) retryBtn.style.display = "none";

    showGameResultPopup(
        "⚡ 순발력 미션 완료!",
        `<strong>${testState.child.name}</strong>의 순발력 기록이 저장되었어요.<br><br>반응 시간: <strong>${state.medianMs ? `${(state.medianMs / 1000).toFixed(2)}초` : "-"}</strong><br>초록 ${state.correctClicks}/${state.greenShown} · 빨강 참기 ${state.redAvoided}/${state.redShown}`,
        "🟢",
        "다음 미션 도전",
        goToVisualSearchTest,
        { resultType: "reaction", onRetry: restartReactionGame }
    );
}

function restartReactionGame() {
    scrollCurrentTestToTop();
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
    resetReactionCountdownPopup();
    showTestIntroPopup("reaction-popup", "reaction");
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

// Clearly different animals keep younger players from comparing tiny color/ear differences.
const visualDistinctFillers = ['🐶','🐱','🐰','🐻','🐼','🐸','🐵','🐔','🐤','🐠','🦆','🐴','🐨','🐢'];
const visualAnimalFamilies = [
    ['🐶','🐕','🐺','🦊'], ['🐱','🐈','🐯','🐅','🦁'], ['🐰','🐇'],
    ['🐻','🐼','🦝','🐨'], ['🐸','🐢','🦎','🐍'], ['🐵','🦍','🦧','🐒'],
    ['🐔','🐤','🐣','🐥'], ['🐠','🐟','🐡','🐬'], ['🦆','🐦','🦢'], ['🐴','🦄','🐮','🫏']
];

// 저학년(미취학~초2) 관찰력 화면 (2026-10-11): 목표와 같은 색 계열 동물은 섞지 않음 → 색으로 먼저 찾는 아이도 헷갈리지 않게
const VISUAL_COLOR_FAMILY = {
    '🐱': 'yellow', '🐤': 'yellow', '🐠': 'yellow', '🐯': 'yellow',
    '🐶': 'brown', '🐻': 'brown', '🐵': 'brown', '🐴': 'brown',
    '🐰': 'white', '🐼': 'white', '🐔': 'white',
    '🐸': 'green', '🦆': 'green', '🐢': 'green',
    '🐨': 'gray', '🐦': 'blue'
};
const VISUAL_YOUNG_MAX_GRID = 5, VISUAL_YOUNG_MAX_TARGETS = 10;
function isYoungVisualPlayer(gradeValue = testState.child.gradeValue) {
    const grade = Number.parseInt(gradeValue, 10);
    return gradeValue !== 'adult' && (!Number.isFinite(grade) || grade <= 2);
}
// 저학년은 칸을 5×5까지만, 찾을 동물은 10마리까지만 (제한 시간은 그대로 짧아짐)
function getVisualLevelConfig(level) {
    const base = visualSearchLevels[level - 1];
    if (!base || !isYoungVisualPlayer()) return base;
    return { ...base, grid: Math.min(VISUAL_YOUNG_MAX_GRID, base.grid), targetCount: Math.min(VISUAL_YOUNG_MAX_TARGETS, base.targetCount) };
}

function buildVisualSearchItems(cfg, set, gradeValue) {
    const total = cfg.grid * cfg.grid, distractorCount = total - cfg.targetCount;
    const grade = Number.parseInt(gradeValue, 10);
    const young = isYoungVisualPlayer(gradeValue);
    const similarCap = young ? 0 : grade <= 4 ? .15 : .25;
    const traps = shuffle([...set.traps]);
    const similarCount = traps.length ? Math.floor(distractorCount * Math.min(cfg.trapRate, similarCap)) : 0;
    const related = new Set([set.target, ...set.traps, ...(visualAnimalFamilies.find(family => family.includes(set.target)) || [])]);
    const targetColor = VISUAL_COLOR_FAMILY[set.target];
    const fillers = (young ? [...visualDistinctFillers, '🐦'] : visualDistinctFillers)
        .filter(item => !related.has(item))
        .filter(item => !young || !targetColor || VISUAL_COLOR_FAMILY[item] !== targetColor);
    const items = Array(cfg.targetCount).fill(set.target);
    for (let index = 0; index < similarCount; index++) items.push(traps[index % traps.length]);
    // Deal a shuffled variety of animals before repeating, rather than picking the same family repeatedly.
    let bag = [];
    while (items.length < total) {
        if (!bag.length) bag = shuffle([...fillers]);
        items.push(bag.pop());
    }
    return shuffle(items);
}

// ==========================================================================
// 04. 시각 탐색 챌린지
// ==========================================================================
function runVisualSearchCountdown() {
    runStartButtonCountdown("visual-start-block", "visual-countdown-number", startVisualSearchGame);
}

function startVisualSearchGame() {
    stopTestIntroVoice();

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
    state.foundTotal = 0;
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
    const cfg = getVisualLevelConfig(state.level);
    const young = isYoungVisualPlayer();

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

    if (targetEl) targetEl.innerHTML = window.nollpicVisualIcon(state.target);
    if (countEl) countEl.innerText = young ? `0 / ${cfg.targetCount}마리 찾았어요` : `${cfg.targetCount}마리를 찾아보세요`;
    if (msgEl) msgEl.innerText = "목표 동물을 모두 찾아요!";

    board.innerHTML = "";
    board.classList.toggle("is-young", young);   // 저학년: 그림 크게, 찾은 칸 ✓
    board.style.gridTemplateColumns = `repeat(${cfg.grid}, 1fr)`;

    const items = buildVisualSearchItems(cfg, set, testState.child.gradeValue);

    items.forEach(item => {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "visual-cell";
        cell.innerHTML = window.nollpicVisualIcon(item);

        bindFastPress(cell, () => handleVisualCellClick(cell, item, cfg));

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
        playNollpicSound("visual-correct");
        cell.classList.add("found");
        state.found++;
        state.foundTotal = (state.foundTotal || 0) + 1;
        if (isYoungVisualPlayer()) {
            const countEl = document.getElementById("visual-target-count");
            if (countEl) countEl.innerText = `${state.found} / ${cfg.targetCount}마리 찾았어요`;
        }

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
        playNollpicSound("wrong");
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

    // 정답으로 누른 칸 수 (저학년은 단계별 찾을 수가 줄어서, 실제로 찾은 수로 셈)
    const totalCorrect = state.foundTotal || 0;
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
        createdAtMs: Date.now(),
        isCurrentPlayer: true
    });

    if (shouldPersistNollpicTestRecords()) {
        localStorage.setItem("nollpic_visual_search_records", JSON.stringify(visualSearchRecords));
        publishTestResult("visual", visualSearchRecords[0]);
    }
    renderVisualSearchLeaderboard();

    const nextBtn = document.getElementById("visual-next-btn");
    if (nextBtn) nextBtn.disabled = false;

    const retryBtn = document.getElementById("visual-retry-btn");
    if (retryBtn) retryBtn.style.display = "none";

    showGameResultPopup(
        "🔍 관찰력 미션 완료!",
        `<strong>${testState.child.name}</strong>의 관찰력 기록이 저장되었어요.<br><br>도달 레벨: <strong>Lv.${state.highestLevel || state.level}</strong><br>정확도: <strong>${state.accuracy}%</strong>`,
        "🔎",
        "다음 미션 도전",
        goToFlankerTest,
        { resultType: "visual", onRetry: restartVisualSearchGame }
    );
}

function restartVisualSearchGame() {
    scrollCurrentTestToTop();
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
    state.foundTotal = 0;
    state.highestLevel = 0;
    state.accuracy = 0;

    if (board) board.innerHTML = "";
    if (msgEl) msgEl.innerText = "시작 버튼을 눌러주세요.";
    if (nextBtn) nextBtn.disabled = true;
    if (retryBtn) retryBtn.style.display = "none";

    updateVisualDashboard();

    showTestIntroPopup("visual-search-popup", "visual");
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
// 충동조절 단계 (2026-10-11 처음 버전 복원): 동물 → 과일 → 크기 비교 도형 → 색칠/빈 도형 → 화살표·손가락 → 무늬 상자
// 그림은 visual-icons.js의 2D 그림으로 그림 (예전엔 글자 기호)
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

// 충동조절 (2026-10-11 예전 방식 복원): 맞히면 다음 단계, 한 번 틀리거나 시간이 지나면 끝 (20단계)
// 그림은 예전 기호(🍓▲◆☆…) 대신 놀픽 2D 동물 그림(flankerLevels의 동물 짝)
// ※ 10/7~10/11에 쓰던 "연습 2 + 기록 16/20문제, 틀려도 계속" 방식은 _dev/before-fix170-20261011/ 에 보관
const FLANKER_START_LEVEL = { low: 1, mid: 1, high: 1 };   // (점수 계산 호환용)

function runFlankerStartCountdown() {
    runStartButtonCountdown("flanker-start-block", "flanker-start-countdown-number", startFlankerGame);
}

function startFlankerGame() {
    stopTestIntroVoice();

    const popup = document.getElementById("flanker-popup");
    if (popup) popup.classList.remove("active");

    const state = testState.flanker;

    clearTimeout(state.answerTimer);
    clearInterval(state.countdownTimer);

    state.isGaming = true;
    state.level = 1;
    state.maxLevel = 1;
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

        stimulusEl.innerHTML = sequence.map(item => `<span>${window.nollpicFlankerIcon(item)}</span>`).join("");
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
            btn.innerHTML = window.nollpicFlankerIcon(item);
            bindFastPress(btn, () => handleFlankerChoice(item));
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
        document.querySelectorAll(".flanker-choice").forEach(btn => btn.disabled = true);

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
        playNollpicSound("flanker-correct");
        state.correct++;
        state.reactionTimes.push(reaction);

        if (msgEl) msgEl.innerText = `정답! ${reaction.toFixed(2)}초`;

        state.level++;
        state.maxLevel = Math.max(state.maxLevel || 1, Math.min(state.level, flankerLevels.length));
        updateFlankerDashboard();

        setTimeout(startFlankerRound, 650);
    } else {
        playNollpicSound("wrong");
        state.wrong++;
        updateFlankerDashboard();

        if (msgEl) msgEl.innerText = "오답! 옆 그림에 속지 말아요";

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
        createdAtMs: Date.now(),
        isCurrentPlayer: true
    });

    if (shouldPersistNollpicTestRecords()) {
        localStorage.setItem("nollpic_flanker_records", JSON.stringify(flankerRecords));
        publishTestResult("flanker", flankerRecords[0]);
    }
    renderFlankerLeaderboard();

    const nextBtn = document.getElementById("flanker-next-btn");
    if (nextBtn) nextBtn.disabled = false;

    const retryBtn = document.getElementById("flanker-retry-btn");
    if (retryBtn) retryBtn.style.display = "none";

    showGameResultPopup(
        "✋ 충동조절 미션 완료!",
        `<strong>${testState.child.name}</strong>의 충동조절 기록이 저장되었어요.<br><br>도달 레벨: <strong>Lv.${Math.min(state.level, flankerLevels.length)}</strong><br>정확도: <strong>${state.accuracy}%</strong>`,
        "🎯",
        "미션 완료",
        finishAllTests,
        { resultType: "flanker", noSound: true, onRetry: restartFlankerGame }
    );
}

function restartFlankerGame() {
    stopTestCompleteVoice();
    scrollCurrentTestToTop();
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

    showTestIntroPopup("flanker-popup", "flanker");
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

// ========================================================================== 
// [FIX] 게임 단계 뒤로가기 / 3번째 반응속도 자동 종료 보강
// ========================================================================== 

function getCurrentVisibleTestStep() {
    const active = document.querySelector('.test-screen.active');
    if (!active) return null;

    const screenToStep = {
        'schulte-screen': 1,
        'memory-screen': 2,
        'reaction-screen': 3,
        'visual-search-screen': 4,
        'flanker-screen': 5
    };

    return screenToStep[active.id] || null;
}

function hideAllStartPopups() {
    stopTestIntroVoice();

    [
        'schulte-countdown-overlay',
        'memory-popup',
        'reaction-popup',
        'visual-search-popup',
        'flanker-popup',
        'game-result-popup'
    ].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });
}

function stopCurrentGameTimers() {
    stopTestIntroVoice();
    stopTestCompleteVoice();

    clearInterval(testState.schulte.timerInterval);

    clearTimeout(testState.memory.showTimer);
    clearTimeout(testState.memory.nextLevelTimer);

    clearTimeout(testState.reaction.spawnTimer);
    clearInterval(testState.reaction.moveTimer);
    if (testState.reaction.currentCircle) {
        testState.reaction.currentCircle.remove();
        testState.reaction.currentCircle = null;
    }
    testState.reaction.isGaming = false;

    clearInterval(testState.visualSearch.timer);
    testState.visualSearch.isGaming = false;

    clearTimeout(testState.flanker.answerTimer);
    clearInterval(testState.flanker.countdownTimer);
    testState.flanker.isGaming = false;
}

function leaveTestsToParent() {
    stopCurrentGameTimers();
    hideAllStartPopups();

    if (window.parent && window.parent !== window && typeof window.parent.goBackFromTestToSurvey === 'function') {
        window.parent.goBackFromTestToSurvey();
        return;
    }

    if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'exitTestToSurvey' }, '*');
    }
}

window.stopNollpicTestAudio = stopCurrentGameTimers;

window.addEventListener('pagehide', stopCurrentGameTimers);
window.addEventListener('beforeunload', stopCurrentGameTimers);
document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopCurrentGameTimers();
});

function restoreTestProgress() {
    const progress = getProgress();
    const savedStep = progress ? Number(progress.currentStep) : 1;
    const step = Number.isInteger(savedStep) && savedStep >= 1 && savedStep <= 5 ? savedStep : 1;
    const screens = ['schulte-screen', 'memory-screen', 'reaction-screen', 'visual-search-screen', 'flanker-screen'];
    const popups = ['schulte-countdown-overlay', 'memory-popup', 'reaction-popup', 'visual-search-popup', 'flanker-popup'];
    const voices = ['schulte', 'memory', 'reaction', 'visual', 'flanker'];
    hideAllStartPopups();
    showScreen(screens[step - 1]);
    // Reloading restores the preparation view, not an uninitialized empty board.
    if (step === 1) resetSchulteIntroPopup();
    showTestIntroPopup(popups[step - 1], voices[step - 1]);

    if (!progress) saveProgress(1);
    else {
        const progressLabel = document.getElementById("tests-mission-progress");
        if (progressLabel) progressLabel.textContent = `${step}/5 미션`;
    }
}

function goToMemoryTest() {
    saveProgress(2);
    hideAllStartPopups();
    showScreen('memory-screen');

    showTestIntroPopup('memory-popup', 'memory');
}

function goToReactionTest() {
    saveProgress(3);
    hideAllStartPopups();
    showScreen('reaction-screen');

    resetReactionCountdownPopup();
    showTestIntroPopup('reaction-popup', 'reaction');
}

function goToVisualSearchTest() {
    saveProgress(4);
    hideAllStartPopups();
    showScreen('visual-search-screen');

    showTestIntroPopup('visual-search-popup', 'visual');
}

function goToFlankerTest() {
    saveProgress(5);
    hideAllStartPopups();
    showScreen('flanker-screen');

    showTestIntroPopup('flanker-popup', 'flanker');
}

function goBackToPreviousTest() {
    const visibleStep = getCurrentVisibleTestStep();
    stopCurrentGameTimers();
    hideAllStartPopups();

    if (!visibleStep || visibleStep === 1) {
        leaveTestsToParent();
        return;
    }

    saveProgress(1);
    showScreen('schulte-screen');
    resetSchulteIntroPopup();
    showTestIntroPopup('schulte-countdown-overlay', 'schulte');
}

// 3번째 반응속도 게임은 아이가 계속 잘하면 끝나지 않는 구조라서 15라운드 후 자동 완료되도록 보강합니다.

// ========================================================================== 
// 실시간 결과값
// ========================================================================== 
const NOLLPIC_RESULT_FIREBASE_CONFIG = {
    apiKey: "AIzaSyClcGJEbev-OvfBu0sssIorQF-9uFsEvn8",
    authDomain: "nollpic.firebaseapp.com",
    projectId: "nollpic",
    storageBucket: "nollpic.firebasestorage.app",
    messagingSenderId: "954410800164",
    appId: "1:954410800164:web:970ebe9421d377e5ce7d53"
};

let nollpicResultToolsPromise = null;

async function getNollpicResultTools() {
    if (nollpicResultToolsPromise) return nollpicResultToolsPromise;

    nollpicResultToolsPromise = Promise.all([
        import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js")
    ]).then(([appModule, firestoreModule]) => {
        const firebaseApp = appModule.getApps().length
            ? appModule.getApps()[0]
            : appModule.initializeApp(NOLLPIC_RESULT_FIREBASE_CONFIG);

        return {
            db: firestoreModule.getFirestore(firebaseApp),
            collection: firestoreModule.collection,
            addDoc: firestoreModule.addDoc,
            getDocs: firestoreModule.getDocs,
            query: firestoreModule.query,
            orderBy: firestoreModule.orderBy,
            limit: firestoreModule.limit,
            serverTimestamp: firestoreModule.serverTimestamp
        };
    });

    return nollpicResultToolsPromise;
}

function escapeResultText(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getLocalResultRecords(type) {
    const keyMap = {
        schulte: "nollpic_schulte_records",
        memory: "nollpic_memory_records",
        reaction: "nollpic_reaction_records",
        visual: "nollpic_visual_search_records",
        flanker: "nollpic_flanker_records"
    };

    try {
        return JSON.parse(localStorage.getItem(keyMap[type]) || "[]");
    } catch (e) {
        return [];
    }
}

function parsePublicResultTime(value, fallbackDate = "") {
    if (!value && fallbackDate) value = fallbackDate;
    if (!value) return 0;
    if (typeof value === "number") return value;
    if (value.seconds) return value.seconds * 1000;
    if (value.toDate) return value.toDate().getTime();

    const text = String(value).trim();
    const normalized = text.replace(/\./g, "-").replace(/\s+/g, "");
    const parsed = Date.parse(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}

// 공개 결과 목록 이름 (2026-10-10): 실명 대신 가운데 글자를 가림. 문주원 → 문*원, 이루 → 이*, 남궁민수 → 남**수
// 서버(testResults)에도 가린 이름만 저장됨. 이름이 없으면 "익명"
function maskChildName(name) {
    const chars = Array.from(String(name || "").replace(/[\s*]/g, "")).slice(0, 10);
    if (!chars.length) return "익명";
    if (chars.length === 1) return chars[0] + "*";
    if (chars.length === 2) return chars[0] + "*";
    return chars[0] + "*".repeat(chars.length - 2) + chars[chars.length - 1];
}

function normalizePublicResult(type, record = {}) {
    const date = record.date || getTodayString();
    const createdAtMs = Number(record.createdAtMs)
        || parsePublicResultTime(record.createdAt, date)
        || Date.now();
    const user = getNollpicLoggedInUserForTests();

    return {
        type,
        grade: record.grade || testState.child.gradeText || "-",
        name: maskChildName(record.name || testState.child.name),
        time: record.time || record.record || "-",
        date,
        createdAtMs,
        memberType: user ? "member" : "guest",
        isGuest: !user
    };
}

function isSeedResultRecord(record = {}) {
    const seedNames = new Set(["김민재", "이서연", "박준우", "최예은"]);
    const seedDates = new Set(["2026.05.25", "2026.05.27", "2026.05.28"]);
    return seedNames.has(record.name) && seedDates.has(record.date);
}

async function publishTestResult(type, record) {
    if (!record) return;

    const result = normalizePublicResult(type, record);

    try {
        const tools = await getNollpicResultTools();
        try {
            await tools.addDoc(tools.collection(tools.db, "testResults"), {
                ...result,
                createdAt: tools.serverTimestamp()
            });
        } catch (maskedNameError) {
            // 서버 규칙이 아직 예전("익명"만 허용)이면 익명으로 다시 저장
            if (result.name === "익명") throw maskedNameError;
            await tools.addDoc(tools.collection(tools.db, "testResults"), {
                ...result,
                name: "익명",
                createdAt: tools.serverTimestamp()
            });
        }
    } catch (e) {
        // Firestore 권한이 막힌 경우에도 로컬 결과 표시는 유지합니다.
    }
}

function getDateLabelFromValue(value) {
    if (!value) return "";
    if (value.toDate) {
        const date = value.toDate();
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
    }
    return String(value);
}

async function fetchPublicResults(type) {
    const tools = await getNollpicResultTools();
    const resultQuery = tools.query(
        tools.collection(tools.db, "testResults"),
        tools.orderBy("createdAt", "desc"),
        tools.limit(60)
    );

    const snapshot = await tools.getDocs(resultQuery);
    return snapshot.docs
        .map(docSnap => docSnap.data())
        .filter(data => data.type === type)
        .filter(data => !isSeedResultRecord(data))
        .map(data => ({
            grade: data.grade || "-",
            name: data.name || "익명",   // 예전 기록은 "익명", 새 기록은 가린 이름
            time: data.time || "-",
            date: getDateLabelFromValue(data.createdAt) || data.date || "",
            createdAtMs: Number(data.createdAtMs) || parsePublicResultTime(data.createdAt, data.date)
        }));
}

function isCurrentGradeResult(item) {
    const currentGrade = testState.child.gradeText || getGradeText(testState.child.gradeValue);
    return !currentGrade || item.grade === currentGrade;
}

const POPUP_RESULT_GUIDES = {
    schulte: "Schulte Table 개념을 바탕으로 구성된 활동입니다. 숫자를 순서대로 찾으며 시각적 주의력과 정보 탐색 능력을 활용합니다.",
    memory: "시공간 작업기억 활동인 Corsi Block Test를 바탕으로 구성했습니다. 본 위치를 다시 찾으며 시각·위치 기억 능력을 활용합니다.",
    reaction: "반응속도와 충동 조절을 살펴보는 활동입니다. 화면 변화에 맞춰 빠르게 반응하면서도 정확한 선택을 유지하는 능력을 활용합니다.",
    visual: "여러 자극 속에서 목표를 빠르게 찾는 시각탐색 활동입니다. 필요한 정보를 구분하고 집중을 유지하는 능력을 활용합니다.",
    flanker: "Flanker 과제 기반 활동입니다.\n방해 자극을 억제하고 목표에 집중하는\n충동 조절 능력을 활용합니다."
};

function renderPopupResultBoard(type) {
    const guideEl = document.getElementById("game-result-guide-text");
    if (guideEl) {
        guideEl.textContent = POPUP_RESULT_GUIDES[type] || POPUP_RESULT_GUIDES.memory;
        guideEl.dataset.mission = type;
    }
    renderPublicResults(type, "game-result-live-list", 8);
}

function formatShortResultDate(value) {
    const text = String(value || "");
    return text.replace(/^\d{2}(\d{2})([.-]\d{2}[.-]\d{2})$/, "$1$2");
}

function formatPopupResultRecord(value) {
    return String(value || "").replace(/단계\s*달성/g, "단계");
}

function formatPopupResultGrade(value) {
    const text = String(value || "");
    const elementaryMatch = text.match(/초등\s*(\d)\s*학년/);
    if (elementaryMatch) return `초${elementaryMatch[1]}`;
    return text === "미취학" ? text : text.replace("학년", "").replace(/\s+/g, "");
}

function getPublicResultIdentity(item = {}) {
    // The local record contains the child's name, but the corresponding
    // public record is intentionally displayed as "익명".  Do not use name
    // when deciding whether those two sources represent the same play.
    const createdAtMs = Number(item.createdAtMs) || 0;
    return [
        String(item.grade || "").trim(),
        String(item.time || "").trim(),
        String(item.date || "").trim(),
        createdAtMs
    ].join("_");
}

async function renderPublicResults(type, listId = `${type}-review-list`, maxItems = 8) {
    const list = document.getElementById(listId);
    if (!list) return;

    list.innerHTML = `<div class="review-empty">결과값을 불러오는 중이에요.</div>`;

    const localResults = getLocalResultRecords(type).filter(isCurrentGradeResult).slice(0, 3).map((item, index) => ({
        ...item,
        createdAtMs: Number(item.createdAtMs) || (parsePublicResultTime(item.createdAt, item.date) || parsePublicResultTime(item.date)) + (3 - index)
    }));
    let results = [];
    try {
        results = [...localResults, ...(await fetchPublicResults(type))];
    } catch (e) {
        results = localResults;
    }

    const seen = new Set();
    results = results
        .map((item, index) => ({
            ...item,
            createdAtMs: Number(item.createdAtMs) || parsePublicResultTime(item.createdAt, item.date) || parsePublicResultTime(item.date) || index
        }))
        .filter(item => {
            if (isSeedResultRecord(item)) return false;
            if (!isCurrentGradeResult(item)) return false;
            const key = getPublicResultIdentity(item);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .sort((a, b) => {
            if (!!a.isCurrentPlayer !== !!b.isCurrentPlayer) return a.isCurrentPlayer ? -1 : 1;
            return (b.createdAtMs || 0) - (a.createdAtMs || 0);
        });

    if (!results.length) {
        list.innerHTML = `<div class="review-empty">아직 표시할 결과값이 없어요.</div>`;
        return;
    }

    list.innerHTML = results.slice(0, maxItems).map(item => `
        <div class="leaderboard-row ${item.isCurrentPlayer ? "highlight" : ""}">
            <span>${escapeResultText(formatPopupResultGrade(item.grade))}</span>
            <span>${escapeResultText(item.name)}</span>
            <span>${escapeResultText(formatPopupResultRecord(item.time))}</span>
            <span>${escapeResultText(formatShortResultDate(item.date))}</span>
        </div>
    `).join("");
}

function renderSchulteLeaderboard() { renderPublicResults("schulte"); }
function renderMemoryLeaderboard() { renderPublicResults("memory"); }
function renderReactionLeaderboard() { renderPublicResults("reaction"); }
function renderVisualSearchLeaderboard() { renderPublicResults("visual"); }
function renderFlankerLeaderboard() { renderPublicResults("flanker"); }

// ==========================================================================
// 미션 미리보기 (2026-10-11): 처음부터 하지 않고 4·5번 미션만 바로 열기
//   tests/tests.html?preview=4  → 관찰력 / ?preview=5 → 충동조절   (&grade=1 처럼 학년 지정 가능, 기본 초2)
//   미리보기에서는 기록·진행 상황을 저장하지 않음 (결과 목록·미션결과에 안 남음)
// ==========================================================================
(function setupMissionPreview() {
    const params = new URLSearchParams(window.location.search);
    const step = params.get("preview");
    if (!["4", "5"].includes(step)) return;
    window.NOLLPIC_TEST_PREVIEW = true;
    shouldPersistNollpicTestRecords = () => false;
    saveProgress = () => {};
    finishAllTests = () => { window.location.reload(); };   // 마지막 "미션 완료"를 누르면 다시 처음 화면으로
    if (!params.get("grade")) testState.child.gradeText = getGradeText(testState.child.gradeValue);
    if (!params.get("name")) testState.child.name = "미리보기";
    const open = () => {
        if (step === "4") goToVisualSearchTest(); else goToFlankerTest();
        if (!document.getElementById("nollpic-preview-badge")) {
            const badge = document.createElement("div");
            badge.id = "nollpic-preview-badge";
            badge.textContent = `미리보기 · ${testState.child.gradeText || "학년"} · 기록 저장 안 됨`;
            badge.style.cssText = "position:fixed;left:50%;bottom:10px;transform:translateX(-50%);z-index:99999;padding:6px 12px;border:2px solid #293344;border-radius:99px;background:#fff0dc;color:#293344;font:800 12px/1.2 sans-serif;pointer-events:none;white-space:nowrap;";
            document.body.append(badge);
        }
    };
    if (document.readyState === "complete") setTimeout(open, 400);
    else window.addEventListener("load", () => setTimeout(open, 400), { once: true });
})();


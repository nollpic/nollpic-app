console.log("🔥 [완벽 수정본] firebase-save-result.js 실행됨");

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyClcGJEbev-OvfBu0sssIorQF-9uFsEvn8",
  authDomain: "nollpic.firebaseapp.com",
  projectId: "nollpic",
  storageBucket: "nollpic.firebasestorage.app",
  messagingSenderId: "136872727133",
  appId: "1:136872727133:web:68e8ec171055beeecbf3b4",
  measurementId: "G-MGB2F1HNJV"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const APP_VERSION = "v1";
const TEST_VERSION = "v1";
const CHALLENGE_START_DATE = "2026-06-01";
const GUEST_LABEL = "\ube44\ud68c\uc6d0";
const GUEST_USER_LABEL = "\ube44\ud68c\uc6d0 \uc0ac\uc6a9\uc790";

function safeJsonParse(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (e) {
    return fallback;
  }
}

function getChallengeWeek() {
  const start = new Date(`${CHALLENGE_START_DATE}T00:00:00+09:00`).getTime();
  const diff = Date.now() - start;
  if (diff < 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24 * 7));
}

/**
 * [버그 수정] 0점을 맞더라도 테스트 영역 항목이 존재하면 완료된 항목으로 인정하도록 변경
 */
function getFinishedTests(scores = {}) {
  if (!scores) return 0;
  return Object.keys(scores).length;
}

function isCompleteResultData(data = {}) {
  if (!data || data.isComplete === false) return false;
  if (data.isComplete === true || Number(data.finishedTests) === 5) return true;
  const scores = data.scores || {};
  return ["attention", "memory", "reaction", "visual", "inhibition"]
    .every(key => Number.isFinite(Number(scores[key])));
}

function getLocalResultData() {
  const latest = safeJsonParse(localStorage.getItem("nollpic_latest_result"));
  const profile = safeJsonParse(localStorage.getItem("nollpic_child_profile"));

  if (!latest) return null;

  // ✅ [중복 차단] 이미 서버에 저장 완료된 원본 데이터라면 더 이상 읽어오지 않고 차단합니다.
  if (latest.isSavedToServer === true) {
    console.log("📢 [차단] 이미 서버(Firestore)에 전송 완료된 검사 결과입니다. 업로드를 전면 중단합니다.");
    return null;
  }

  const child = latest.child || profile || null;
  const scores = latest.scores || {};

  return {
    resultId: latest.resultId || `result_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    child,
    childId: child?.id || "",
    childName: child?.name || "",
    gradeText: child?.gradeText || "",
    gradeValue: child?.gradeValue || "",
    gender: child?.gender || "",

    date: getTodayString(),
    localDate: getTodayString(),
    originalDate: latest.date || "",
    completedAtMs: latest.completedAtMs || Date.now(),
    overall: Number(latest.overall || 0),
    scores,
    analysis: latest.analysis || "",
    raw: latest.raw || {},

    appVersion: APP_VERSION,
    testVersion: latest.testVersion || TEST_VERSION,
    challengeWeek: getChallengeWeek(),
    finishedTests: latest.finishedTests || getFinishedTests(scores),
    isComplete: isCompleteResultData({ ...latest, scores }),
    playMinutes: latest.playMinutes || null,

    savedSource: "github-pages",
    userAgent: navigator.userAgent,
    savedAt: serverTimestamp()
  };
}

async function getFirebaseSessionNumber(uid, childId, childName) {
  try {
    const snapshot = await getDocs(collection(db, "users", uid, "results"));
    let sameChildCount = 0;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!isCompleteResultData(data)) return;
      const sameById = childId && data.childId === childId;
      const sameByName = !childId && childName && data.childName === childName;
      if (sameById || sameByName) sameChildCount += 1;
    });
    return sameChildCount + 1;
  } catch (e) {
    console.error("세션 넘버 조회 실패:", e);
    return 1;
  }
}

function getGuestId() {
  const storageKey = "nollpic_guest_id";
  let guestId = localStorage.getItem(storageKey);

  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(storageKey, guestId);
  }

  return guestId;
}

async function getGuestSessionNumber(guestId, childId, childName) {
  try {
    const snapshot = await getDocs(collection(db, "guestUsers", guestId, "results"));
    let sameChildCount = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      if (!isCompleteResultData(data)) return;
      const sameById = childId && data.childId === childId;
      const sameByName = !childId && childName && data.childName === childName;
      if (sameById || sameByName) sameChildCount += 1;
    });

    return sameChildCount + 1;
  } catch (e) {
    console.error("비로그인 세션 넘버 조회 실패:", e);
    return 1;
  }
}

async function saveChildProfileToFirestore(uid, user, resultData) {
  const child = resultData.child;
  if (!child || !child.name) return;

  const childId = resultData.childId || child.id || `child_${Date.now()}`;

  await setDoc(
    doc(db, "users", uid, "children", childId),
    {
      id: childId,
      name: child.name || resultData.childName || "우리 아이",
      gradeValue: child.gradeValue || resultData.gradeValue || "",
      gradeText: child.gradeText || resultData.gradeText || "",
      gender: child.gender || resultData.gender || "",
      startedAt: child.startedAt || resultData.date || "",
      uid,
      userEmail: user.email || "",
      userName: user.displayName || "",
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

async function saveGuestProfileToFirestore(guestId, resultData) {
  const child = resultData.child;
  const childId = resultData.childId || child?.id || `child_${Date.now()}`;

  await setDoc(
    doc(db, "guestUsers", guestId),
    {
      uid: guestId,
      guestId,
      isGuest: true,
      memberType: "guest",
      userEmail: GUEST_LABEL,
      userName: GUEST_USER_LABEL,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  if (!child && !resultData.childName) return;

  await setDoc(
    doc(db, "guestUsers", guestId, "children", childId),
    {
      id: childId,
      name: child?.name || resultData.childName || "우리 아이",
      gradeValue: child?.gradeValue || resultData.gradeValue || "",
      gradeText: child?.gradeText || resultData.gradeText || "",
      gender: child?.gender || resultData.gender || "",
      startedAt: child?.startedAt || resultData.date || "",
      uid: guestId,
      guestId,
      isGuest: true,
      memberType: "guest",
      userEmail: GUEST_LABEL,
      userName: GUEST_USER_LABEL,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

async function saveUserProfileToFirestore(uid, user) {
  await setDoc(
    doc(db, "users", uid),
    {
      uid,
      email: user.email || "",
      userEmail: user.email || "",
      userName: user.displayName || "",
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

function makeSaveKey(uid, resultData) {
  if (resultData.resultId) return `firebase_saved_${uid}_${resultData.resultId}`;
  const childKey = resultData.childId || resultData.childName || "child";
  return `firebase_saved_${uid}_${childKey}_${resultData.date}_${resultData.overall}`;
}

function getTodayString() {
  const now = new Date();
  return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * 중복 없는 Firestore 업로드 공통 핵심 로직
 */
async function uploadProcess(user, resultData, triggerSource) {
  if (!user || !resultData) return;

  // 5가지 검사가 다 끝나지 않은 불완전 데이터는 업로드 거절
  if (!resultData.isComplete && resultData.finishedTests !== 5) {
    console.log(`[${triggerSource}] 미완료 결과로 인해 Firebase 저장 건너뜀.`);
    return;
  }

  const saveKey = makeSaveKey(user.uid, resultData);

  // 1차 방어막: 현재 로그인한 계정 기준으로 이미 올린 이력이 있는지 체크
  if (localStorage.getItem(saveKey) === "true") {
    console.log(`[${triggerSource}] 이미 현재 계정으로 Firestore 서버 동기화가 완료된 결과입니다.`);
    return;
  }

  try {
    const sessionNumber = await getFirebaseSessionNumber(user.uid, resultData.childId, resultData.childName);

    const payload = {
      uid: user.uid,
      userEmail: user.email,
      userName: user.displayName,
      sessionNumber,
      ...resultData,
      savedAt: serverTimestamp()
    };

    console.log(`🚀 [${triggerSource}] Firestore 업로드 시작`, payload);

    await saveUserProfileToFirestore(user.uid, user);
    await saveChildProfileToFirestore(user.uid, user, resultData);
    await addDoc(collection(db, "users", user.uid, "results"), payload);

    // ✅ [버그 수정 완료] 서버 저장 성공 시 기기 내부 원본 데이터 자체에 "저장 완료" 도장을 확실하게 찍습니다.
    // 이렇게 하면 계정을 로그아웃하고 다른 이메일로 바꿔도 이 81점짜리 데이터가 다시 읽히지 않습니다.
    const latestData = safeJsonParse(localStorage.getItem("nollpic_latest_result"));
    if (latestData) {
      latestData.isSavedToServer = true;
      localStorage.setItem("nollpic_latest_result", JSON.stringify(latestData));
    }

    // 계정별 고유 키 방어막도 함께 작동 처리
    localStorage.setItem(saveKey, "true");
    console.log(`✅ [${triggerSource}] Firestore 서버 저장 성공 및 중복 방지 마킹 완료.`);

  } catch (error) {
    console.error(`❌ [${triggerSource}] Firestore 연동 최종 실패:`, error);
  }
}

async function uploadGuestProcess(resultData, triggerSource) {
  if (!resultData) return;

  if (!resultData.isComplete && resultData.finishedTests !== 5) {
    console.log(`[${triggerSource}] 미완료 비로그인 결과로 인해 Firebase 저장 건너뜀.`);
    return;
  }

  const guestId = getGuestId();
  const saveKey = makeSaveKey(guestId, resultData);

  if (localStorage.getItem(saveKey) === "true") {
    console.log(`[${triggerSource}] 이미 비로그인 Firestore 서버 동기화가 완료된 결과입니다.`);
    return;
  }

  try {
    const sessionNumber = await getGuestSessionNumber(guestId, resultData.childId, resultData.childName);

    const payload = {
      uid: guestId,
      guestId,
      isGuest: true,
      memberType: "guest",
      userEmail: GUEST_LABEL,
      userName: GUEST_USER_LABEL,
      sessionNumber,
      ...resultData,
      savedAt: serverTimestamp()
    };

    console.log(`🚀 [${triggerSource}] 비로그인 Firestore 업로드 시작`, payload);

    await saveGuestProfileToFirestore(guestId, resultData);
    await addDoc(collection(db, "guestUsers", guestId, "results"), payload);

    const latestData = safeJsonParse(localStorage.getItem("nollpic_latest_result"));
    if (latestData) {
      latestData.isSavedToServer = true;
      localStorage.setItem("nollpic_latest_result", JSON.stringify(latestData));
    }

    localStorage.setItem(saveKey, "true");
    console.log(`✅ [${triggerSource}] 비로그인 Firestore 서버 저장 성공 및 중복 방지 마킹 완료.`);

  } catch (error) {
    console.error(`❌ [${triggerSource}] 비로그인 Firestore 연동 최종 실패:`, error);
  }
}

// [트리거 1] 로그인 상태 변경 및 페이지 진입 시 미동기화 데이터 수급
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    console.log("로그인 사용자가 없습니다. 비로그인 결과 저장을 시도합니다.");
    const resultData = getLocalResultData();
    if (resultData) {
      await uploadGuestProcess(resultData, "비로그인 인증상태 트리거");
    }
    return;
  }
  const resultData = getLocalResultData();
  if (resultData) {
    await uploadProcess(user, resultData, "인증상태 변경 트리거");
  }
});

// [트리거 2] 검사 완료 페이지 진입 시 실시간 강제 연동
window.addEventListener("nollpic-result-saved", async (event) => {
  const user = auth.currentUser;
  const resultData = event.detail || getLocalResultData();

  if (!user) {
    console.log("검사 완료 수신: 비로그인 결과 저장을 시도합니다.");
    if (resultData) {
      await uploadGuestProcess(resultData, "비로그인 검사완료 실시간 트리거");
    } else {
      console.log("검사 완료 수신 실패: 전송할 비로그인 결과 구조체를 확보하지 못했습니다.");
    }
    return;
  }

  if (resultData) {
    await uploadProcess(user, resultData, "검사완료 실시간 트리거");
  } else {
    console.log("검사 완료 수신 실패: 전송할 결과 구조체를 확보하지 못했습니다.");
  }
});

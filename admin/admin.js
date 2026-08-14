import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword,
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore, collection, collectionGroup, getDocs, writeBatch, doc,
  setDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ── Firebase 초기화 ─────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyClcGJEbev-OvfBu0sssIorQF-9uFsEvn8",
  authDomain: "nollpic.firebaseapp.com",
  projectId: "nollpic",
  storageBucket: "nollpic.firebasestorage.app",
  messagingSenderId: "136872727133",
  appId: "1:136872727133:web:68e8ec171055beeecbf3b4"
};
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

const ADMIN_EMAILS = ["monojjin@gmail.com", "nollpic.official@gmail.com"];
const GUEST_LABEL = "\ube44\ud68c\uc6d0";

// ── DOM ─────────────────────────────────────────────
const loginScreen   = document.getElementById("login-screen");
const adminScreen   = document.getElementById("admin-screen");
const loginError    = document.getElementById("login-error");
const resultTable   = document.getElementById("result-table");
const searchInput   = document.getElementById("search-input");
const filterGrade   = document.getElementById("filter-grade");
const filterComplete= document.getElementById("filter-complete");
const filterWeekday = document.getElementById("filter-weekday");
const sortOrder     = document.getElementById("sort-order");
const filterAppLaunch = document.getElementById("filter-app-launch");
const rowCountEl    = document.getElementById("row-count");
const thCheck       = document.getElementById("th-check");
const deleteBtn     = document.getElementById("delete-btn");
const resultPagination = document.getElementById("result-pagination");
const trendChart       = document.getElementById("trend-chart");
const trendChartTotal  = document.getElementById("trend-chart-total");
const trendChartCaption = document.getElementById("trend-chart-caption");
const trendChartTabs   = document.querySelectorAll("[data-chart-range]");
const resultAverageRow = document.getElementById("result-average-row");
const childDetailModal   = document.getElementById("child-detail-modal");
const childDetailTitle   = document.getElementById("child-detail-title");
const childDetailSummary = document.getElementById("child-detail-summary");
const childDetailClose   = document.getElementById("child-detail-close");
const childGrowthCanvas  = document.getElementById("child-growth-canvas");
const childGrowthList    = document.getElementById("child-growth-list");
const playForm           = document.getElementById("play-form");
const playIdInput        = document.getElementById("play-id");
const playTitleInput     = document.getElementById("play-title");
const playThumbInput     = document.getElementById("play-thumbnail");
const playDescInput      = document.getElementById("play-description");
const playLinkInput      = document.getElementById("play-link");
const playAreaInput      = document.getElementById("play-area");
const playOrderInput     = document.getElementById("play-order");
const playEnabledInput   = document.getElementById("play-enabled");
const playSaveBtn        = document.getElementById("play-save-btn");
const playResetBtn       = document.getElementById("play-reset-btn");
const playTable          = document.getElementById("play-table");
const gnbItems           = document.querySelectorAll(".admin-gnb-item");

let allRows = [];
let currentFilteredRows = [];
let currentPageRows = [];
let recommendedPlays = [];
let completedRowsForTrend = [];
let trendChartRange = "daily";
let resultCurrentPage = 1;
const RESULT_PAGE_SIZE = 30;

function isCompleteResult(row = {}) {
  if (!row || row.isComplete === false) return false;
  if (row.isComplete === true || Number(row.finishedTests) === 5) return true;
  const scores = row.scores || {};
  return ["attention", "memory", "reaction", "visual", "inhibition"]
    .every(key => Number.isFinite(Number(scores[key])));
}

// ── 로그인 ──────────────────────────────────────────
document.getElementById("login-btn").addEventListener("click", async () => {
  const email    = document.getElementById("admin-email").value.trim();
  const password = document.getElementById("admin-password").value.trim();
  loginError.textContent = "";
  if (!email || !password) { loginError.textContent = "이메일과 비밀번호를 입력해주세요."; return; }
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch {
    loginError.textContent = "로그인 실패. 이메일 또는 비밀번호를 확인해주세요.";
  }
});

document.getElementById("admin-password").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("login-btn").click();
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  await signOut(auth); location.reload();
});

document.getElementById("refresh-btn").addEventListener("click", loadAdminData);
document.getElementById("export-btn").addEventListener("click", exportCSV);
deleteBtn.addEventListener("click", deleteSelectedRows);
playForm?.addEventListener("submit", saveRecommendedPlay);
playResetBtn?.addEventListener("click", resetPlayForm);
gnbItems.forEach(item => {
  item.addEventListener("click", () => {
    setActiveGnb(item.dataset.target);
    document.getElementById(item.dataset.target)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
});
trendChartTabs.forEach(button => {
  button.addEventListener("click", () => {
    trendChartRange = button.dataset.chartRange || "daily";
    trendChartTabs.forEach(item => item.classList.toggle("active", item === button));
    renderTrendChart(completedRowsForTrend, trendChartRange);
  });
});
childDetailClose?.addEventListener("click", closeChildDetail);
childDetailModal?.addEventListener("click", (e) => {
  if (e.target === childDetailModal) closeChildDetail();
});

searchInput.addEventListener("input", applyFilter);
filterGrade.addEventListener("change", applyFilter);
filterComplete.addEventListener("change", applyFilter);
filterWeekday?.addEventListener("change", applyFilter);
sortOrder?.addEventListener("change", applyFilter);
filterAppLaunch?.addEventListener("change", applyFilter);

function setActiveGnb(targetId) {
  gnbItems.forEach(item => {
    item.classList.toggle("active", item.dataset.target === targetId);
  });
}

thCheck.addEventListener("change", (e) => {
  const isChecked = e.target.checked;
  const rowInputs = resultTable.querySelectorAll(".td-check");
  rowInputs.forEach(input => {
    input.checked = isChecked;
  });
});

// ── 인증 상태 ────────────────────────────────────────
onAuthStateChanged(auth, async user => {
  if (!user) { showLogin(); return; }
  if (!ADMIN_EMAILS.includes(user.email)) {
    alert("관리자만 접속할 수 있습니다.");
    await signOut(auth); location.href = "/"; return;
  }
  document.getElementById("admin-email-label").textContent = user.email;
  showAdmin();
  await loadAdminData();
  await loadRecommendedPlays();
});

function showLogin() {
  loginScreen.classList.remove("hidden");
  adminScreen.classList.add("hidden");
}
function showAdmin() {
  loginScreen.classList.add("hidden");
  adminScreen.classList.remove("hidden");
}

function buildAppLaunchMap(usersSnap, guestUsersSnap) {
  const map = new Map();
  const addProfile = (id, data = {}) => {
    if (!id) return;
    if (!data.appInstalledModeSeen && !data.lastAppLaunchAt) return;
    map.set(id, {
      seen: data.appInstalledModeSeen === true || !!data.lastAppLaunchAt,
      lastAt: data.lastAppLaunchAt || null,
      count: Number(data.appLaunchCount) || 0
    });
  };

  usersSnap.forEach(docSnap => addProfile(docSnap.id, docSnap.data()));
  guestUsersSnap.forEach(docSnap => addProfile(docSnap.id, docSnap.data()));
  return map;
}

function formatAppLaunchStatus(info) {
  if (!info || !info.seen) return "미확인";
  const date = formatFirestoreDateTime(info.lastAt) || "-";
  const count = info.count ? `${info.count}회` : "기록 있음";
  return `앱 실행됨 ${date} (${count})`;
}

function buildScoreLevelMeta(raw = {}) {
  const schulteTime = raw.schulteTime || raw.attentionTime || "";
  const levelText = value => {
    const level = Number(value) || 0;
    return level > 0 ? `Lv.${level}` : "";
  };

  return {
    attention: schulteTime ? `${schulteTime}초` : "",
    memory: levelText(raw.memoryLevel),
    reaction: levelText(raw.reactionLevel),
    visual: levelText(raw.visualLevel),
    inhibition: levelText(raw.flankerLevel)
  };
}

// ── 데이터 로딩 (수정본) ──────────────────
async function loadAdminData() {
  resultTable.innerHTML = `<tr><td colspan="16" class="loading-msg">⏳ 데이터를 불러오는 중...</td></tr>`;
  allRows = [];
  if(thCheck) thCheck.checked = false;

  let todayCount = 0;

  try {
    // [확인] 모든 유저의 'results' 서브 컬렉션을 통째로 가져옵니다.
    const [resultsSnap, usersSnap, guestUsersSnap] = await Promise.all([
      getDocs(collectionGroup(db, "results")),
      getDocs(collection(db, "users")),
      getDocs(collection(db, "guestUsers"))
    ]);
    const appLaunchMap = buildAppLaunchMap(usersSnap, guestUsersSnap);
    
    // 디버깅용: 실제로 DB에서 몇 건의 검사결과를 가져왔는지 콘솔에 출력합니다.
    console.log(`[어드민] DB에서 총 ${resultsSnap.size}개의 검사 결과를 가져왔습니다.`);

    const userSet = new Set();
    const childSet = new Set();

    resultsSnap.forEach(resultDoc => {
      const r = resultDoc.data();
      
      // 데이터가 들어오는지 개별 확인용 로그 (확인 후 삭제 가능)
      console.log("가져온 문서 데이터:", r);

      const uid = r.uid || resultDoc.ref.parent.parent?.id || "";
      const isGuest = r.isGuest === true || r.memberType === "guest" || String(uid).startsWith("guest_");
      const appLaunchInfo = appLaunchMap.get(uid) || null;
      const userEmail = r.userEmail || r.email || (r.isGuest ? "비로그인" : "-");
      const displayUserEmail = isGuest ? GUEST_LABEL : userEmail;
      const userKey = uid || userEmail;
      if (!isGuest && userKey && userKey !== "-") userSet.add(userKey);

      const date = formatFirestoreDateTime(r.savedAt) || formatFirestoreDateTime(r.createdAt) || r.date || r.testDate || "-";
      const sortMs = getResultSortMs(r, date);
      const isComplete = isCompleteResult(r);

      if (isComplete && isTodayResult(sortMs, date)) todayCount++;

      const childName = r.childName || r.child?.name || "-";
      const displayChildName = childName === "-" && isGuest ? GUEST_LABEL : childName;
      const gradeText = normalizeGradeText(r.gradeText || r.child?.gradeText || r.child?.gradeValue || "-");
      const gender = r.gender || r.child?.gender || "-";

      const childId = r.childId || r.child?.id || "";
      const guestChildKey = `${userKey}_${displayChildName}_${gradeText}_${gender}`;
      const childKey = isGuest ? guestChildKey : (childId || `${userKey}_${displayChildName}_${gradeText}`);
      if (isComplete && childKey && displayChildName !== "-") childSet.add(childKey);

      const s = r.scores || {};
      const raw = r.raw || {};
      const levelMeta = buildScoreLevelMeta(r.raw || {});

      allRows.push({
        id: resultDoc.id,
        refPath: resultDoc.ref.path,
        date,
        sortMs,
        userEmail: displayUserEmail,
        childId,
        childKey,
        childName: displayChildName,
        gradeText,
        gender,
        overall: r.overall ?? "-",
        attention: s.attention ?? "-",
        memory: s.memory ?? "-",
        reaction: s.reaction ?? "-",
        visual: s.visual ?? "-",
        inhibition: s.inhibition ?? "-",
        raw,
        levelMeta,
        appLaunchInfo,
        testCount: 1,
        isComplete
      });
    });

    const completedRows = allRows.filter(row => row.isComplete);
    completedRowsForTrend = completedRows;
    const childCounts = new Map();
    completedRows.forEach(row => {
      childCounts.set(row.childKey, (childCounts.get(row.childKey) || 0) + 1);
    });
    allRows.forEach(row => {
      row.testCount = childCounts.get(row.childKey) || 0;
    });

    document.getElementById("user-count").textContent = userSet.size;
    document.getElementById("child-count").textContent = childSet.size;
    document.getElementById("result-count").textContent = completedRows.length;
    document.getElementById("today-result-count").textContent = todayCount;
    document.getElementById("app-launch-count").textContent = appLaunchMap.size;
    renderTrendChart(completedRowsForTrend, trendChartRange);
    allRows.sort((a, b) => (b.sortMs || 0) - (a.sortMs || 0));
    applyFilter();

  } catch (err) {
    console.error("어드민 데이터 취합 중 오류 발생:", err);
    resultTable.innerHTML = `<tr><td colspan="16" class="error-msg">❌ 데이터 로드 실패: ${err.message}</td></tr>`;
  }
}

const PLAY_AREA_LABELS = {
  attention: "집중력 (끈기력)",
  visual: "시각탐색 (관찰력)",
  memory: "작업기억력 (기억력)",
  reaction: "반응속도 (순발력)",
  inhibition: "충동조절"
};

function makePlayId() {
  return `play_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function loadRecommendedPlays() {
  if (!playTable) return;
  playTable.innerHTML = `<tr><td colspan="8" class="loading-msg">추천놀이를 불러오는 중...</td></tr>`;

  try {
    const snap = await getDocs(collection(db, "recommendedPlays"));
    recommendedPlays = snap.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    renderRecommendedPlays();
  } catch (err) {
    console.error("추천놀이 로드 실패:", err);
    playTable.innerHTML = `<tr><td colspan="8" class="error-msg">추천놀이 로드 실패: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function renderRecommendedPlays() {
  if (!playTable) return;
  const countEl = document.getElementById("play-row-count");
  if (countEl) countEl.textContent = `총 ${recommendedPlays.length}개`;

  if (!recommendedPlays.length) {
    playTable.innerHTML = `<tr><td colspan="8" class="loading-msg">등록된 추천놀이가 없습니다.</td></tr>`;
    return;
  }

  const sorted = [...recommendedPlays].sort((a, b) => {
    const areaCompare = String(a.area || "").localeCompare(String(b.area || ""));
    if (areaCompare) return areaCompare;
    return (Number(a.order) || 999) - (Number(b.order) || 999);
  });

  playTable.innerHTML = sorted.map(item => {
    const thumb = item.thumbnail
      ? `<img class="play-thumb" src="${escapeAttr(item.thumbnail)}" alt=""/>`
      : `<span class="score-empty">없음</span>`;
    const status = item.enabled === false
      ? `<span class="play-status-off">미사용</span>`
      : `<span class="play-status-on">사용</span>`;

    return `<tr>
      <td><strong>${escapeHtml(PLAY_AREA_LABELS[item.area] || item.area || "-")}</strong></td>
      <td class="count-cell">${escapeHtml(item.order ?? "-")}</td>
      <td><strong>${escapeHtml(item.title || "-")}</strong></td>
      <td>${thumb}</td>
      <td class="play-desc-cell">${escapeHtml(item.description || "-")}</td>
      <td class="play-link-cell">${item.link ? `<a href="${escapeAttr(item.link)}" target="_blank" rel="noopener">${escapeHtml(item.link)}</a>` : "-"}</td>
      <td>${status}</td>
      <td>
        <div class="play-row-actions">
          <button type="button" class="play-edit-btn" data-play-id="${escapeAttr(item.id)}">수정</button>
          <button type="button" class="play-delete-btn" data-play-id="${escapeAttr(item.id)}">삭제</button>
        </div>
      </td>
    </tr>`;
  }).join("");

  playTable.querySelectorAll(".play-edit-btn").forEach(button => {
    button.addEventListener("click", () => editRecommendedPlay(button.dataset.playId));
  });
  playTable.querySelectorAll(".play-delete-btn").forEach(button => {
    button.addEventListener("click", () => deleteRecommendedPlay(button.dataset.playId));
  });
}

async function saveRecommendedPlay(event) {
  event.preventDefault();
  if (!playTitleInput || !playAreaInput) return;

  const id = playIdInput.value || makePlayId();
  const payload = {
    title: playTitleInput.value.trim(),
    thumbnail: playThumbInput.value.trim(),
    description: playDescInput.value.trim(),
    link: playLinkInput.value.trim(),
    area: playAreaInput.value,
    order: Number(playOrderInput.value) || 1,
    enabled: !!playEnabledInput.checked,
    updatedAt: serverTimestamp()
  };

  if (!payload.title) {
    alert("추천놀이 제목을 입력해주세요.");
    playTitleInput.focus();
    return;
  }

  try {
    playSaveBtn.disabled = true;
    playSaveBtn.textContent = "저장 중...";
    await setDoc(doc(db, "recommendedPlays", id), payload, { merge: true });
    resetPlayForm();
    await loadRecommendedPlays();
    alert("추천놀이가 저장되었습니다.");
  } catch (err) {
    console.error("추천놀이 저장 실패:", err);
    alert(`추천놀이 저장 실패: ${err.message}`);
  } finally {
    playSaveBtn.disabled = false;
    playSaveBtn.textContent = "저장";
  }
}

function editRecommendedPlay(id) {
  const item = recommendedPlays.find(play => play.id === id);
  if (!item) return;

  playIdInput.value = item.id || "";
  playTitleInput.value = item.title || "";
  playThumbInput.value = item.thumbnail || "";
  playDescInput.value = item.description || "";
  playLinkInput.value = item.link || "";
  playAreaInput.value = item.area || "inhibition";
  playOrderInput.value = item.order || 1;
  playEnabledInput.checked = item.enabled !== false;
  playSaveBtn.textContent = "수정 저장";
  playTitleInput.focus();
}

async function deleteRecommendedPlay(id) {
  const item = recommendedPlays.find(play => play.id === id);
  if (!item) return;
  if (!confirm(`추천놀이 "${item.title || id}"을 삭제할까요?`)) return;

  try {
    await deleteDoc(doc(db, "recommendedPlays", id));
    await loadRecommendedPlays();
  } catch (err) {
    console.error("추천놀이 삭제 실패:", err);
    alert(`추천놀이 삭제 실패: ${err.message}`);
  }
}

function resetPlayForm() {
  playForm?.reset();
  if (playIdInput) playIdInput.value = "";
  if (playAreaInput) playAreaInput.value = "inhibition";
  if (playOrderInput) playOrderInput.value = "1";
  if (playEnabledInput) playEnabledInput.checked = true;
  if (playSaveBtn) playSaveBtn.textContent = "저장";
}

function groupRowsByChild(rows, order = "desc") {
  const map = new Map();

  rows.forEach(row => {
    if (!row || !row.childKey) return;

    const existing = map.get(row.childKey);
    if (!existing) {
      map.set(row.childKey, row);
      return;
    }

    if ((row.sortMs || 0) > (existing.sortMs || 0)) {
      map.set(row.childKey, row);
    }
  });

  return Array.from(map.values())
    .sort((a, b) => {
      const diff = (a.sortMs || 0) - (b.sortMs || 0);
      return order === "asc" ? diff : -diff;
    });
}

function applyFilter() {
  const q       = searchInput.value.trim().toLowerCase();
  const grade   = filterGrade.value;
  const complete= filterComplete.value;
  const weekday = filterWeekday?.value || "";
  const order = sortOrder?.value || "desc";
  const appLaunch = filterAppLaunch?.value || "";
  
  if(thCheck) thCheck.checked = false;

  const matchedRows = allRows.filter(row => {
    const rowDate = row.sortMs ? new Date(row.sortMs) : null;
    const matchSearch = !q ||
      row.childName.toLowerCase().includes(q) ||
      row.childId.toLowerCase().includes(q) ||
      row.childKey.toLowerCase().includes(q) ||
      row.userEmail.toLowerCase().includes(q);
    const matchGrade  = !grade || row.gradeText.includes(grade);
    const matchDone   = complete === ""
      ? true
      : complete === "done" ? row.isComplete : !row.isComplete;
    const matchWeekday = !weekday || (rowDate && String(rowDate.getDay()) === weekday);
    const hasAppLaunch = !!(row.appLaunchInfo && row.appLaunchInfo.seen);
    const matchAppLaunch = appLaunch === ""
      ? true
      : appLaunch === "seen" ? hasAppLaunch : !hasAppLaunch;
    return matchSearch && matchGrade && matchDone && matchWeekday && matchAppLaunch;
  });

  currentFilteredRows = groupRowsByChild(matchedRows, order);
  resultCurrentPage = 1;

  rowCountEl.textContent = `총 ${currentFilteredRows.length}명`;
  renderResultAverageSummary(currentFilteredRows, grade);
  renderPagedTable();
}

function renderPagedTable() {
  const totalPages = Math.max(1, Math.ceil(currentFilteredRows.length / RESULT_PAGE_SIZE));
  resultCurrentPage = Math.min(Math.max(1, resultCurrentPage), totalPages);
  const start = (resultCurrentPage - 1) * RESULT_PAGE_SIZE;
  currentPageRows = currentFilteredRows.slice(start, start + RESULT_PAGE_SIZE);
  renderTable(currentPageRows, start);
  renderPagination(totalPages);
}

function renderTable(rows, startIndex = 0) {
  if (!rows.length) {
    resultTable.innerHTML = `<tr><td colspan="16" class="loading-msg">검색 결과가 없습니다.</td></tr>`;
    currentPageRows = [];
    return;
  }

  resultTable.innerHTML = rows.map((row, index) => {
    const doneBadge = row.isComplete
      ? `<span class="badge badge-done">완료</span>`
      : `<span class="badge badge-undone">미완료</span>`;
    const genderText = row.gender === "male" ? "남" : row.gender === "female" ? "여" : row.gender;
    const childIdLabel = row.childId || row.childKey || "-";
    const appLaunchText = formatAppLaunchStatus(row.appLaunchInfo);
    const overallCell = v => v === "-" ? `<td class="score-empty score-overall-col">-</td>` : `<td class="score score-overall score-overall-col">${escapeHtml(v)}</td>`;
    const scoreCell  = (v, meta = "") => v === "-"
      ? `<td class="score-empty">-</td>`
      : `<td class="score score-detail"><span class="score-value">${escapeHtml(v)}</span>${meta ? `<span class="score-level">${escapeHtml(meta)}</span>` : ""}</td>`;

    return `<tr>
      <td class="td-check-cell">
        <input type="checkbox" class="td-check" data-index="${startIndex + index}" data-page-index="${index}"/>
      </td>
      <td class="date-cell">${escapeHtml(row.date)}</td>
      <td class="email-cell">${escapeHtml(row.userEmail)}</td>
      <td>
        <button type="button" class="child-id-btn" data-child-key="${escapeAttr(row.childKey)}" title="성장 그래프 보기">
          ${escapeHtml(shortId(childIdLabel))}
        </button>
      </td>
      <td><strong>${escapeHtml(row.childName)}</strong></td>
      <td class="count-cell">${escapeHtml(row.testCount)}</td>
      <td>${escapeHtml(row.gradeText)}</td>
      <td>${escapeHtml(genderText)}</td>
      ${overallCell(row.overall)}
      ${scoreCell(row.attention, row.levelMeta?.attention)}
      ${scoreCell(row.memory, row.levelMeta?.memory)}
      ${scoreCell(row.reaction, row.levelMeta?.reaction)}
      ${scoreCell(row.visual, row.levelMeta?.visual)}
      ${scoreCell(row.inhibition, row.levelMeta?.inhibition)}
      <td class="app-launch-cell">${escapeHtml(appLaunchText)}</td>
      <td>${doneBadge}</td>
    </tr>`;
  }).join("");

  const mainTable = document.getElementById("main-table");
  mainTable?.querySelectorAll("thead th").forEach((th, index) => {
    th.classList.toggle("score-overall-head", index === 8);
    th.classList.toggle("score-detail-head", index >= 9 && index <= 13);
  });

  resultTable.querySelectorAll(".child-id-btn").forEach(button => {
    button.addEventListener("click", () => openChildDetail(button.dataset.childKey));
  });
}

function renderPagination(totalPages) {
  if (!resultPagination) return;

  if (totalPages <= 1) {
    resultPagination.innerHTML = "";
    return;
  }

  resultPagination.innerHTML = Array.from({ length: totalPages }, (_, index) => {
    const page = index + 1;
    return `<button type="button" class="${page === resultCurrentPage ? "active" : ""}" data-page="${page}">${page}</button>`;
  }).join("");

  resultPagination.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      resultCurrentPage = Number(button.dataset.page) || 1;
      if (thCheck) thCheck.checked = false;
      renderPagedTable();
    });
  });
}

function toAverageNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function addAverageValue(bucket, key, value) {
  const num = toAverageNumber(value);
  if (num === null) return;
  bucket[key] = (bucket[key] || 0) + num;
  bucket[`${key}Count`] = (bucket[`${key}Count`] || 0) + 1;
}

function getAverage(bucket, key, digits = 0) {
  const count = bucket[`${key}Count`] || 0;
  if (!count) return "-";
  const value = bucket[key] / count;
  return digits > 0 ? value.toFixed(digits) : String(Math.round(value));
}

function buildAverageBucket(rows = []) {
  const bucket = { count: 0 };
  rows.filter(row => row.isComplete).forEach(row => {
    bucket.count++;
    addAverageValue(bucket, "overall", row.overall);
    addAverageValue(bucket, "attention", row.attention);
    addAverageValue(bucket, "memory", row.memory);
    addAverageValue(bucket, "reaction", row.reaction);
    addAverageValue(bucket, "visual", row.visual);
    addAverageValue(bucket, "inhibition", row.inhibition);
  });
  return bucket;
}

function renderResultAverageSummary(rows = [], grade = "") {
  if (!resultAverageRow) return;

  const bucket = buildAverageBucket(rows);
  const title = grade ? `${grade} 평균` : "전체 평균";
  const items = [
    ["종합", getAverage(bucket, "overall")],
    ["집중 유지력", getAverage(bucket, "attention")],
    ["작업 기억력", getAverage(bucket, "memory")],
    ["반응 속도", getAverage(bucket, "reaction")],
    ["시각 탐색", getAverage(bucket, "visual")],
    ["충동 억제", getAverage(bucket, "inhibition")]
  ];
  const countText = bucket.count ? `완료 ${bucket.count}건 기준` : "평균을 계산할 완료 검사 데이터가 없습니다.";

  resultAverageRow.innerHTML = `
    <th colspan="8" class="average-context-cell">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(countText)}</span>
    </th>
    ${items.map(([label, value], index) => `
      <th class="average-score-cell ${index === 0 ? "overall" : ""}">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(bucket.count ? value : "-")}</strong>
      </th>
    `).join("")}
    <th class="average-app-cell"></th>
  `;
}
function getGradeSortValue(gradeText = "") {
  const text = String(gradeText || "");
  if (text.includes("미취") || text.includes("誘몄")) return 0;
  const match = text.match(/[1-6]/);
  if (match) return Number(match[0]);
  if (text.includes("어른") || text.includes("?대") || text.toLowerCase().includes("adult")) return 7;
  return 99;
}

function renderGradeStats(rows = []) {
  if (!gradeStatsTable) return;

  const completed = rows.filter(row => isCompleteResult(row));
  if (gradeStatsTotal) gradeStatsTotal.textContent = `완료 검사 ${completed.length}건 기준`;

  if (!completed.length) {
    gradeStatsTable.innerHTML = `<tr><td colspan="9" class="loading-msg">표시할 완료 검사 데이터가 없습니다.</td></tr>`;
    return;
  }

  const buckets = new Map();
  completed.forEach(row => {
    const grade = row.gradeText || "-";
    if (!buckets.has(grade)) {
      buckets.set(grade, { grade, count: 0 });
    }

    const bucket = buckets.get(grade);
    bucket.count++;
    addAverageValue(bucket, "overall", row.overall);
    addAverageValue(bucket, "attention", row.attention);
    addAverageValue(bucket, "memory", row.memory);
    addAverageValue(bucket, "reaction", row.reaction);
    addAverageValue(bucket, "visual", row.visual);
    addAverageValue(bucket, "inhibition", row.inhibition);

    const raw = row.raw || {};
    addAverageValue(bucket, "attentionSec", parseFloat(raw.schulteTime || raw.attentionTime));
    addAverageValue(bucket, "memoryLevel", raw.memoryLevel);
    addAverageValue(bucket, "reactionLevel", raw.reactionLevel);
    addAverageValue(bucket, "visualLevel", raw.visualLevel);
    addAverageValue(bucket, "flankerLevel", raw.flankerLevel);
  });

  const stats = Array.from(buckets.values()).sort((a, b) => {
    const order = getGradeSortValue(a.grade) - getGradeSortValue(b.grade);
    return order || String(a.grade).localeCompare(String(b.grade), "ko");
  });

  gradeStatsTable.innerHTML = stats.map(bucket => {
    const rawSummary = [
      `집중 ${getAverage(bucket, "attentionSec", 1)}초`,
      `기억 Lv.${getAverage(bucket, "memoryLevel", 1)}`,
      `반응 Lv.${getAverage(bucket, "reactionLevel", 1)}`,
      `탐색 Lv.${getAverage(bucket, "visualLevel", 1)}`,
      `억제 Lv.${getAverage(bucket, "flankerLevel", 1)}`
    ].join("<br>");

    return `<tr>
      <td><strong>${escapeHtml(bucket.grade)}</strong></td>
      <td>${bucket.count}</td>
      <td class="grade-stat-overall">${getAverage(bucket, "overall")}</td>
      <td>${getAverage(bucket, "attention")}</td>
      <td>${getAverage(bucket, "memory")}</td>
      <td>${getAverage(bucket, "reaction")}</td>
      <td>${getAverage(bucket, "visual")}</td>
      <td>${getAverage(bucket, "inhibition")}</td>
      <td class="grade-stat-raw">${rawSummary}</td>
    </tr>`;
  }).join("");
}

function openChildDetail(childKey) {
  const history = allRows
    .filter(row => row.childKey === childKey && row.isComplete)
    .sort((a, b) => (a.sortMs || 0) - (b.sortMs || 0));

  if (!history.length) return;

  const child = history[history.length - 1];
  childDetailTitle.textContent = `${child.childName} 상세 점수`;
  childDetailSummary.textContent = `${child.gradeText} · ${formatGender(child.gender)} · 검사 ${history.length}회 · ID ${child.childId || shortId(child.childKey)}`;
  childDetailModal.classList.remove("hidden");

  drawGrowthChart(history);
  renderGrowthList(history);
}

function closeChildDetail() {
  childDetailModal?.classList.add("hidden");
}

function drawGrowthChart(history) {
  if (!childGrowthCanvas) return;

  const ctx = childGrowthCanvas.getContext("2d");
  const rect = childGrowthCanvas.getBoundingClientRect();
  const width = Math.max(640, Math.floor(rect.width || 920));
  const height = Math.max(280, Math.floor(rect.height || 420));
  const dpr = window.devicePixelRatio || 1;

  childGrowthCanvas.width = width * dpr;
  childGrowthCanvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const values = history.map(row => Number(row.overall)).map(v => Number.isFinite(v) ? v : 0);
  const padding = { top: 28, right: 28, bottom: 54, left: 54 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const x = index => padding.left + (history.length === 1 ? chartWidth / 2 : (chartWidth * index) / (history.length - 1));
  const y = value => padding.top + chartHeight - (Math.max(0, Math.min(100, value)) / 100) * chartHeight;

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#E7E9F3";
  ctx.lineWidth = 1;
  [0, 25, 50, 75, 100].forEach(mark => {
    const yy = y(mark);
    ctx.beginPath();
    ctx.moveTo(padding.left, yy);
    ctx.lineTo(width - padding.right, yy);
    ctx.stroke();
    ctx.fillStyle = "#9AA1B2";
    ctx.font = "12px Pretendard, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(String(mark), padding.left - 10, yy + 4);
  });

  ctx.strokeStyle = "#E8532A";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  values.forEach((value, index) => {
    const xx = x(index);
    const yy = y(value);
    if (index === 0) ctx.moveTo(xx, yy);
    else ctx.lineTo(xx, yy);
  });
  ctx.stroke();

  values.forEach((value, index) => {
    const xx = x(index);
    const yy = y(value);

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(xx, yy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#E8532A";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#222";
    ctx.font = "700 12px Pretendard, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(value), xx, yy - 12);

    ctx.fillStyle = "#787F91";
    ctx.font = "12px Pretendard, sans-serif";
    ctx.fillText(formatShortDate(history[index].date), xx, height - padding.bottom + 28);
  });
}

function renderGrowthList(history) {
  if (!childGrowthList) return;

  childGrowthList.innerHTML = history.map((row, index) => `
    <div class="growth-item growth-detail-item">
      <div class="growth-item-head">
        <span>${index + 1}회차</span>
        <strong>${escapeHtml(row.overall)}점</strong>
        <em>${escapeHtml(row.date)}</em>
      </div>
      <div class="growth-score-grid">
        ${detailScoreLine("집중", row.attention, row.levelMeta?.attention)}
        ${detailScoreLine("기억", row.memory, row.levelMeta?.memory)}
        ${detailScoreLine("반응", row.reaction, row.levelMeta?.reaction)}
        ${detailScoreLine("탐색", row.visual, row.levelMeta?.visual)}
        ${detailScoreLine("억제", row.inhibition, row.levelMeta?.inhibition)}
      </div>
    </div>
  `).join("");
}

function detailScoreLine(label, score, meta = "") {
  return `
    <div class="growth-score-line">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(score)}</strong>
      <em>${escapeHtml(meta || "-")}</em>
    </div>
  `;
}

function formatGender(gender) {
  return gender === "male" ? "남" : gender === "female" ? "여" : gender || "-";
}

function shortId(value) {
  const text = String(value || "-");
  return text.length > 18 ? `${text.slice(0, 8)}...${text.slice(-6)}` : text;
}

function formatShortDate(date) {
  return String(date || "-").replace(/^(\d{4})[. -]?\s*/, "").trim();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value);
}

async function deleteSelectedRows() {
  const checkedInputs = resultTable.querySelectorAll(".td-check:checked");
  
  if (checkedInputs.length === 0) {
    alert("삭제할 최신 검사 기록을 먼저 선택해주세요.");
    return;
  }

  const targetRows = Array.from(checkedInputs)
    .map(input => {
      const filteredIndex = parseInt(input.getAttribute("data-index"), 10);
      return currentFilteredRows[filteredIndex];
    })
    .filter(row => row && row.refPath);
  const targetPaths = new Set(targetRows.map(row => row.refPath));

  if (!confirm(`정말로 선택한 최신 검사 기록 ${targetPaths.size}건을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`)) {
    return;
  }

  try {
    deleteBtn.disabled = true;
    deleteBtn.textContent = "⏳ 삭제 중...";

    const batch = writeBatch(db);

    targetPaths.forEach(refPath => {
      batch.delete(doc(db, refPath));
    });

    await batch.commit();
    alert("선택한 데이터가 성공적으로 삭제되었습니다.");
    await loadAdminData();

  } catch (err) {
    console.error("데이터 삭제 중 오류 발생:", err);
    alert(`삭제 실패: ${err.message}`);
  } finally {
    deleteBtn.disabled = false;
    deleteBtn.textContent = "🗑️ 선택 삭제";
  }
}

// [수정] 다운로드 브라우저 버그 수정 및 필터링 데이터 연동 적용
function exportCSV() {
  // 현재 화면에 필터링되어 보이는 데이터를 기준으로 다운로드 (없으면 전체 데이터)
  const targetRows = currentFilteredRows.length > 0 ? currentFilteredRows : allRows;

  if (targetRows.length === 0) {
    alert("다운로드할 데이터가 없습니다.");
    return;
  }

  const headers = ["검사일","이메일","아이ID","아이이름","검사횟수","학년","성별","종합","집중유지력","집중기록","작업기억력","작업기억레벨","반응속도","반응레벨","시각탐색","시각탐색레벨","충동억제","충동억제레벨","앱실행","완료여부"];
  const rows = targetRows.map(r => [
    r.date, r.userEmail, r.childId || r.childKey, r.childName, r.testCount, r.gradeText,
    formatGender(r.gender),
    r.overall,
    r.attention, r.levelMeta?.attention || "",
    r.memory, r.levelMeta?.memory || "",
    r.reaction, r.levelMeta?.reaction || "",
    r.visual, r.levelMeta?.visual || "",
    r.inhibition, r.levelMeta?.inhibition || "",
    formatAppLaunchStatus(r.appLaunchInfo),
    r.isComplete ? "완료" : "미완료"
  ]);

  // 데이터 내부에 쉼표(,)가 있을 경우를 대비한 래핑 및 CSV 인코딩
  const csvContent = [headers, ...rows].map(rowArray => 
    rowArray.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")
  ).join("\n");

  // Excel 한글 깨짐 방지용 BOM 설정 및 블록 생성
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `nollpic_results_${getTodayText()}.csv`;
  
  // 크롬/사파리 다운로드 거부 방지를 위해 DOM에 일시적 트리거 결합
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function getTodayText() {
  const now = new Date();
  return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getWeekStart(date) {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = startOfLocalDay(date);
  start.setDate(start.getDate() + diff);
  return start;
}

function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatShortMonthDay(date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getTrendBuckets(range = "daily") {
  if (range === "weekly") {
    const thisWeek = getWeekStart(new Date());
    return Array.from({ length: 8 }, (_, index) => {
      const date = new Date(thisWeek);
      date.setDate(thisWeek.getDate() - ((7 - index) * 7));
      const end = new Date(date);
      end.setDate(date.getDate() + 6);
      return {
        key: getLocalDateKey(date),
        label: `${formatShortMonthDay(date)}~${formatShortMonthDay(end)}`,
        count: 0
      };
    });
  }

  if (range === "monthly") {
    const thisMonth = getMonthStart(new Date());
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: `${date.getMonth() + 1}월`,
        count: 0
      };
    });
  }

  const today = startOfLocalDay(new Date());
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return {
      key: getLocalDateKey(date),
      label: `${["일", "월", "화", "수", "목", "금", "토"][date.getDay()]}\n${formatShortMonthDay(date)}`,
      count: 0
    };
  });
}

function getTrendKeyForRow(row, range) {
  const date = row.sortMs ? new Date(row.sortMs) : new Date(getDisplayDateKey(row.date));
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";

  if (range === "weekly") return getLocalDateKey(getWeekStart(date));
  if (range === "monthly") return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  return getLocalDateKey(date);
}

function getTrendCaption(range) {
  if (range === "weekly") return "최근 8주 기준";
  if (range === "monthly") return "최근 6개월 기준";
  return "최근 7일 기준";
}

function getTrendTotalLabel(range, total) {
  if (range === "weekly") return `최근 8주 ${total}건`;
  if (range === "monthly") return `최근 6개월 ${total}건`;
  return `최근 7일 ${total}건`;
}

function renderTrendChart(rows = [], range = "daily") {
  if (!trendChart) return;

  const buckets = getTrendBuckets(range);
  const bucketMap = new Map(buckets.map(bucket => [bucket.key, bucket]));

  rows.forEach(row => {
    const bucket = bucketMap.get(getTrendKeyForRow(row, range));
    if (bucket) bucket.count += 1;
  });

  const maxCount = Math.max(1, ...buckets.map(bucket => bucket.count));
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);

  if (trendChartCaption) trendChartCaption.textContent = getTrendCaption(range);
  if (trendChartTotal) trendChartTotal.textContent = getTrendTotalLabel(range, total);

  if (!buckets.length) {
    trendChart.innerHTML = `<div class="trend-empty">표시할 검사 데이터가 없습니다.</div>`;
    return;
  }

  const width = 760;
  const height = 230;
  const padding = { top: 28, right: 26, bottom: 48, left: 28 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const xStep = buckets.length > 1 ? plotWidth / (buckets.length - 1) : plotWidth;
  const points = buckets.map((bucket, index) => {
    const x = padding.left + (index * xStep);
    const y = padding.top + plotHeight - ((bucket.count / maxCount) * plotHeight);
    return { ...bucket, x, y };
  });
  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${padding.top + plotHeight} L ${points[0].x.toFixed(1)} ${padding.top + plotHeight} Z`;
  const gridLines = [0, 0.5, 1].map(ratio => {
    const y = padding.top + (plotHeight * ratio);
    return `<line class="trend-grid-line" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"></line>`;
  }).join("");

  trendChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${getTrendCaption(range)} 완료 검사 추이">
      ${gridLines}
      <path class="trend-fill" d="${areaPath}"></path>
      <path class="trend-line" d="${linePath}"></path>
      ${points.map(point => `
        <g>
          <circle class="trend-point" cx="${point.x}" cy="${point.y}" r="5"></circle>
          <text class="trend-point-count" x="${point.x}" y="${Math.max(15, point.y - 12)}">${point.count}</text>
          ${String(point.label).split("\n").map((line, lineIndex) => `
            <text class="trend-axis-label" x="${point.x}" y="${height - 24 + (lineIndex * 14)}">${line}</text>
          `).join("")}
        </g>
      `).join("")}
    </svg>
  `;
}

function getLocalDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function getDisplayDateKey(value) {
  const match = String(value || "").match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (!match) return "";
  return [
    match[1],
    String(Number(match[2])).padStart(2, "0"),
    String(Number(match[3])).padStart(2, "0")
  ].join("-");
}

function isTodayResult(sortMs, displayDate = "") {
  const todayKey = getLocalDateKey(new Date());
  const sortDateKey = sortMs ? getLocalDateKey(new Date(sortMs)) : "";
  return sortDateKey === todayKey || getDisplayDateKey(displayDate) === todayKey;
}

function normalizeGradeText(value) {
  const text = String(value || "").trim();
  if (!text || text === "-") return "-";
  if (text === "adult" || text.includes("어른")) return "어른";
  if (text === "0") return "미취학";
  if (/^[1-6]$/.test(text)) return `초${text}`;
  if (text.includes("미취학")) return "미취학";
  return text.replace("초등 ", "초").replace("학년", "");
}

function formatFirestoreDate(timestamp) {
  if (!timestamp) return null;
  if (timestamp.seconds) {
    const d = new Date(timestamp.seconds * 1000);
    return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}`;
  }
  return String(timestamp);
}

function formatFirestoreDateTime(timestamp) {
  if (!timestamp) return null;
  const d = timestamp.seconds
    ? new Date(timestamp.seconds * 1000)
    : new Date(timestamp);
  if (Number.isNaN(d.getTime())) return String(timestamp);
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getTimestampMs(value) {
  if (!value) return 0;
  if (value.seconds) return value.seconds * 1000;
  if (typeof value === "number") return value;
  const parsed = Date.parse(String(value).replace(/\./g, "-"));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getResultSortMs(result = {}, displayDate = "") {
  return getTimestampMs(result.savedAt)
    || getTimestampMs(result.createdAt)
    || Number(result.completedAtMs)
    || getTimestampMs(result.date)
    || getTimestampMs(result.testDate)
    || getTimestampMs(displayDate);
}

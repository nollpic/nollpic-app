const samples = [
  {
    child: '김놀픽 · 초2',
    date: '2026.06.01',
    overall: 82,
    comment: '지난 기록보다 7점 좋아졌어요.',
    abilities: [
      ['🎯', '집중 유지력', '슐테표 수행', 78],
      ['🧩', '작업 기억력', '위치 기억 활동', 84],
      ['⚡', '반응 속도', '빠른 반응 활동', 76],
      ['🔍', '시각 탐색력', '목표 빠르게 찾기', 88],
      ['✋', '충동 억제', '멈추고 선택하기', 83]
    ],
    history: [
      {
        date: '2026.06.01',
        summary: '최근 검사',
        scores: { attention: 78, memory: 84, reaction: 76, visual: 88, inhibition: 83 }
      },
      {
        date: '2026.05.18',
        summary: '이전 검사',
        scores: { attention: 72, memory: 78, reaction: 70, visual: 82, inhibition: 76 }
      },
      {
        date: '2026.05.04',
        summary: '첫 검사',
        scores: { attention: 67, memory: 70, reaction: 64, visual: 79, inhibition: 69 }
      }
    ],
    analysis: '최근 기록과 비교했을 때 <strong>작업 기억력</strong>과 <strong>시각 탐색력</strong>이 좋아졌어요. 반응 속도는 빠르지만 정확도를 조금 더 높이는 연습을 해보면 좋아요.'
  }
];

let index = 0;
let isHistoryOpen = false;

const scoreLabels = [
  ['attention', '🎯 집중 유지력'],
  ['memory', '🧩 작업 기억력'],
  ['reaction', '⚡ 반응 속도'],
  ['visual', '🔍 시각 탐색력'],
  ['inhibition', '✋ 충동 억제']
];


function getScoreLevel(score) {
  if (score >= 80) return 'strong';
  if (score >= 60) return 'normal';
  return 'need';
}

function getScoreLevelLabel(score) {
  const level = getScoreLevel(Number(score) || 0);
  if (level === 'strong') return '✨ 강점 영역';
  if (level === 'normal') return '👍 보통 영역';
  return '🌱 연습 필요';
}

function getAbilityFeedback(key, score) {
  const level = getScoreLevel(Number(score) || 0);
  const feedbackMap = {
    attention: {
      strong: '집중 유지력은 좋은 편입니다. 목표를 보고 순서대로 찾아가는 힘이 안정적으로 나타났어요.',
      normal: '집중 유지력은 보통 수준입니다. 컨디션이나 주변 환경에 따라 집중 시간이 달라질 수 있어요.',
      need: '집중 유지력 연습이 필요합니다. 과제를 끝까지 살피기보다 중간에 놓치거나 서두르는 모습이 나타날 수 있어요.'
    },
    memory: {
      strong: '작업 기억력은 좋은 편입니다. 방금 본 정보를 머릿속에 잠시 저장하고 활용하는 힘이 안정적으로 나타났어요.',
      normal: '작업 기억력은 보통 수준입니다. 규칙이나 위치를 기억하는 놀이를 반복하면 더 안정적으로 좋아질 수 있어요.',
      need: '작업 기억력 연습이 필요합니다. 설명을 듣고 바로 잊거나, 순서와 위치를 헷갈리는 모습이 나타날 수 있어요.'
    },
    reaction: {
      strong: '반응 속도는 좋은 편입니다. 자극을 보고 빠르게 반응하는 힘이 안정적으로 나타났어요.',
      normal: '반응 속도는 보통 수준입니다. 빠르게 누르는 것보다 정확하게 반응하는 연습을 함께 하면 좋아요.',
      need: '반응 속도 연습이 필요합니다. 화면의 변화를 알아차리고 행동으로 옮기는 시간이 다소 걸릴 수 있어요.'
    },
    visual: {
      strong: '시각 탐색력은 좋은 편입니다. 여러 정보 속에서 필요한 목표를 빠르게 찾는 힘이 안정적으로 나타났어요.',
      normal: '시각 탐색력은 보통 수준입니다. 복잡한 화면에서 목표를 찾는 놀이를 반복하면 더 좋아질 수 있어요.',
      need: '시각 탐색력 연습이 필요합니다. 여러 자극 속에서 필요한 정보를 찾을 때 놓치거나 시간이 걸릴 수 있어요.'
    },
    inhibition: {
      strong: '충동 억제는 좋은 편입니다. 하고 싶은 반응을 잠시 멈추고 규칙에 맞게 선택하는 힘이 안정적으로 나타났어요.',
      normal: '충동 억제는 보통 수준입니다. 빨리 하려는 마음이 커질 때 실수가 늘 수 있어요.',
      need: '충동 억제 연습이 필요합니다. 문제를 끝까지 보기 전에 서두르거나, 멈춰야 할 때 반응하는 모습이 나타날 수 있어요.'
    },
  };
  return feedbackMap[key]?.[level] || '오늘 검사 결과가 저장되었어요.';
}

function makeNollpicAnalysisFromScores(scores = {}) {
  const labels = [
    { key: 'attention', name: '집중 유지력', emoji: '🎯' },
    { key: 'memory', name: '작업 기억력', emoji: '🧩' },
    { key: 'reaction', name: '반응 속도', emoji: '⚡' },
    { key: 'visual', name: '시각 탐색력', emoji: '🔍' },
    { key: 'inhibition', name: '충동 억제', emoji: '✋' }
  ];

  const sorted = labels
    .map(item => ({ ...item, score: Number(scores[item.key]) || 0 }))
    .sort((a, b) => b.score - a.score);

  const best = sorted[0];
  const need = sorted[sorted.length - 1];
  const summary = `오늘 결과에서는 <strong>${best.name}</strong>이 가장 안정적으로 나타났고, <strong>${need.name}</strong>은 다음 놀이에서 조금 더 연습해보면 좋아요.`;

  const detail = labels.map(item => {
    const score = Number(scores[item.key]) || 0;
    return `
      <div class="analysis-row">
        <strong>${item.emoji} ${item.name} ${score}점 · ${getScoreLevelLabel(score)}</strong><br>
        <span>${getAbilityFeedback(item.key, score)}</span>
      </div>
    `;
  }).join('');

  const guide = `<div class="analysis-guide"><strong>추천 방향</strong><br>점수가 낮게 나온 영역은 하루 5~10분씩 짧게 반복해보세요.</div>`;
  return `${summary}<br><br>${detail}${guide}`;
}

function render(data) {
  document.getElementById('child-name').innerText = data.child;
  document.getElementById('latest-date').innerText = data.date;
  document.getElementById('overall-score').innerText = data.overall;
  document.getElementById('overall-comment').innerText = data.comment;

  document.getElementById('ability-list').innerHTML = data.abilities.map(item => `
    <div class="ability-row">
      <div class="ability-icon">${item[0]}</div>
      <div>
        <strong>${item[1]}</strong>
        <p>${item[2]}</p>
      </div>
      <div class="ability-score">${item[3]}</div>
    </div>
  `).join('');

  document.getElementById('history-list').innerHTML = data.history.map(item => `
    <div class="history-row">
      <div class="history-top">
        <strong>${item.date}</strong>
        <span>${item.summary}</span>
      </div>
      <div class="history-detail">
        ${scoreLabels.map(([key, label]) => `
          <div class="history-score-row">
            <span>${label}</span>
            <em>${item.scores[key]}점</em>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  document.getElementById('analysis-text').innerHTML = data.analysis;
  renderGrowthChart(data.history);
}

function toggleHistory() {
  isHistoryOpen = !isHistoryOpen;
  const panel = document.getElementById('history-panel');
  const icon = document.getElementById('accordion-icon');

  if (isHistoryOpen) {
    panel.classList.add('open');
    if (icon) icon.classList.add('open');
  } else {
    panel.classList.remove('open');
    if (icon) icon.classList.remove('open');
  }
}

function changeSample() {
  index = (index + 1) % samples.length;
  render(samples[index]);
}


function makeShareText() {
  const data = samples[index];

  return `
놀픽 검사 결과

아이: ${data.child}
검사일: ${data.date}

🎯 집중 유지력: ${data.abilities[0][3]}점
🧩 작업 기억력: ${data.abilities[1][3]}점
⚡ 반응 속도: ${data.abilities[2][3]}점
🔍 시각 탐색력: ${data.abilities[3][3]}점
✋ 충동 억제: ${data.abilities[4][3]}점

놀픽에서 우리 아이의 성장 기록을 확인해보세요.
`;
}

function encodeResultSharePayload(payload) {
  const json = JSON.stringify(payload);
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function getResultShareUrl() {
  return new URL('/', window.location.origin).href;
}

async function shareResult() {
  const data = samples[index];
  const shareUrl = getResultShareUrl(data);
  const shareData = {
    title: '놀픽 검사 결과',
    text: makeShareText().trim(),
    url: shareUrl
  };

  if (navigator.share) {
    await navigator.share(shareData);
  } else {
    await navigator.clipboard.writeText(`${shareData.text}\n\n${shareUrl}`);
    alert('검사 결과 링크가 복사되었습니다.');
  }
}


function safeParseLocalStorage(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (e) {
    return fallback;
  }
}

function getNollpicUserForResult() {
  return safeParseLocalStorage('nollpic_user', null);
}

function getChildrenStorageKeyForResult() {
  const user = getNollpicUserForResult();
  return user && user.uid ? `nollpic_children_${user.uid}` : 'nollpic_children_guest';
}

function getSavedChildrenForResult() {
  return safeParseLocalStorage(getChildrenStorageKeyForResult(), []);
}

function normalizeResultChild(item) {
  if (!item) return null;
  const child = item.child || item;
  if (!child || !child.name) return null;
  return {
    id: child.id || item.childId || '',
    name: child.name || item.childName || '우리 아이',
    gradeText: child.gradeText || item.gradeText || '',
    gradeValue: child.gradeValue || item.gradeValue || '',
    gender: child.gender || item.gender || ''
  };
}

function getAllChildrenForResult() {
  const children = getSavedChildrenForResult();
  const history = safeParseLocalStorage('nollpic_result_history', []);
  const latest = safeParseLocalStorage('nollpic_latest_result', null);
  const profile = safeParseLocalStorage('nollpic_child_profile', null);
  const map = new Map();

  [...children, profile].forEach(child => {
    if (!child || !child.name) return;
    const key = child.id || `${child.name}_${child.gradeText || ''}_${child.gender || ''}`;
    map.set(key, { ...child, id: child.id || key });
  });

  [latest, ...history].forEach(item => {
    if (!isCompleteResult(item)) return;
    const child = normalizeResultChild(item);
    if (!child || !child.name) return;
    const key = child.id || `${child.name}_${child.gradeText || ''}_${child.gender || ''}`;
    if (!map.has(key)) map.set(key, { ...child, id: child.id || key });
  });

  return Array.from(map.values());
}

function isSameResultChild(item, child) {
  if (!item || !child) return false;
  const itemChild = item.child || {};
  if (child.id && (item.childId === child.id || itemChild.id === child.id)) return true;
  return !!(child.name && (item.childName === child.name || itemChild.name === child.name) &&
    (item.gradeText === child.gradeText || itemChild.gradeText === child.gradeText));
}

function isCompleteResult(item) {
  if (!item || item.isComplete === false) return false;
  if (item.isComplete === true || Number(item.finishedTests) === 5) return true;
  const scores = item.scores || {};
  return ['attention', 'memory', 'reaction', 'visual', 'inhibition']
    .every(key => Number.isFinite(Number(scores[key])));
}

function getChildLabelForResult(child) {
  if (!child) return '우리 아이';
  const gradeText = child.gradeText ? child.gradeText.replace('초등 ', '초') : '';
  return gradeText ? `${child.name || '우리 아이'} · ${gradeText}` : (child.name || '우리 아이');
}

function getResultCountForChild(child) {
  const history = safeParseLocalStorage('nollpic_result_history', []);
  const latest = safeParseLocalStorage('nollpic_latest_result', null);
  const matched = [latest, ...history].filter(item => isCompleteResult(item) && isSameResultChild(item, child));
  const keys = new Set(matched.map(item => `${item?.date || ''}_${item?.overall || ''}_${JSON.stringify(item?.scores || {})}`));
  return keys.size;
}

function setupChildSelector(selectedChildId = '') {
  const selector = document.getElementById('child-selector');
  if (!selector) return null;

  const children = getAllChildrenForResult();
  selector.innerHTML = '';

  if (children.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = '아이 없음';
    selector.appendChild(option);
    selector.disabled = true;
    return null;
  }

 selector.disabled = false;

children.forEach((child, idx) => {
  const option = document.createElement('option');
  option.value = child.id || `${child.name}_${idx}`;

  const count = getResultCountForChild(child);

  const gradeText = child.gradeText
    ? child.gradeText.replace('초등 ', '초')
    : '';

  option.textContent = count > 0
    ? `${child.name || '우리 아이'} ${gradeText} (${count}회)`
    : `${child.name || '우리 아이'} ${gradeText} (기록 없음)`;

  selector.appendChild(option);
});

  const params = new URLSearchParams(window.location.search);
  const urlChildId = params.get('childId') || '';
  const storedSelected = safeParseLocalStorage('nollpic_selected_child', null);
  const targetId = selectedChildId || urlChildId || storedSelected?.id || children[0].id;
  const selectedChild = children.find(child => child.id === targetId) || children[0];

  selector.value = selectedChild.id;
  localStorage.setItem('nollpic_selected_child', JSON.stringify(selectedChild));
  localStorage.setItem('nollpic_child_profile', JSON.stringify(selectedChild));

  selector.onchange = () => {
    const child = children.find(item => item.id === selector.value) || children[0];
    localStorage.setItem('nollpic_selected_child', JSON.stringify(child));
    localStorage.setItem('nollpic_child_profile', JSON.stringify(child));
    const data = getSavedNollpicData(child.id);
    samples[0] = data;
    index = 0;
    render(data);
  };

  return selectedChild;
}

function formatHistoryItem(item, latest, summary) {
  return {
    date: item.date || latest.date,
    summary,
    scores: {
      attention: item.scores?.attention ?? 0,
      memory: item.scores?.memory ?? 0,
      reaction: item.scores?.reaction ?? 0,
      visual: item.scores?.visual ?? 0,
      inhibition: item.scores?.inhibition ?? 0
    }
  };
}

function buildDisplayHistory(items, latest) {
  const source = items.length ? items : [latest];
  const formatted = [formatHistoryItem(source[0], latest, '최근 검사')];

  if (source.length === 1) {
    formatted.push(formatHistoryItem(source[0], latest, '첫 검사'));
    return formatted;
  }

  const previousEnd = Math.min(source.length - 1, 3);
  for (let idx = 1; idx < previousEnd; idx++) {
    formatted.push(formatHistoryItem(source[idx], latest, '이전 검사'));
  }

  formatted.push(formatHistoryItem(source[source.length - 1], latest, '첫 검사'));
  return formatted;
}

function getSavedNollpicData(selectedChildId = '') {
  let latest = null;
  let history = [];
  let profile = null;

  latest = safeParseLocalStorage('nollpic_latest_result', null);
  history = safeParseLocalStorage('nollpic_result_history', []);
  profile = safeParseLocalStorage('nollpic_child_profile', null);

  history = history.filter(isCompleteResult);
  if (latest && !isCompleteResult(latest)) {
    latest = history[0] || null;
  }

  const params = new URLSearchParams(window.location.search);
  const childId = selectedChildId || params.get('childId') || profile?.id || '';

  if (profile || childId) {
    const selectedChild = getAllChildrenForResult().find(child => child.id === childId) || profile;
    const filtered = history.filter(item => isSameResultChild(item, selectedChild) && isCompleteResult(item));

    if (filtered.length > 0) {
      history = filtered;
      latest = filtered[0];
      localStorage.setItem('nollpic_latest_result', JSON.stringify(latest));
    } else if (latest) {
      const selectedChild = getAllChildrenForResult().find(child => child.id === childId) || profile;
      const isSameChild = isSameResultChild(latest, selectedChild);
      if (!isSameChild) latest = null;
    }
  }

  if (!latest) {
    const childName = profile?.name || '우리 아이';
    const gradeText = profile?.gradeText || '';
    const childLabel = gradeText ? `${childName} · ${gradeText.replace('초등 ', '초')}` : childName;
    return {
      child: childLabel,
      date: '-',
      overall: 0,
      comment: '아직 저장된 검사 기록이 없어요. 홈에서 검사를 완료하면 이곳에 기록이 쌓입니다.',
      abilities: [
        ['🎯', '집중 유지력', '검사 전', 0],
        ['🧩', '작업 기억력', '검사 전', 0],
        ['⚡', '반응 속도', '검사 전', 0],
        ['🔍', '시각 탐색력', '검사 전', 0],
        ['✋', '충동 억제', '검사 전', 0]

      ],
      history: [{
        date: '-',
        summary: '검사 기록 없음',
        scores: { attention: 0, memory: 0, reaction: 0,  visual: 0, inhibition: 0}
      }],
      analysis: '아직 이 아이의 검사 기록이 없어요. 검사를 완료하면 아이별 성장 기록이 자동으로 표시됩니다.'
    };
  }

  const childName = latest.child?.name || profile?.name || '우리 아이';
  const gradeText = latest.child?.gradeText || profile?.gradeText || '';
  const childLabel = gradeText ? `${childName} · ${gradeText.replace('초등 ', '초')}` : childName;

  const currentScores = latest.scores || {};
  const historyItems = history.length ? history : [latest];

  // 표시용 중복 제거: 같은 날짜 + 동일 점수는 첫 번째만 유지
  const seenKeys = new Set();
  const dedupedHistory = historyItems.filter(item => {
    const key = `${item.date}_${item.overall}_${item.scores?.attention}_${item.scores?.memory}_${item.scores?.reaction}`;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  const formattedHistory = buildDisplayHistory(dedupedHistory, latest);

  const previous = formattedHistory[1];
  const diff = previous ? (latest.overall - Math.round((previous.scores.attention + previous.scores.memory + previous.scores.reaction + previous.scores.inhibition + previous.scores.visual) / 5)) : 0;
  const comment = diff > 0
    ? `지난 기록보다 ${diff}점 좋아졌어요.`
    : diff < 0
      ? `지난 기록보다 ${Math.abs(diff)}점 낮아졌지만 다시 연습하면 좋아질 수 있어요.`
      : '오늘의 기준 기록이 저장되었어요.';

  return {
    child: childLabel,
    date: latest.date,
    overall: latest.overall,
    comment,
    abilities: [
      ['🎯', '집중 유지력', '슐테표 수행', currentScores.attention ?? 0],
      ['🧩', '작업 기억력', '위치 기억 활동', currentScores.memory ?? 0],
      ['⚡', '반응 속도', '빠른 반응 활동', currentScores.reaction ?? 0],
      ['🔍', '시각 탐색력', '목표 빠르게 찾기', currentScores.visual ?? 0],
      ['✋', '충동 억제', '멈추고 선택하기', currentScores.inhibition ?? 0]
    ],
    history: formattedHistory,
    analysis: makeNollpicAnalysisFromScores(currentScores)
  };
}

function initNollpicResult() {
  const selectedChild = setupChildSelector();
  const savedData = getSavedNollpicData(selectedChild?.id || '');
  if (savedData) {
    samples[0] = savedData;
  }
  render(samples[index]);
}

let growthChart = null;

function getShortDate(dateText) {
  const parts = dateText.split('.');
  if (parts.length >= 3) {
    return `${Number(parts[1])}/${Number(parts[2])}`;
  }
  return dateText;
}

function renderGrowthChart(history) {
  const chartCanvas = document.getElementById('growthChart');
  if (!chartCanvas || typeof Chart === 'undefined') return;

  const orderedHistory = [...history].reverse();
  const labels = orderedHistory.map(item => getShortDate(item.date));

  const first = orderedHistory[0].scores;
  const last = orderedHistory[orderedHistory.length - 1].scores;

  const growthList = [
    { key: 'attention', label: '집중력', diff: last.attention - first.attention },
    { key: 'memory', label: '기억력', diff: last.memory - first.memory },
    { key: 'reaction', label: '반응속도', diff: last.reaction - first.reaction },
    { key: 'visual', label: '시각탐색', diff: last.visual - first.visual },
    { key: 'inhibition', label: '충동억제', diff: last.inhibition - first.inhibition }
  ];

  const bestGrowth = growthList.sort((a, b) => b.diff - a.diff)[0];
  const summary = document.getElementById('growth-summary');
  const badge = document.getElementById('growth-badge');

  if (summary) {
    summary.innerHTML = `${bestGrowth.label}이 가장 크게 성장했어요 <strong>+${bestGrowth.diff}점</strong>`;
  }

  if (badge) {
    badge.innerText = bestGrowth.diff > 0 ? `+${bestGrowth.diff}점` : '확인중';
  }

  if (growthChart) {
    growthChart.destroy();
  }

  growthChart = new Chart(chartCanvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '집중력',
          data: orderedHistory.map(item => item.scores.attention),
          borderColor: '#FF6B00',
          backgroundColor: 'rgba(255,107,0,0.08)',
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: '기억력',
          data: orderedHistory.map(item => item.scores.memory),
          borderColor: '#0E1D3E',
          backgroundColor: 'rgba(14,29,62,0.08)',
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: '반응속도',
          data: orderedHistory.map(item => item.scores.reaction),
          borderColor: '#F59E0B',
          backgroundColor: 'rgba(245,158,11,0.08)',
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: '시각탐색',
          data: orderedHistory.map(item => item.scores.visual),
          borderColor: '#8B5CF6',
          backgroundColor: 'rgba(139,92,246,0.08)',
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: '충동억제',
          data: orderedHistory.map(item => item.scores.inhibition),
          borderColor: '#22C55E',
          backgroundColor: 'rgba(34,197,94,0.08)',
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { top: 4, bottom: 4, left: 0, right: 4 }
      },
      plugins: {
        legend: {
          position: 'bottom',
          onClick: null,
          labels: {
            boxWidth: 8,
            boxHeight: 8,
            padding: 12,
            usePointStyle: true,
            pointStyle: 'circle',
            font: { size: 10, weight: '700' },
            color: '#5b5562'
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            font: { size: 10 },
            color: '#8892A0'
          },
          grid: {
            color: 'rgba(14,29,62,0.05)'
          },
          border: { dash: [4, 4] }
        },
        x: {
          ticks: {
            font: { size: 10 },
            color: '#8892A0'
          },
          grid: { display: false }
        }
      }
    }
  });
}

initNollpicResult();

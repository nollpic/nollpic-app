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
      ['✋', '충동 억제', '멈추고 선택하기', 83],
      ['🔍', '시각 탐색력', '목표 빠르게 찾기', 88]
    ],
    history: [
      {
        date: '2026.06.01',
        summary: '최근 검사',
        scores: { attention: 78, memory: 84, reaction: 76, inhibition: 83, visual: 88 }
      },
      {
        date: '2026.05.18',
        summary: '이전 검사',
        scores: { attention: 72, memory: 78, reaction: 70, inhibition: 76, visual: 82 }
      },
      {
        date: '2026.05.04',
        summary: '첫 검사',
        scores: { attention: 67, memory: 70, reaction: 64, inhibition: 69, visual: 79 }
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
  ['inhibition', '✋ 충동 억제'],
  ['visual', '🔍 시각 탐색력']
];

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
    icon.innerText = '⌃';
  } else {
    panel.classList.remove('open');
    icon.innerText = '⌄';
  }
}

function changeSample() {
  index = (index + 1) % samples.length;
  render(samples[index]);
}

function makeShareText() {
  const data = samples[index];
  return `놀픽 검사 결과\n${data.child}\n${data.date}\n종합 결과: ${data.overall}점\n집중 유지력: ${data.abilities[0][3]}점\n작업 기억력: ${data.abilities[1][3]}점\n반응 속도: ${data.abilities[2][3]}점\n충동 억제: ${data.abilities[3][3]}점\n시각 탐색력: ${data.abilities[4][3]}점`;
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
✋ 충동 억제: ${data.abilities[3][3]}점
🔍 시각 탐색력: ${data.abilities[4][3]}점

놀픽에서 우리 아이의 성장 기록을 확인해보세요.
`;
}

async function shareResult() {

    const shareUrl = window.location.href;

    const shareData = {
        title: "놀픽 검사 결과",
        text: "우리 아이의 검사 결과를 확인해보세요!",
        url: shareUrl
    };

    if (navigator.share) {
        await navigator.share(shareData);
    } else {
        await navigator.clipboard.writeText(shareUrl);
        alert("링크가 복사되었습니다.");
    }
}



function getSavedNollpicData() {
  let latest = null;
  let history = [];
  let profile = null;

  try {
    latest = JSON.parse(localStorage.getItem('nollpic_latest_result'));
  } catch (e) {
    latest = null;
  }

  try {
    history = JSON.parse(localStorage.getItem('nollpic_result_history')) || [];
  } catch (e) {
    history = [];
  }

  try {
    profile = JSON.parse(localStorage.getItem('nollpic_child_profile'));
  } catch (e) {
    profile = null;
  }

  const params = new URLSearchParams(window.location.search);
  const childId = params.get('childId') || profile?.id || '';

  if (profile || childId) {
    const filtered = history.filter(item => {
      const itemChild = item.child || {};
      if (childId && itemChild.id && itemChild.id === childId) return true;
      if (!profile) return false;
      return itemChild.name === profile.name && itemChild.gradeText === profile.gradeText;
    });

    if (filtered.length > 0) {
      history = filtered;
      latest = filtered[0];
      localStorage.setItem('nollpic_latest_result', JSON.stringify(latest));
    } else if (latest) {
      const latestChild = latest.child || {};
      const isSameChild = (childId && latestChild.id && latestChild.id === childId) ||
        (profile && latestChild.name === profile.name && latestChild.gradeText === profile.gradeText);
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
        ['✋', '충동 억제', '검사 전', 0],
        ['🔍', '시각 탐색력', '검사 전', 0]
      ],
      history: [{
        date: '-',
        summary: '검사 기록 없음',
        scores: { attention: 0, memory: 0, reaction: 0, inhibition: 0, visual: 0 }
      }],
      analysis: '아직 이 아이의 검사 기록이 없어요. 검사를 완료하면 아이별 성장 기록이 자동으로 표시됩니다.'
    };
  }

  const childName = latest.child?.name || profile?.name || '우리 아이';
  const gradeText = latest.child?.gradeText || profile?.gradeText || '';
  const childLabel = gradeText ? `${childName} · ${gradeText.replace('초등 ', '초')}` : childName;

  const currentScores = latest.scores || {};
  const historyItems = history.length ? history : [latest];

  const formattedHistory = historyItems.slice(0, 5).map((item, idx) => ({
    date: item.date || latest.date,
    summary: idx === 0 ? '최근 검사' : '이전 검사',
    scores: {
      attention: item.scores?.attention ?? 0,
      memory: item.scores?.memory ?? 0,
      reaction: item.scores?.reaction ?? 0,
      inhibition: item.scores?.inhibition ?? 0,
      visual: item.scores?.visual ?? 0
    }
  }));

  if (formattedHistory.length === 1) {
    const only = formattedHistory[0];
    formattedHistory.push({
      date: only.date,
      summary: '첫 검사',
      scores: { ...only.scores }
    });
  }

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
      ['✋', '충동 억제', '멈추고 선택하기', currentScores.inhibition ?? 0],
      ['🔍', '시각 탐색력', '목표 빠르게 찾기', currentScores.visual ?? 0]
    ],
    history: formattedHistory,
    analysis: latest.analysis || '오늘 검사 결과가 저장되었어요. 낮게 나온 영역은 다음 놀이에서 한 번 더 연습해보면 좋아요.'
  };
}

function initNollpicResult() {
  const savedData = getSavedNollpicData();
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
    { key: 'inhibition', label: '충동억제', diff: last.inhibition - first.inhibition },
    { key: 'visual', label: '시각탐색', diff: last.visual - first.visual }
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
          borderColor: '#ff7a59',
          backgroundColor: 'rgba(255,122,89,0.12)',
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: '기억력',
          data: orderedHistory.map(item => item.scores.memory),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34,197,94,0.12)',
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: '반응속도',
          data: orderedHistory.map(item => item.scores.reaction),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.12)',
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: '충동억제',
          data: orderedHistory.map(item => item.scores.inhibition),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.12)',
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: '시각탐색',
          data: orderedHistory.map(item => item.scores.visual),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139,92,246,0.12)',
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          onClick: null,
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            padding: 12,
            usePointStyle: true,
            pointStyle: 'circle',
            font: { size: 11, weight: '700' }
          }
        }
      },
      scales: {
        y: {
          min: 50,
          max: 100,
          ticks: {
            stepSize: 10,
            font: { size: 10 }
          },
          grid: {
            color: 'rgba(14,29,62,0.08)'
          }
        },
        x: {
          ticks: {
            font: { size: 10 }
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

initNollpicResult();

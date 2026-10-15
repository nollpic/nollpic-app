(function (root) {
  'use strict';
  /* 2026-10-15 개편: 학년(저학년 1~3 · 고학년 4~6)에 따라 5구간 계획이 정해지고, 구간마다 목표 보석이 바뀜.
     뒤 구간으로 갈수록 헷갈리는 보석이 늘어남. 차이는 "딱 하나, 잘 보면 분명히 보이게"(색 하나 · 깎임 하나 · 금 · 방향)
     type: basic 한 종류 찾기 · pair 두 종류 함께 · crack 금 간 보석은 빼고 · flip 바로 선 것만 · switch 찾는 중에 목표가 바뀜
     confuse: sameColor 같은 색 다른 모양 · sameShape 같은 모양 다른 색 · similarColor 비슷한 색(파랑↔보라, 빨강↔분홍)
              similarCut 비슷한 깎임(육각↔팔각) · crack 금 간 목표 보석 · flip 거꾸로 선 목표 보석
     filler: far 색도 모양도 목표와 다름(쉬움) · any 아무 보석 */
  const config = {
    gameId: 'ATT-001', title: '크리스탈 광산', primaryDomain: 'attention', secondaryDomains: [],
    gameVersion: '2.0.0', rulesVersion: '2.0.0', estimatedSeconds: 75,
    entry: 'minigames/crystal-mine/index.html', thumbnail: 'minigames/crystal-mine/thumbnail.svg',
    rounds: 5, durationMs: 90000, correctPoints: 100, wrongPenalty: 30, simulatedReward: 20, wrongFeedbackMs: 450,
    colors: ['blue', 'purple', 'green', 'red', 'pink', 'gold'],
    shapes: ['diamond', 'hexagon', 'octagon', 'drop', 'heart', 'star'],
    similarColor: { blue: 'purple', purple: 'blue', red: 'pink', pink: 'red' },
    similarCut: { hexagon: 'octagon', octagon: 'hexagon' },
    /* 갈수록 확실히 어렵게 (2026-10-15 2차: "거의 같은 레벨로 이어지는 느낌" 의견)
       저학년: 8구간(제한 150초). 3×3 몸풀기 → 4×4 → 6구간 새 규칙(금 간 보석) → 5×5
       고학년: 90초 타임어택, 목표 10구간
         1~5  규칙 배우기: 한 판에 헷갈림 한 가지
         6~10 규칙 겹치기: 한 판에 헷갈림 두 가지 (예: 금 + 비슷한 색)
         11~  깊은 광산(loop를 반복): 6×6, 찾을 개수·헷갈리는 보석 더 많이, 헷갈림 세 가지 */
    bands: {
      lower: { label: '저학년 탐험', description: '1~3학년 · 8구간, 뒤로 갈수록 판이 커지고 새 규칙이 나와요!', durationMs: 150000, rounds: [
        { size: 3, type: 'basic', count: 2, filler: 'far' },
        { size: 3, type: 'basic', count: 2, confuse: { sameColor: 2 }, filler: 'far' },
        { size: 3, type: 'basic', count: 3, confuse: { sameShape: 2 }, filler: 'any' },
        { size: 4, type: 'basic', count: 3, confuse: { sameColor: 2, sameShape: 2 }, filler: 'any' },
        { size: 4, type: 'pair', count: 2, confuse: { sameColor: 2 }, filler: 'any' },
        { size: 4, type: 'crack', count: 3, confuse: { crack: 2, sameShape: 2 }, filler: 'any' },
        { size: 5, type: 'basic', count: 4, confuse: { sameColor: 3, sameShape: 3 }, filler: 'any' },
        { size: 5, type: 'pair', count: 3, confuse: { sameColor: 2, sameShape: 2 }, filler: 'any' }
      ] },
      upper: { label: '고학년 타임어택', description: '4~6학년 · 90초, 갈수록 깊고 어려운 광산! 목표는 10구간!', durationMs: 90000, timeAttack: true, goal: 10, rounds: [
        { size: 4, type: 'basic', count: 3, confuse: { similarCut: 3, sameColor: 2 }, filler: 'any' },
        { size: 5, type: 'basic', count: 4, confuse: { similarColor: 4, sameShape: 2 }, filler: 'any' },
        { size: 5, type: 'crack', count: 4, confuse: { crack: 4, sameColor: 2 }, filler: 'any' },
        { size: 5, type: 'flip', count: 4, confuse: { flip: 4, sameColor: 2 }, filler: 'any' },
        { size: 5, type: 'switch', count: 3, confuse: { sameColor: 2 }, filler: 'any' },
        { size: 5, type: 'basic', count: 4, confuse: { similarColor: 3, similarCut: 3 }, filler: 'any' },
        { size: 5, type: 'crack', count: 4, confuse: { crack: 3, similarColor: 3 }, filler: 'any' },
        { size: 5, type: 'flip', count: 4, confuse: { flip: 3, similarColor: 3 }, filler: 'any' },
        { size: 5, type: 'pair', count: 3, confuse: { similarColor: 2, sameShape: 2 }, filler: 'any' },
        { size: 5, type: 'switch', count: 4, confuse: { similarColor: 3, sameShape: 2 }, filler: 'any' }
      ], loop: [
        { size: 6, type: 'crack', count: 5, confuse: { crack: 4, similarCut: 4, sameColor: 2 }, filler: 'any' },
        { size: 6, type: 'flip', count: 5, confuse: { flip: 4, similarColor: 4, sameShape: 2 }, filler: 'any' },
        { size: 6, type: 'switch', count: 4, confuse: { similarColor: 3, similarCut: 3, sameColor: 2 }, filler: 'any' },
        { size: 6, type: 'pair', count: 4, confuse: { similarColor: 3, sameShape: 3 }, filler: 'any' },
        { size: 6, type: 'crack', count: 6, confuse: { crack: 5, similarColor: 4, similarCut: 3 }, filler: 'any' }
      ] }
    }
  };
  const deepFreeze = o => { Object.values(o).forEach(v => { if (v && typeof v === 'object') deepFreeze(v); }); return Object.freeze(o); };
  deepFreeze(config);
  if (typeof module === 'object' && module.exports) module.exports = config;
  else root.NollpicCrystalConfig = config;
})(typeof window === 'object' ? window : globalThis);

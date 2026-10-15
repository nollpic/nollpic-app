(function (root) {
  'use strict';
  const config = {
    gameId: 'ATT-001', title: '크리스탈 광산', primaryDomain: 'attention', secondaryDomains: [],
    gameVersion: '1.1.0', rulesVersion: '1.1.0', estimatedSeconds: 120,
    entry: 'minigames/crystal-mine/index.html', thumbnail: 'minigames/crystal-mine/thumbnail.svg',
    rounds: 5, durationMs: 90000, correctPoints: 100, wrongPenalty: 30, simulatedReward: 20, wrongFeedbackMs: 450,
    difficulties: {
      1: { size: 3, targetCount: 2, target: { color: 'blue', shape: 'diamond', star: false }, label: '파란 마름모 보석' },
      2: { size: 4, targetCount: 3, target: { color: 'blue', shape: 'square', star: false }, label: '파란 네모 보석' },
      3: { size: 5, targetCount: 4, target: { color: 'blue', shape: 'diamond', star: false }, label: '별 없는 파란 마름모 보석' }
    }
  };
  Object.values(config.difficulties).forEach(d => { Object.freeze(d.target); Object.freeze(d); });
  Object.freeze(config.difficulties); Object.freeze(config);
  if (typeof module === 'object' && module.exports) module.exports = config;
  else root.NollpicCrystalConfig = config;
})(typeof window === 'object' ? window : globalThis);

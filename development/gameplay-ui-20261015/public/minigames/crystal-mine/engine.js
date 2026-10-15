(function (root) {
  'use strict';
  const config = typeof module === 'object' && module.exports ? require('./config.js') : root.NollpicCrystalConfig;
  const copy = value => JSON.parse(JSON.stringify(value));
  const matches = (gem, target) => gem.color === target.color && gem.shape === target.shape && gem.star === target.star;
  function randomFrom(seed) {
    let value = seed >>> 0;
    return () => { value += 0x6D2B79F5; let t = value; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function generateBoard(difficulty, random) {
    const d = config.difficulties[difficulty];
    if (!d) throw Error('Unknown difficulty');
    const pool = ['blue', 'pink', 'green', 'gold'].flatMap(color => ['diamond', 'square', 'hexagon'].map(shape => ({ color, shape, star: false })));
    let distractors = pool.filter(x => !matches(x, d.target));
    let required = [];
    if (difficulty === 1) distractors = distractors.filter(x => x.color !== d.target.color && x.shape !== d.target.shape);
    if (difficulty >= 2) required = [{ color: 'blue', shape: difficulty === 2 ? 'diamond' : 'square', star: false }, { color: 'pink', shape: d.target.shape, star: false }];
    if (difficulty === 3) { const starred = { ...d.target, star: true }; distractors = distractors.filter(x => x.color === d.target.color || x.shape === d.target.shape); distractors.push(starred); required.push(starred); }
    const board = [...Array.from({ length: d.targetCount }, () => ({ ...d.target })), ...required];
    while (board.length < d.size ** 2) board.push({ ...distractors[Math.floor(random() * distractors.length)] });
    for (let i = board.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [board[i], board[j]] = [board[j], board[i]]; }
    const targets = board.filter(x => matches(x, d.target)).length;
    if (board.length !== d.size ** 2 || targets !== d.targetCount || targets < 1) throw Error('Invalid target board');
    return board.map((gem, id) => ({ ...gem, id, selected: false, correct: matches(gem, d.target) }));
  }
  function score(correct, wrong) { return Math.max(0, correct * config.correctPoints - wrong * config.wrongPenalty); }
  function stars(accuracy, completed, mode) { return completed && mode === 'challenge' ? accuracy >= .9 ? 3 : accuracy >= .8 ? 2 : 1 : 0; }
  function median(values) { if (!values.length) return null; const v = [...values].sort((a,b) => a-b), m = Math.floor(v.length / 2); return v.length % 2 ? v[m] : (v[m-1] + v[m]) / 2; }
  function create({ difficulty = 1, mode = 'challenge', seed = 1, sessionId, childId = 'dev-child-a', now = () => performance.now(), wallNow = () => new Date().toISOString() } = {}) {
    if (!config.difficulties[difficulty] || !['challenge','practice'].includes(mode)) throw Error('Invalid game configuration');
    const random = randomFrom(seed), d = config.difficulties[difficulty];
    let phase = 'ready', resumePhase = null, activeMs = 0, activeStart = null, round = 0, board = [], correct = 0, wrong = 0, completedRounds = 0, startedAt = wallNow(), finalResult = null;
    const roundRecords = [], wrongUntil = new Map();
    const elapsed = () => activeMs + (activeStart === null ? 0 : Math.max(0, now() - activeStart));
    function stopClock() { activeMs = elapsed(); activeStart = null; }
    function end(reason) {
      if (finalResult) return copy(finalResult);
      stopClock(); if (mode === 'challenge') activeMs = Math.min(activeMs, config.durationMs);
      phase = 'ended';
      const accuracy = correct + wrong ? correct / (correct + wrong) : null;
      finalResult = { sessionId, gameId: config.gameId, gameVersion: config.gameVersion, rulesVersion: config.rulesVersion, childId, difficulty, mode, boardSeed: seed >>> 0, startedAt, endedAt: wallNow(), endReason: reason,
        correctCount: correct, wrongCount: wrong, accuracy, completedRounds, totalRounds: config.rounds, collectedCount: correct, score: score(correct, wrong), stars: stars(accuracy, reason === 'completed', mode), activePlayMs: activeMs,
        firstGemMedianMs: median(roundRecords.map(x => x.firstCorrectMs).filter(x => x !== null)), roundRecords: copy(roundRecords), rewardMode: 'simulation', simulatedReward: reason === 'completed' && mode === 'challenge' ? config.simulatedReward : 0, verification: 'client_reported' };
      return copy(finalResult);
    }
    function tick() { if (phase === 'playing' && mode === 'challenge' && elapsed() >= config.durationMs) end('timeout'); return finalResult && copy(finalResult); }
    function beginRound() {
      if (!['ready','transition'].includes(phase) || finalResult || completedRounds >= config.rounds) return false;
      round++; board = generateBoard(difficulty, random); wrongUntil.clear();
      roundRecords.push({ round, activeStartMs: activeMs, firstCorrectMs: null, correctCount: 0, wrongCount: 0, completed: false, selections: [] });
      phase = 'playing'; activeStart = now(); return true;
    }
    function pick(id) {
      if (phase !== 'playing') return null;
      if (tick()) return null;
      const gem = board.find(x => x.id === id); if (!gem || gem.selected) return null;
      const record = roundRecords[round - 1], at = elapsed();
      if ((wrongUntil.get(id) || 0) > at) return null;
      if (gem.correct) gem.selected = true;
      else wrongUntil.set(id, at + config.wrongFeedbackMs);
      record.selections.push({ tileId: id, correct: gem.correct, activePlayMs: at });
      if (gem.correct) { correct++; record.correctCount++; if (record.firstCorrectMs === null) record.firstCorrectMs = at - record.activeStartMs; }
      else { wrong++; record.wrongCount++; }
      const remaining = board.filter(x => matches(x, d.target) && !x.selected).length;
      if (!remaining) {
        stopClock(); record.completed = true; completedRounds++; phase = 'transition';
        if (completedRounds === config.rounds) end('completed');
      }
      return { correct: gem.correct, remaining, roundComplete: !remaining, ended: !!finalResult };
    }
    function pause() { if (!['playing','transition','ready'].includes(phase)) return false; if (tick()) return false; resumePhase = phase; stopClock(); phase = 'paused'; return true; }
    function resume() { if (phase !== 'paused') return false; phase = resumePhase; if (phase === 'playing') activeStart = now(); return true; }
    function view() { const played = mode === 'challenge' ? Math.min(elapsed(), config.durationMs) : elapsed(); return { phase, difficulty, mode, round, totalRounds: config.rounds, size: d.size, target: { ...d.target }, targetLabel: d.label, board: copy(board), targetCount: board.filter(x => matches(x, d.target)).length, foundCount: board.filter(x => matches(x, d.target) && x.selected).length, completedRounds, correctCount: correct, wrongCount: wrong, score: score(correct, wrong), activePlayMs: played, remainingMs: mode === 'challenge' ? Math.max(0, config.durationMs - played) : null }; }
    return { beginRound, pick, pause, resume, tick, abandon: () => end('abandoned'), view, result: () => finalResult && copy(finalResult) };
  }
  const api = { create, matches, generateBoard, randomFrom, score, stars, median };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NollpicCrystalMine = api;
})(typeof window === 'object' ? window : globalThis);

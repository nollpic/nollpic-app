(function (root) {
  'use strict';
  /* 2026-10-15 개편: 학년 구간(band: lower/upper)별 5구간 계획(config.bands), 구간마다 목표가 바뀜.
     다른 놀이(마법 회로·반전 마법사 등)가 randomFrom을 가져다 쓰므로 이름·동작 유지 */
  const config = typeof module === 'object' && module.exports ? require('./config.js') : root.NollpicCrystalConfig;
  const copy = value => JSON.parse(JSON.stringify(value));
  const gemOf = (color, shape, extra = {}) => ({ color, shape, crack: false, flip: false, ...extra });
  const matches = (gem, target) => gem.color === target.color && gem.shape === target.shape && !!gem.crack === !!target.crack && !!gem.flip === !!target.flip;
  function randomFrom(seed) {
    let value = seed >>> 0;
    return () => { value += 0x6D2B79F5; let t = value; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const pickOne = (list, random) => list[Math.floor(random() * list.length)];
  function bandOf(value) { return value === 'upper' || Number(value) === 2 ? 'upper' : 'lower'; }

  // 구간 목표 고르기: 헷갈림 종류가 성립하는 색·모양만, 바로 앞 구간과는 다른 보석
  function chooseTargets(spec, random, previous) {
    const c = spec.confuse || {};
    let colors = [...config.colors], shapes = [...config.shapes];
    if (c.similarColor) colors = colors.filter(x => config.similarColor[x]);
    if (c.similarCut) shapes = shapes.filter(x => config.similarCut[x]);
    if (c.flip || spec.type === 'flip') shapes = shapes.filter(x => x === 'drop' || x === 'heart');
    // 앞 구간 목표와 색도 모양도 다르게 (조건 때문에 안 되면 조합만 다르게)
    const prevColors = (previous || []).map(p => p.color), prevShapes = (previous || []).map(p => p.shape);
    const freshColors = colors.filter(x => !prevColors.includes(x)), freshShapes = shapes.filter(x => !prevShapes.includes(x));
    if (freshColors.length) colors = freshColors;
    if (freshShapes.length) shapes = freshShapes;
    let a, guard = 0;
    do { a = gemOf(pickOne(colors, random), pickOne(shapes, random)); } while (previous && previous.some(p => p.color === a.color && p.shape === a.shape) && ++guard < 20);
    if (spec.type !== 'pair' && spec.type !== 'switch') return [a];
    const otherColors = config.colors.filter(x => x !== a.color), otherShapes = config.shapes.filter(x => x !== a.shape);
    return [a, gemOf(pickOne(otherColors, random), pickOne(otherShapes, random))];
  }

  function generateBoard(spec, random, previous) {
    const targets = chooseTargets(spec, random, previous), [a] = targets, c = spec.confuse || {};
    const isTarget = g => targets.some(t => matches(g, t));
    const board = [];
    targets.forEach(t => { for (let i = 0; i < spec.count; i++) board.push({ ...t }); });
    const add = (n, make) => { for (let i = 0; i < n; i++) { let g, k = 0; do { g = make(); } while (isTarget(g) && ++k < 30); if (!isTarget(g)) board.push(g); } };
    add(c.sameColor || 0, () => gemOf(a.color, pickOne(config.shapes.filter(s => s !== a.shape), random)));
    add(c.sameShape || 0, () => gemOf(pickOne(config.colors.filter(x => x !== a.color), random), a.shape));
    add(c.similarColor || 0, () => gemOf(config.similarColor[a.color], a.shape));
    add(c.similarCut || 0, () => gemOf(a.color, config.similarCut[a.shape]));
    add(c.crack || 0, () => ({ ...a, crack: true }));
    add(c.flip || 0, () => ({ ...a, flip: true }));
    const usedColors = targets.map(t => t.color), usedShapes = targets.map(t => t.shape);
    const far = () => gemOf(pickOne(config.colors.filter(x => !usedColors.includes(x)), random), pickOne(config.shapes.filter(s => !usedShapes.includes(s)), random));
    const any = () => gemOf(pickOne(config.colors, random), pickOne(config.shapes, random));
    add(Math.max(0, spec.size ** 2 - board.length), spec.filler === 'far' ? far : any);
    while (board.length > spec.size ** 2) board.pop();
    for (let i = board.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [board[i], board[j]] = [board[j], board[i]]; }
    const expected = targets.length * spec.count;
    if (board.length !== spec.size ** 2 || board.filter(isTarget).length !== expected) throw Error('Invalid target board');
    return { targets, board: board.map((gem, id) => ({ ...gem, id, selected: false })) };
  }

  function score(correct, wrong) { return Math.max(0, correct * config.correctPoints - wrong * config.wrongPenalty); }
  function stars(accuracy, completed, mode) { return completed && mode === 'challenge' ? accuracy >= .9 ? 3 : accuracy >= .8 ? 2 : 1 : 0; }
  function attackStars(rounds, accuracy, goal = 10, mode) { if (mode !== 'challenge' || !rounds) return 0; let s = rounds >= goal * .8 ? 3 : rounds >= goal * .5 ? 2 : 1; if (accuracy !== null && accuracy < .7) s = Math.max(1, s - 1); return s; }
  function median(values) { if (!values.length) return null; const v = [...values].sort((a,b) => a-b), m = Math.floor(v.length / 2); return v.length % 2 ? v[m] : (v[m-1] + v[m]) / 2; }

  function create({ band = 'lower', difficulty, mode = 'challenge', seed = 1, sessionId, childId = 'dev-child-a', now = () => performance.now(), wallNow = () => new Date().toISOString() } = {}) {
    band = bandOf(difficulty !== undefined ? difficulty : band);
    if (!['challenge','practice'].includes(mode)) throw Error('Invalid game configuration');
    const B = config.bands[band], plan = B.rounds, timeAttack = !!B.timeAttack, totalRounds = timeAttack ? null : plan.length, random = randomFrom(seed);
    /* 2026-10-15 3차: 구간마다 제한 시간이 새로 시작(config.roundTime), 시간 안에 못 찾으면 하트 -1 하고 다음 구간. 하트 0이면 끝. 틀리면 시간 깎기 */
    const maxHearts = mode === 'challenge' ? (B.hearts || 3) : null, penaltyMs = B.wrongPenaltyMs || 0;
    const limitAt = r => { const t = B.roundTime || {}; if (r <= (t.list || []).length) return t.list[r - 1]; return Math.max(t.min || 12000, (t.after || 20000) - (r - (t.list || []).length - 1) * (t.step || 0)); };
    let hearts = maxHearts, roundPenalty = 0, timedOutRounds = 0, lastTimeout = 0, phase = 'ready', resumePhase = null, activeMs = 0, activeStart = null, round = 0, board = [], targets = [], active = [], switched = false, correct = 0, wrong = 0, completedRounds = 0, startedAt = wallNow(), finalResult = null;
    const roundRecords = [], wrongUntil = new Map();
    // 타임어택은 정해진 구간 뒤로 loop를 돌며 계속
    const specAt = r => r <= plan.length ? plan[r - 1] : B.loop[(r - plan.length - 1) % B.loop.length];
    const spec = () => specAt(Math.max(1, round));
    const elapsed = () => activeMs + (activeStart === null ? 0 : Math.max(0, now() - activeStart));
    const isActiveTarget = g => active.some(t => matches(g, t));
    function stopClock() { activeMs = elapsed(); activeStart = null; }
    function end(reason) {
      if (finalResult) return copy(finalResult);
      stopClock();
      phase = 'ended';
      const accuracy = correct + wrong ? correct / (correct + wrong) : null;
      finalResult = { sessionId, gameId: config.gameId, gameVersion: config.gameVersion, rulesVersion: config.rulesVersion, childId, band, difficulty: band, mode, boardSeed: seed >>> 0, startedAt, endedAt: wallNow(), endReason: reason,
        correctCount: correct, wrongCount: wrong, accuracy, completedRounds, attemptedRounds: round, timedOutRounds, heartsLeft: hearts, maxHearts, totalRounds, timeAttack, goal: B.goal || null, collectedCount: correct, score: score(correct, wrong), stars: timeAttack ? attackStars(completedRounds, accuracy, B.goal, mode) : reason === 'completed' && mode === 'challenge' ? Math.max(1, Math.min(stars(accuracy, true, mode), hearts)) : 0, activePlayMs: activeMs,
        firstGemMedianMs: median(roundRecords.map(x => x.firstCorrectMs).filter(x => x !== null)), roundRecords: copy(roundRecords), rewardMode: 'simulation', simulatedReward: reason === 'completed' && mode === 'challenge' ? config.simulatedReward : 0, verification: 'client_reported' };
      return copy(finalResult);
    }
    const roundLimit = () => limitAt(Math.max(1, round));
    const roundUsed = () => round ? elapsed() - roundRecords[round - 1].activeStartMs + roundPenalty : 0;
    const roundLeft = () => mode === 'challenge' ? Math.max(0, roundLimit() - roundUsed()) : null;
    // 구간 시간이 다 되면: 하트 -1, 이 구간은 실패로 넘어감. 하트 0 → 끝 (저학년은 마지막 구간이었어도 끝)
    function timeoutRound() {
      stopClock(); const record = roundRecords[round - 1]; record.timedOut = true; timedOutRounds++; hearts--; lastTimeout = round; phase = 'transition';
      if (hearts <= 0) end(timeAttack ? 'completed' : 'out-of-hearts');
      else if (!timeAttack && round >= totalRounds) end('completed');
      else if (timeAttack && round >= (B.maxRounds || 30)) end('completed');
    }
    function tick() { if (phase === 'playing' && mode === 'challenge' && roundLeft() <= 0) timeoutRound(); return finalResult && copy(finalResult); }
    function beginRound() {
      if (!['ready','transition'].includes(phase) || finalResult || (!timeAttack && round >= totalRounds)) return false;
      round++; roundPenalty = 0; const made = generateBoard(spec(), random, targets); board = made.board; targets = made.targets; wrongUntil.clear(); switched = false;
      active = spec().type === 'pair' ? [...targets] : [targets[0]];
      roundRecords.push({ round, type: spec().type, limitMs: mode === 'challenge' ? roundLimit() : null, activeStartMs: activeMs, firstCorrectMs: null, correctCount: 0, wrongCount: 0, completed: false, selections: [] });
      phase = 'playing'; activeStart = now(); return true;
    }
    // 틀린 이유: 금 · 거꾸로 · 목표가 바뀜 · 그 밖
    function reasonFor(gem) {
      const a = targets[0];
      if (switched && matches(gem, a)) return 'switched';
      if (gem.color === a.color && gem.shape === a.shape && gem.crack) return 'crack';
      if (gem.color === a.color && gem.shape === a.shape && gem.flip) return 'flip';
      return 'mismatch';
    }
    function pick(id) {
      if (phase !== 'playing') return null;
      if (tick()) return null;
      const gem = board.find(x => x.id === id); if (!gem || gem.selected) return null;
      const record = roundRecords[round - 1], at = elapsed();
      if ((wrongUntil.get(id) || 0) > at) return null;
      const ok = isActiveTarget(gem), reason = ok ? null : reasonFor(gem);
      if (ok) gem.selected = true; else wrongUntil.set(id, at + config.wrongFeedbackMs);
      record.selections.push({ tileId: id, correct: ok, reason, activePlayMs: at });
      if (ok) { correct++; record.correctCount++; if (record.firstCorrectMs === null) record.firstCorrectMs = at - record.activeStartMs; }
      else { wrong++; record.wrongCount++; if (mode === 'challenge') roundPenalty += penaltyMs; }
      // 바뀌는 구간: 처음 목표를 하나 남기고 다 찾으면 목표가 바뀜 → 남은 처음 목표는 이제 누르면 안 됨
      let didSwitch = false;
      if (ok && spec().type === 'switch' && !switched && board.filter(x => matches(x, targets[0]) && x.selected).length === spec().count - 1) {
        switched = true; didSwitch = true; active = [targets[1]];
      }
      const remaining = board.filter(x => isActiveTarget(x) && !x.selected).length;
      if (!remaining) {
        stopClock(); record.completed = true; completedRounds++; phase = 'transition';
        if (!timeAttack && round >= totalRounds) end('completed');
        else if (timeAttack && mode === 'challenge' && round >= (B.maxRounds || 30)) end('completed');
        else if (timeAttack && mode === 'practice' && completedRounds >= (B.goal || 10)) end('completed');
      }
      if (ok || phase !== 'playing') return { correct: ok, reason, switched: didSwitch, remaining, roundComplete: !remaining, ended: !!finalResult };
      tick();   // 틀림 벌점으로 시간이 다 됐을 수 있음
      return { correct: ok, reason, switched: didSwitch, remaining, roundComplete: false, timedOut: phase !== 'playing', penaltyMs: mode === 'challenge' ? penaltyMs : 0, ended: !!finalResult };
    }
    function pause() { if (!['playing','transition','ready'].includes(phase)) return false; if (tick()) return false; resumePhase = phase; stopClock(); phase = 'paused'; return true; }
    function resume() { if (phase !== 'paused') return false; phase = resumePhase; if (phase === 'playing') activeStart = now(); return true; }
    function view() {
      const played = elapsed(), s = round ? spec() : plan[0];
      return { phase, band, difficulty: band, mode, round, totalRounds, timeAttack, goal: B.goal || null, size: s.size, roundType: s.type, switched,
        targets: copy(active), allTargets: copy(targets), board: copy(board),
        targetCount: board.filter(isActiveTarget).length, foundCount: board.filter(x => isActiveTarget(x) && x.selected).length,
        completedRounds, correctCount: correct, wrongCount: wrong, score: score(correct, wrong), activePlayMs: played, results: roundRecords.map(r => r.completed ? 'ok' : r.timedOut ? 'miss' : ''), remainingMs: roundLeft(), roundLimitMs: mode === 'challenge' ? roundLimit() : null, hearts, maxHearts, lastTimeout, timedOutRounds };
    }
    return { beginRound, pick, pause, resume, tick, abandon: () => end('abandoned'), view, result: () => finalResult && copy(finalResult) };
  }
  const api = { create, matches, generateBoard, randomFrom, score, stars, attackStars, median, bandOf };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NollpicCrystalMine = api;
})(typeof window === 'object' ? window : globalThis);

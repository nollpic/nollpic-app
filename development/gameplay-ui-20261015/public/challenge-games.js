/* 놀픽 놀이 목록 (기본값)
   - 앱(index.html)과 관리자(admin/admin.html)가 함께 읽음
   - weights: 이 놀이가 각 영역에 얼마나 도움이 되는지 0~3 (3 = 주 영역)
       attention 끈기력 · memory 기억력 · reaction 순발력 · visual 관찰력 · inhibition 충동조절
   - minLevel~maxLevel: 학년 단계 1(초1~2) · 2(초3~4) · 3(초5~6)
   - 관리자 "게임 관리"에서 바꾼 값(Firestore challengeGames/{id})이 이 기본값을 덮어씀
   - 새 놀이를 추가할 때: 여기에 한 줄 + index.html에 open 함수 + 놀이 파일
   - img: 목록·오늘 카드에 이모지 대신 쓸 그림 (없으면 emoji 픽셀 아이콘) */
(function () {
  window.NOLLPIC_AREA_KEYS = ['attention', 'memory', 'reaction', 'visual', 'inhibition'];
  window.NOLLPIC_GAME_CATALOG = [
    { id: 1,  title: '기억 공방',         emoji: '🍣', img: 'images/sushi-salmon-flat.png', open: 'openMemoryKitchenGame',  desc: '순서를 기억해 완성해요',       weights: { memory: 3, attention: 1, visual: 1 } },
    { id: 2,  title: '숫자더하기 놀이',   emoji: '🔢', open: 'openNumberFocusGame',    desc: '숫자를 차례대로 더해요',       weights: { attention: 3, memory: 2 } },
    { id: 3,  title: '모양기억 놀이',     emoji: '🧱', open: 'openJengaMemoryGame',    desc: '본 모양을 젠가로 만들어요',    weights: { visual: 3, memory: 2 }, kit: '젠가 블록 4개' },
    { id: 4,  title: '색 조각 맞추기',    emoji: '🎨', open: 'openColorMatchGame',     desc: '같은 색 조각을 찾아요',        weights: { visual: 3, attention: 1 } },
    { id: 5,  title: '손가락 순서 놀이',  emoji: '✋', open: 'openHandSequenceGame',   desc: '손가락 순서를 따라 해요',      weights: { memory: 3, inhibition: 1 }, kit: '엄마·아빠와 함께' },
    { id: 6,  title: '9칸 위치기억',      emoji: '🔲', open: 'openGridMemoryGame',     desc: '반짝인 칸을 기억해요',         weights: { memory: 3, visual: 1 } },
    { id: 7,  title: '색깔 블록 연산',    emoji: '🧮', open: 'openColorEquationGame',  desc: '색깔 블록으로 계산해요',       weights: { attention: 3, memory: 1, visual: 1 } },
    { id: 8,  title: '색깔대로 말해요',   emoji: '🌈', open: 'openStroopGame',         desc: '글자 말고 색깔을 말해요',      weights: { inhibition: 3, attention: 1 } },
    { id: 9,  title: '거꾸로 369',        emoji: '🔁', open: 'openReverse369Game',     desc: '규칙을 거꾸로 지켜요',         weights: { inhibition: 3, attention: 2, memory: 1 } },
    { id: 10, title: '생선 굽기',         emoji: '🐟', open: 'openFishGrillGame',      desc: '딱 알맞을 때까지 기다려요',    weights: { inhibition: 3, reaction: 1, attention: 1 } },
    { id: 11, title: '숫자 숨바꼭질',     emoji: '🔍', open: 'openNumberHideSeekGame', desc: '숨은 숫자를 찾아요',           weights: { visual: 3, attention: 1 } },
    { id: 12, title: '컬러 드롭',         emoji: '💧', open: 'openColorDropGame',      desc: '맞는 색을 빠르게 눌러요',      weights: { reaction: 3, inhibition: 1 } },
    { id: 13, title: '재료 조립하기',     emoji: '🍔', open: 'openRecipeBuilderGame',  desc: '그림 보고 재료를 쌓아요',      weights: { visual: 3, memory: 2 } },
    { id: 14, title: '같은 모양 길 잇기', emoji: '🔺', open: 'openShapeConnectGame',   desc: '같은 모양끼리 길을 이어요',    weights: { attention: 3, visual: 2 } },
    { id: 15, title: '탁구 랠리',         emoji: '🏓', open: 'openPingPongRallyGame',  desc: '공을 놓치지 않게 받아요',      weights: { reaction: 3, attention: 1 } },
    { id: 16, title: '숫자로 찾기',       emoji: '🔎', open: 'openNumberSearchGame',   desc: '숫자를 순서대로 찾아요',       weights: { visual: 3, attention: 2 } },
    { id: 17, title: '블록 합치기',       emoji: '🟦', open: 'openBlockMergeGame',     desc: '같은 블록을 합쳐요',           weights: { attention: 3, visual: 1 } },
    { id: 18, title: '꼬인 길 작전',      emoji: '🧵', open: 'openTangledPathGame',    desc: '선이 안 겹치게 3단계 풀기',    weights: { attention: 3, visual: 1 } },
    { id: 19, title: '크리스탈 광산', emoji: '💎', img: 'minigames/crystal-mine/thumbnail.svg', open: 'openCrystalMineGame', desc: '목표 보석을 찾아 5구간 탐험해요', weights: { attention: 3 } },
    { id: 20, title: '마법 회로 복구', emoji: '✦', open: 'openMagicCircuitGame', desc: '에너지 수정을 연결해요', weights: { visual: 3, attention: 1 } },
    { id: 21, title: '반전 마법사의 함정', emoji: '↔', open: 'openDirectionWizardGame', desc: '바뀐 규칙을 찾아요', weights: { inhibition: 3, attention: 1 } },
    { id: 22, title: '컬러 마법사의 시험', emoji: '▲', open: 'openColorWizardGame', desc: '색깔 규칙을 판단해요', weights: { inhibition: 3, visual: 1 } },
    { id: 23, title: '369 암호 해독', emoji: '369', open: 'openCipher369Game', desc: '숫자 규칙을 해독해요', weights: { inhibition: 3, memory: 1 } },
    { id: 24, title: '비밀 건축 연구소', emoji: '▣', open: 'openSecretArchitectureGame', desc: '기억한 구조를 만들어요', weights: { memory: 3, visual: 1 } },
    { id: 25, title: '비밀의 문 탈출', emoji: '🚪', open: 'openSecretDoorGame', desc: '단서를 기억해 비밀의 문을 열어요', weights: { memory: 3, attention: 1 } },
  ].map(g => ({ minLevel: 1, maxLevel: 3, enabled: true, kit: '', ...g }));
})();

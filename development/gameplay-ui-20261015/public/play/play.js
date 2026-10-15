/* ================================================================
   놀픽 플레이 페이지 — play.js
   콘텐츠 카드 렌더링 및 라우팅 담당
================================================================ */

'use strict';

// 플레이 콘텐츠 목록 (추후 추가)
const playContents = [
    // 예시 형식:
    // {
    //   id: 'memory-match',
    //   icon: '🃏',
    //   title: '카드 뒤집기',
    //   sub: '기억력 훈련',
    //   url: 'memory-match/index.html'
    // }
];

function renderPlayContents() {
    const main = document.getElementById('play-main');
    if (!main) return;

    if (playContents.length === 0) {
        // 빈 상태 유지 (html에서 렌더된 상태 그대로)
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'play-grid';

    playContents.forEach(content => {
        const card = document.createElement('button');
        card.className = 'play-card';
        card.innerHTML = `
            <div class="play-card-icon">${content.icon}</div>
            <div class="play-card-title">${content.title}</div>
            <div class="play-card-sub">${content.sub}</div>
        `;
        card.addEventListener('click', () => {
            if (content.url) window.location.href = content.url;
        });
        grid.appendChild(card);
    });

    // 빈 상태 교체
    const emptyEl = main.querySelector('.play-empty');
    if (emptyEl) emptyEl.replaceWith(grid);
    else main.appendChild(grid);
}

document.addEventListener('DOMContentLoaded', renderPlayContents);

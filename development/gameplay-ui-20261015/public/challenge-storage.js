(function () {
    'use strict';
    const sessionKey = 'nollpic_challenge_guest_session_v1';
    const personal = key => (key.startsWith('nollpic_challenge_') && key !== 'nollpic_challenge_games_override') || key.startsWith('nollpic_summer_challenge_') || ['nollpic_avatar_v3', 'nollpic_points_spent'].includes(key);
    const signedIn = () => typeof window.nollpicHasAuthenticatedUser === 'function' && window.nollpicHasAuthenticatedUser();
    const newId = () => window.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
    let fallbackSession = newId();
    function guestSession() {
        try {
            let id = sessionStorage.getItem(sessionKey);
            if (!id) { id = fallbackSession; sessionStorage.setItem(sessionKey, id); }
            return id;
        } catch (_) { return fallbackSession; }
    }
    function destination(key) { return personal(key) && !signedIn() ? 'nollpic:challenge-guest:v1:' + guestSession() + ':' + key : key; }
    function beginGuestSession() {
        fallbackSession = newId();
        try { sessionStorage.setItem(sessionKey, fallbackSession); } catch (_) {}
        window.dispatchEvent(new CustomEvent('nollpic-challenge-context'));
    }
    window.NollpicChallengeStorage = {
        isSignedIn: signedIn, beginGuestSession,
        getItem: key => localStorage.getItem(destination(key)),
        setItem: (key, value) => localStorage.setItem(destination(key), value),
        removeItem: key => localStorage.removeItem(destination(key))
    };
})();

// Synthetic local-only browser fixture. The verification server blocks every backend connection.
document.addEventListener('DOMContentLoaded', () => {
    // Native confirm dialogs are not exposed reliably by the in-app browser; cancel/error branches are covered by VM tests.
    window.confirm = message => message === '로그아웃 하시겠어요?';
    const children = [
        {id: 'synthetic-child-a', name: '가상 첫째', gradeValue: '2', gradeText: '초등 2학년', gender: 'male'},
        {id: 'synthetic-child-b', name: '가상 둘째', gradeValue: '4', gradeText: '초등 4학년', gender: 'female'}
    ];
    if (sessionStorage.getItem('verification_fixture_initialized') !== 'true' && new URLSearchParams(location.search).get('verification') !== 'guest') {
    localStorage.setItem('nollpic_user', JSON.stringify({uid: 'synthetic-parent', email: 'parent@example.invalid'}));
    localStorage.setItem('nollpic_children_synthetic-parent', JSON.stringify(children));
    localStorage.setItem('nollpic_selected_child', JSON.stringify(children[0]));
    localStorage.setItem('nollpic_child_profile', JSON.stringify(children[0]));
    localStorage.setItem('nollpic_summer_challenge_state_original_v2', JSON.stringify({completed: 2, completedSteps: [1,2], claimedSteps: [1,2], openedChests: [], chestRewards: {}}));
    localStorage.setItem('nollpic_challenge_start', getChallengeDateKey(new Date()));
    sessionStorage.setItem('verification_fixture_initialized', 'true');
    }
    window.syncNollpicDataFromFirestore = async () => ({children: getSavedChildren(), results: []});
    window.nollpicSyncFromFirebase = window.syncNollpicDataFromFirestore;
    window.saveChildToFirestore = async () => {};
});

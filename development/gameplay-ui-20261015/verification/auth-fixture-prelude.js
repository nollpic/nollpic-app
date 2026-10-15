// Explicit local Firebase SDK model. No network or Firebase user/document APIs are used.
const fixtureAuth = {currentUser: null};
let fixtureAuthObserver;
function initializeApp(config) { if (config.projectId !== 'nollpic') throw new Error('Unexpected static project'); return {}; }
function getAuth() { return fixtureAuth; }
function getFirestore() { return {}; }
class GoogleAuthProvider {}
function onAuthStateChanged(auth, observer) {
    fixtureAuthObserver = observer;
    window.addEventListener('DOMContentLoaded', () => {
        const stored = JSON.parse(localStorage.getItem('nollpic_user') || 'null');
        auth.currentUser = new URLSearchParams(location.search).get('verification') !== 'guest' && stored ? {...stored, displayName:'가상 부모'} : null;
        observer(auth.currentUser);
    });
}
async function signOut(auth) { auth.currentUser = null; await fixtureAuthObserver(null); }
async function signInWithPopup(auth) {
    const user = {uid:'synthetic-parent', displayName:'가상 부모', email:'parent@example.invalid'};
    auth.currentUser = user;
    await fixtureAuthObserver(user);
    return {user};
}
async function signInWithRedirect() { throw new Error('Redirect unavailable in local model'); }
async function getRedirectResult() { return null; }
function doc() { throw new Error('No data access permitted in local model'); }
function setDoc() { throw new Error('No data writes permitted in local model'); }
function serverTimestamp() { throw new Error('No data writes permitted in local model'); }
function increment() { throw new Error('No data writes permitted in local model'); }

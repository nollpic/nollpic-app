import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyClcGJEbev-OvfBu0sssIorQF-9uFsEvn8",
  authDomain: "nollpic.firebaseapp.com",
  projectId: "nollpic",
  storageBucket: "nollpic.firebasestorage.app",
  messagingSenderId: "136872727133",
  appId: "1:136872727133:web:68e8ec171055beeecbf3b4",
  measurementId: "G-MGB2F1HNJV"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.googleLogin = async function () {
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    localStorage.setItem("nollpic_user", JSON.stringify({
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      photo: user.photoURL
    }));

    alert(`${user.displayName}님 환영합니다.`);
    nextPage(2);

  } catch (error) {
    console.error(error);
    alert("구글 로그인 실패: " + error.message);
  }
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    localStorage.setItem("nollpic_user", JSON.stringify({
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      photo: user.photoURL
    }));
  }
});
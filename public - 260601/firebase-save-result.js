import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const db = getFirestore(app);

function getLocalResultData() {
  const latest = JSON.parse(localStorage.getItem("nollpic_latest_result") || "null");
  const profile = JSON.parse(localStorage.getItem("nollpic_child_profile") || "null");

  if (!latest) return null;

  return {
    child: latest.child || profile || null,
    date: latest.date || "",
    overall: latest.overall || 0,
    scores: latest.scores || {},
    analysis: latest.analysis || "",
    savedAt: serverTimestamp()
  };
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    console.log("로그인 사용자가 없습니다.");
    return;
  }

  const resultData = getLocalResultData();

  if (!resultData) {
    console.log("저장할 검사 결과가 없습니다.");
    return;
  }

  const saveKey = `firebase_saved_${resultData.date}_${resultData.overall}`;

  if (localStorage.getItem(saveKey)) {
    console.log("이미 Firebase에 저장된 결과입니다.");
    return;
  }

  await addDoc(collection(db, "users", user.uid, "results"), {
    uid: user.uid,
    userEmail: user.email,
    userName: user.displayName,
    ...resultData
  });

  localStorage.setItem(saveKey, "true");

  console.log("Firestore 저장 완료");
});
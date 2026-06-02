import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("nollpic_user") || "null");
  } catch (e) {
    return null;
  }
}

function saveUser(user) {
  if (!user) return;

  const previousUser = getStoredUser();

  // 다른 구글 계정으로 로그인하면 현재 선택된 아이/최근 결과 캐시가 섞이지 않도록 지웁니다.
  // 아이 목록 자체는 nollpic_children_UID 형태라 계정별로 따로 유지됩니다.
  if (previousUser && previousUser.uid && previousUser.uid !== user.uid) {
    localStorage.removeItem("nollpic_selected_child");
    localStorage.removeItem("nollpic_child_profile");
    localStorage.removeItem("nollpic_latest_result");
    localStorage.removeItem("nollpic_child_name");
    localStorage.removeItem("nollpic_child_grade");
  }

  localStorage.setItem("nollpic_user", JSON.stringify({
    uid: user.uid,
    name: user.displayName || "놀픽 사용자",
    email: user.email || "",
    photo: user.photoURL || ""
  }));
}

function markLoginPending() {
  sessionStorage.setItem("nollpic_login_pending", "true");
  sessionStorage.setItem("nollpic_after_login_page", "2");
}

function clearLoginPending() {
  sessionStorage.removeItem("nollpic_login_pending");
}

function isLoginPending() {
  return sessionStorage.getItem("nollpic_login_pending") === "true";
}

function isOnLoginPage() {
  const page1 = document.getElementById("page-1");
  return !!page1 && page1.classList.contains("active");
}

function goAfterLogin() {
  // app.js 로딩 타이밍과 겹쳐도 이동되도록 여러 번 안전하게 호출합니다.
  const move = () => {
    if (typeof window.nextPage === "function") {
      window.nextPage(2);
      return true;
    }
    if (typeof nextPage === "function") {
      nextPage(2);
      return true;
    }
    return false;
  };

  if (!move()) {
    setTimeout(move, 100);
  }
  setTimeout(move, 300);
  setTimeout(move, 800);
}

function moveAfterLogin(user, showWelcome = false) {
  saveUser(user);
  clearLoginPending();

  if (showWelcome) {
    alert(`${user.displayName || "사용자"}님 환영합니다.`);
  }

  goAfterLogin();
}

function isInBlockedAppBrowser() {
  const ua = navigator.userAgent.toLowerCase();
  return /kakaotalk|instagram|fbav|fban|line|naver/.test(ua);
}

function showFirebaseLoginError(error) {
  console.error("Google login error", error);

  const code = error && error.code ? error.code : "";
  let message = "구글 로그인에 실패했어요.";

  if (location.protocol === "file:") {
    message = "구글 로그인은 index.html을 더블클릭한 file:// 화면에서는 작동하지 않아요. GitHub Pages나 Firebase Hosting 주소에서 확인해주세요.";
  } else if (code.includes("unauthorized-domain")) {
    message = "Firebase 승인 도메인에 현재 주소가 등록되어 있지 않아요. Firebase Console > Authentication > Settings > Authorized domains에 현재 도메인을 추가해주세요.";
  } else if (code.includes("popup-blocked")) {
    message = "브라우저가 팝업을 차단했어요. 다시 시도하면 redirect 방식으로 로그인합니다.";
  } else if (code.includes("popup-closed-by-user")) {
    message = "로그인 창이 닫혔어요. 다시 시도해주세요.";
  } else if (code.includes("operation-not-allowed")) {
    message = "Firebase Console에서 Google 로그인 제공업체가 활성화되어 있는지 확인해주세요.";
  }

  alert(message + (code ? `\n\n오류코드: ${code}` : ""));
}

window.googleLogin = async function () {
  if (location.protocol === "file:") {
    alert("구글 로그인은 file:// 로컬 파일 화면에서는 작동하지 않아요. GitHub Pages/Firebase Hosting 주소에서 확인해주세요.");
    return;
  }

  if (isInBlockedAppBrowser()) {
    alert("카카오톡/인스타그램/일부 인앱브라우저에서는 Google 로그인이 차단됩니다. 오른쪽 위 메뉴에서 Chrome 또는 외부 브라우저로 열어주세요.");
    return;
  }

  markLoginPending();

  try {
    // 모바일 Chrome에서도 우선 popup 방식으로 처리합니다.
    // redirect 방식은 돌아온 뒤 화면 이동이 브라우저에 따라 불안정해서 fallback으로만 사용합니다.
    const result = await signInWithPopup(auth, provider);
    moveAfterLogin(result.user, true);
  } catch (error) {
    const code = error && error.code ? error.code : "";

    if (code.includes("popup-blocked") || code.includes("popup-closed-by-user") || code.includes("cancelled-popup-request")) {
      try {
        await signInWithRedirect(auth, provider);
        return;
      } catch (redirectError) {
        clearLoginPending();
        showFirebaseLoginError(redirectError);
        return;
      }
    }

    clearLoginPending();
    showFirebaseLoginError(error);
  }
};

// redirect 로그인으로 돌아온 경우 사용자 정보를 저장하고 다음 페이지로 이동합니다.
getRedirectResult(auth)
  .then((result) => {
    if (result && result.user) {
      moveAfterLogin(result.user, true);
    }
  })
  .catch((error) => {
    clearLoginPending();
    showFirebaseLoginError(error);
  });

onAuthStateChanged(auth, (user) => {
  if (!user) return;

  saveUser(user);

  // 이미 로그인된 사용자가 로그인 화면에 남아 있으면 무조건 다음 화면으로 보냅니다.
  if (isLoginPending() || isOnLoginPage()) {
    moveAfterLogin(user, false);
  }
});

window.addEventListener("DOMContentLoaded", () => {
  // 새로고침 후에도 localStorage에 로그인 사용자가 있으면 로그인 화면에 머물지 않게 보정합니다.
  const storedUser = getStoredUser();
  if (storedUser && storedUser.uid && isOnLoginPage()) {
    setTimeout(goAfterLogin, 200);
  }
});

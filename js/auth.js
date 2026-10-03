// ============================================================
//  AUTHENTICATION & ROLE GUARDS
// ============================================================
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase-init.js";
import { users } from "./db.js";

/* ------------------------- ACTIONS ------------------------- */

export async function registerStudent({ email, password, fullName, studentClass, studentId }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: fullName });

  // Firestore user record — role is STUDENT by default.
  await users.create(cred.user.uid, {
    uid: cred.user.uid,
    email,
    fullName,
    studentClass,
    studentId: studentId || `SC-${Date.now().toString(36).toUpperCase()}`,
    role: "student",
    avatarUrl: "",
    active: true
  });

  return cred.user;
}

export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logout() {
  await signOut(auth);
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

/* ------------------------- STATE ------------------------- */

export function observeAuth(cb) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) return cb(null, null);
    const profile = await users.get(user.uid);
    cb(user, profile);
  });
}

export async function currentUser() {
  return new Promise(resolve => {
    const off = onAuthStateChanged(auth, async (user) => {
      off();
      if (!user) return resolve(null);
      const profile = await users.get(user.uid);
      resolve({ user, profile });
    });
  });
}

/* ------------------------- GUARDS ------------------------- */

/**
 * Call at the top of any protected page.
 *   requireAuth()                 → any signed-in user
 *   requireAuth(["admin"])        → admin only
 *   requireAuth(["admin","teacher"])
 * Redirects to /login.html if not signed in.
 * Redirects to /dashboard.html if role not allowed.
 */
export async function requireAuth(allowedRoles = null, redirectIfFail = "/login.html") {
  const res = await currentUser();
  if (!res) { window.location.replace(redirectIfFail); return null; }
  const { user, profile } = res;

  if (!profile) {
    // Auth exists but no Firestore user doc — force re-login.
    await logout();
    window.location.replace(redirectIfFail);
    return null;
  }
  if (profile.active === false) {
    await logout();
    alert("Your account has been disabled. Contact the administrator.");
    window.location.replace(redirectIfFail);
    return null;
  }
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    window.location.replace("/dashboard.html");
    return null;
  }
  return { user, profile };
}

export function roleHome(role) {
  return role === "admin" ? "/admin.html" : "/dashboard.html";
}

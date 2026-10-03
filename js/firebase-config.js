// ============================================================
//  SCHOLAR'S CAMP — FIREBASE CONFIGURATION
//  ⚠️ PASTE FIREBASE CONFIG HERE
//  Get these values from Firebase Console → Project Settings → Your apps → Web
//  These are PUBLIC frontend values (safe to ship). Real security is enforced
//  by Firestore Security Rules, NOT by hiding these.
// ============================================================

export const firebaseConfig = {
  apiKey:            "PASTE_YOUR_API_KEY",
  authDomain:        "PASTE_YOUR_AUTH_DOMAIN",
  projectId:         "PASTE_YOUR_PROJECT_ID",
  storageBucket:     "PASTE_YOUR_STORAGE_BUCKET",
  messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID",
  appId:             "PASTE_YOUR_APP_ID"
};

// ============================================================
//  GOOGLE APPS SCRIPT WEB APP URL
//  ⚠️ PASTE GOOGLE APPS SCRIPT WEB APP URL HERE
//  Example: https://script.google.com/macros/s/AKfycb.../exec
//  NEVER put Google service-account keys or OAuth secrets here.
// ============================================================
export const GOOGLE_APPS_SCRIPT_WEB_APP_URL =
  "PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";

// ============================================================
//  GOOGLE DRIVE ROOT FOLDER ID
//  ⚠️ PASTE GOOGLE DRIVE ROOT FOLDER ID HERE
//  Open the "SCHOLAR'S CAMP" folder in Drive — the ID is the
//  long string after /folders/ in the URL.
// ============================================================
export const GOOGLE_DRIVE_ROOT_FOLDER_ID =
  "PASTE_GOOGLE_DRIVE_ROOT_FOLDER_ID_HERE";

// App constants
export const APP_NAME    = "Scholar's Camp Physics";
export const APP_VERSION = "1.0.0";
export const SUBJECT_ID  = "physics";

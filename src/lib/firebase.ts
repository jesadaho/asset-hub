import { initializeApp } from "firebase/app";
import { getAnalytics, type Analytics } from "firebase/analytics";

let analytics: Analytics | null = null;

const defaultFirebaseConfig = {
  apiKey: "AIzaSyAOwqhsqM2S0iN8yljkm3bUe61V1hPzDmc",
  authDomain: "assethub-54579.firebaseapp.com",
  projectId: "assethub-54579",
  storageBucket: "assethub-54579.firebasestorage.app",
  messagingSenderId: "996693529414",
  appId: "1:996693529414:web:54ee8734577a17f7d6cb47",
  measurementId: "G-PSFTRRHNDW",
};

function getConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? defaultFirebaseConfig.apiKey;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? defaultFirebaseConfig.appId;
  if (!apiKey || !appId) return null;
  return {
    apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? defaultFirebaseConfig.authDomain,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? defaultFirebaseConfig.projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? defaultFirebaseConfig.storageBucket,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? defaultFirebaseConfig.messagingSenderId,
    appId,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? defaultFirebaseConfig.measurementId,
  };
}

export function getFirebaseAnalytics(): Analytics | null {
  if (typeof window === "undefined") return null;
  if (analytics) return analytics;
  const config = getConfig();
  if (!config) return null;
  try {
    const app = initializeApp(config);
    analytics = getAnalytics(app);
    return analytics;
  } catch {
    return null;
  }
}

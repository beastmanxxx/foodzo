import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

import { getFirebaseConfig } from "./firebaseConfig";

let firebaseClientApp: FirebaseApp | null = null;
let firebaseClientAuth: Auth | null = null;
let googleAuthProvider: GoogleAuthProvider | null = null;

function ensureClientApp(): FirebaseApp {
  if (firebaseClientApp) {
    return firebaseClientApp;
  }

  if (getApps().length > 0) {
    firebaseClientApp = getApp();
  } else {
    firebaseClientApp = initializeApp(getFirebaseConfig());
  }

  return firebaseClientApp;
}

export function getFirebaseClientAuth(): Auth {
  if (firebaseClientAuth) {
    return firebaseClientAuth;
  }

  firebaseClientAuth = getAuth(ensureClientApp());
  return firebaseClientAuth;
}

export function getGoogleAuthProvider(): GoogleAuthProvider {
  if (googleAuthProvider) {
    return googleAuthProvider;
  }

  googleAuthProvider = new GoogleAuthProvider();
  googleAuthProvider.setCustomParameters({ prompt: "select_account" });
  return googleAuthProvider;
}

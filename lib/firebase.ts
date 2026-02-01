import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore/lite";

import { getFirebaseConfig } from "./firebaseConfig";

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;

function ensureFirebaseApp(): FirebaseApp {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (getApps().length > 0) {
    firebaseApp = getApp();
  } else {
    firebaseApp = initializeApp(getFirebaseConfig());
  }

  return firebaseApp;
}

export function getFirebaseApp(): FirebaseApp {
  return ensureFirebaseApp();
}

export function getFirestoreDb(): Firestore {
  if (firestoreDb) {
    return firestoreDb;
  }

  firestoreDb = getFirestore(ensureFirebaseApp());
  return firestoreDb;
}

export function getFirebaseApiKey(): string {
  return getFirebaseConfig().apiKey;
}

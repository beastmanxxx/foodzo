export type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

function pickFirebaseEnv(primary: string | undefined, fallback: string | undefined) {
  return primary && primary.length > 0 ? primary : fallback;
}

export function getFirebaseConfig(): FirebaseConfig {
  const apiKey = pickFirebaseEnv(
    process.env.FIREBASE_API_KEY,
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  );
  const authDomain = pickFirebaseEnv(
    process.env.FIREBASE_AUTH_DOMAIN,
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  );
  const projectId = pickFirebaseEnv(
    process.env.FIREBASE_PROJECT_ID,
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
  const storageBucket = pickFirebaseEnv(
    process.env.FIREBASE_STORAGE_BUCKET,
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  );
  const messagingSenderId = pickFirebaseEnv(
    process.env.FIREBASE_MESSAGING_SENDER_ID,
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  );
  const appId = pickFirebaseEnv(
    process.env.FIREBASE_APP_ID,
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  );

  const missingKeys = [
    ["FIREBASE_API_KEY", apiKey],
    ["FIREBASE_AUTH_DOMAIN", authDomain],
    ["FIREBASE_PROJECT_ID", projectId],
    ["FIREBASE_STORAGE_BUCKET", storageBucket],
    ["FIREBASE_MESSAGING_SENDER_ID", messagingSenderId],
    ["FIREBASE_APP_ID", appId],
  ].filter(([, value]) => !value);

  if (missingKeys.length > 0) {
    const keysList = missingKeys.map(([key]) => key).join(", ");
    throw new Error(
      `Missing Firebase configuration. Please define the following environment variables: ${keysList}.`
    );
  }

  return {
    apiKey: apiKey!,
    authDomain: authDomain!,
    projectId: projectId!,
    storageBucket: storageBucket!,
    messagingSenderId: messagingSenderId!,
    appId: appId!,
  };
}

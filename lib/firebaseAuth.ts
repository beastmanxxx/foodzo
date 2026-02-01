import { getFirebaseApiKey } from "./firebase";

const FIREBASE_AUTH_BASE_URL = "https://identitytoolkit.googleapis.com/v1";

export class FirebaseAuthRestError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "FirebaseAuthRestError";
  }
}

type IdentityToolkitErrorResponse = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    errors?: Array<{ message?: string }>;
  };
};

async function callIdentityToolkit<T>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const apiKey = getFirebaseApiKey();
  const url = `${FIREBASE_AUTH_BASE_URL}${path}?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = (await response.json().catch(() => ({}))) as
    | T
    | IdentityToolkitErrorResponse;

  if (!response.ok) {
    const message =
      (data as IdentityToolkitErrorResponse)?.error?.message ?? "UNKNOWN_ERROR";
    throw new FirebaseAuthRestError(message, message);
  }

  return data as T;
}

type SignUpResponse = {
  localId: string;
  email: string;
  idToken: string;
  refreshToken: string;
};

type SignInResponse = {
  localId: string;
  email: string;
  idToken: string;
  refreshToken: string;
  registered?: boolean;
};

type LookupUserResponse = {
  users?: Array<{
    localId: string;
    email?: string;
    displayName?: string;
    phoneNumber?: string;
    photoUrl?: string;
    providerUserInfo?: Array<{ providerId?: string }>;
  }>;
};

export async function signUpWithEmailPassword(email: string, password: string) {
  return callIdentityToolkit<SignUpResponse>("/accounts:signUp", {
    email,
    password,
    returnSecureToken: true,
  });
}

export async function signInWithEmailPassword(email: string, password: string) {
  return callIdentityToolkit<SignInResponse>("/accounts:signInWithPassword", {
    email,
    password,
    returnSecureToken: true,
  });
}

export async function lookupAccountByIdToken(idToken: string) {
  const response = await callIdentityToolkit<LookupUserResponse>("/accounts:lookup", {
    idToken,
  });

  if (!response.users || response.users.length === 0) {
    throw new FirebaseAuthRestError("USER_NOT_FOUND", "User not found for provided token.");
  }

  const [user] = response.users;
  return user;
}

export async function deleteAccountByIdToken(idToken: string) {
  await callIdentityToolkit<unknown>("/accounts:delete", {
    idToken,
  });
}

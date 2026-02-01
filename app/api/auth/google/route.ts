import { NextResponse } from "next/server";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
  type CollectionReference,
  type QueryDocumentSnapshot,
} from "firebase/firestore/lite";

import { FirebaseAuthRestError, lookupAccountByIdToken } from "@/lib/firebaseAuth";
import { getFirestoreDb } from "@/lib/firebase";
import { NORMALIZED_ADMIN_PHONE } from "@/lib/constants";
import { normalizePhoneValue, PHONE_REGEX } from "@/lib/credentials";

const USERNAME_ALLOWED_REGEX = /[^a-zA-Z0-9_]/g;
const MIN_USERNAME_LENGTH = 3;

export type UserDocument = {
  authUid?: string;
  username: string;
  usernameLower: string;
  email: string;
  emailLower: string;
  phone: string;
  phoneNormalized: string;
  isAdmin?: boolean;
  createdAt: string;
  updatedAt: string;
};

type GoogleAuthRequest = {
  idToken: string;
};

type GoogleAuthSuccessResponse = {
  success: true;
  requiresPhone: boolean;
  user: {
    username: string;
    email: string;
    phone: string;
    isAdmin: boolean;
  };
};

type GoogleAuthErrorResponse = {
  error: string;
};

const generateUsernameCandidates = (displayName: string | undefined, email: string) => {
  const candidates: string[] = [];

  if (displayName) {
    const slug = displayName
      .toLowerCase()
      .replace(USERNAME_ALLOWED_REGEX, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
    if (slug.length >= MIN_USERNAME_LENGTH) {
      candidates.push(slug);
    }
  }

  const emailLocalPart = email.split("@")[0];
  const emailSlug = emailLocalPart
    .toLowerCase()
    .replace(USERNAME_ALLOWED_REGEX, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (emailSlug.length >= MIN_USERNAME_LENGTH) {
    candidates.push(emailSlug);
  }

  candidates.push(`foodzo_user_${Math.floor(Math.random() * 10000)}`);
  return candidates;
};

async function ensureUniqueUsername(
  usersCollection: CollectionReference<UserDocument>,
  baseCandidates: string[]
) {
  for (const candidate of baseCandidates) {
    const normalized = candidate.toLowerCase();
    const snapshot = await getDocs(
      query(usersCollection, where("usernameLower", "==", normalized), limit(1))
    );

    if (snapshot.empty) {
      return { username: candidate, usernameLower: normalized };
    }
  }

  const fallback = `foodzo_user_${Date.now()}`;
  return { username: fallback, usernameLower: fallback.toLowerCase() };
}

function buildSuccessResponse(
  user: UserDocument,
  requiresPhone: boolean
): GoogleAuthSuccessResponse {
  return {
    success: true,
    requiresPhone,
    user: {
      username: user.username,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin === true,
    },
  };
}

export async function POST(request: Request) {
  let payload: GoogleAuthRequest;
  try {
    payload = (await request.json()) as GoogleAuthRequest;
  } catch {
    return NextResponse.json<GoogleAuthErrorResponse>(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  if (!payload || typeof payload.idToken !== "string" || !payload.idToken.trim()) {
    return NextResponse.json<GoogleAuthErrorResponse>(
      { error: "idToken is required." },
      { status: 400 }
    );
  }

  let userInfo: Awaited<ReturnType<typeof lookupAccountByIdToken>>;
  try {
    userInfo = await lookupAccountByIdToken(payload.idToken);
  } catch (error) {
    if (error instanceof FirebaseAuthRestError) {
      const code = error.code;
      if (code === "INVALID_ID_TOKEN" || code === "TOKEN_EXPIRED" || code === "USER_NOT_FOUND") {
        return NextResponse.json<GoogleAuthErrorResponse>(
          { error: "Invalid or expired authentication token." },
          { status: 401 }
        );
      }

      if (code === "USER_DISABLED") {
        return NextResponse.json<GoogleAuthErrorResponse>(
          { error: "This account has been disabled." },
          { status: 403 }
        );
      }
    }

    console.error("Google auth lookup failed", error);
    return NextResponse.json<GoogleAuthErrorResponse>(
      { error: "Unable to verify Google account at the moment." },
      { status: 500 }
    );
  }

  if (!userInfo.providerUserInfo?.some((provider) => provider.providerId === "google.com")) {
    return NextResponse.json<GoogleAuthErrorResponse>(
      { error: "Google provider not linked to this account." },
      { status: 400 }
    );
  }

  if (!userInfo.email) {
    return NextResponse.json<GoogleAuthErrorResponse>(
      { error: "Google account email is required." },
      { status: 400 }
    );
  }

  const email = userInfo.email;
  const emailLower = email.toLowerCase();
  const rawPhone = userInfo.phoneNumber ?? "";
  const phoneNormalizedFromAuth = normalizePhoneValue(rawPhone);
  const db = getFirestoreDb();
  const usersCollection = collection(db, "users") as CollectionReference<UserDocument>;

  let matchedSnapshot: QueryDocumentSnapshot<UserDocument> | null = null;

  if (userInfo.localId) {
    const uidSnapshot = await getDocs(
      query(usersCollection, where("authUid", "==", userInfo.localId), limit(1))
    );
    if (!uidSnapshot.empty) {
      matchedSnapshot = uidSnapshot.docs[0] as QueryDocumentSnapshot<UserDocument>;
    }
  }

  if (!matchedSnapshot) {
    const emailSnapshot = await getDocs(
      query(usersCollection, where("emailLower", "==", emailLower), limit(1))
    );
    if (!emailSnapshot.empty) {
      matchedSnapshot = emailSnapshot.docs[0] as QueryDocumentSnapshot<UserDocument>;
    }
  }

  const timestamp = new Date().toISOString();

  if (matchedSnapshot) {
    const existingData = matchedSnapshot.data();
    const updates: Partial<UserDocument> = {
      authUid: userInfo.localId ?? existingData.authUid,
      email,
      emailLower,
      updatedAt: timestamp,
    };

    const newPhoneNormalized = phoneNormalizedFromAuth;
    if (newPhoneNormalized && PHONE_REGEX.test(newPhoneNormalized)) {
      updates.phone = rawPhone;
      updates.phoneNormalized = newPhoneNormalized;
    }

    if (!existingData.username || existingData.username.length < MIN_USERNAME_LENGTH) {
      const { username, usernameLower } = await ensureUniqueUsername(
        usersCollection,
        generateUsernameCandidates(userInfo.displayName, email)
      );
      updates.username = username;
      updates.usernameLower = usernameLower;
    }

    if (existingData.phoneNormalized === NORMALIZED_ADMIN_PHONE) {
      updates.isAdmin = true;
    } else if (
      (updates.phoneNormalized ?? existingData.phoneNormalized) === NORMALIZED_ADMIN_PHONE
    ) {
      updates.isAdmin = true;
    }

    await updateDoc(matchedSnapshot.ref, updates);

    const mergedUser: UserDocument = {
      ...existingData,
      ...updates,
      username: updates.username ?? existingData.username,
      usernameLower: updates.usernameLower ?? existingData.usernameLower,
      isAdmin:
        updates.isAdmin ?? existingData.isAdmin ?? existingData.phoneNormalized === NORMALIZED_ADMIN_PHONE,
      createdAt: existingData.createdAt,
      updatedAt: updates.updatedAt ?? existingData.updatedAt,
    };

    const finalPhoneNormalized = mergedUser.phoneNormalized;
    const requiresPhone = !finalPhoneNormalized || !PHONE_REGEX.test(finalPhoneNormalized);

    return NextResponse.json(buildSuccessResponse(mergedUser, requiresPhone));
  }

  const usernameResult = await ensureUniqueUsername(
    usersCollection,
    generateUsernameCandidates(userInfo.displayName, email)
  );

  const sanitizedPhoneNormalized = PHONE_REGEX.test(phoneNormalizedFromAuth)
    ? phoneNormalizedFromAuth
    : "";
  const sanitizedPhone = sanitizedPhoneNormalized ? rawPhone : "";
  const isAdmin = sanitizedPhoneNormalized === NORMALIZED_ADMIN_PHONE;

  const newUser: UserDocument = {
    authUid: userInfo.localId,
    username: usernameResult.username,
    usernameLower: usernameResult.usernameLower,
    email,
    emailLower,
    phone: sanitizedPhone,
    phoneNormalized: sanitizedPhoneNormalized,
    isAdmin,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await addDoc(usersCollection, newUser);

  const requiresPhone = !sanitizedPhoneNormalized || !PHONE_REGEX.test(sanitizedPhoneNormalized);

  return NextResponse.json(buildSuccessResponse(newUser, requiresPhone), { status: 201 });
}

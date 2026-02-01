import { NextResponse } from "next/server";
import {
  collection,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
  type CollectionReference,
} from "firebase/firestore/lite";

import { FirebaseAuthRestError, lookupAccountByIdToken } from "@/lib/firebaseAuth";
import { getFirestoreDb } from "@/lib/firebase";
import { NORMALIZED_ADMIN_PHONE } from "@/lib/constants";
import { normalizePhoneValue, PHONE_REGEX } from "@/lib/credentials";

import type { UserDocument } from "../google/route";

type PhoneRequestBody = {
  idToken: string;
  phone: string;
};

type PhoneSuccessResponse = {
  success: true;
  user: {
    username: string;
    email: string;
    phone: string;
    isAdmin: boolean;
  };
};

type PhoneErrorResponse = {
  error: string;
};

const MIN_PHONE_DIGITS = 7;

function buildSuccessResponse(user: UserDocument): PhoneSuccessResponse {
  return {
    success: true,
    user: {
      username: user.username,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin === true,
    },
  };
}

export async function POST(request: Request) {
  let payload: PhoneRequestBody;
  try {
    payload = (await request.json()) as PhoneRequestBody;
  } catch {
    return NextResponse.json<PhoneErrorResponse>({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (
    !payload ||
    typeof payload.idToken !== "string" ||
    !payload.idToken.trim() ||
    typeof payload.phone !== "string"
  ) {
    return NextResponse.json<PhoneErrorResponse>({ error: "Invalid request body." }, { status: 400 });
  }

  const trimmedPhone = payload.phone.trim();
  const normalizedPhone = normalizePhoneValue(trimmedPhone);

  if (!normalizedPhone || normalizedPhone.length < MIN_PHONE_DIGITS || !PHONE_REGEX.test(normalizedPhone)) {
    return NextResponse.json<PhoneErrorResponse>(
      { error: "Enter a valid phone number with country code." },
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
        return NextResponse.json<PhoneErrorResponse>(
          { error: "Session expired. Please sign in again." },
          { status: 401 }
        );
      }
    }

    console.error("Phone auth lookup failed", error);
    return NextResponse.json<PhoneErrorResponse>(
      { error: "Unable to verify session. Please try again." },
      { status: 500 }
    );
  }

  const db = getFirestoreDb();
  const usersCollection = collection(db, "users") as CollectionReference<UserDocument>;

  let matchedUserSnapshot = null;

  if (userInfo.localId) {
    const uidSnapshot = await getDocs(
      query(usersCollection, where("authUid", "==", userInfo.localId), limit(1))
    );
    if (!uidSnapshot.empty) {
      matchedUserSnapshot = uidSnapshot.docs[0];
    }
  }

  if (!matchedUserSnapshot && userInfo.email) {
    const emailSnapshot = await getDocs(
      query(usersCollection, where("emailLower", "==", userInfo.email.toLowerCase()), limit(1))
    );

    if (!emailSnapshot.empty) {
      matchedUserSnapshot = emailSnapshot.docs[0];
    }
  }

  if (!matchedUserSnapshot) {
    return NextResponse.json<PhoneErrorResponse>(
      { error: "No matching user profile found. Please contact support." },
      { status: 404 }
    );
  }

  const existingData = matchedUserSnapshot.data();
  const timestamp = new Date().toISOString();
  const isAdminUpdate =
    normalizedPhone === NORMALIZED_ADMIN_PHONE || existingData.phoneNormalized === NORMALIZED_ADMIN_PHONE;

  await updateDoc(matchedUserSnapshot.ref, {
    phone: trimmedPhone,
    phoneNormalized: normalizedPhone,
    isAdmin: isAdminUpdate ? true : existingData.isAdmin,
    updatedAt: timestamp,
  });

  const merged: UserDocument = {
    ...existingData,
    phone: trimmedPhone,
    phoneNormalized: normalizedPhone,
    isAdmin: isAdminUpdate ? true : existingData.isAdmin,
    updatedAt: timestamp,
  };

  return NextResponse.json(buildSuccessResponse(merged));
}

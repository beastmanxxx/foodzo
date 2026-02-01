import { NextResponse } from "next/server";
import {
  collection,
  getDocs,
  limit,
  query,
  where,
  type CollectionReference,
} from "firebase/firestore/lite";

import {
  FirebaseAuthRestError,
  signInWithEmailPassword,
} from "@/lib/firebaseAuth";
import { getFirestoreDb } from "@/lib/firebase";
import { validateSigninPayload } from "@/lib/credentials";
import { NORMALIZED_ADMIN_PHONE } from "@/lib/constants";

type UserDocument = {
  authUid?: string;
  username: string;
  email: string;
  emailLower: string;
  phone: string;
  phoneNormalized: string;
  isAdmin?: boolean;
};

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const validation = validateSigninPayload(payload);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const db = getFirestoreDb();
    const usersCollection = collection(db, "users") as CollectionReference<UserDocument>;

    let emailForAuth: string | null = null;
    let preloadedUser: UserDocument | null = null;

    if (validation.mode === "email") {
      emailForAuth = validation.normalizedEmail;
    } else {
      const phoneSnapshot = await getDocs(
        query(usersCollection, where("phoneNormalized", "==", validation.normalizedPhone), limit(1))
      );

      if (phoneSnapshot.empty) {
        return NextResponse.json(
          { error: "Invalid credentials." },
          { status: 401 }
        );
      }

      preloadedUser = phoneSnapshot.docs[0].data();
      emailForAuth = preloadedUser.emailLower;
    }

    if (!emailForAuth) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    let authUid: string | null = null;
    try {
      const authResponse = await signInWithEmailPassword(emailForAuth, validation.password);
      authUid = authResponse.localId;
    } catch (error) {
      if (error instanceof FirebaseAuthRestError) {
        const message = error.code;
        if (message === "INVALID_PASSWORD" || message === "EMAIL_NOT_FOUND") {
          return NextResponse.json(
            { error: "Invalid credentials." },
            { status: 401 }
          );
        }
        if (message === "USER_DISABLED") {
          return NextResponse.json(
            { error: "This account has been disabled." },
            { status: 403 }
          );
        }
        if (message === "TOO_MANY_ATTEMPTS_TRY_LATER") {
          return NextResponse.json(
            {
              error:
                "Too many failed attempts. Please wait a bit and try again.",
            },
            { status: 429 }
          );
        }

        console.error("Firebase Auth signin error", error);
        return NextResponse.json(
          { error: "Unable to sign in at the moment. Please try again later." },
          { status: 500 }
        );
      }

      throw error;
    }

    let userRecord = preloadedUser;

    if (authUid) {
      const uidSnapshot = await getDocs(
        query(usersCollection, where("authUid", "==", authUid), limit(1))
      );

      if (!uidSnapshot.empty) {
        userRecord = uidSnapshot.docs[0].data();
      }
    }

    if (!userRecord) {
      const emailSnapshot = await getDocs(
        query(usersCollection, where("emailLower", "==", emailForAuth), limit(1))
      );

      if (!emailSnapshot.empty) {
        userRecord = emailSnapshot.docs[0].data();
      }
    }

    if (!userRecord) {
      return NextResponse.json(
        {
          error:
            "Account profile is missing. Please contact support before signing in again.",
        },
        { status: 500 }
      );
    }

    const documentIsAdmin = userRecord.isAdmin === true;
    const isAdmin =
      documentIsAdmin || userRecord.phoneNormalized === NORMALIZED_ADMIN_PHONE;

    return NextResponse.json({
      success: true,
      user: {
        username: userRecord.username,
        email: userRecord.email,
        phone: userRecord.phone,
        isAdmin,
      },
    });
  } catch (error) {
    console.error("Signin error", error);
    return NextResponse.json(
      { error: "Unable to sign in at the moment. Please try again later." },
      { status: 500 }
    );
  }
}

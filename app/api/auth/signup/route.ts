import { NextResponse } from "next/server";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  where,
  type CollectionReference,
} from "firebase/firestore/lite";

import { FirebaseAuthRestError, signUpWithEmailPassword } from "@/lib/firebaseAuth";
import { getFirestoreDb } from "@/lib/firebase";
import { validateSignupPayload } from "@/lib/credentials";
import { NORMALIZED_ADMIN_PHONE } from "@/lib/constants";

type UserDocument = {
  authUid: string;
  username: string;
  usernameLower: string;
  email: string;
  emailLower: string;
  phone: string;
  phoneNormalized: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const validation = validateSignupPayload(payload);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const {
      username,
      email,
      phone,
      password,
      normalizedUsername,
      normalizedEmail,
      normalizedPhone,
    } = validation;

    const db = getFirestoreDb();
    const usersCollection = collection(db, "users") as CollectionReference<UserDocument>;

    const usernameSnapshot = await getDocs(
      query(usersCollection, where("usernameLower", "==", normalizedUsername), limit(1))
    );

    if (!usernameSnapshot.empty) {
      return NextResponse.json(
        { error: "Username already exists. Please choose another." },
        { status: 409 }
      );
    }

    const emailSnapshot = await getDocs(
      query(usersCollection, where("emailLower", "==", normalizedEmail), limit(1))
    );

    if (!emailSnapshot.empty) {
      return NextResponse.json(
        { error: "Email already registered. Try signing in instead." },
        { status: 409 }
      );
    }

    const phoneSnapshot = await getDocs(
      query(usersCollection, where("phoneNormalized", "==", normalizedPhone), limit(1))
    );

    if (!phoneSnapshot.empty) {
      return NextResponse.json(
        { error: "Phone number already registered. Try signing in instead." },
        { status: 409 }
      );
    }

    let authUid: string | null = null;
    try {
      const authResponse = await signUpWithEmailPassword(email, password);
      authUid = authResponse.localId;
    } catch (error) {
      if (error instanceof FirebaseAuthRestError) {
        const message = error.code;
        if (message === "EMAIL_EXISTS") {
          return NextResponse.json(
            { error: "Email already registered. Try signing in instead." },
            { status: 409 }
          );
        }
        if (message === "WEAK_PASSWORD") {
          return NextResponse.json(
            { error: "Password must be stronger. Please choose a more secure password." },
            { status: 400 }
          );
        }
        if (message === "INVALID_EMAIL") {
          return NextResponse.json(
            { error: "Please provide a valid email address." },
            { status: 400 }
          );
        }
        if (message === "OPERATION_NOT_ALLOWED") {
          return NextResponse.json(
            {
              error:
                "Email/password sign ups are disabled for this project. Enable them in Firebase Authentication settings.",
            },
            { status: 500 }
          );
        }
        console.error("Firebase Auth signup error", error);
        return NextResponse.json(
          { error: "Unable to sign up at the moment. Please try again later." },
          { status: 500 }
        );
      }
      throw error;
    }

    if (!authUid) {
      return NextResponse.json(
        { error: "Unable to sign up at the moment. Please try again later." },
        { status: 500 }
      );
    }

    const isPermanentAdmin = normalizedPhone === NORMALIZED_ADMIN_PHONE;
    const timestamp = new Date().toISOString();

    await addDoc(usersCollection, {
      authUid,
      username,
      usernameLower: normalizedUsername,
      email,
      emailLower: normalizedEmail,
      phone,
      phoneNormalized: normalizedPhone,
      isAdmin: isPermanentAdmin,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Signup error", error);
    return NextResponse.json(
      { error: "Unable to sign up at the moment. Please try again later." },
      { status: 500 }
    );
  }
}

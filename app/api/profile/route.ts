import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, limit, query, where } from "firebase/firestore/lite";

import { getFirestoreDb } from "@/lib/firebase";
import { normalizePhoneValue, PHONE_REGEX } from "@/lib/credentials";

import type { UserDocument } from "@/app/api/auth/google/route";

const missingParamsResponse = NextResponse.json(
  { error: "Provide email or phone to lookup profile." },
  { status: 400 }
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawEmail = searchParams.get("email")?.trim();
  const rawPhone = searchParams.get("phone")?.trim();

  if (!rawEmail && !rawPhone) {
    return missingParamsResponse;
  }

  const db = getFirestoreDb();
  const usersCollection = collection(db, "users");

  const emailLower = rawEmail?.toLowerCase();
  const phoneNormalized = rawPhone ? normalizePhoneValue(rawPhone) : "";

  let snapshot;

  if (emailLower) {
    snapshot = await getDocs(
      query(usersCollection, where("emailLower", "==", emailLower), limit(1))
    );
  }

  if ((!snapshot || snapshot.empty) && phoneNormalized && PHONE_REGEX.test(phoneNormalized)) {
    snapshot = await getDocs(
      query(usersCollection, where("phoneNormalized", "==", phoneNormalized), limit(1))
    );
  }

  if (!snapshot || snapshot.empty) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const doc = snapshot.docs[0];
  const data = doc.data() as UserDocument;

  return NextResponse.json({
    user: {
      username: data.username,
      email: data.email,
      phone: data.phone,
      isAdmin: data.isAdmin ?? false,
      photoUrl: data.photoUrl ?? undefined,
    },
  });
}

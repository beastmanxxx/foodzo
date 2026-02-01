import { NextResponse } from "next/server";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore/lite";

import { getAuthorizedAdminPhone } from "@/lib/admin";
import { getFirestoreDb } from "@/lib/firebase";

const USERS_COLLECTION = "users";

type UserDocument = {
  username: string;
  email: string;
  phone: string;
  phoneNormalized: string;
  isAdmin?: boolean;
};

export async function GET(request: Request) {
  const adminPhone = await getAuthorizedAdminPhone(request);

  if (!adminPhone) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getFirestoreDb();
    const usersCollection = collection(db, USERS_COLLECTION);
    const snapshot = await getDocs(
      query(usersCollection, orderBy("createdAt", "desc"), limit(200))
    );

    const users = snapshot.docs.map((docSnap) => docSnap.data() as UserDocument);

    return NextResponse.json({
      users: users.map((user) => ({
        username: user.username,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin === true,
      })),
    });
  } catch (error) {
    console.error("Failed to load users", error);
    return NextResponse.json(
      { error: "Failed to load users. Please try again later." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const adminPhone = await getAuthorizedAdminPhone(request);

  if (!adminPhone) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { phone } = payload as Record<string, unknown>;

  if (typeof phone !== "string") {
    return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
  }

  const normalizedPhone = phone.replace(/[^0-9+]/g, "");

  if (!normalizedPhone) {
    return NextResponse.json({ error: "Provide a valid phone number." }, { status: 400 });
  }

  try {
    const db = getFirestoreDb();
    const usersCollection = collection(db, USERS_COLLECTION);
    const matchSnapshot = await getDocs(
      query(usersCollection, where("phoneNormalized", "==", normalizedPhone), limit(1))
    );

    if (matchSnapshot.empty) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const userDoc = matchSnapshot.docs[0];
    await updateDoc(userDoc.ref, {
      isAdmin: true,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to promote user", error);
    return NextResponse.json(
      { error: "Failed to promote user. Please try again later." },
      { status: 500 }
    );
  }
}

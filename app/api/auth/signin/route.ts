import { NextResponse } from "next/server";

import { getDb } from "@/lib/mongodb";
import { verifyPassword } from "@/lib/password";
import { validateSigninPayload } from "@/lib/credentials";
import { NORMALIZED_ADMIN_PHONE } from "@/lib/constants";

type UserDocument = {
  username: string;
  email: string;
  emailLower: string;
  phone: string;
  phoneNormalized: string;
  passwordHash: string;
  isAdmin?: boolean;
};

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const validation = validateSigninPayload(payload);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const db = await getDb();
    const usersCollection = db.collection<UserDocument>("users");

    let existingUser: UserDocument | null = null;

    if (validation.mode === "email") {
      existingUser = await usersCollection.findOne({
        emailLower: validation.normalizedEmail,
      });
    } else {
      existingUser = await usersCollection.findOne({
        phoneNormalized: validation.normalizedPhone,
      });
    }

    if (!existingUser || typeof existingUser.passwordHash !== "string") {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(
      validation.password,
      existingUser.passwordHash
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    const documentIsAdmin = existingUser.isAdmin === true;
    const isAdmin =
      documentIsAdmin || existingUser.phoneNormalized === NORMALIZED_ADMIN_PHONE;

    return NextResponse.json({
      success: true,
      user: {
        username: existingUser.username,
        email: existingUser.email,
        phone: existingUser.phone,
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

import { NextResponse } from "next/server";

import { getDb } from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";
import { validateSignupPayload } from "@/lib/credentials";
import { NORMALIZED_ADMIN_PHONE } from "@/lib/constants";

type UserDocument = {
  username: string;
  usernameLower: string;
  email: string;
  emailLower: string;
  phone: string;
  phoneNormalized: string;
  passwordHash: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
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

    const db = await getDb();
    const usersCollection = db.collection<UserDocument>("users");

    const existingUser = await usersCollection.findOne({
      $or: [
        { usernameLower: normalizedUsername },
        { emailLower: normalizedEmail },
        { phoneNormalized: normalizedPhone },
      ],
    });

    if (existingUser) {
      if (existingUser.usernameLower === normalizedUsername) {
        return NextResponse.json(
          { error: "Username already exists. Please choose another." },
          { status: 409 }
        );
      }

      if (existingUser.emailLower === normalizedEmail) {
        return NextResponse.json(
          { error: "Email already registered. Try signing in instead." },
          { status: 409 }
        );
      }

      if (existingUser.phoneNormalized === normalizedPhone) {
        return NextResponse.json(
          { error: "Phone number already registered. Try signing in instead." },
          { status: 409 }
        );
      }
    }

    const passwordHash = await hashPassword(password);

    const isPermanentAdmin = normalizedPhone === NORMALIZED_ADMIN_PHONE;

    await usersCollection.insertOne({
      username,
      usernameLower: normalizedUsername,
      email,
      emailLower: normalizedEmail,
      phone,
      phoneNormalized: normalizedPhone,
      passwordHash,
      isAdmin: isPermanentAdmin,
      createdAt: new Date(),
      updatedAt: new Date(),
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

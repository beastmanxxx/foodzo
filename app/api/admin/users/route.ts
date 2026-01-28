import { NextResponse } from "next/server";

import { getAuthorizedAdminPhone } from "@/lib/admin";
import { getDb } from "@/lib/mongodb";

const USERS_COLLECTION = "users";

export async function GET(request: Request) {
  const adminPhone = await getAuthorizedAdminPhone(request);

  if (!adminPhone) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const usersCollection = db.collection(USERS_COLLECTION);

  const users = await usersCollection
    .find({}, { projection: { passwordHash: 0 } })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  return NextResponse.json({
    users: users.map((user) => ({
      username: user.username,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin === true,
    })),
  });
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

  const db = await getDb();
  const usersCollection = db.collection(USERS_COLLECTION);

  const result = await usersCollection.updateOne(
    { phoneNormalized: normalizedPhone },
    {
      $set: {
        isAdmin: true,
        updatedAt: new Date(),
      },
    }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

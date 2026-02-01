import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore/lite";

import {
  CATEGORIES_COLLECTION,
  type CategoryDocument,
  serializeCategory,
} from "@/lib/categories";
import { getFirestoreDb } from "@/lib/firebase";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id?: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const params = await context.params;
  const rawId = params?.id ?? "";
  const normalizedId = rawId.trim();

  if (!normalizedId) {
    return NextResponse.json({ error: "Invalid category id." }, { status: 400 });
  }

  try {
    const db = getFirestoreDb();
    const categoryRef = doc(db, CATEGORIES_COLLECTION, normalizedId);
    const snapshot = await getDoc(categoryRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }

    const category = serializeCategory(normalizedId, snapshot.data() as CategoryDocument);

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Failed to load category", error);
    return NextResponse.json({ error: "Failed to load category." }, { status: 500 });
  }
}

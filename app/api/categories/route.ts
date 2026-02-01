import { NextResponse } from "next/server";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore/lite";

import {
  CATEGORIES_COLLECTION,
  type CategoryDocument,
  serializeCategory,
} from "@/lib/categories";
import { getFirestoreDb } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getFirestoreDb();
    const categoriesCollection = collection(db, CATEGORIES_COLLECTION);
    const categoriesQuery = query(categoriesCollection, orderBy("createdAt", "desc"), limit(200));
    const snapshot = await getDocs(categoriesQuery);

    const categories = snapshot.docs.map((docSnap) =>
      serializeCategory(docSnap.id, docSnap.data() as CategoryDocument)
    );

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Failed to load categories", error);
    return NextResponse.json(
      { error: "Failed to load categories. Please try again later." },
      { status: 500 }
    );
  }
}

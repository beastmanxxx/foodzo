import { NextResponse } from "next/server";
import { collection, getDocs, query, where, limit } from "firebase/firestore/lite";

import { getFirestoreDb } from "@/lib/firebase";
import {
  PRODUCTS_COLLECTION,
  type ProductDocument,
  serializeProduct,
} from "@/lib/products";

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
    const productsCollection = collection(db, PRODUCTS_COLLECTION);
    const productsSnapshot = await getDocs(
      query(productsCollection, where("categoryIds", "array-contains", normalizedId), limit(200))
    );

    const products = productsSnapshot.docs.map((docSnap) =>
      serializeProduct(docSnap.id, docSnap.data() as ProductDocument)
    );

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Failed to load products for category", error);
    return NextResponse.json(
      { error: "Failed to load products for this category." },
      { status: 500 }
    );
  }
}

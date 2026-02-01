import { NextResponse } from "next/server";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore/lite";

import { getFirestoreDb } from "@/lib/firebase";
import {
  PRODUCTS_COLLECTION,
  ProductDocument,
  serializeProduct,
} from "@/lib/products";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getFirestoreDb();
    const productsCollection = collection(db, PRODUCTS_COLLECTION);
    const productsQuery = query(productsCollection, orderBy("createdAt", "desc"), limit(200));
    const snapshot = await getDocs(productsQuery);

    const products = snapshot.docs.map((docSnap) =>
      serializeProduct(docSnap.id, docSnap.data() as ProductDocument)
    );

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Failed to load products", error);
    return NextResponse.json(
      { error: "Failed to load products. Please try again later." },
      { status: 500 }
    );
  }
}

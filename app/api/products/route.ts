import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/mongodb";
import {
  PRODUCTS_COLLECTION,
  ProductDocument,
  serializeProduct,
} from "@/lib/products";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDb();
  const productsCollection = db.collection<ProductDocument>(PRODUCTS_COLLECTION);

  const products = await productsCollection
    .find({}, { sort: { createdAt: -1 } })
    .limit(200)
    .toArray();

  return NextResponse.json({
    products: products.map((product) =>
      serializeProduct(product as ProductDocument & { _id: ObjectId })
    ),
  });
}

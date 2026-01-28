import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { Buffer } from "node:buffer";

import { getAuthorizedAdminPhone } from "@/lib/admin";
import { getCloudinaryClient } from "@/lib/cloudinary";
import { getDb } from "@/lib/mongodb";
import {
  PRODUCTS_COLLECTION,
  ProductDocument,
  serializeProduct,
  validateProductFormData,
} from "@/lib/products";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const adminPhone = await getAuthorizedAdminPhone(request);

  if (!adminPhone) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

export async function POST(request: Request) {
  const adminPhone = await getAuthorizedAdminPhone(request);

  if (!adminPhone) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const validation = validateProductFormData(formData);

  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const imageFile = formData.get("image");

  if (!(imageFile instanceof File) || imageFile.size === 0) {
    return NextResponse.json({ error: "Product image is required." }, { status: 400 });
  }

  const mimeType = imageFile.type || "application/octet-stream";

  let secureUrl: string;
  let publicId: string;

  try {
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const cloudinary = getCloudinaryClient();
    const uploadResult = await cloudinary.uploader.upload(
      `data:${mimeType};base64,${base64}`,
      {
        folder: "foodzo/products",
        resource_type: "image",
      }
    );

    secureUrl = uploadResult.secure_url;
    publicId = uploadResult.public_id;
  } catch (error) {
    console.error("Cloudinary upload failed", error);
    return NextResponse.json(
      { error: "Failed to upload product image. Please try again." },
      { status: 500 }
    );
  }

  const { data } = validation;

  const productDocument: ProductDocument = {
    name: data.name,
    description: data.description,
    price: data.price,
    salePrice: data.salePrice,
    rating: data.rating,
    deliveryTime: data.deliveryTime,
    imageUrl: secureUrl,
    imagePublicId: publicId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const db = await getDb();
    const productsCollection = db.collection<ProductDocument>(PRODUCTS_COLLECTION);
    const insertResult = await productsCollection.insertOne(productDocument);
    const inserted = await productsCollection.findOne({ _id: insertResult.insertedId });

    if (!inserted) {
      throw new Error("Failed to load inserted product");
    }

    return NextResponse.json(
      {
        product: serializeProduct(inserted as ProductDocument & { _id: ObjectId }),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to save product", error);
    return NextResponse.json(
      { error: "Failed to save product. Please try again later." },
      { status: 500 }
    );
  }
}

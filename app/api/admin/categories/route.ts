import { Buffer } from "node:buffer";

import { NextResponse } from "next/server";
import { addDoc, collection, getDocs, getDoc, limit, orderBy, query } from "firebase/firestore/lite";

import { getAuthorizedAdminPhone } from "@/lib/admin";
import {
  CATEGORIES_COLLECTION,
  type CategoryDocument,
  serializeCategory,
  validateCategoryFormData,
} from "@/lib/categories";
import { getCloudinaryClient } from "@/lib/cloudinary";
import { getFirestoreDb } from "@/lib/firebase";
import { syncCategoryProductLinks } from "@/lib/categoryProductLinks";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const adminPhone = await getAuthorizedAdminPhone(request);

  if (!adminPhone) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getFirestoreDb();
    const categoriesCollection = collection(db, CATEGORIES_COLLECTION);
    const snapshot = await getDocs(
      query(categoriesCollection, orderBy("createdAt", "desc"), limit(200))
    );

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

  const validation = validateCategoryFormData(formData);

  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const imageFile = formData.get("image");

  if (!(imageFile instanceof File) || imageFile.size === 0) {
    return NextResponse.json(
      { error: "Category image is required." },
      { status: 400 }
    );
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
        folder: "foodzo/categories",
        resource_type: "image",
      }
    );

    secureUrl = uploadResult.secure_url;
    publicId = uploadResult.public_id;
  } catch (error) {
    console.error("Cloudinary upload failed", error);
    return NextResponse.json(
      { error: "Failed to upload category image. Please try again." },
      { status: 500 }
    );
  }

  const { data } = validation;

  const categoryDocument: CategoryDocument = {
    name: data.name,
    imageUrl: secureUrl,
    imagePublicId: publicId,
    productIds: data.productIds,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const db = getFirestoreDb();
    const categoriesCollection = collection(db, CATEGORIES_COLLECTION);
    const insertedRef = await addDoc(categoriesCollection, categoryDocument);
    const insertedSnapshot = await getDoc(insertedRef);

    if (!insertedSnapshot.exists()) {
      throw new Error("Failed to retrieve inserted category");
    }

    const categoryResponse = serializeCategory(
      insertedSnapshot.id,
      insertedSnapshot.data() as CategoryDocument
    );

    await syncCategoryProductLinks(db, insertedSnapshot.id, data.productIds, []);

    return NextResponse.json(
      {
        category: categoryResponse,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to save category", error);

    try {
      const cloudinary = getCloudinaryClient();
      await cloudinary.uploader.destroy(publicId);
    } catch (cleanupError) {
      console.error("Failed to cleanup uploaded category image", cleanupError);
    }

    return NextResponse.json(
      { error: "Failed to save category. Please try again later." },
      { status: 500 }
    );
  }
}

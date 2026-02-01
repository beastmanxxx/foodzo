import { Buffer } from "node:buffer";

import { NextResponse } from "next/server";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore/lite";

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

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
};

async function uploadCategoryImage(image: File): Promise<CloudinaryUploadResult> {
  const mimeType = image.type || "application/octet-stream";
  const arrayBuffer = await image.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const cloudinary = getCloudinaryClient();

  return cloudinary.uploader.upload(`data:${mimeType};base64,${base64}`, {
    folder: "foodzo/categories",
    resource_type: "image",
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const adminPhone = await getAuthorizedAdminPhone(request);

  if (!adminPhone) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const normalizedId = id.trim();

  if (!normalizedId) {
    return NextResponse.json({ error: "Invalid category id." }, { status: 400 });
  }

  const db = getFirestoreDb();
  const categoryRef = doc(db, CATEGORIES_COLLECTION, normalizedId);
  const existingSnapshot = await getDoc(categoryRef);
  const existingCategory = existingSnapshot.exists()
    ? (existingSnapshot.data() as CategoryDocument)
    : null;

  if (!existingCategory) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
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

  let uploadedImage: CloudinaryUploadResult | null = null;

  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      uploadedImage = await uploadCategoryImage(imageFile);
    } catch (error) {
      console.error("Cloudinary upload failed", error);
      return NextResponse.json(
        { error: "Failed to upload category image. Please try again." },
        { status: 500 }
      );
    }
  }

  const update: Partial<CategoryDocument> = {
    name: validation.data.name,
    productIds: validation.data.productIds,
    updatedAt: new Date().toISOString(),
  };

  if (uploadedImage) {
    update.imageUrl = uploadedImage.secure_url;
    update.imagePublicId = uploadedImage.public_id;
  }

  try {
    await updateDoc(categoryRef, update);
  } catch (error) {
    console.error("Failed to update category", error);

    if (uploadedImage) {
      try {
        const cloudinary = getCloudinaryClient();
        await cloudinary.uploader.destroy(uploadedImage.public_id);
      } catch (cleanupError) {
        console.error("Failed to cleanup uploaded category image", cleanupError);
      }
    }

    return NextResponse.json(
      { error: "Failed to update category. Please try again later." },
      { status: 500 }
    );
  }

  const updatedSnapshot = await getDoc(categoryRef);
  const updatedCategory = updatedSnapshot.exists()
    ? (updatedSnapshot.data() as CategoryDocument)
    : null;

  if (!updatedCategory) {
    return NextResponse.json(
      { error: "Unable to load updated category." },
      { status: 500 }
    );
  }

  await syncCategoryProductLinks(db, normalizedId, validation.data.productIds, existingCategory.productIds);

  if (uploadedImage && existingCategory.imagePublicId) {
    try {
      const cloudinary = getCloudinaryClient();
      await cloudinary.uploader.destroy(existingCategory.imagePublicId);
    } catch (cleanupError) {
      console.error("Failed to delete previous category image", cleanupError);
    }
  }

  return NextResponse.json({
    category: serializeCategory(normalizedId, updatedCategory),
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  const adminPhone = await getAuthorizedAdminPhone(request);

  if (!adminPhone) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const normalizedId = id.trim();

  if (!normalizedId) {
    return NextResponse.json({ error: "Invalid category id." }, { status: 400 });
  }

  const db = getFirestoreDb();
  const categoryRef = doc(db, CATEGORIES_COLLECTION, normalizedId);
  const existingSnapshot = await getDoc(categoryRef);
  const existingCategory = existingSnapshot.exists()
    ? (existingSnapshot.data() as CategoryDocument)
    : null;

  if (!existingCategory) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  try {
    await deleteDoc(categoryRef);
  } catch (error) {
    console.error("Failed to delete category", error);
    return NextResponse.json(
      { error: "Failed to delete category. Please try again later." },
      { status: 500 }
    );
  }

  if (existingCategory.imagePublicId) {
    try {
      const cloudinary = getCloudinaryClient();
      await cloudinary.uploader.destroy(existingCategory.imagePublicId);
    } catch (error) {
      console.error("Failed to delete category image from Cloudinary", error);
    }
  }

  return NextResponse.json({ success: true });
}

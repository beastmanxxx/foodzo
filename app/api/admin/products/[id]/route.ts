import { NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore/lite";

import { getAuthorizedAdminPhone } from "@/lib/admin";
import { getCloudinaryClient } from "@/lib/cloudinary";
import { getFirestoreDb } from "@/lib/firebase";
import {
  PRODUCTS_COLLECTION,
  type ProductDocument,
  serializeProduct,
  validateProductFormData,
} from "@/lib/products";
import { syncProductCategoryLinks } from "@/lib/categoryProductLinks";

type RouteContext = {
  params: Promise<{
    id?: string;
  }>;
};

export const dynamic = "force-dynamic";

type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
};

async function uploadProductImage(image: File): Promise<CloudinaryUploadResult> {
  const mimeType = image.type || "application/octet-stream";
  const arrayBuffer = await image.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const cloudinary = getCloudinaryClient();

  return cloudinary.uploader.upload(`data:${mimeType};base64,${base64}`, {
    folder: "foodzo/products",
    resource_type: "image",
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const adminPhone = await getAuthorizedAdminPhone(request);

  if (!adminPhone) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const rawId = params?.id ?? "";
  const normalizedId = rawId.trim();

  if (!normalizedId) {
    return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  }

  const db = getFirestoreDb();
  const productRef = doc(db, PRODUCTS_COLLECTION, normalizedId);
  const existingSnapshot = await getDoc(productRef);
  const existingProduct = existingSnapshot.exists()
    ? (existingSnapshot.data() as ProductDocument)
    : null;

  if (!existingProduct) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
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

  let uploadedImage: CloudinaryUploadResult | null = null;

  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      uploadedImage = await uploadProductImage(imageFile);
    } catch (error) {
      console.error("Cloudinary upload failed", error);
      return NextResponse.json(
        { error: "Failed to upload product image. Please try again." },
        { status: 500 }
      );
    }
  }

  const { data } = validation;
  const update: Partial<ProductDocument> = {
    name: data.name,
    description: data.description,
    price: data.price,
    salePrice: data.salePrice,
    rating: data.rating,
    deliveryTime: data.deliveryTime,
    categoryIds: data.categoryIds,
    updatedAt: new Date().toISOString(),
  };

  if (uploadedImage) {
    update.imageUrl = uploadedImage.secure_url;
    update.imagePublicId = uploadedImage.public_id;
  }

  try {
    await updateDoc(productRef, update);
  } catch (error) {
    console.error("Failed to update product", error);

    if (uploadedImage) {
      try {
        const cloudinary = getCloudinaryClient();
        await cloudinary.uploader.destroy(uploadedImage.public_id);
      } catch (cleanupError) {
        console.error("Failed to cleanup uploaded image after update failure", cleanupError);
      }
    }

    return NextResponse.json(
      { error: "Failed to update product. Please try again later." },
      { status: 500 }
    );
  }

  const updatedSnapshot = await getDoc(productRef);
  const updatedProduct = updatedSnapshot.exists()
    ? (updatedSnapshot.data() as ProductDocument)
    : null;

  if (!updatedProduct) {
    return NextResponse.json(
      { error: "Unable to load updated product." },
      { status: 500 }
    );
  }

  await syncProductCategoryLinks(db, normalizedId, data.categoryIds, existingProduct.categoryIds);

  if (uploadedImage && existingProduct.imagePublicId) {
    try {
      const cloudinary = getCloudinaryClient();
      await cloudinary.uploader.destroy(existingProduct.imagePublicId);
    } catch (cleanupError) {
      console.error("Failed to delete previous product image", cleanupError);
    }
  }

  return NextResponse.json({
    product: serializeProduct(normalizedId, updatedProduct),
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  const adminPhone = await getAuthorizedAdminPhone(request);

  if (!adminPhone) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const rawId = params?.id ?? "";
  const normalizedId = rawId.trim();

  if (!normalizedId) {
    return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  }

  const db = getFirestoreDb();
  const productRef = doc(db, PRODUCTS_COLLECTION, normalizedId);
  const existingSnapshot = await getDoc(productRef);
  const existingProduct = existingSnapshot.exists()
    ? (existingSnapshot.data() as ProductDocument)
    : null;

  if (!existingProduct) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  try {
    await deleteDoc(productRef);
  } catch (error) {
    console.error("Failed to delete product", error);
    return NextResponse.json(
      { error: "Failed to delete product. Please try again later." },
      { status: 500 }
    );
  }

  if (existingProduct.imagePublicId) {
    try {
      const cloudinary = getCloudinaryClient();
      await cloudinary.uploader.destroy(existingProduct.imagePublicId);
    } catch (error) {
      console.error("Failed to delete product image from Cloudinary", error);
    }
  }

  return NextResponse.json({ success: true });
}

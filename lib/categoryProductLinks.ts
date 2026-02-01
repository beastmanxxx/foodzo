import { doc, getDoc, updateDoc, type Firestore } from "firebase/firestore/lite";

import { CATEGORIES_COLLECTION, type CategoryDocument } from "./categories";
import { PRODUCTS_COLLECTION, type ProductDocument } from "./products";

const timestamp = () => new Date().toISOString();

const normalizeIds = (ids: string[] | undefined | null): string[] => {
  if (!ids || ids.length === 0) return [];

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of ids) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized;
};

const replaceCategoryProducts = async (
  db: Firestore,
  categoryId: string,
  nextProductIds: string[]
) => {
  const categoryRef = doc(db, CATEGORIES_COLLECTION, categoryId);
  const snapshot = await getDoc(categoryRef);

  if (!snapshot.exists()) return;

  const data = snapshot.data() as CategoryDocument;
  const currentIds = normalizeIds(data.productIds);

  if (
    currentIds.length === nextProductIds.length &&
    currentIds.every((id) => nextProductIds.includes(id))
  ) {
    return;
  }

  await updateDoc(categoryRef, {
    productIds: nextProductIds,
    updatedAt: timestamp(),
  });
};

const replaceProductCategories = async (
  db: Firestore,
  productId: string,
  nextCategoryIds: string[]
) => {
  const productRef = doc(db, PRODUCTS_COLLECTION, productId);
  const snapshot = await getDoc(productRef);

  if (!snapshot.exists()) return;

  const data = snapshot.data() as ProductDocument;
  const currentIds = normalizeIds(data.categoryIds);

  if (
    currentIds.length === nextCategoryIds.length &&
    currentIds.every((id) => nextCategoryIds.includes(id))
  ) {
    return;
  }

  await updateDoc(productRef, {
    categoryIds: nextCategoryIds,
    updatedAt: timestamp(),
  });
};

export const syncProductCategoryLinks = async (
  db: Firestore,
  productId: string,
  nextCategoryIds: string[] | undefined,
  previousCategoryIds: string[] | undefined
) => {
  const next = normalizeIds(nextCategoryIds);
  const prev = normalizeIds(previousCategoryIds);

  await replaceProductCategories(db, productId, next);

  const removals = prev.filter((id) => !next.includes(id));
  const additions = next.filter((id) => !prev.includes(id));

  const updates: Promise<void>[] = [];

  for (const categoryId of additions) {
    updates.push(
      (async () => {
        const categoryRef = doc(db, CATEGORIES_COLLECTION, categoryId);
        const snapshot = await getDoc(categoryRef);
        if (!snapshot.exists()) return;
        const category = snapshot.data() as CategoryDocument;
        const current = normalizeIds(category.productIds);
        if (!current.includes(productId)) {
          current.push(productId);
          await updateDoc(categoryRef, {
            productIds: current,
            updatedAt: timestamp(),
          });
        }
      })()
    );
  }

  for (const categoryId of removals) {
    updates.push(
      (async () => {
        const categoryRef = doc(db, CATEGORIES_COLLECTION, categoryId);
        const snapshot = await getDoc(categoryRef);
        if (!snapshot.exists()) return;
        const category = snapshot.data() as CategoryDocument;
        const current = normalizeIds(category.productIds).filter((id) => id !== productId);
        await replaceCategoryProducts(db, categoryId, current);
      })()
    );
  }

  await Promise.allSettled(updates);
};

export const syncCategoryProductLinks = async (
  db: Firestore,
  categoryId: string,
  nextProductIds: string[] | undefined,
  previousProductIds: string[] | undefined
) => {
  const next = normalizeIds(nextProductIds);
  const prev = normalizeIds(previousProductIds);

  await replaceCategoryProducts(db, categoryId, next);

  const removals = prev.filter((id) => !next.includes(id));
  const additions = next.filter((id) => !prev.includes(id));

  const updates: Promise<void>[] = [];

  for (const productId of additions) {
    updates.push(
      (async () => {
        const productRef = doc(db, PRODUCTS_COLLECTION, productId);
        const snapshot = await getDoc(productRef);
        if (!snapshot.exists()) return;
        const product = snapshot.data() as ProductDocument;
        const current = normalizeIds(product.categoryIds);
        if (!current.includes(categoryId)) {
          current.push(categoryId);
          await updateDoc(productRef, {
            categoryIds: current,
            updatedAt: timestamp(),
          });
        }
      })()
    );
  }

  for (const productId of removals) {
    updates.push(
      (async () => {
        const productRef = doc(db, PRODUCTS_COLLECTION, productId);
        const snapshot = await getDoc(productRef);
        if (!snapshot.exists()) return;
        const product = snapshot.data() as ProductDocument;
        const current = normalizeIds(product.categoryIds).filter((id) => id !== categoryId);
        await replaceProductCategories(db, productId, current);
      })()
    );
  }

  await Promise.allSettled(updates);
};

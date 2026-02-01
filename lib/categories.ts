export const CATEGORIES_COLLECTION = "categories";

export type CategoryDocument = {
  name: string;
  imageUrl: string;
  imagePublicId: string;
  productIds?: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type CategoryResponse = {
  id: string;
  name: string;
  imageUrl: string;
  productIds: string[];
  createdAt: string;
  updatedAt: string;
};

export const MIN_CATEGORY_NAME_LENGTH = 2;
export const MAX_CATEGORY_NAME_LENGTH = 40;

export const categoryNameLengthMessage = `Category name must be between ${MIN_CATEGORY_NAME_LENGTH} and ${MAX_CATEGORY_NAME_LENGTH} characters.`;

const toIsoString = (value: unknown, field: string): string => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? new Date().toISOString() : value.toISOString();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  if (typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  console.warn(`[serializeCategory] Invalid ${field} provided:`, value);
  return new Date().toISOString();
};

export const validateCategoryFormData = (formData: FormData) => {
  const name = formData.get("name");

  if (typeof name !== "string") {
    return { success: false, error: "Category name is required." } as const;
  }

  const trimmed = name.trim();

  if (
    trimmed.length < MIN_CATEGORY_NAME_LENGTH ||
    trimmed.length > MAX_CATEGORY_NAME_LENGTH
  ) {
    return { success: false, error: categoryNameLengthMessage } as const;
  }

  const rawProductIds = formData.getAll("productIds");
  const productIds = rawProductIds
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return {
    success: true,
    data: {
      name: trimmed,
      productIds,
    },
  } as const;
};

export const serializeCategory = (id: string, category: CategoryDocument): CategoryResponse => ({
  id,
  name: category.name,
  imageUrl: category.imageUrl,
  productIds: Array.isArray(category.productIds)
    ? category.productIds.filter((value) => typeof value === "string" && value.trim().length > 0)
    : [],
  createdAt: toIsoString(category.createdAt, "createdAt"),
  updatedAt: toIsoString(category.updatedAt, "updatedAt"),
});

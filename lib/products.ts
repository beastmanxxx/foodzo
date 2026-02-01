export const PRODUCTS_COLLECTION = "products";
export const DELIVERY_TIME_UNITS = ["minutes", "hours", "days"] as const;
export type DeliveryTimeUnit = (typeof DELIVERY_TIME_UNITS)[number];

export type ProductDocument = {
  name: string;
  description: string;
  price: number;
  salePrice: number | null;
  rating: number;
  deliveryTime: {
    value: number;
    unit: DeliveryTimeUnit;
  };
  imageUrl: string;
  imagePublicId: string;
  categoryIds?: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
};

const MIN_NAME_LENGTH = 3;
const MAX_NAME_LENGTH = 80;
export const MIN_DESCRIPTION_LENGTH = 10;
export const MAX_DESCRIPTION_LENGTH = 500;
const MIN_PRICE = 0;
const MAX_PRICE = 100000;
const MIN_RATING = 0;
const MAX_RATING = 5;
const MIN_DELIVERY_VALUE = 1;
const MAX_DELIVERY_VALUE = 1000;

export type ProductResponse = {
  id: string;
  name: string;
  description: string;
  price: number;
  salePrice: number | null;
  rating: number;
  deliveryTime: {
    value: number;
    unit: DeliveryTimeUnit;
  };
  imageUrl: string;
  categoryIds: string[];
  createdAt: string;
  updatedAt: string;
};

function ensureIsoString(value: unknown): string {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? new Date().toISOString() : value.toISOString();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
}

export function serializeProduct(id: string, doc: ProductDocument): ProductResponse {
  return {
    id,
    name: doc.name,
    description: doc.description,
    price: doc.price,
    salePrice: doc.salePrice,
    rating: doc.rating,
    deliveryTime: {
      value: doc.deliveryTime.value,
      unit: doc.deliveryTime.unit,
    },
    imageUrl: doc.imageUrl,
    categoryIds: Array.isArray(doc.categoryIds)
      ? doc.categoryIds.filter((value) => typeof value === "string" && value.trim().length > 0)
      : [],
    createdAt: ensureIsoString(doc.createdAt),
    updatedAt: ensureIsoString(doc.updatedAt),
  };
}

type ProductValidationFailure = {
  success: false;
  error: string;
};

type ProductValidationSuccess = {
  success: true;
  data: {
    name: string;
    description: string;
    price: number;
    salePrice: number | null;
    rating: number;
    deliveryTime: {
      value: number;
      unit: DeliveryTimeUnit;
    };
    categoryIds: string[];
  };
};

export type ProductValidationResult =
  | ProductValidationFailure
  | ProductValidationSuccess;

function parseNumber(value: string, field: string): number | null {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`${field} must be a valid number.`);
  }
  return parsed;
}

export function validateProductFormData(formData: FormData): ProductValidationResult {
  try {
    const rawName = formData.get("name");
    if (typeof rawName !== "string") {
      return { success: false, error: "Product name is required." };
    }
    const name = rawName.trim();
    if (name.length < MIN_NAME_LENGTH || name.length > MAX_NAME_LENGTH) {
      return {
        success: false,
        error: `Product name must be between ${MIN_NAME_LENGTH} and ${MAX_NAME_LENGTH} characters.`,
      };
    }

    const rawDescription = formData.get("description");
    if (typeof rawDescription !== "string") {
      return { success: false, error: "Description is required." };
    }
    const description = rawDescription.trim();
    if (
      description.length < MIN_DESCRIPTION_LENGTH ||
      description.length > MAX_DESCRIPTION_LENGTH
    ) {
      return {
        success: false,
        error: `Description must be between ${MIN_DESCRIPTION_LENGTH} and ${MAX_DESCRIPTION_LENGTH} characters.`,
      };
    }

    const rawPrice = formData.get("price");
    if (typeof rawPrice !== "string") {
      return { success: false, error: "Price is required." };
    }
    const price = Number(rawPrice);
    if (Number.isNaN(price) || price <= MIN_PRICE || price > MAX_PRICE) {
      return {
        success: false,
        error: `Price must be greater than ${MIN_PRICE} and below ${MAX_PRICE}.`,
      };
    }

    const rawSalePrice = formData.get("salePrice");
    let salePrice: number | null = null;
    if (typeof rawSalePrice === "string" && rawSalePrice.trim()) {
      const parsedSalePrice = parseNumber(rawSalePrice, "Sale price");
      salePrice = parsedSalePrice ?? null;
      if (salePrice !== null) {
        if (salePrice < 0 || salePrice > price) {
          return {
            success: false,
            error: "Sale price must be positive and cannot exceed the price.",
          };
        }
      }
    }

    const rawRating = formData.get("rating");
    if (typeof rawRating !== "string") {
      return { success: false, error: "Rating is required." };
    }
    const rating = Number(rawRating);
    if (Number.isNaN(rating) || rating < MIN_RATING || rating > MAX_RATING) {
      return {
        success: false,
        error: `Rating must be between ${MIN_RATING} and ${MAX_RATING}.`,
      };
    }

    const rawDeliveryValue = formData.get("deliveryValue");
    if (typeof rawDeliveryValue !== "string") {
      return { success: false, error: "Delivery time value is required." };
    }
    const deliveryValue = Number(rawDeliveryValue);
    if (
      Number.isNaN(deliveryValue) ||
      deliveryValue < MIN_DELIVERY_VALUE ||
      deliveryValue > MAX_DELIVERY_VALUE
    ) {
      return {
        success: false,
        error: `Delivery time must be between ${MIN_DELIVERY_VALUE} and ${MAX_DELIVERY_VALUE}.`,
      };
    }

    const rawDeliveryUnit = formData.get("deliveryUnit");
    if (typeof rawDeliveryUnit !== "string") {
      return { success: false, error: "Delivery time unit is required." };
    }
    const deliveryUnit = rawDeliveryUnit.trim().toLowerCase();
    if (!DELIVERY_TIME_UNITS.includes(deliveryUnit as DeliveryTimeUnit)) {
      return { success: false, error: "Invalid delivery time unit." };
    }

    const rawCategoryIds = formData.getAll("categoryIds");
    const categoryIds = rawCategoryIds
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    return {
      success: true,
      data: {
        name,
        description,
        price,
        salePrice,
        rating,
        deliveryTime: {
          value: deliveryValue,
          unit: deliveryUnit as DeliveryTimeUnit,
        },
        categoryIds,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Invalid product payload.",
    };
  }
}

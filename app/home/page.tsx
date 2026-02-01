"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import locationGif from "@/assets/images/location.gif";
import { FOODZO_USER_STORAGE_KEY, NORMALIZED_ADMIN_PHONE } from "@/lib/constants";
import { formatPrice } from "@/lib/currency";
import {
  DELIVERY_TIME_UNITS,
  type DeliveryTimeUnit,
  type ProductResponse,
  MIN_DESCRIPTION_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} from "@/lib/products";
import {
  MAX_CATEGORY_NAME_LENGTH,
  MIN_CATEGORY_NAME_LENGTH,
  type CategoryResponse,
} from "@/lib/categories";
import BottomNav from "@/components/BottomNav";

const featured = {
  title: "Ongoing Offers",
  subtitle: "Offers You Can't Miss!",
  cta: "Order Now",
};

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  salePrice: string;
  rating: string;
  deliveryValue: string;
  deliveryUnit: DeliveryTimeUnit;
};

const productFormInitialState: ProductFormState = {
  name: "",
  description: "",
  price: "",
  salePrice: "",
  rating: "",
  deliveryValue: "",
  deliveryUnit: DELIVERY_TIME_UNITS[0],
};

type FeaturedCard = {
  name: string;
  rating: number;
  reviews: number;
  eta: string;
  price: string;
  accent: string;
};

const popularItems: FeaturedCard[] = [
  {
    name: "Pepperoni pizza",
    rating: 4.7,
    reviews: 310,
    eta: "15 Mins",
    price: "$9.80",
    accent: "from-[#f7b42c] to-[#fc7b28]",
  },
  {
    name: "Mediterranean salad",
    rating: 4.5,
    reviews: 204,
    eta: "18 Mins",
    price: "$7.40",
    accent: "from-[#ffd36b] to-[#ff9d2b]",
  },
];

const trendingItems: FeaturedCard[] = [
  {
    name: "Phirni creme",
    rating: 4.6,
    reviews: 503,
    eta: "12 Mins",
    price: "$6.20",
    accent: "from-[#f9c56b] to-[#f7962c]",
  },
  {
    name: "Berry cheesecake",
    rating: 4.8,
    reviews: 412,
    eta: "20 Mins",
    price: "$8.90",
    accent: "from-[#ffb041] to-[#ff7b3d]",
  },
];

const formatDeliveryTimeLabel = (delivery: ProductResponse["deliveryTime"]) => {
  const baseUnit = delivery.unit.endsWith("s")
    ? delivery.unit.slice(0, -1)
    : delivery.unit;
  const unit = delivery.value === 1 ? baseUnit : delivery.unit;
  return `${delivery.value} ${unit}`;
};

type StoredUser = {
  username?: string;
  email?: string;
  phone?: string;
  address?: string;
  isAdmin?: boolean;
};

type AdminUser = {
  username: string;
  email: string;
  phone: string;
  isAdmin: boolean;
};

export default function AppHome() {
  const router = useRouter();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [promotingPhone, setPromotingPhone] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productForm, setProductForm] = useState<ProductFormState>(productFormInitialState);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productPreviewUrl, setProductPreviewUrl] = useState<string | null>(null);
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [productSubmitError, setProductSubmitError] = useState<string | null>(null);
  const [productSubmitSuccess, setProductSubmitSuccess] = useState<string | null>(null);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null);
  const [editForm, setEditForm] = useState<ProductFormState>(productFormInitialState);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
  const [editProductSubmitting, setEditProductSubmitting] = useState(false);
  const [editProductSubmitError, setEditProductSubmitError] = useState<string | null>(null);
  const [isDeleteProductOpen, setIsDeleteProductOpen] = useState(false);
  const [productPendingDeletion, setProductPendingDeletion] =
    useState<ProductResponse | null>(null);
  const [deleteProductSubmitting, setDeleteProductSubmitting] = useState(false);
  const [deleteProductError, setDeleteProductError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [selectedProductCategoryIds, setSelectedProductCategoryIds] = useState<string[]>([]);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [categorySubmitError, setCategorySubmitError] = useState<string | null>(null);
  const [categorySubmitSuccess, setCategorySubmitSuccess] = useState<string | null>(null);
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [categoryPreviewUrl, setCategoryPreviewUrl] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryImageFile, setEditCategoryImageFile] = useState<File | null>(null);
  const [editCategoryPreviewUrl, setEditCategoryPreviewUrl] = useState<string | null>(null);
  const [editCategorySubmitting, setEditCategorySubmitting] = useState(false);
  const [editCategorySubmitError, setEditCategorySubmitError] = useState<string | null>(null);
  const [selectedCategoryProductIds, setSelectedCategoryProductIds] = useState<string[]>([]);
  const [isDeleteCategoryOpen, setIsDeleteCategoryOpen] = useState(false);
  const [categoryPendingDeletion, setCategoryPendingDeletion] =
    useState<CategoryResponse | null>(null);
  const [deleteCategorySubmitting, setDeleteCategorySubmitting] = useState(false);
  const [deleteCategoryError, setDeleteCategoryError] = useState<string | null>(null);
  const [activeAdminSection, setActiveAdminSection] =
    useState<"users" | "products" | "categories">("products");

  const descriptionLength = productForm.description.trim().length;
  const isDescriptionLengthInvalid =
    descriptionLength < MIN_DESCRIPTION_LENGTH ||
    descriptionLength > MAX_DESCRIPTION_LENGTH;
  const editDescriptionLength = editForm.description.trim().length;
  const isEditDescriptionLengthInvalid =
    editDescriptionLength < MIN_DESCRIPTION_LENGTH ||
    editDescriptionLength > MAX_DESCRIPTION_LENGTH;
  const categoryNameLength = categoryName.trim().length;
  const isCategoryNameInvalid =
    categoryNameLength < MIN_CATEGORY_NAME_LENGTH ||
    categoryNameLength > MAX_CATEGORY_NAME_LENGTH;
  const editCategoryNameLength = editCategoryName.trim().length;
  const isEditCategoryNameInvalid =
    editCategoryNameLength < MIN_CATEGORY_NAME_LENGTH ||
    editCategoryNameLength > MAX_CATEGORY_NAME_LENGTH;

  const usernameTrimmed = currentUser?.username?.trim();
  const displayUsername = usernameTrimmed && usernameTrimmed.length > 0 ? usernameTrimmed : "Foodzo";
  const addressTrimmed = currentUser?.address?.trim();
  const displayAddress = addressTrimmed && addressTrimmed.length > 0 ? addressTrimmed : "Not provided";
  const shouldShowWelcomeEmoji = Boolean(usernameTrimmed);

  useEffect(() => {
    if (!productImageFile) {
      setProductPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(productImageFile);
    setProductPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [productImageFile]);

  useEffect(() => {
    if (editImageFile) {
      const objectUrl = URL.createObjectURL(editImageFile);
      setEditPreviewUrl(objectUrl);
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }

    if (isEditProductOpen && editingProduct) {
      setEditPreviewUrl(editingProduct.imageUrl);
    } else if (!editImageFile) {
      setEditPreviewUrl(null);
    }
  }, [editImageFile, editingProduct, isEditProductOpen]);

  useEffect(() => {
    if (!categoryImageFile) {
      setCategoryPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(categoryImageFile);
    setCategoryPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [categoryImageFile]);

  useEffect(() => {
    if (editCategoryImageFile) {
      const objectUrl = URL.createObjectURL(editCategoryImageFile);
      setEditCategoryPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }

    if (isEditCategoryOpen && editingCategory) {
      setEditCategoryPreviewUrl(editingCategory.imageUrl);
    } else if (!editCategoryImageFile) {
      setEditCategoryPreviewUrl(null);
    }
  }, [editCategoryImageFile, editingCategory, isEditCategoryOpen]);

  const resetProductForm = useCallback(() => {
    setProductForm(productFormInitialState);
    setProductImageFile(null);
    setProductPreviewUrl(null);
    setProductSubmitError(null);
    setSelectedProductCategoryIds([]);
  }, []);

  const resetEditForm = useCallback(() => {
    setEditForm(productFormInitialState);
    setEditImageFile(null);
    setEditPreviewUrl(null);
    setEditProductSubmitError(null);
    setEditProductSubmitting(false);
    setSelectedProductCategoryIds([]);
  }, []);

  const resetCategoryForm = useCallback(() => {
    setCategoryName("");
    setCategoryImageFile(null);
    setCategoryPreviewUrl(null);
    setCategorySubmitError(null);
    setSelectedCategoryProductIds([]);
  }, []);

  const resetEditCategoryForm = useCallback(() => {
    setEditCategoryName("");
    setEditCategoryImageFile(null);
    setEditCategoryPreviewUrl(null);
    setEditCategorySubmitError(null);
    setEditCategorySubmitting(false);
    setSelectedCategoryProductIds([]);
  }, []);

  const toggleProductCategorySelection = (categoryId: string) => {
    setSelectedProductCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleCategoryProductSelection = (productId: string) => {
    setSelectedCategoryProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const renderCategorySelector = (
    selectedIds: string[],
    onToggle: (id: string) => void
  ) => {
    if (categoriesLoading) {
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`category-skeleton-${index}`}
              className="flex items-center gap-3 rounded-[20px] bg-[#ffe6c9] p-4 shadow-[0_12px_24px_rgba(215,120,10,0.16)] animate-pulse"
            >
              <span className="h-12 w-12 rounded-full bg-white/70"></span>
              <div className="flex-1 space-y-2">
                <span className="block h-3 w-24 rounded-full bg-white/70"></span>
                <span className="block h-3 w-32 rounded-full bg-white/60"></span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (categories.length === 0) {
      return (
        <p className="text-xs font-semibold text-[#b37d32]">
          No categories available yet.
        </p>
      );
    }

    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((category) => {
          const isSelected = selectedIds.includes(category.id);

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onToggle(category.id)}
              className={`group relative flex items-center gap-4 rounded-[22px] border px-4 py-3 text-left transition hover:-translate-y-[2px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb43b] ${
                isSelected
                  ? "border-[#2c1603] bg-[#ffedd5] shadow-[0_16px_32px_rgba(44,22,3,0.22)]"
                  : "border-transparent bg-white shadow-[0_12px_24px_rgba(215,120,10,0.12)]"
              }`}
              aria-pressed={isSelected}
            >
              <span className="relative h-14 w-14 overflow-hidden rounded-[16px] bg-[#ffe5c2] shadow-[0_10px_18px_rgba(215,120,10,0.18)]">
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  fill
                  sizes="56px"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              </span>
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-sm font-semibold text-[#2c1603]">{category.name}</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a56718]">
                  Updated {new Date(category.updatedAt).toLocaleDateString()}
                </span>
              </div>
              {isSelected && (
                <span className="text-base" aria-hidden>
                  ✅
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const renderProductSelector = (
    selectedIds: string[],
    onToggle: (id: string) => void
  ) => {
    if (productsLoading) {
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`product-skeleton-${index}`}
              className="flex items-center gap-3 rounded-[20px] bg-[#ffe6c9] p-4 shadow-[0_12px_24px_rgba(215,120,10,0.16)] animate-pulse"
            >
              <span className="h-16 w-16 rounded-[18px] bg-white/70"></span>
              <div className="flex-1 space-y-2">
                <span className="block h-3 w-28 rounded-full bg-white/70"></span>
                <span className="block h-3 w-36 rounded-full bg-white/60"></span>
                <span className="block h-3 w-20 rounded-full bg-white/50"></span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <p className="text-xs font-semibold text-[#b37d32]">
          No products available yet.
        </p>
      );
    }

    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {products.map((product) => {
          const isSelected = selectedIds.includes(product.id);

          return (
            <button
              key={product.id}
              type="button"
              onClick={() => onToggle(product.id)}
              className={`group relative flex items-center gap-4 rounded-[22px] border px-4 py-3 text-left transition hover:-translate-y-[2px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb43b] ${
                isSelected
                  ? "border-[#2c1603] bg-[#ffedd5] shadow-[0_16px_32px_rgba(44,22,3,0.22)]"
                  : "border-transparent bg-white shadow-[0_12px_24px_rgba(215,120,10,0.12)]"
              }`}
              aria-pressed={isSelected}
            >
              <span className="relative h-16 w-16 overflow-hidden rounded-[18px] bg-[#ffe5c2] shadow-[0_10px_18px_rgba(215,120,10,0.18)]">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="64px"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              </span>
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-sm font-semibold text-[#2c1603]">{product.name}</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a56718]">
                  ⭐ {product.rating.toFixed(1)} · {product.deliveryTime.value} {product.deliveryTime.unit}
                </span>
                <span className="text-xs font-semibold text-[#b55a07]">
                  {formatPrice(product.price)}
                </span>
              </div>
              {isSelected && (
                <span className="text-base" aria-hidden>
                  ✅
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const response = await fetch("/api/products", { cache: "no-store" });
      const payload = (await response.json()) as {
        products?: ProductResponse[];
        error?: string;
      };

      if (!response.ok || !payload.products) {
        throw new Error(payload.error || "Failed to load products.");
      }

      setProducts(payload.products);
    } catch (error) {
      console.error("Failed to load products", error);
      setProductsError(
        error instanceof Error
          ? error.message
          : "Unable to load products right now."
      );
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (showAdminPanel) {
      fetchProducts();
    }
  }, [showAdminPanel, fetchProducts]);

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const response = await fetch("/api/categories", { cache: "no-store" });
      const payload = (await response.json()) as {
        categories?: CategoryResponse[];
        error?: string;
      };

      if (!response.ok || !payload.categories) {
        throw new Error(payload.error || "Failed to load categories.");
      }

      setCategories(payload.categories);
    } catch (error) {
      console.error("Failed to load categories", error);
      setCategoriesError(
        error instanceof Error ? error.message : "Unable to load categories right now."
      );
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (showAdminPanel && activeAdminSection === "categories") {
      fetchCategories();
    }
  }, [showAdminPanel, activeAdminSection, fetchCategories]);

  const openAddProductModal = () => {
    setIsAddProductOpen(true);
    setProductSubmitError(null);
    setProductSubmitSuccess(null);
    setSelectedProductCategoryIds([]);
  };

  const closeAddProductModal = () => {
    setIsAddProductOpen(false);
    resetProductForm();
    setProductSubmitError(null);
  };

  const openDeleteProductModal = (product: ProductResponse) => {
    setProductPendingDeletion(product);
    setDeleteProductError(null);
    setProductSubmitError(null);
    setProductSubmitSuccess(null);
    setIsDeleteProductOpen(true);
  };

  const closeDeleteProductModal = () => {
    setIsDeleteProductOpen(false);
    setProductPendingDeletion(null);
    setDeleteProductError(null);
    setDeleteProductSubmitting(false);
  };

  const openAddCategoryModal = () => {
    setIsAddCategoryOpen(true);
    resetCategoryForm();
    setCategorySubmitError(null);
    setCategorySubmitSuccess(null);
    setSelectedCategoryProductIds([]);
  };

  const closeAddCategoryModal = () => {
    setIsAddCategoryOpen(false);
    resetCategoryForm();
  };

  const openDeleteCategoryModal = (category: CategoryResponse) => {
    setCategoryPendingDeletion(category);
    setDeleteCategoryError(null);
    setCategorySubmitError(null);
    setCategorySubmitSuccess(null);
    setIsDeleteCategoryOpen(true);
  };

  const closeDeleteCategoryModal = () => {
    setIsDeleteCategoryOpen(false);
    setCategoryPendingDeletion(null);
    setDeleteCategoryError(null);
    setDeleteCategorySubmitting(false);
  };

  const openEditCategoryModal = (category: CategoryResponse) => {
    setEditingCategory(category);
    setEditCategoryName(category.name);
    setEditCategoryImageFile(null);
    setEditCategoryPreviewUrl(category.imageUrl);
    setEditCategorySubmitError(null);
    setEditCategorySubmitting(false);
    setSelectedCategoryProductIds(category.productIds ?? []);
    setIsEditCategoryOpen(true);
  };

  const closeEditCategoryModal = () => {
    setIsEditCategoryOpen(false);
    setEditingCategory(null);
    resetEditCategoryForm();
  };

  const openEditProductModal = (product: ProductResponse) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      salePrice: product.salePrice !== null ? product.salePrice.toString() : "",
      rating: product.rating.toString(),
      deliveryValue: product.deliveryTime.value.toString(),
      deliveryUnit: product.deliveryTime.unit,
    });
    setEditImageFile(null);
    setEditPreviewUrl(product.imageUrl);
    setEditProductSubmitError(null);
    setEditProductSubmitting(false);
    setSelectedProductCategoryIds(product.categoryIds ?? []);
    setIsEditProductOpen(true);
  };

  const closeEditProductModal = () => {
    setIsEditProductOpen(false);
    setEditingProduct(null);
    resetEditForm();
  };

  const handleProductInputChange = (
    field: keyof ProductFormState
  ) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setProductForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleProductSelectChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    setProductForm((prev) => ({
      ...prev,
      deliveryUnit: event.target.value as DeliveryTimeUnit,
    }));
  };

  const handleProductImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setProductImageFile(file);
  };

  const handleEditInputChange = (
    field: keyof ProductFormState
  ) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setEditForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleEditSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setEditForm((prev) => ({
      ...prev,
      deliveryUnit: event.target.value as DeliveryTimeUnit,
    }));
  };

  const handleEditImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setEditImageFile(file);
  };

  const handleProductFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser?.phone) {
      setProductSubmitError(
        "Admin session not found. Please sign in again to add products."
      );
      return;
    }

    if (!productImageFile) {
      setProductSubmitError("Please select a product image.");
      return;
    }

    setProductSubmitError(null);
    setProductSubmitSuccess(null);

    const trimmedDescription = productForm.description.trim();
    if (
      trimmedDescription.length < MIN_DESCRIPTION_LENGTH ||
      trimmedDescription.length > MAX_DESCRIPTION_LENGTH
    ) {
      setProductSubmitError(
        `Description must be between ${MIN_DESCRIPTION_LENGTH} and ${MAX_DESCRIPTION_LENGTH} characters.`
      );
      return;
    }

    setProductSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", productForm.name.trim());
      formData.append("description", trimmedDescription);
      formData.append("price", productForm.price.trim());
      if (productForm.salePrice.trim()) {
        formData.append("salePrice", productForm.salePrice.trim());
      }
      formData.append("rating", productForm.rating.trim());
      formData.append("deliveryValue", productForm.deliveryValue.trim());
      formData.append("deliveryUnit", productForm.deliveryUnit);
      formData.append("image", productImageFile);
      selectedProductCategoryIds.forEach((categoryId) => {
        formData.append("categoryIds", categoryId);
      });

      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "x-admin-phone": currentUser.phone,
        },
        body: formData,
      });

      const payload = (await response.json()) as {
        product?: ProductResponse;
        error?: string;
      };

      if (!response.ok || !payload.product) {
        throw new Error(payload.error || "Failed to add product.");
      }

      setProducts((prev) => [payload.product!, ...prev]);
      setProductSubmitSuccess("Product added successfully!");
      resetProductForm();
      setIsAddProductOpen(false);
    } catch (error) {
      console.error("Add product failed", error);
      setProductSubmitError(
        error instanceof Error ? error.message : "Failed to add product."
      );
    } finally {
      setProductSubmitting(false);
    }
  };

  const handleEditCategorySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentUser?.phone || !editingCategory) {
      setEditCategorySubmitError(
        "Admin session not found. Please sign in again to edit categories."
      );
      return;
    }

    const trimmedName = editCategoryName.trim();

    if (
      trimmedName.length < MIN_CATEGORY_NAME_LENGTH ||
      trimmedName.length > MAX_CATEGORY_NAME_LENGTH
    ) {
      setEditCategorySubmitError(
        `Category name must be between ${MIN_CATEGORY_NAME_LENGTH} and ${MAX_CATEGORY_NAME_LENGTH} characters.`
      );
      return;
    }

    setEditCategorySubmitting(true);
    setEditCategorySubmitError(null);

    try {
      const formData = new FormData();
      formData.append("name", trimmedName);
      if (editCategoryImageFile) {
        formData.append("image", editCategoryImageFile);
      }
      selectedCategoryProductIds.forEach((productId) => {
        formData.append("productIds", productId);
      });

      const response = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: "PATCH",
        headers: {
          "x-admin-phone": currentUser.phone,
        },
        body: formData,
      });

      const payload = (await response.json()) as {
        category?: CategoryResponse;
        error?: string;
      };

      if (!response.ok || !payload.category) {
        throw new Error(payload.error || "Failed to update category.");
      }

      setCategories((prev) =>
        prev.map((category) =>
          category.id === payload.category!.id ? payload.category! : category
        )
      );
      setCategorySubmitSuccess("Category updated successfully!");
      closeEditCategoryModal();
    } catch (error) {
      console.error("Edit category failed", error);
      setEditCategorySubmitError(
        error instanceof Error ? error.message : "Failed to update category."
      );
    } finally {
      setEditCategorySubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!currentUser?.phone) {
      setCategorySubmitError("Admin session not found. Please sign in again.");
      return;
    }

    if (!categoryPendingDeletion) {
      setCategorySubmitError("No category selected for deletion.");
      return;
    }

    setCategorySubmitError(null);
    setCategorySubmitSuccess(null);
    setDeleteCategoryError(null);
    setDeleteCategorySubmitting(true);

    try {
      const response = await fetch(`/api/admin/categories/${categoryPendingDeletion.id}`, {
        method: "DELETE",
        headers: {
          "x-admin-phone": currentUser.phone,
        },
      });

      let payload: { success?: boolean; error?: string } = {};
      const contentType = response.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) {
        try {
          payload = (await response.json()) as { success?: boolean; error?: string };
        } catch (error) {
          console.warn("Unable to parse delete category response", error);
        }
      }

      if (!response.ok || payload.success !== true) {
        throw new Error(payload.error || "Failed to delete category.");
      }

      setCategories((prev) =>
        prev.filter((category) => category.id !== categoryPendingDeletion.id)
      );
      setCategorySubmitSuccess("Category deleted successfully!");
      closeDeleteCategoryModal();
    } catch (error) {
      console.error("Delete category failed", error);
      const message =
        error instanceof Error ? error.message : "Failed to delete category.";
      setDeleteCategoryError(message);
      setCategorySubmitError(message);
    } finally {
      setDeleteCategorySubmitting(false);
    }
  };

  const handleCategoryImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setCategoryImageFile(file);
  };

  const handleCategoryNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCategoryName(event.target.value);
  };

  const handleEditCategoryImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setEditCategoryImageFile(file);
  };

  const handleEditCategoryNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEditCategoryName(event.target.value);
  };

  const handleAddCategorySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentUser?.phone) {
      setCategorySubmitError("Admin session not found. Please sign in again to add categories.");
      return;
    }

    if (!categoryImageFile) {
      setCategorySubmitError("Please select a category image.");
      return;
    }

    const trimmedName = categoryName.trim();

    if (trimmedName.length < MIN_CATEGORY_NAME_LENGTH || trimmedName.length > MAX_CATEGORY_NAME_LENGTH) {
      setCategorySubmitError(
        `Category name must be between ${MIN_CATEGORY_NAME_LENGTH} and ${MAX_CATEGORY_NAME_LENGTH} characters.`
      );
      return;
    }

    setCategorySubmitting(true);
    setCategorySubmitError(null);

    try {
      const formData = new FormData();
      formData.append("name", trimmedName);
      formData.append("image", categoryImageFile);
      selectedCategoryProductIds.forEach((productId) => {
        formData.append("productIds", productId);
      });

      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "x-admin-phone": currentUser.phone,
        },
        body: formData,
      });

      const payload = (await response.json()) as {
        category?: CategoryResponse;
        error?: string;
      };

      if (!response.ok || !payload.category) {
        throw new Error(payload.error || "Failed to add category.");
      }

      setCategories((prev) => [payload.category!, ...prev]);
      setCategorySubmitSuccess("Category added successfully!");
      setIsAddCategoryOpen(false);
      resetCategoryForm();
    } catch (error) {
      console.error("Add category failed", error);
      setCategorySubmitError(
        error instanceof Error ? error.message : "Failed to add category."
      );
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleEditProductFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentUser?.phone || !editingProduct) {
      setEditProductSubmitError(
        "Admin session not found. Please sign in again to edit products."
      );
      return;
    }

    setEditProductSubmitError(null);
    setProductSubmitSuccess(null);

    const trimmedDescription = editForm.description.trim();
    if (
      trimmedDescription.length < MIN_DESCRIPTION_LENGTH ||
      trimmedDescription.length > MAX_DESCRIPTION_LENGTH
    ) {
      setEditProductSubmitError(
        `Description must be between ${MIN_DESCRIPTION_LENGTH} and ${MAX_DESCRIPTION_LENGTH} characters.`
      );
      return;
    }

    setEditProductSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", editForm.name.trim());
      formData.append("description", trimmedDescription);
      formData.append("price", editForm.price.trim());
      if (editForm.salePrice.trim()) {
        formData.append("salePrice", editForm.salePrice.trim());
      }
      formData.append("rating", editForm.rating.trim());
      formData.append("deliveryValue", editForm.deliveryValue.trim());
      formData.append("deliveryUnit", editForm.deliveryUnit);
      if (editImageFile) {
        formData.append("image", editImageFile);
      }
      selectedProductCategoryIds.forEach((categoryId) => {
        formData.append("categoryIds", categoryId);
      });

      const response = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: "PATCH",
        headers: {
          "x-admin-phone": currentUser.phone,
        },
        body: formData,
      });

      const payload = (await response.json()) as {
        product?: ProductResponse;
        error?: string;
      };

      if (!response.ok || !payload.product) {
        throw new Error(payload.error || "Failed to update product.");
      }

      setProducts((prev) =>
        prev.map((product) =>
          product.id === payload.product!.id ? payload.product! : product
        )
      );

      setProductSubmitError(null);
      setProductSubmitSuccess("Product updated successfully!");
      closeEditProductModal();
    } catch (error) {
      console.error("Edit product failed", error);
      setEditProductSubmitError(
        error instanceof Error ? error.message : "Failed to update product."
      );
    } finally {
      setEditProductSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!currentUser?.phone) {
      setProductSubmitError(
        "Admin session not found. Please sign in again to manage products."
      );
      return;
    }

    if (!productPendingDeletion) {
      setProductSubmitError("No product selected for deletion.");
      return;
    }

    setProductSubmitError(null);
    setProductSubmitSuccess(null);
    setDeleteProductError(null);
    setDeleteProductSubmitting(true);

    try {
      const response = await fetch(`/api/admin/products/${productPendingDeletion.id}`, {
        method: "DELETE",
        headers: {
          "x-admin-phone": currentUser.phone,
        },
      });

      let payload: { success?: boolean; error?: string } = {};
      const contentType = response.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) {
        try {
          payload = (await response.json()) as { success?: boolean; error?: string };
        } catch (error) {
          console.warn("Unable to parse delete product response", error);
        }
      }

      if (!response.ok || payload.success !== true) {
        throw new Error(payload.error || "Failed to delete product.");
      }

      setProducts((prev) =>
        prev.filter((product) => product.id !== productPendingDeletion.id)
      );
      setProductSubmitSuccess("Product deleted successfully!");
      closeDeleteProductModal();
    } catch (error) {
      console.error("Delete product failed", error);
      const message =
        error instanceof Error ? error.message : "Failed to delete product.";
      setDeleteProductError(message);
      setProductSubmitError(message);
    } finally {
      setDeleteProductSubmitting(false);
    }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem(FOODZO_USER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredUser;
        setCurrentUser(parsed);
        const normalizedPhone = parsed.phone?.replace(/[^0-9+]/g, "") ?? "";
        if (parsed.isAdmin || normalizedPhone === NORMALIZED_ADMIN_PHONE) {
          setIsAdmin(true);
        }
      }
    } catch (error) {
      console.warn("Unable to read stored user", error);
    }
  }, []);

  useEffect(() => {
    const fetchAdminUsers = async () => {
      if (!currentUser?.phone) return;
      setAdminLoading(true);
      setAdminError(null);
      try {
        const response = await fetch("/api/admin/users", {
          headers: {
            "x-admin-phone": currentUser.phone,
          },
        });

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error || "Failed to load users");
        }

        const payload = (await response.json()) as {
          users: AdminUser[];
        };
        setAdminUsers(payload.users);
      } catch (error) {
        console.error("Failed to load admin users", error);
        setAdminError(
          error instanceof Error ? error.message : "Unable to load users right now."
        );
      } finally {
        setAdminLoading(false);
      }
    };

    if (showAdminPanel && isAdmin) {
      fetchAdminUsers();
    }
  }, [showAdminPanel, isAdmin, currentUser?.phone]);

  const promoteUser = async (phone: string) => {
    if (!currentUser?.phone) return;
    setPromotingPhone(phone);
    setAdminError(null);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-phone": currentUser.phone,
        },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Failed to promote user");
      }

      setAdminUsers((prev) =>
        prev.map((user) =>
          user.phone === phone
            ? {
                ...user,
                isAdmin: true,
              }
            : user
        )
      );
    } catch (error) {
      console.error("Failed to promote user", error);
      setAdminError(error instanceof Error ? error.message : "Failed to promote user");
    } finally {
      setPromotingPhone(null);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 180);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const enforceHome = () => {
      router.replace("/home");
      window.history.pushState(null, "", "/home");
    };

    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      enforceHome();
    };

    enforceHome();
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router]);

  const mainWrapperClasses =
  "relative z-40 -mt-[20px] flex-1 space-y-8 rounded-t-[25px] bg-[#fff5e4] px-5 pb-24 pt-[40px] shadow-[0_-18px_36px_rgba(215,120,10,0.12)]";

  if (isAdmin && showAdminPanel) {
    return (
      <div className="flex min-h-dvh flex-col bg-[#fff5e4] text-[#2c1603]">
        <header className="flex flex-wrap items-center justify-between gap-4 bg-white px-6 py-5 shadow-[0_18px_36px_rgba(222,137,14,0.18)]">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-[#2c1603]">Admin Panel</h1>
            <p className="text-sm text-[#7a4a1f]">Manage users and products</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 rounded-full bg-[#fff6e7] px-4 py-2 text-sm font-semibold text-[#7a4a1f]">
              <span>Section</span>
              <select
                value={activeAdminSection}
                onChange={(event) =>
                  setActiveAdminSection(
                    event.target.value as "users" | "products" | "categories"
                  )
                }
                className="rounded-full border-none bg-white px-3 py-1 text-sm font-semibold text-[#2c1603] focus:outline focus:outline-2 focus:outline-[#ffb43b]"
              >
                <option value="users">Users</option>
                <option value="products">Products</option>
                <option value="categories">Categories</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => setShowAdminPanel(false)}
              className="rounded-full bg-[#2c1603] px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em] text-[#ffcf4d] transition hover:scale-[1.02]"
            >
              Close
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
            {activeAdminSection === "users" && (
              <section className="rounded-[24px] bg-white px-6 py-5 shadow-[0_18px_36px_rgba(222,137,14,0.12)]">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                Users
              </h3>
              <div className="mt-4 space-y-3">
                {adminError && (
                  <p className="rounded-[18px] bg-[#fff0e5] px-4 py-2 text-sm font-semibold text-[#7a2b12]">
                    {adminError}
                  </p>
                )}
                {adminLoading ? (
                  <p className="text-sm text-[#7a4a1f]">Loading users…</p>
                ) : adminUsers.length === 0 ? (
                  <p className="text-sm text-[#7a4a1f]">No users found yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {adminUsers.map((user) => {
                      const normalizedPhone = user.phone.replace(/[^0-9+]/g, "");
                      const isPermanentAdmin =
                        normalizedPhone === NORMALIZED_ADMIN_PHONE;

                      return (
                        <li
                          key={`${user.email}-${user.phone}`}
                          className="flex flex-col gap-2 rounded-[20px] bg-[#fff6e7] px-4 py-3 text-sm"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-[#2c1603]">{user.username}</p>
                              <p className="text-xs text-[#7a4a1f]">{user.email}</p>
                              <p className="text-xs text-[#7a4a1f]">{user.phone}</p>
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                user.isAdmin
                                  ? "bg-[#e1f4d8] text-[#336b1f]"
                                  : "bg-[#ffe4cc] text-[#a65612]"
                              }`}
                            >
                              {user.isAdmin ? "Admin" : "User"}
                            </span>
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => promoteUser(user.phone)}
                              disabled={
                                user.isAdmin || isPermanentAdmin || promotingPhone === user.phone
                              }
                              className="rounded-full bg-[#2c1603] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#ffcf4d] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {user.isAdmin || isPermanentAdmin
                                ? "Already Admin"
                                : promotingPhone === user.phone
                                ? "Promoting..."
                                : "Make Admin"}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
            )}

            {activeAdminSection === "products" && (
              <section className="rounded-[24px] bg-white px-6 py-5 shadow-[0_18px_36px_rgba(222,137,14,0.12)]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                  Products
                </h3>
                <button
                  type="button"
                  onClick={openAddProductModal}
                  className="rounded-full bg-[#2c1603] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#ffcf4d] transition hover:scale-[1.02]"
                >
                  Add Product
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {productSubmitSuccess && (
                  <p className="rounded-[18px] bg-[#e7f7e1] px-4 py-2 text-sm font-semibold text-[#276424]">
                    {productSubmitSuccess}
                  </p>
                )}

                {productsError && (
                  <p className="rounded-[18px] bg-[#fff0e5] px-4 py-2 text-sm font-semibold text-[#7a2b12]">
                    {productsError}
                  </p>
                )}

                {productsLoading ? (
                  <p className="text-sm text-[#7a4a1f]">Loading products…</p>
                ) : products.length === 0 ? (
                  <p className="rounded-[18px] bg-[#fff6e7] px-4 py-3 text-sm font-semibold text-[#7a4a1f]">
                    No products added yet.
                  </p>
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {products.map((product) => (
                      <li
                        key={product.id}
                        className="flex gap-3 rounded-[20px] bg-[#fff6e7] p-3 text-sm shadow-[0_12px_28px_rgba(215,120,10,0.1)]"
                      >
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[16px] bg-[#ffe5c2]">
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-1 flex-col gap-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-semibold text-[#2c1603]">
                              {product.name}
                            </h4>
                            <span className="text-xs font-semibold text-[#b55a07]">
                              {formatPrice(product.salePrice ?? product.price)}
                            </span>
                          </div>
                          {product.salePrice !== null && (
                            <span className="text-xs text-[#a25611] line-through">
                              {formatPrice(product.price)}
                            </span>
                          )}
                          <p className="line-clamp-2 text-xs text-[#7a4a1f]">
                            {product.description}
                          </p>
                          <div className="mt-1 flex items-center gap-3 text-[11px] font-semibold text-[#8a4c05]">
                            <span>⭐ {product.rating.toFixed(1)}</span>
                            <span>⏱ {formatDeliveryTimeLabel(product.deliveryTime)}</span>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openEditProductModal(product);
                              }}
                              className="rounded-full bg-[#ffe4cc] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a25611] transition hover:scale-[1.02]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openDeleteProductModal(product);
                              }}
                              disabled={
                                deleteProductSubmitting &&
                                productPendingDeletion?.id === product.id
                              }
                              className="rounded-full bg-[#7a2b12] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ffcf4d] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deleteProductSubmitting &&
                              productPendingDeletion?.id === product.id
                                ? "Deleting…"
                                : "Delete"}
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
            )}

            {activeAdminSection === "categories" && (
              <section className="rounded-[24px] bg-white px-6 py-5 shadow-[0_18px_36px_rgba(222,137,14,0.12)]">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                    Categories
                  </h3>
                  <button
                    type="button"
                    onClick={openAddCategoryModal}
                    className="rounded-full bg-[#2c1603] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#ffcf4d] transition hover:scale-[1.02]"
                  >
                    Add Category
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {categorySubmitSuccess && (
                    <p className="rounded-[18px] bg-[#e7f7e1] px-4 py-2 text-sm font-semibold text-[#276424]">
                      {categorySubmitSuccess}
                    </p>
                  )}

                  {categoriesError && (
                    <p className="rounded-[18px] bg-[#fff0e5] px-4 py-2 text-sm font-semibold text-[#7a2b12]">
                      {categoriesError}
                    </p>
                  )}

                  {categoriesLoading ? (
                    <p className="text-sm text-[#7a4a1f]">Loading categories…</p>
                  ) : categories.length === 0 ? (
                    <p className="rounded-[18px] bg-[#fff6e7] px-4 py-3 text-sm font-semibold text-[#7a4a1f]">
                      No categories added yet.
                    </p>
                  ) : (
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {categories.map((category) => (
                        <li
                          key={category.id}
                          className="flex items-center gap-3 rounded-[20px] bg-[#fff6e7] p-3 text-sm shadow-[0_12px_28px_rgba(215,120,10,0.1)]"
                        >
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[16px] bg-[#ffe5c2]">
                            <Image
                              src={category.imageUrl}
                              alt={category.name}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex flex-1 flex-col gap-1">
                            <h4 className="text-sm font-semibold text-[#2c1603]">
                              {category.name}
                            </h4>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b37d32]">
                              Added {new Date(category.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditCategoryModal(category)}
                              className="rounded-full bg-[#ffe4cc] px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a25611] transition hover:scale-[1.02]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteCategoryModal(category)}
                              disabled={
                                deleteCategorySubmitting &&
                                categoryPendingDeletion?.id === category.id
                              }
                              className="rounded-full bg-[#7a2b12] px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ffcf4d] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deleteCategorySubmitting &&
                              categoryPendingDeletion?.id === category.id
                                ? "Deleting…"
                                : "Delete"}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            )}
          </div>
        </main>

        {isAddProductOpen && (
          <div className="fixed inset-0 z-50 flex min-h-dvh w-full bg-black/60">
            <div
              className="relative flex min-h-dvh w-full flex-col overflow-y-auto bg-white px-4 py-6 text-[#2c1603] shadow-none sm:px-8"
              role="dialog"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">Add New Product</h3>
                <button
                  type="button"
                  onClick={closeAddProductModal}
                  className="rounded-full bg-[#ffcf4d] px-3 py-1 text-sm font-semibold text-[#2c1603]"
                >
                  Cancel
                </button>
              </div>

              <form className="mt-4 flex flex-1 flex-col gap-4" onSubmit={handleProductFormSubmit}>
                <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                  <div className="grid gap-3">
                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                      Name
                      <input
                        type="text"
                        value={productForm.name}
                        onChange={handleProductInputChange("name")}
                        className="w-[95%] rounded-[16px] border-none bg-[#fff6e7] px-3 py-2 text-sm text-[#2c1603] placeholder:text-[#b37d32] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b] sm:w-full"
                        placeholder="Product name"
                        required
                      />
                    </label>

                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                      Description
                      <textarea
                        value={productForm.description}
                        onChange={handleProductInputChange("description")}
                        className="h-28 w-[95%] rounded-[16px] border-none bg-[#fff6e7] px-3 py-2 text-sm text-[#2c1603] placeholder:text-[#b37d32] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b] sm:w-full"
                        aria-invalid={isDescriptionLengthInvalid}
                        placeholder="Describe the product"
                        required
                      />
                      <span
                        className={`w-[95%] text-[11px] font-semibold sm:w-full ${
                          isDescriptionLengthInvalid
                            ? "text-[#b91c1c]"
                            : "text-[#b37d32]"
                        }`}
                      >
                        {descriptionLength} / {MAX_DESCRIPTION_LENGTH} characters (min {MIN_DESCRIPTION_LENGTH})
                      </span>
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                        Price (₹)
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={productForm.price}
                          onChange={handleProductInputChange("price")}
                          className="w-[95%] rounded-[16px] border-none bg-[#fff6e7] px-3 py-2 text-sm text-[#2c1603] placeholder:text-[#b37d32] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b] sm:w-full"
                          placeholder="e.g. 399"
                          required
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                        Sale Price (₹)
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={productForm.salePrice}
                          onChange={handleProductInputChange("salePrice")}
                          className="w-[95%] rounded-[16px] border-none bg-[#fff6e7] px-3 py-2 text-sm text-[#2c1603] placeholder:text-[#b37d32] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b] sm:w-full"
                          placeholder="Optional"
                        />
                      </label>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                        Rating
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={productForm.rating}
                          onChange={handleProductInputChange("rating")}
                          className="w-[95%] rounded-[16px] border-none bg-[#fff6e7] px-3 py-2 text-sm text-[#2c1603] placeholder:text-[#b37d32] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b] sm:w-full"
                          placeholder="e.g. 4.5"
                          required
                        />
                      </label>
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                          Delivery Time
                          <input
                            type="number"
                            min="1"
                            value={productForm.deliveryValue}
                            onChange={handleProductInputChange("deliveryValue")}
                            className="w-[95%] rounded-[16px] border-none bg-[#fff6e7] px-3 py-2 text-sm text-[#2c1603] placeholder:text-[#b37d32] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b] sm:w-full"
                            placeholder="e.g. 30"
                            required
                          />
                        </label>
                        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                          Unit
                          <select
                            value={productForm.deliveryUnit}
                            onChange={handleProductSelectChange}
                            className="w-[95%] rounded-[16px] border-none bg-[#fff6e7] px-3 py-2 text-sm text-[#2c1603] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b] sm:w-full"
                          >
                            {DELIVERY_TIME_UNITS.map((unit) => (
                              <option key={unit} value={unit}>
                                {unit.charAt(0).toUpperCase() + unit.slice(1)}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>

                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                      Product Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProductImageChange}
                        className="w-[95%] rounded-[16px] border-none bg-[#fff6e7] px-3 py-2 text-sm text-[#2c1603] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b] sm:w-full"
                        required
                      />
                    </label>

                    <fieldset className="flex flex-col gap-3 rounded-[18px] bg-[#fffaf1] p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                          Assign Categories
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a56718]">
                          Selected {selectedProductCategoryIds.length}
                        </span>
                      </div>
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => toggleProductCategorySelection(category.id)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] transition ${
                            selectedProductCategoryIds.includes(category.id)
                              ? "bg-[#2c1603] text-[#ffcf4d] shadow-[0_8px_18px_rgba(44,22,3,0.28)]"
                              : "bg-white text-[#b37428] shadow-[0_8px_18px_rgba(215,120,10,0.14)] hover:scale-[1.02]"
                          }`}
                          aria-pressed={selectedProductCategoryIds.includes(category.id)}
                        >
                          {category.name}
                        </button>
                      ))}
                    </fieldset>

                    {productPreviewUrl && (
                      <div className="relative h-32 w-full overflow-hidden rounded-[20px] bg-[#ffe5c2] sm:h-40">
                        <Image
                          src={productPreviewUrl}
                          alt="Selected preview"
                          fill
                          sizes="(max-width: 520px) 100vw, 520px"
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {productSubmitError && (
                  <p className="rounded-[18px] bg-[#fff0e5] px-4 py-2 text-sm font-semibold text-[#7a2b12]">
                    {productSubmitError}
                  </p>
                )}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={closeAddProductModal}
                    className="w-full rounded-full bg-[#fff6e7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#7a4a1f] sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={productSubmitting || isDescriptionLengthInvalid}
                    className="w-full rounded-full bg-[#2c1603] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#ffcf4d] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    {productSubmitting ? "Adding…" : "Add Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isAddCategoryOpen && (
          <div className="fixed inset-0 z-50 flex min-h-dvh w-full bg-black/60">
            <div
              className="relative flex min-h-dvh w-full flex-col overflow-y-auto bg-white px-4 py-6 text-[#2c1603] shadow-none sm:px-8"
              role="dialog"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">Add New Category</h3>
                <button
                  type="button"
                  onClick={closeAddCategoryModal}
                  className="rounded-full bg-[#ffcf4d] px-3 py-1 text-sm font-semibold text-[#2c1603]"
                >
                  Cancel
                </button>
              </div>

              <form className="mt-4 flex flex-1 flex-col gap-4" onSubmit={handleAddCategorySubmit}>
                <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                    Category Name
                    <input
                      type="text"
                      value={categoryName}
                      onChange={handleCategoryNameChange}
                      className="w-[95%] rounded-[16px] border-none bg-[#fff6e7] px-3 py-2 text-sm text-[#2c1603] placeholder:text-[#b37d32] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b] sm:w-full"
                      placeholder="e.g. Beverages"
                      required
                    />
                    <span
                      className={`w-[95%] text-[11px] font-semibold sm:w-full ${
                        isCategoryNameInvalid ? "text-[#b91c1c]" : "text-[#b37d32]"
                      }`}
                    >
                      {categoryNameLength} / {MAX_CATEGORY_NAME_LENGTH} characters (min {MIN_CATEGORY_NAME_LENGTH})
                    </span>
                  </label>

                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                    Category Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCategoryImageChange}
                      className="w-[95%] rounded-[16px] border-none bg-[#fff6e7] px-3 py-2 text-sm text-[#2c1603] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b] sm:w-full"
                      required
                    />
                  </label>

                  <fieldset className="flex flex-col gap-3 rounded-[18px] bg-[#fffaf1] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                        Assign Products
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a56718]">
                        Selected {selectedCategoryProductIds.length}
                      </span>
                    </div>
                    {renderProductSelector(selectedCategoryProductIds, toggleCategoryProductSelection)}
                  </fieldset>

                  {categoryPreviewUrl && (
                    <div className="relative h-32 w-full overflow-hidden rounded-[20px] bg-[#ffe5c2]">
                      <Image
                        src={categoryPreviewUrl}
                        alt="Category preview"
                        fill
                        sizes="(max-width: 420px) 100vw, 420px"
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>

                {categorySubmitError && (
                  <p className="rounded-[18px] bg-[#fff0e5] px-4 py-2 text-sm font-semibold text-[#7a2b12]">
                    {categorySubmitError}
                  </p>
                )}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={closeAddCategoryModal}
                    className="w-full rounded-full bg-[#fff6e7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#7a4a1f] sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={categorySubmitting || isCategoryNameInvalid}
                    className="w-full rounded-full bg-[#2c1603] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#ffcf4d] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    {categorySubmitting ? "Adding…" : "Add Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isDeleteCategoryOpen && categoryPendingDeletion && (
          <div className="fixed inset-0 z-50 flex min-h-dvh w-full items-start justify-center overflow-y-auto bg-black/60 px-3 py-6 sm:items-center sm:px-4">
            <div
              className="flex w-full max-w-[380px] flex-col rounded-[26px] bg-white px-4 py-5 text-[#2c1603] shadow-[0_24px_60px_rgba(0,0,0,0.32)] sm:max-h-[calc(100vh-4rem)] sm:px-6 sm:py-6"
              role="dialog"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">Delete Category</h3>
                <button
                  type="button"
                  onClick={closeDeleteCategoryModal}
                  className="rounded-full bg-[#ffcf4d] px-3 py-1 text-sm font-semibold text-[#2c1603]"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3 rounded-[20px] bg-[#fff6e7] p-3 shadow-[0_12px_28px_rgba(215,120,10,0.12)]">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[16px] bg-[#ffe5c2]">
                    <Image
                      src={categoryPendingDeletion.imageUrl}
                      alt={categoryPendingDeletion.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <h4 className="text-sm font-semibold text-[#2c1603]">
                      {categoryPendingDeletion.name}
                    </h4>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b37d32]">
                      Added {new Date(categoryPendingDeletion.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-[#7a4a1f]">
                  Are you sure you want to delete this category? This action cannot be undone and dishes will no longer appear under this filter.
                </p>

                {deleteCategoryError && (
                  <p className="rounded-[18px] bg-[#fff0e5] px-4 py-2 text-sm font-semibold text-[#7a2b12]">
                    {deleteCategoryError}
                  </p>
                )}
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={closeDeleteCategoryModal}
                  className="w-full rounded-full bg-[#fff6e7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#7a4a1f] sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCategory}
                  disabled={deleteCategorySubmitting}
                  className="w-full rounded-full bg-[#7a2b12] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#ffcf4d] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                >
                  {deleteCategorySubmitting ? "Deleting…" : "Delete Category"}
                </button>
              </div>
            </div>
          </div>
        )}

        {isDeleteProductOpen && productPendingDeletion && (
          <div className="fixed inset-0 z-50 flex min-h-dvh w-full items-start justify-center overflow-y-auto bg-black/60 px-3 py-6 sm:items-center sm:px-4">
            <div
              className="flex w-full max-w-[420px] flex-col rounded-[26px] bg-white px-4 py-5 text-[#2c1603] shadow-[0_24px_60px_rgba(0,0,0,0.32)] sm:max-h-[calc(100vh-4rem)] sm:px-6 sm:py-6"
              role="dialog"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">Delete Product</h3>
                <button
                  type="button"
                  onClick={closeDeleteProductModal}
                  className="rounded-full bg-[#ffcf4d] px-3 py-1 text-sm font-semibold text-[#2c1603]"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3 rounded-[20px] bg-[#fff6e7] p-3 shadow-[0_12px_28px_rgba(215,120,10,0.12)]">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[16px] bg-[#ffe5c2]">
                    <Image
                      src={productPendingDeletion.imageUrl}
                      alt={productPendingDeletion.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <h4 className="text-sm font-semibold text-[#2c1603]">
                      {productPendingDeletion.name}
                    </h4>
                    <span className="text-xs font-semibold text-[#7a4a1f]">
                      {formatPrice(productPendingDeletion.price)}
                    </span>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-[#7a4a1f]">
                  Are you sure you want to delete this product? This action cannot be undone and the product will be removed from the menu for all users.
                </p>

                {deleteProductError && (
                  <p className="rounded-[18px] bg-[#fff0e5] px-4 py-2 text-sm font-semibold text-[#7a2b12]">
                    {deleteProductError}
                  </p>
                )}
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={closeDeleteProductModal}
                  className="w-full rounded-full bg-[#fff6e7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#7a4a1f] sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteProduct}
                  disabled={deleteProductSubmitting}
                  className="w-full rounded-full bg-[#7a2b12] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#ffcf4d] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                >
                  {deleteProductSubmitting ? "Deleting…" : "Delete Product"}
                </button>
              </div>
            </div>
          </div>
        )}

        {isEditCategoryOpen && editingCategory && (
          <div className="fixed inset-0 z-50 flex min-h-dvh w-full bg-black/60">
            <div
              className="relative flex min-h-dvh w-full flex-col overflow-y-auto bg-white px-4 py-6 text-[#2c1603] shadow-none sm:px-8"
              role="dialog"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">Edit Category</h3>
                <button
                  type="button"
                  onClick={closeEditCategoryModal}
                  className="rounded-full bg-[#ffcf4d] px-3 py-1 text-sm font-semibold text-[#2c1603]"
                >
                  Cancel
                </button>
              </div>

              <form className="mt-4 flex flex-1 flex-col gap-4" onSubmit={handleEditCategorySubmit}>
                <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                    Category Name
                    <input
                      type="text"
                      value={editCategoryName}
                      onChange={handleEditCategoryNameChange}
                      className="w-[95%] rounded-[16px] border-none bg-[#fff6e7] px-3 py-2 text-sm text-[#2c1603] placeholder:text-[#b37d32] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b] sm:w-full"
                      placeholder="Category name"
                      required
                    />
                    <span
                      className={`w-[95%] text-[11px] font-semibold sm:w-full ${
                        isEditCategoryNameInvalid ? "text-[#b91c1c]" : "text-[#b37d32]"
                      }`}
                    >
                      {editCategoryNameLength} / {MAX_CATEGORY_NAME_LENGTH} characters (min {MIN_CATEGORY_NAME_LENGTH})
                    </span>
                  </label>

                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                    Category Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditCategoryImageChange}
                      className="w-[95%] rounded-[16px] border-none bg-[#fff6e7] px-3 py-2 text-sm text-[#2c1603] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b] sm:w-full"
                    />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b37d32]">
                      Leave empty to keep current image
                    </span>
                  </label>

                  <fieldset className="flex flex-col gap-3 rounded-[18px] bg-[#fffaf1] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                        Assign Products
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a56718]">
                        Selected {selectedCategoryProductIds.length}
                      </span>
                    </div>
                    {renderProductSelector(selectedCategoryProductIds, toggleCategoryProductSelection)}
                  </fieldset>

                  {editCategoryPreviewUrl && (
                    <div className="relative h-32 w-full overflow-hidden rounded-[20px] bg-[#ffe5c2]">
                      <Image
                        src={editCategoryPreviewUrl}
                        alt="Category preview"
                        fill
                        sizes="(max-width: 420px) 100vw, 420px"
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>

                {editCategorySubmitError && (
                  <p className="rounded-[18px] bg-[#fff0e5] px-4 py-2 text-sm font-semibold text-[#7a2b12]">
                    {editCategorySubmitError}
                  </p>
                )}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={closeEditCategoryModal}
                    className="w-full rounded-full bg-[#fff6e7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#7a4a1f] sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editCategorySubmitting || isEditCategoryNameInvalid}
                    className="w-full rounded-full bg-[#2c1603] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#ffcf4d] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    {editCategorySubmitting ? "Updating…" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isEditProductOpen && editingProduct && (
          <div className="fixed inset-0 z-50 flex min-h-dvh w-full bg-black/60">
            <div
              className="relative flex min-h-dvh w-full flex-col overflow-y-auto bg-white px-4 py-6 text-[#2c1603] shadow-none sm:px-8"
              role="dialog"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">Edit Product</h3>
                <button
                  type="button"
                  onClick={closeEditProductModal}
                  className="rounded-full bg-[#ffcf4d] px-3 py-1 text-sm font-semibold text-[#2c1603]"
                >
                  Cancel
                </button>
              </div>

              <form className="mt-4 flex flex-1 flex-col gap-4" onSubmit={handleEditProductFormSubmit}>
                <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                  <div className="grid gap-3">
                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                      Name
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={handleEditInputChange("name")}
                        className="w-[95%] rounded-[16px] border-none bg-[#fff6e7] px-3 py-2 text-sm text-[#2c1603] placeholder:text-[#b37d32] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b] sm:w-full"
                        placeholder="Product name"
                        required
                      />
                    </label>

                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                      Description
                      <textarea
                        value={editForm.description}
                        onChange={handleEditInputChange("description")}
                        className="h-28 w-[95%] rounded-[16px] border-none bg-[#fff6e7] px-3 py-2 text-sm text-[#2c1603] placeholder:text-[#b37d32] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b] sm:w-full"
                        aria-invalid={isEditDescriptionLengthInvalid}
                        placeholder="Describe the product"
                        required
                      />
                      <span
                        className={`w-[95%] text-[11px] font-semibold sm:w-full ${
                          isEditDescriptionLengthInvalid
                            ? "text-[#b91c1c]"
                            : "text-[#b37d32]"
                        }`}
                      >
                        {editDescriptionLength} / {MAX_DESCRIPTION_LENGTH} characters (min {MIN_DESCRIPTION_LENGTH})
                      </span>
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                        Price (₹)
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editForm.price}
                          onChange={handleEditInputChange("price")}
                          className="w-[95%] rounded-[16px] border-none bg-[#fff6e7] px-3 py-2 text-sm text-[#2c1603] placeholder:text-[#b37d32] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b] sm:w-full"
                          placeholder="e.g. 399"
                          required
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                        Sale Price (₹)
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editForm.salePrice}
                          onChange={handleEditInputChange("salePrice")}
                          className="w-[95%] rounded-[16px] border-none bg-[#fff6e7] px-3 py-2 text-sm text-[#2c1603] placeholder:text-[#b37d32] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b] sm:w-full"
                          placeholder="Optional"
                        />
                      </label>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                        Rating
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={editForm.rating}
                          onChange={handleEditInputChange("rating")}
                          className="w-[95%] rounded-[16px] border-none bg-[#fff6e7] px-3 py-2 text-sm text-[#2c1603] placeholder:text-[#b37d32] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b] sm:w-full"
                          placeholder="e.g. 4.5"
                          required
                        />
                      </label>
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                          Delivery Time
                          <input
                            type="number"
                            min="1"
                            value={editForm.deliveryValue}
                            onChange={handleEditInputChange("deliveryValue")}
                            className="w-[95%] rounded-[16px] border-none bg-[#fff6e7] px-3 py-2 text-sm text-[#2c1603] placeholder:text-[#b37d32] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b] sm:w-full"
                            placeholder="e.g. 30"
                            required
                          />
                        </label>
                        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                          Unit
                          <select
                            value={editForm.deliveryUnit}
                            onChange={handleEditSelectChange}
                            className="w-[95%] rounded-[16px] border-none bg-[#fff6e7] px-3 py-2 text-sm text-[#2c1603] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b] sm:w-full"
                          >
                            {DELIVERY_TIME_UNITS.map((unit) => (
                              <option key={unit} value={unit}>
                                {unit.charAt(0).toUpperCase() + unit.slice(1)}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>

                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                      Product Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditImageChange}
                        className="w-[95%] rounded-[16px] border-none bg-[#fff6e7] px-3 py-2 text-sm text-[#2c1603] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b] sm:w-full"
                      />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b37d32]">
                        Leave empty to keep current image
                      </span>
                    </label>

                    <fieldset className="flex flex-col gap-3 rounded-[18px] bg-[#fffaf1] p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                          Assign Categories
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a56718]">
                          Selected {selectedProductCategoryIds.length}
                        </span>
                      </div>
                      {renderCategorySelector(selectedProductCategoryIds, toggleProductCategorySelection)}
                    </fieldset>

                    {editPreviewUrl && (
                      <div className="relative h-32 w-full overflow-hidden rounded-[20px] bg-[#ffe5c2] sm:h-40">
                        <Image
                          src={editPreviewUrl}
                          alt="Selected preview"
                          fill
                          sizes="(max-width: 520px) 100vw, 520px"
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {editProductSubmitError && (
                  <p className="rounded-[18px] bg-[#fff0e5] px-4 py-2 text-sm font-semibold text-[#7a2b12]">
                    {editProductSubmitError}
                  </p>
                )}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={closeEditProductModal}
                    className="w-full rounded-full bg-[#fff6e7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#7a4a1f] sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editProductSubmitting || isEditDescriptionLengthInvalid}
                    className="w-full rounded-full bg-[#2c1603] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#ffcf4d] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    {editProductSubmitting ? "Updating…" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#fff5e4] text-[#301f0c]">
      <header className="sticky top-0 z-20 overflow-hidden pb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ffcf4d] via-[#ffac1f] to-[#ff7a00]"></div>
        <div
          className="absolute inset-0 opacity-40 mix-blend-screen"
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 12%, rgba(255,255,255,0.55), transparent 58%), radial-gradient(circle at 82% -8%, rgba(255,245,211,0.55), transparent 62%)",
          }}
        ></div>

        <div className="relative z-10 flex flex-col gap-4 px-5 pt-[clamp(1.6rem,9vw,2.6rem)] text-[#2c1603]">
          <div className="flex items-center justify-between rounded-[28px] bg-white px-4 py-3 text-[#2b1d0c] shadow-[0_18px_36px_rgba(222,137,14,0.25)]">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_14px_26px_rgba(233,153,23,0.27)]">
                <Image
                  src={locationGif}
                  alt="Location pin"
                  className="h-8 w-8 object-contain"
                />
              </span>
              <div className="leading-tight">
                <p className="text-[13px] font-semibold text-[#b55a07]">
                  <span className="text-[#7a4a1f]">{displayUsername}</span>
                  {shouldShowWelcomeEmoji ? " 😊" : ""}
                </p>
                <span className="text-xs font-semibold uppercase tracking-[0.26em] text-[#ac6510]">
                  Delivery To
                </span>
                <p className="text-[13px] font-semibold text-[#2c1603]">{displayAddress}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white text-[21px] text-[#2c1603] shadow-[0_12px_28px_rgba(233,153,23,0.25)]"
              >
                🛒
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#ffb733] to-[#ff7c00] text-[11px] font-semibold text-white">
                  3
                </span>
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAdminPanel(true)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2c1603] text-xl text-[#ffcf4d] shadow-[0_12px_24px_rgba(44,22,3,0.3)] transition hover:scale-[1.03]"
                  aria-label="Open admin panel"
                >
                  ⚙️
                </button>
              )}
            </div>
          </div>

          <label className="relative flex items-center">
            <span className="absolute left-4 text-xl text-[#c87b00]">🔍</span>
            <input
              type="search"
              placeholder="Search dishes, cuisines or restaurants"
              className="w-full rounded-[26px] border-none bg-white px-12 py-3 text-[14px] font-medium text-[#3a250f] placeholder:text-[#b37d32] shadow-[0_18px_32px_rgba(221,132,4,0.22)] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b]"
              onFocus={() => router.push("/search")}
              onClick={() => router.push("/search")}
            />
          </label>

          <div className="flex items-center justify-between text-[#2b1606]">
            {categoriesLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <span
                  key={`category-loading-${index}`}
                  className="h-12 w-12 rounded-full bg-white/70 shadow-[0_12px_24px_rgba(255,134,0,0.12)] animate-pulse"
                ></span>
              ))
            ) : categories.length === 0 ? (
              <p className="text-xs font-semibold text-[#7a4a1f]">
                No categories added yet.
              </p>
            ) : (
              categories.slice(0, 5).map((category: CategoryResponse) => (
                <button
                  key={category.id}
                  type="button"
                  className="flex flex-col items-center gap-2"
                  onClick={() => router.push(`/categories/${category.id}`)}
                >
                  <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_12px_24px_rgba(255,134,0,0.22)]">
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </span>
                  <span className="text-[13px] font-medium text-[#2c1603]">
                    {category.name}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </header>

      <main className={mainWrapperClasses}>
        <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#ffb733] via-[#ff9b17] to-[#ff7c00] text-white shadow-[0_26px_60px_rgba(215,120,10,0.28)]">
          <div className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.32em] text-white/80">
                {featured.title}
              </span>
              <h2 className="text-2xl font-semibold leading-tight">
                {featured.subtitle}
              </h2>
              <p className="text-sm text-white/85">
                Fresh deals on your favourite meals, refreshed daily. Grab them before they are gone!
              </p>
              <button className="mt-2 w-max rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#b55a07] shadow-[0_16px_28px_rgba(191,101,8,0.22)] transition hover:scale-[1.03]">
                {featured.cta}
              </button>
            </div>
            <div className="relative h-28 w-28 self-center sm:self-auto">
              <div className="absolute inset-0 rounded-full bg-white/30 blur-lg"></div>
              <div className="absolute inset-[10%] rounded-full bg-white/95"></div>
              <Image
                src="https://images.unsplash.com/photo-1604908177010-0f4f66f76f6e?auto=format&fit=crop&w=320&q=80"
                alt="Fresh pizza"
                fill
                className="rounded-full object-cover"
                priority
              />
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#2d1c07]">Popular Items</h3>
            <Link href="#" className="text-sm font-semibold text-[#b55a07]">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {popularItems.map((item) => (
              <article
                key={item.name}
                className="rounded-[26px] bg-white p-4 shadow-[0_20px_40px_rgba(196,126,28,0.12)]"
              >
                <div className={`relative mb-4 h-36 w-full overflow-hidden rounded-[22px] bg-gradient-to-br ${item.accent}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.55),transparent_65%)]"></div>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#8a4c05]/80">
                  <span className="flex items-center gap-1 rounded-full bg-[#fff2d2] px-2 py-1 text-[#8a4c05]">
                    ⏱ {item.eta}
                  </span>
                  <span className="flex items-center gap-1">
                    ⭐ {item.rating}
                  </span>
                  <span className="text-[#b68447]">({item.reviews} reviews)</span>
                </div>
                <h4 className="mt-3 text-lg font-semibold text-[#2d1c07]">{item.name}</h4>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-[#b55a07]">{item.price}</span>
                  <button className="rounded-full bg-[#b55a07] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white">
                    Add
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#2d1c07]">Trending Items</h3>
            <Link href="#" className="text-sm font-semibold text-[#b55a07]">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {trendingItems.map((item) => (
              <article
                key={item.name}
                className="rounded-[26px] bg-white p-4 shadow-[0_20px_40px_rgba(196,126,28,0.12)]"
              >
                <div className={`relative mb-4 h-36 w-full overflow-hidden rounded-[22px] bg-gradient-to-br ${item.accent}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.5),transparent_65%)]"></div>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#7b3f0d]/80">
                  <span className="flex items-center gap-1 rounded-full bg-[#fff1d6] px-2 py-1 text-[#7b3f0d]">
                    ⏱ {item.eta}
                  </span>
                  <span className="flex items-center gap-1">
                    ⭐ {item.rating}
                  </span>
                  <span className="text-[#b68447]">({item.reviews} reviews)</span>
                </div>
                <h4 className="mt-3 text-lg font-semibold text-[#2d1c07]">{item.name}</h4>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-[#b55a07]">{item.price}</span>
                  <button className="rounded-full bg-[#b55a07] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white">
                    Add
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed left-1/2 top-0 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-gradient-to-r from-[#ffcf4d] via-[#ffac1f] to-[#ff7a00] px-5 py-3 text-sm font-semibold text-[#2c1603] shadow-[0_20px_44px_rgba(255,162,17,0.32)] transition-all duration-300 ${
          showScrollTop ? "translate-y-3 opacity-100" : "pointer-events-none -translate-y-8 opacity-0"
        }`}
        aria-label="Scroll to top"
      >
        <span className="text-lg">↑</span>
        Back to top
      </button>

      {isAdmin && showAdminPanel && (
        <div className="fixed inset-0 z-50 flex min-h-dvh w-full items-center justify-center overflow-y-auto bg-black/40 px-6 py-8" role="dialog">
          <div className="relative w-full max-w-[560px] rounded-[26px] bg-white px-6 py-6 text-[#2c1603] shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Admin Panel</h2>
              <button
                type="button"
                onClick={() => setShowAdminPanel(false)}
                className="rounded-full bg-[#ffcf4d] px-3 py-1 text-sm font-semibold text-[#2c1603]"
              >
                Close
              </button>
            </div>

            <section className="mt-4 space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                Users
              </h3>
              {adminError && (
                <p className="rounded-[18px] bg-[#fff0e5] px-4 py-2 text-sm font-semibold text-[#7a2b12]">
                  {adminError}
                </p>
              )}
              {adminLoading ? (
                <p className="text-sm text-[#7a4a1f]">Loading users…</p>
              ) : adminUsers.length === 0 ? (
                <p className="text-sm text-[#7a4a1f]">No users found yet.</p>
              ) : (
                <ul className="space-y-3">
                  {adminUsers.map((user) => {
                    const normalizedPhone = user.phone.replace(/[^0-9+]/g, "");
                    const isPermanentAdmin =
                      normalizedPhone === NORMALIZED_ADMIN_PHONE;

                    return (
                      <li
                        key={`${user.email}-${user.phone}`}
                        className="flex flex-col gap-2 rounded-[20px] bg-[#fff6e7] px-4 py-3 text-sm"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-[#2c1603]">{user.username}</p>
                            <p className="text-xs text-[#7a4a1f]">{user.email}</p>
                            <p className="text-xs text-[#7a4a1f]">{user.phone}</p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              user.isAdmin
                                ? "bg-[#e1f4d8] text-[#336b1f]"
                                : "bg-[#ffe4cc] text-[#a65612]"
                            }`}
                          >
                            {user.isAdmin ? "Admin" : "User"}
                          </span>
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => promoteUser(user.phone)}
                            disabled={user.isAdmin || isPermanentAdmin || promotingPhone === user.phone}
                            className="rounded-full bg-[#2c1603] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#ffcf4d] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {user.isAdmin || isPermanentAdmin
                              ? "Already Admin"
                              : promotingPhone === user.phone
                              ? "Promoting..."
                              : "Make Admin"}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                  Products
                </h3>
                <button
                  type="button"
                  onClick={openAddProductModal}
                  className="rounded-full bg-[#2c1603] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#ffcf4d] transition hover:scale-[1.02]"
                >
                  Add Product
                </button>
              </div>

              {productSubmitSuccess && (
                <p className="rounded-[18px] bg-[#e7f7e1] px-4 py-2 text-sm font-semibold text-[#276424]">
                  {productSubmitSuccess}
                </p>
              )}

              {productsError && (
                <p className="rounded-[18px] bg-[#fff0e5] px-4 py-2 text-sm font-semibold text-[#7a2b12]">
                  {productsError}
                </p>
              )}

              {productsLoading ? (
                <p className="text-sm text-[#7a4a1f]">Loading products…</p>
              ) : products.length === 0 ? (
                <p className="rounded-[18px] bg-[#fff6e7] px-4 py-3 text-sm font-semibold text-[#7a4a1f]">
                  No products added yet.
                </p>
              ) : (
                <ul className="grid max-h-[260px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                  {products.map((product) => (
                    <li
                      key={product.id}
                      className="flex gap-3 rounded-[20px] bg-[#fff6e7] p-3 text-sm shadow-[0_12px_28px_rgba(215,120,10,0.1)]"
                    >
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[16px] bg-[#ffe5c2]">
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-[#2c1603]">
                            {product.name}
                          </h4>
                          <span className="text-xs font-semibold text-[#b55a07]">
                            {formatPrice(product.salePrice ?? product.price)}
                          </span>
                        </div>
                        {product.salePrice !== null && (
                          <span className="text-xs text-[#a25611] line-through">
                            {formatPrice(product.price)}
                          </span>
                        )}
                        <p className="line-clamp-2 text-xs text-[#7a4a1f]">
                          {product.description}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-[11px] font-semibold text-[#8a4c05]">
                          <span>⭐ {product.rating.toFixed(1)}</span>
                          <span>⏱ {formatDeliveryTimeLabel(product.deliveryTime)}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditProductModal(product);
                            }}
                            className="rounded-full bg-[#ffe4cc] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a25611] transition hover:scale-[1.02]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openDeleteProductModal(product);
                            }}
                            disabled={
                              deleteProductSubmitting &&
                              productPendingDeletion?.id === product.id
                            }
                            className="rounded-full bg-[#7a2b12] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ffcf4d] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deleteProductSubmitting &&
                            productPendingDeletion?.id === product.id
                              ? "Deleting…"
                              : "Delete"}
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {isAddProductOpen && (
              <div className="fixed inset-0 z-50 flex min-h-dvh w-full bg-black/60">
                <div
                  className="relative flex min-h-dvh w-full flex-col overflow-y-auto bg-white px-4 py-6 text-[#2c1603] shadow-none sm:px-8"
                  role="dialog"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold">Add New Product</h3>
                    <button
                      type="button"
                      onClick={closeAddProductModal}
                      className="rounded-full bg-[#ffcf4d] px-3 py-1 text-sm font-semibold text-[#2c1603]"
                    >
                      Cancel
                    </button>
                  </div>

                  <form className="mt-4 flex flex-1 flex-col gap-4" onSubmit={handleProductFormSubmit}>
                    <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                      <div className="grid gap-3">
                        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                          Name
                          <input
                            type="text"
                            value={productForm.name}
                            onChange={handleProductInputChange("name")}
                            className="w-[95%] rounded-[16px] border-none bg-[#fff6e7] px-3 py-2 text-sm text-[#2c1603] placeholder:text-[#b37d32] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b] sm:w-full"
                            placeholder="Product name"
                            required
                          />
                        </label>

                        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                          Description
                          <textarea
                            value={productForm.description}
                            onChange={handleProductInputChange("description")}
                            className="h-28 w-[95%] rounded-[16px] border-none bg-[#fff6e7] px-3 py-2 text-sm text-[#2c1603] placeholder:text-[#b37d32] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b] sm:w-full"
                            aria-invalid={isDescriptionLengthInvalid}
                            placeholder="Describe the product"
                            required
                          />
                          <span
                            className={`w-[95%] text-[11px] font-semibold sm:w-full ${
                              isDescriptionLengthInvalid
                                ? "text-[#b91c1c]"
                                : "text-[#b37d32]"
                            }`}
                          >
                            {descriptionLength} / {MAX_DESCRIPTION_LENGTH} characters
                            {" "}(min {MIN_DESCRIPTION_LENGTH})
                          </span>
                        </label>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                            Price (₹)
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={productForm.price}
                              onChange={handleProductInputChange("price")}
                              className="w-[95%] rounded-[16px] border-none bg-[#fff6e7] px-3 py-2 text-sm text-[#2c1603] placeholder:text-[#b37d32] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b] sm:w-full"
                              placeholder="e.g. 399"
                              required
                            />
                          </label>
                          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                            Sale Price (₹)
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={productForm.salePrice}
                              onChange={handleProductInputChange("salePrice")}
                              className="w-[95%] rounded-[16px] border-none bg-[#fff6e7] px-3 py-2 text-sm text-[#2c1603] placeholder:text-[#b37d32] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b] sm:w-full"
                              placeholder="Optional"
                            />
                          </label>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                            Rating
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="5"
                              value={productForm.rating}
                              onChange={handleProductInputChange("rating")}
                              className="w-[95%] rounded-[16px] border-none bg-[#fff6e7] px-3 py-2 text-sm text-[#2c1603] placeholder:text-[#b37d32] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b] sm:w-full"
                              placeholder="e.g. 4.5"
                              required
                            />
                          </label>
                          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                              Delivery Time
                              <input
                                type="number"
                                min="1"
                                value={productForm.deliveryValue}
                                onChange={handleProductInputChange("deliveryValue")}
                                className="w-[95%] rounded-[16px] border-none bg-[#fff6e7] px-3 py-2 text-sm text-[#2c1603] placeholder:text-[#b37d32] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b] sm:w-full"
                                placeholder="e.g. 30"
                                required
                              />
                            </label>
                            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                              Unit
                              <select
                                value={productForm.deliveryUnit}
                                onChange={handleProductSelectChange}
                                className="w-[95%] rounded-[16px] border-none bg-[#fff6e7] px-3 py-2 text-sm text-[#2c1603] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b] sm:w-full"
                              >
                                {DELIVERY_TIME_UNITS.map((unit) => (
                                  <option key={unit} value={unit}>
                                    {unit.charAt(0).toUpperCase() + unit.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        </div>

                        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b37428]">
                          Product Image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProductImageChange}
                            className="w-[95%] rounded-[16px] border-none bg-[#fff6e7] px-3 py-2 text-sm text-[#2c1603] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b] sm:w-full"
                            required
                          />
                        </label>

                        {productPreviewUrl && (
                          <div className="relative h-32 w-full overflow-hidden rounded-[20px] bg-[#ffe5c2] sm:h-40">
                            <Image
                              src={productPreviewUrl}
                              alt="Selected preview"
                              fill
                              sizes="(max-width: 520px) 100vw, 520px"
                              className="object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {productSubmitError && (
                      <p className="rounded-[18px] bg-[#fff0e5] px-4 py-2 text-sm font-semibold text-[#7a2b12]">
                        {productSubmitError}
                      </p>
                    )}

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                      <button
                        type="button"
                        onClick={closeAddProductModal}
                        className="w-full rounded-full bg-[#fff6e7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#7a4a1f] sm:w-auto"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={productSubmitting || isDescriptionLengthInvalid}
                        className="w-full rounded-full bg-[#2c1603] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#ffcf4d] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                      >
                        {productSubmitting ? "Adding…" : "Add Product"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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

const categories = [
  { label: "Desert", emoji: "🍰" },
  { label: "Ice Cream", emoji: "🍦" },
  { label: "Pizza", emoji: "🍕" },
  { label: "Coffee", emoji: "☕" },
  { label: "Burger", emoji: "🍔" },
];

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

  const descriptionLength = productForm.description.trim().length;
  const isDescriptionLengthInvalid =
    descriptionLength < MIN_DESCRIPTION_LENGTH ||
    descriptionLength > MAX_DESCRIPTION_LENGTH;

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

  const resetProductForm = useCallback(() => {
    setProductForm(productFormInitialState);
    setProductImageFile(null);
    setProductPreviewUrl(null);
    setProductSubmitError(null);
  }, []);

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

  const openAddProductModal = () => {
    setIsAddProductOpen(true);
    setProductSubmitError(null);
    setProductSubmitSuccess(null);
  };

  const closeAddProductModal = () => {
    setIsAddProductOpen(false);
    resetProductForm();
    setProductSubmitError(null);
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

  const mainWrapperClasses =
    "relative z-40 -mt-[20px] flex-1 space-y-8 rounded-t-[25px] bg-[#fff5e4] px-5 pb-24 pt-[40px] shadow-[0_-18px_36px_rgba(215,120,10,0.12)]";

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
                {currentUser?.username && (
                  <p className="text-[13px] font-semibold text-[#b55a07]">
                    Welcome <span className="text-black">{currentUser.username}</span> 😊
                  </p>
                )}
                <span className="text-xs font-semibold uppercase tracking-[0.26em] text-[#ac6510]">
                  Delivery To
                </span>
                <p className="text-[13px] font-semibold text-[#2c1603]">
                  New York City Rd
                </p>
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
            {categories.map((category) => (
              <button
                key={category.label}
                type="button"
                className="flex flex-col items-center gap-2"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl shadow-[0_12px_24px_rgba(255,134,0,0.22)]">
                  {category.emoji}
                </span>
                <span className="text-[13px] font-medium text-[#2c1603]">
                  {category.label}
                </span>
              </button>
            ))}
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

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[520px] px-6 pb-6">
        <div className="flex items-center justify-between rounded-[26px] bg-white/95 px-6 py-4 shadow-[0_24px_54px_rgba(215,120,10,0.18)] backdrop-blur-sm">
          {[
            { label: "Home", icon: "🏠", active: true },
            { label: "Favorite", icon: "❤️" },
            { label: "Orders", icon: "🛒" },
            { label: "Profile", icon: "👤" },
          ].map((item) => (
            <button
              key={item.label}
              className={`flex flex-col items-center text-xs font-semibold transition ${
                item.active ? "text-[#c77408]" : "text-[#b7925f]"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6" role="dialog">
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
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {isAddProductOpen && (
              <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-3 py-6 sm:items-center sm:px-4">
                <div
                  className="flex w-full max-w-[540px] flex-col rounded-[26px] bg-white px-4 py-5 text-[#2c1603] shadow-[0_24px_60px_rgba(0,0,0,0.3)] sm:max-h-[calc(100vh-4rem)] sm:px-6 sm:py-6"
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

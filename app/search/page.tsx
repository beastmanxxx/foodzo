"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { formatPrice } from "@/lib/currency";
import { type ProductResponse } from "@/lib/products";

const mainWrapperClasses =
  "relative z-40 -mt-[14px] flex-1 space-y-6 rounded-t-[16px] bg-[#fff6e5] px-5 pb-20 pt-10 shadow-[0_-18px_36px_rgba(215,120,10,0.12)]";

const formatDeliveryTimeLabel = (delivery: ProductResponse["deliveryTime"]) => {
  const baseUnit = delivery.unit.endsWith("s")
    ? delivery.unit.slice(0, -1)
    : delivery.unit;
  const unit = delivery.value === 1 ? baseUnit : delivery.unit;
  return `${delivery.value} ${unit}`;
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 180);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return products;
    }

    return products.filter((product) => {
      const nameMatch = product.name.toLowerCase().includes(normalized);
      const descriptionMatch = product.description.toLowerCase().includes(normalized);
      return nameMatch || descriptionMatch;
    });
  }, [query, products]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/products", { cache: "no-store" });
        const payload = (await response.json()) as {
          products?: ProductResponse[];
          error?: string;
        };

        if (!response.ok || !payload.products) {
          throw new Error(payload.error || "Unable to load products.");
        }

        setProducts(payload.products);
      } catch (err) {
        console.error("Search products load failed", err);
        setError(err instanceof Error ? err.message : "Unable to load products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-[#fff6e5] text-[#2b1606]">
      <header className="sticky top-0 z-20 overflow-hidden pb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ffcf4d] via-[#ffac1f] to-[#ff7a00]"></div>
        <div
          className="absolute inset-0 opacity-40 mix-blend-screen"
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 12%, rgba(255,255,255,0.55), transparent 58%), radial-gradient(circle at 82% -8%, rgba(255,245,211,0.55), transparent 62%)",
          }}
        ></div>

        <div className="relative z-10 flex flex-col gap-2 px-5 pb-3 pt-[clamp(1.5rem,8vw,2.4rem)] text-[#2c1603]">
          <div className="flex items-center justify-between rounded-[28px] bg-white px-4 py-3 shadow-[0_18px_36px_rgba(222,137,14,0.25)]">
            <div className="leading-tight">
              <span className="text-xs font-semibold uppercase tracking-[0.26em] text-[#ac6510]">
                Explore
              </span>
              <h1 className="text-[17px] font-semibold text-[#2c1603]">
                Search Dishes
              </h1>
            </div>
            <Link
              href="/home"
              aria-label="Back to home"
              className="flex items-center justify-center rounded-full bg-[#2c1603] p-3 text-base text-[#ffcf4d] shadow-[0_12px_28px_rgba(44,22,3,0.28)] transition hover:scale-[1.08]"
            >
              ←
            </Link>
          </div>

          <label className="relative flex items-center">
            <span className="absolute left-4 text-xl text-[#c87b00]">🔍</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              placeholder="Search by product or category"
              className="w-full rounded-[26px] border-none bg-white px-12 py-3 text-[14px] font-medium text-[#3a250f] placeholder:text-[#b37d32] shadow-[0_18px_32px_rgba(221,132,4,0.22)] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[#ffb43b]"
              autoFocus
            />
          </label>
        </div>
      </header>

      <main className={mainWrapperClasses}>
        {loading ? (
          <p className="rounded-[22px] bg-white/80 px-5 py-6 text-center text-sm font-semibold text-[#a25611] shadow-[0_16px_36px_rgba(221,132,4,0.12)]">
            Loading products…
          </p>
        ) : error ? (
          <p className="rounded-[22px] bg-white/80 px-5 py-6 text-center text-sm font-semibold text-[#7a2b12] shadow-[0_16px_36px_rgba(221,132,4,0.12)]">
            {error}
          </p>
        ) : filteredProducts.length === 0 ? (
          <p className="rounded-[22px] bg-white/80 px-5 py-6 text-center text-sm font-semibold text-[#a25611] shadow-[0_16px_36px_rgba(221,132,4,0.12)]">
            No results found. Try a different keyword.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {filteredProducts.map((product) => (
              <li
                key={product.id}
                className="rounded-[26px] bg-white p-4 shadow-[0_20px_40px_rgba(196,126,28,0.12)]"
              >
                <div className="relative mb-4 h-36 w-full overflow-hidden rounded-[22px] bg-gradient-to-br from-[#ffd36b] via-[#ffb041] to-[#ff7b3d]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.55),transparent_65%)]"></div>
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 320px"
                    className="object-cover mix-blend-multiply"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#8a4c05]/80">
                  <span className="flex items-center gap-1 rounded-full bg-[#fff2d2] px-2 py-1 text-[#8a4c05]">
                    ⏱ {formatDeliveryTimeLabel(product.deliveryTime)}
                  </span>
                  <span className="flex items-center gap-1">
                    ⭐ {product.rating.toFixed(1)}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-semibold text-[#2d1c07]">
                  {product.name}
                </h2>
                <p className="mt-1 line-clamp-2 text-xs text-[#7a4a1f]">
                  {product.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="block text-[15px] font-semibold text-[#b55a07]">
                      {formatPrice(product.salePrice ?? product.price)}
                    </span>
                    {product.salePrice !== null && (
                      <span className="block text-xs font-semibold text-[#a25611]/70 line-through">
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>
                  <button className="rounded-full bg-[#b55a07] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:scale-[1.03]">
                    Add
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed left-1/2 top-0 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-gradient-to-r from-[#ffcf4d] via-[#ffac1f] to-[#ff7a00] px-5 py-3 text-sm font-semibold text-[#2c1603] shadow-[0_20px_44px_rgba(255,162,17,0.32)] transition-all duration-300 ${
          showScrollTop
            ? "translate-y-3 opacity-100"
            : "pointer-events-none -translate-y-8 opacity-0"
        }`}
        aria-label="Scroll to top"
      >
        <span className="text-lg">↑</span>
        Back to top
      </button>
    </div>
  );
}

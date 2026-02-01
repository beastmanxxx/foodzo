import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import type { CategoryResponse } from "@/lib/categories";
import type { ProductResponse } from "@/lib/products";
import { formatPrice } from "@/lib/currency";

const buildBaseUrl = async () => {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "http";

  if (host) {
    return `${protocol}://${host}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
};

async function fetchCategory(categoryId: string) {
  const baseUrl = await buildBaseUrl();
  const response = await fetch(`${baseUrl}/api/categories/${categoryId}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to fetch category");
  }

  const payload = (await response.json()) as { category?: CategoryResponse };
  return payload.category ?? null;
}

async function fetchCategoryProducts(categoryId: string) {
  const baseUrl = await buildBaseUrl();
  const response = await fetch(`${baseUrl}/api/categories/${categoryId}/products`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return [] as ProductResponse[];
  }

  const payload = (await response.json()) as { products?: ProductResponse[] };
  return payload.products ?? [];
}

const buildReviewLabel = (rating: number, index: number) => {
  const base = Math.max(40, Math.round(rating * 70));
  const multiplier = (index % 4) + 4;
  const total = base * multiplier;
  return `${rating.toFixed(1)} (${total} reviews)`;
};

const formatDeliveryDuration = (value: number, unit: string) => {
  const normalized = unit.toLowerCase();

  if (normalized.startsWith("min")) {
    return `${value} Mins`;
  }

  if (normalized.startsWith("hour")) {
    return `${value} Hrs`;
  }

  if (normalized.startsWith("day")) {
    return `${value} Days`;
  }

  return `${value} ${unit}`;
};

export default async function CategoryPage({
  params,
}: {
  params: Promise<{
    id?: string;
  }>;
}) {
  const { id } = await params;
  const categoryId = id?.trim();

  if (!categoryId) {
    notFound();
  }

  const [category, products] = await Promise.all([
    fetchCategory(categoryId),
    fetchCategoryProducts(categoryId),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white text-[#17212b]">
      <main className="mx-auto w-full max-w-[1080px] flex-1 px-5 pb-28 pt-10">
        <section className="space-y-8">
          <div
            className="relative overflow-hidden rounded-[30px] bg-[#e7f6ef] shadow-[0_32px_60px_rgba(23,33,43,0.14)]"
            style={{
              backgroundImage: `url(${category.imageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/35 to-black/55"></div>
            <Link
              href="/home"
              className="absolute left-5 top-5 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#1f4b2b] shadow-[0_12px_24px_rgba(23,33,43,0.18)]"
              aria-label="Back to home"
            >
              ←
            </Link>
            <div className="relative flex min-h-[180px] flex-col items-center justify-end gap-3 px-6 pb-8 text-white">
              <div className="rounded-full bg-white/85 px-6 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-[#1b8240]">
                {category.name} time now
              </div>
              <h1 className="text-[28px] font-semibold uppercase tracking-wide text-white drop-shadow-[0_12px_24px_rgba(0,0,0,0.35)]">
                {category.name}
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5">
            {products.map((product, index) => (
              <article
                key={product.id}
                className="overflow-hidden rounded-[24px] bg-[#f7f8fa] shadow-[0_16px_32px_rgba(23,33,43,0.08)]"
              >
                <div className="relative h-40 w-full overflow-hidden">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 340px"
                    className="rounded-[20px] object-cover"
                  />
                  <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-[#1b8240] shadow-[0_12px_22px_rgba(0,0,0,0.12)]">
                    <span>⏱</span>
                    <span>{formatDeliveryDuration(product.deliveryTime.value, product.deliveryTime.unit)}</span>
                  </div>
                  <button
                    type="button"
                    className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#f15f70] shadow-[0_12px_20px_rgba(241,95,112,0.28)]"
                    aria-label="Toggle favorite"
                  >
                    ♥
                  </button>
                </div>

                <div className="flex flex-col gap-3 px-4 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-base font-semibold text-[#17212b]">{product.name}</h3>
                      <span className="text-[11px] font-semibold text-[#748085]">
                        ⭐ {buildReviewLabel(product.rating, index)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-[#1a9f4c] px-3 py-1 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(26,159,76,0.28)]">
                      {formatPrice(product.price)}
                    </span>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[#dce6e1] text-sm text-[#4e5b5f] shadow-[0_6px_14px_rgba(23,33,43,0.1)]"
                      aria-label="Share product"
                    >
                      ↗
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

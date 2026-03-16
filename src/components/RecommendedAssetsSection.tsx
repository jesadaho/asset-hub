"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";

const PRIMARY = "#068e7b";

type RecommendedAsset = {
  id: string;
  name: string;
  type: string;
  price: number;
  salePrice?: number;
  monthlyRent?: number;
  address: string;
  listingType?: string;
  saleWithTenant?: boolean;
  status: string;
  imageUrl: string | null;
};

function CardSkeleton() {
  return (
    <div className="flex min-w-[280px] max-w-[320px] flex-shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white sm:min-w-0">
      <div className="h-40 max-h-[180px] shrink-0 animate-pulse bg-slate-200" />
      <div className="space-y-2 p-4">
        <div className="h-5 w-24 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  );
}

function RecommendedAssetCard({ item }: { item: RecommendedAsset }) {
  return (
    <Link
      href={`/listings/${item.id}`}
      className="group flex min-w-[280px] max-w-[320px] flex-shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md sm:min-w-0"
    >
      <div className="relative aspect-[3/2] w-full shrink-0 overflow-hidden bg-slate-200">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            className="h-full w-full object-cover object-center transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <Home className="h-12 w-12" aria-hidden />
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          <span className="rounded-md bg-white/95 px-2 py-1 text-xs font-medium text-slate-700 shadow">
            {item.listingType === "sale" ? "ขาย" : "เช่า"}
          </span>
          {item.listingType === "sale" && item.saleWithTenant && (
            <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 shadow">
              ขายพร้อมผู้เช่า
            </span>
          )}
        </div>
      </div>
      <div className="flex min-h-[152px] flex-1 flex-col p-4">
        <p className="text-xs font-medium text-slate-500">
          {item.listingType === "sale" && item.salePrice
            ? "ราคาขาย"
            : item.saleWithTenant && item.monthlyRent
              ? "ค่าเช่าปัจจุบัน"
              : "ราคา"}
        </p>
        <p className="text-lg font-bold text-slate-900" style={{ color: PRIMARY }}>
          ฿{item.price.toLocaleString()}
        </p>
        {item.listingType === "sale" && (item.monthlyRent ?? 0) > 0 && (
          <p className="mt-1 text-sm text-slate-500">
            ค่าเช่าปัจจุบัน ฿{item.monthlyRent!.toLocaleString()}/เดือน
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
          <span>{item.type}</span>
          {item.saleWithTenant && <span>มีผู้เช่าอยู่</span>}
        </div>
        <p className="mt-2 line-clamp-2 text-sm font-medium text-slate-900">
          {item.name}
        </p>
      </div>
    </Link>
  );
}

export function RecommendedAssetsSection() {
  const [items, setItems] = useState<RecommendedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchItems() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/recommended-assets");
        const data: { message?: string; listings?: RecommendedAsset[] } =
          await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || "Failed to load recommended assets");
        }
        if (!cancelled) {
          const nextItems = Array.isArray(data.listings) ? data.listings : [];
          setItems(nextItems);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchItems();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      className="border-b border-slate-200 bg-white px-4 py-10 sm:px-6 lg:px-8"
      aria-labelledby="recommended-assets-title"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2
            id="recommended-assets-title"
            className="text-xl font-bold text-slate-900 sm:text-2xl"
          >
            สินทรัพย์แนะนำ
          </h2>
          {!loading && items.length > 0 && (
            <span className="text-sm font-medium text-slate-600">
              {items.length} รายการ
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-slate-500">
          รายการประกาศขายและปล่อยเช่าตรงจากเจ้าของห้อง
        </p>

        {error && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-6 flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="mt-6 flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
            {items.map((item) => (
              <RecommendedAssetCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
            ยังไม่พบรายการที่ตรงเงื่อนไขสำหรับส่วนสินทรัพย์แนะนำ
          </div>
        )}
      </div>
    </section>
  );
}

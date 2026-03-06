"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, ChevronLeft, Home, ChevronRight } from "lucide-react";
import { Header } from "@/components/Header";
import { HeaderSimple } from "@/components/HeaderSimple";

const PRIMARY = "#068e7b";
const PER_PAGE = 12;

type ListingItem = {
  id: string;
  name: string;
  type: string;
  price: number;
  address: string;
  listingType?: string;
  imageUrl: string | null;
};

function ListingsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const location = searchParams.get("location") ?? "";
  const listingTypeParam =
    searchParams.get("listingType") ?? searchParams.get("listing_type") ?? "rent";
  const listingType =
    listingTypeParam.toLowerCase() === "sale" ? "sale" : "rent";
  const minPrice = searchParams.get("minPrice") ?? searchParams.get("min_price") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? searchParams.get("max_price") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const [listings, setListings] = useState<ListingItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(
    async (pageNum: number) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("listingType", listingType);
        if (location) params.set("location", location);
        if (minPrice) params.set("minPrice", minPrice);
        if (maxPrice) params.set("maxPrice", maxPrice);
        params.set("limit", String(PER_PAGE));
        params.set("page", String(pageNum));
        const res = await fetch(`/api/listings?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setListings(data.listings ?? []);
        setTotalPages(data.totalPages ?? 0);
        setTotalCount(data.totalCount ?? 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    },
    [listingType, location, minPrice, maxPrice]
  );

  useEffect(() => {
    fetchListings(page);
  }, [page, fetchListings]);

  const goToPage = (p: number) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", String(p));
    router.push(`${pathname}?${next.toString()}`);
  };

  if (loading && listings.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <HeaderSimple />
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <p className="text-slate-500">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
            <ChevronLeft className="h-4 w-4" /> กลับไปค้นหา
          </Link>
          <span className="text-sm text-slate-500">
            {listingType === "rent" ? "ประกาศเช่า" : "ประกาศขาย"}
            {location ? ` · ${location}` : ""}
          </span>
          {!loading && (
            <span className="text-sm font-medium text-slate-700">
              ทั้งหมด {totalCount.toLocaleString()} รายการ
              {totalPages > 0 && ` · หน้า ${page} จาก ${totalPages}`}
            </span>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {listings.length === 0 && !loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <Search className="mx-auto h-12 w-12 text-slate-300" aria-hidden />
            <p className="mt-4 font-medium text-slate-700">ไม่พบรายการที่ตรงกับคำค้น</p>
            <p className="mt-1 text-sm text-slate-500">ลองเปลี่ยนคำค้นหรือเงื่อนไข</p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: PRIMARY }}
            >
              ค้นหาใหม่
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((item) => (
                <Link
                  key={item.id}
                  href={`/listings/${item.id}`}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="aspect-[3/2] bg-slate-200">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <Home className="h-12 w-12" aria-hidden />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-slate-900 line-clamp-1">{item.name}</p>
                    <p className="mt-1 text-lg font-bold" style={{ color: PRIMARY }}>
                      ฿{item.price.toLocaleString()}
                      {item.listingType === "sale" ? (
                        <span className="text-sm font-normal text-slate-500"></span>
                      ) : (
                        <span className="text-sm font-normal text-slate-500">/ เดือน</span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 line-clamp-2">{item.address}</p>
                    <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {item.type}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {listings.length > 0 && (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                {totalPages > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => goToPage(page - 1)}
                      disabled={page <= 1 || loading}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" /> ก่อนหน้า
                    </button>
                    <div className="flex items-center gap-1">
                      {(() => {
                        const show = 5;
                        let start = Math.max(1, page - Math.floor(show / 2));
                        const end = Math.min(totalPages, start + show - 1);
                        if (end - start + 1 < show) start = Math.max(1, end - show + 1);
                        return Array.from({ length: end - start + 1 }, (_, i) => {
                          const p = start + i;
                          const isCurrent = p === page;
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => goToPage(p)}
                              disabled={loading}
                              className={`min-w-[2.25rem] rounded-lg py-2 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50 ${
                                isCurrent
                                  ? "text-white"
                                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              }`}
                              style={isCurrent ? { backgroundColor: PRIMARY } : undefined}
                            >
                              {p}
                            </button>
                          );
                        });
                      })()}
                    </div>
                    <button
                      type="button"
                      onClick={() => goToPage(page + 1)}
                      disabled={page >= totalPages || loading}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
                    >
                      ถัดไป <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
                <span className="w-full text-center text-sm text-slate-500 sm:w-auto">
                  หน้า {page} จาก {totalPages || 1} · ทั้งหมด {totalCount} รายการ
                  {totalPages <= 1 && totalCount > 0 && ` (แสดง ${PER_PAGE} รายการต่อหน้า)`}
                </span>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function ListingsPageFallback() {
  return (
    <div className="min-h-screen bg-slate-50">
      <HeaderSimple />
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-slate-500">กำลังโหลด...</p>
      </div>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<ListingsPageFallback />}>
      <ListingsPageContent />
    </Suspense>
  );
}

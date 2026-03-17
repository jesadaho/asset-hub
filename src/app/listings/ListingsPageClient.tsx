"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, ChevronLeft, Home, ChevronRight, BedDouble, Bath, Mail, Heart } from "lucide-react";
import { Header } from "@/components/Header";
import { ListingsSearchBar } from "@/components/ListingsSearchBar";
import type { DDPropertyItem } from "@/lib/ddproperty-api";

const PRIMARY = "#068e7b";
const PER_PAGE = 12;

type ListingItem = {
  id: string;
  name: string;
  type: string;
  price: number;
  salePrice?: number;
  monthlyRent?: number;
  address: string;
  listingType?: string;
  saleWithTenant?: boolean;
  bedrooms?: string;
  bathrooms?: string;
  createdAt?: string;
  imageUrl: string | null;
};

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
function formatListingDate(isoOrDate: string | null | undefined): string | null {
  if (!isoOrDate) return null;
  const date = new Date(isoOrDate);
  if (Number.isNaN(date.getTime())) return null;
  const d = date.getDate();
  const m = THAI_MONTHS[date.getMonth()];
  const y = date.getFullYear() + 543;
  return `${d} ${m} ${y}`;
}

/** Skeleton for horizontal listing card (image left, content right) */
function ListingCardSkeleton() {
  return (
    <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="h-44 w-64 shrink-0 animate-pulse bg-slate-200 sm:h-52 sm:w-80" />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-4 sm:p-5">
        <div className="h-5 w-3/4 max-w-[200px] animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-full max-w-[280px] animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
        <div className="h-7 w-24 animate-pulse rounded bg-slate-200" />
        <div className="mt-1 flex gap-4">
          <div className="h-4 w-8 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-8 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="mt-3 flex gap-2">
          <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-9 w-16 animate-pulse rounded-lg bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

export default function ListingsPageClient() {
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
  const [ddItems, setDdItems] = useState<DDPropertyItem[]>([]);
  const [ddPage, setDdPage] = useState(1);
  const [ddTotalPages, setDdTotalPages] = useState(0);
  const [ddTotalCount, setDdTotalCount] = useState<number | null>(null);
  const [ddLoading, setDdLoading] = useState(false);
  const [ddError, setDdError] = useState<string | null>(null);

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

  // Reset DDproperty page when filters change
  useEffect(() => {
    setDdPage(1);
  }, [listingType, location]);

  useEffect(() => {
    if (listingType !== "rent" && listingType !== "sale") {
      setDdItems([]);
      setDdError(null);
      setDdTotalPages(0);
      setDdTotalCount(null);
      return;
    }
    let cancelled = false;
    setDdLoading(true);
    setDdError(null);
    const params = new URLSearchParams();
    params.set("listing_type", listingType === "sale" ? "SALE" : "RENT");
    params.set("page", String(ddPage));
    if (location) params.set("location", location);
    fetch(`/api/ddproperty/search?${params.toString()}`)
      .then(async (res) => {
        const data = (await res.json()) as {
          items?: DDPropertyItem[];
          message?: string;
          totalPages?: number | null;
          totalCount?: number | null;
        };
        return { ok: res.ok, data };
      })
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (ok) {
          setDdItems(Array.isArray(data.items) ? data.items : []);
          setDdTotalPages(
            typeof data.totalPages === "number" && data.totalPages >= 0 ? data.totalPages : 0
          );
          setDdTotalCount(
            typeof data.totalCount === "number" && data.totalCount >= 0 ? data.totalCount : null
          );
        } else {
          setDdItems([]);
          setDdError(data.message ?? "โหลดรายการจาก DDproperty ไม่ได้");
          setDdTotalPages(0);
          setDdTotalCount(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setDdItems([]);
          setDdError(e instanceof Error ? e.message : "โหลดรายการจาก DDproperty ไม่ได้");
          setDdTotalPages(0);
          setDdTotalCount(null);
        }
      })
      .finally(() => {
        if (!cancelled) setDdLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [listingType, location, ddPage]);

  const goToPage = (p: number) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", String(p));
    router.push(`${pathname}?${next.toString()}`);
  };

  /** รายการรวม: ประกาศจาก Asset Ace ขึ้นก่อน เสมอ ตามด้วย DDproperty (เฉพาะหน้า 1) */
  type ListingRow = { source: "own"; item: ListingItem } | { source: "dd"; item: DDPropertyItem };
  const isRent = listingType === "rent";
  const isSale = listingType === "sale";
  const showDdOnThisPage = (isRent || isSale) && page === 1;
  const ownRows: ListingRow[] = listings.map((item) => ({ source: "own" as const, item }));
  const ddRows: ListingRow[] = showDdOnThisPage
    ? ddItems.map((item) => ({ source: "dd" as const, item }))
    : [];
  const displayRows: ListingRow[] = [...ownRows, ...ddRows];
  const displayCount = showDdOnThisPage
    ? totalCount + (ddTotalCount ?? ddItems.length)
    : totalCount;
  const showSkeletons = (loading && listings.length === 0) || (showDdOnThisPage && ddLoading && ddItems.length === 0 && listings.length === 0);
  const showMoreSkeletons = showDdOnThisPage && ddLoading && listings.length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main>
        <ListingsSearchBar />

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="mb-6 text-sm text-slate-600">
            {listingType === "rent" ? "ประกาศเช่า" : "ประกาศขาย"}
            {location ? ` ใน ${location}` : ""}
            {" · "}
            <span className="font-medium text-slate-800">
              ทั้งหมด {!showSkeletons && !loading ? displayCount.toLocaleString() : "—"} รายการ
            </span>
            {!showSkeletons && !loading && totalPages > 0 && (
              <span className="text-slate-500"> · หน้า {page} จาก {totalPages}</span>
            )}
          </p>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {showDdOnThisPage && ddError && (
          <div className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
            โหลดรายการจาก DDproperty ไม่สมบูรณ์: {ddError}
          </div>
        )}

        {displayRows.length === 0 && !showSkeletons && !showMoreSkeletons && !loading && (!showDdOnThisPage || !ddLoading) ? (
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
            <div className="flex gap-6 lg:gap-8">
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-4">
                  {showSkeletons ? (
                    Array.from({ length: 8 }, (_, i) => <ListingCardSkeleton key={`sk-${i}`} />)
                  ) : (
                    <>
                      {displayRows.map((row) =>
                        row.source === "own" ? (
                          <div
                            key={`own-${row.item.id}`}
                            className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                          >
                            <Link href={`/listings/${row.item.id}`} className="group flex min-w-0 flex-1">
                              <div className="h-44 w-64 shrink-0 bg-slate-200 sm:h-52 sm:w-80">
                                {row.item.imageUrl ? (
                                  <img
                                    src={row.item.imageUrl}
                                    alt=""
                                    className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                                    <Home className="h-12 w-12" aria-hidden />
                                  </div>
                                )}
                              </div>
                              <div className="flex min-w-0 flex-1 flex-col justify-center p-4 sm:p-5">
                                <p className="font-semibold text-slate-900 line-clamp-1">{row.item.name}</p>
                                {row.item.address && (
                                  <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">{row.item.address}</p>
                                )}
                                <p className="mt-1 text-xs font-medium text-slate-500">
                                  {row.item.listingType === "sale" && row.item.salePrice
                                    ? "ราคาขาย"
                                    : row.item.saleWithTenant && row.item.monthlyRent
                                      ? "ค่าเช่าปัจจุบัน"
                                      : row.item.listingType === "sale"
                                        ? "ราคา"
                                        : "ค่าเช่า"}
                                </p>
                                <p className="mt-1 text-lg font-bold" style={{ color: PRIMARY }}>
                                  ฿{row.item.price.toLocaleString()}
                                  {row.item.listingType === "sale" ? null : (
                                    <span className="text-sm font-normal text-slate-500">/ เดือน</span>
                                  )}
                                </p>
                                {row.item.listingType === "sale" && (row.item.monthlyRent ?? 0) > 0 && (
                                  <p className="mt-1 text-sm text-slate-500">
                                    ค่าเช่าปัจจุบัน ฿{row.item.monthlyRent!.toLocaleString()}/เดือน
                                  </p>
                                )}
                                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                                  <span className="inline-flex items-center gap-1.5" title="ห้องนอน">
                                    <BedDouble className="h-4 w-4 text-slate-500" aria-hidden />
                                    {row.item.bedrooms != null && row.item.bedrooms !== "" ? row.item.bedrooms : "—"}
                                  </span>
                                  <span className="inline-flex items-center gap-1.5" title="ห้องน้ำ">
                                    <Bath className="h-4 w-4 text-slate-500" aria-hidden />
                                    {row.item.bathrooms != null && row.item.bathrooms !== "" ? row.item.bathrooms : "—"}
                                  </span>
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{row.item.type}</span>
                                </div>
                                {row.item.createdAt && formatListingDate(row.item.createdAt) && (
                                  <p className="mt-1.5 text-xs text-slate-500">
                                    ลงประกาศ {formatListingDate(row.item.createdAt)}
                                  </p>
                                )}
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                  >
                                    <Mail className="h-4 w-4" aria-hidden />
                                    Contact
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                    aria-label="บันทึก"
                                  >
                                    <Heart className="h-4 w-4" aria-hidden />
                                    Save
                                  </button>
                                </div>
                              </div>
                            </Link>
                          </div>
                        ) : (
                          <div
                            key={`dd-${row.item.id}`}
                            className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                          >
                            <Link href={`/listings/dd/${encodeURIComponent(row.item.id)}`} className="group flex min-w-0 flex-1">
                              <div className="h-44 w-64 shrink-0 bg-slate-200 sm:h-52 sm:w-80">
                                {row.item.imageUrl ? (
                                  <img
                                    src={row.item.imageUrl}
                                    alt=""
                                    className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                                    <Home className="h-12 w-12" aria-hidden />
                                  </div>
                                )}
                              </div>
                              <div className="flex min-w-0 flex-1 flex-col justify-center p-4 sm:p-5">
                                <p className="font-semibold text-slate-900 line-clamp-1">{row.item.title}</p>
                                {row.item.location && (
                                  <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">{row.item.location}</p>
                                )}
                                <p className="mt-1 text-xs font-medium text-slate-500">
                                  {listingType === "sale" ? "ราคาขาย" : "ค่าเช่า"}
                                </p>
                                <p className="mt-1 text-lg font-bold" style={{ color: PRIMARY }}>
                                  {row.item.price > 0
                                    ? `฿${row.item.price.toLocaleString()}`
                                    : row.item.priceDisplay ?? "฿—"}
                                  {listingType !== "sale" && (
                                    <span className="text-sm font-normal text-slate-500">/ เดือน</span>
                                  )}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                                  <span className="inline-flex items-center gap-1.5" title="ห้องนอน">
                                    <BedDouble className="h-4 w-4 text-slate-500" aria-hidden />
                                    {row.item.bedrooms != null && String(row.item.bedrooms) !== "" ? String(row.item.bedrooms) : "—"}
                                  </span>
                                  <span className="inline-flex items-center gap-1.5" title="ห้องน้ำ">
                                    <Bath className="h-4 w-4 text-slate-500" aria-hidden />
                                    {row.item.bathrooms != null && String(row.item.bathrooms) !== "" ? String(row.item.bathrooms) : "—"}
                                  </span>
                                  {row.item.propertyType && (
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{row.item.propertyType}</span>
                                  )}
                                </div>
                                {row.item.listedAt && formatListingDate(row.item.listedAt) && (
                                  <p className="mt-1.5 text-xs text-slate-500">
                                    ลงประกาศ {formatListingDate(row.item.listedAt)}
                                  </p>
                                )}
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                  >
                                    <Mail className="h-4 w-4" aria-hidden />
                                    Contact
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                    aria-label="บันทึก"
                                  >
                                    <Heart className="h-4 w-4" aria-hidden />
                                    Save
                                  </button>
                                </div>
                              </div>
                            </Link>
                          </div>
                        )
                      )}
                      {showMoreSkeletons && Array.from({ length: 4 }, (_, i) => <ListingCardSkeleton key={`sk-dd-${i}`} />)}
                    </>
                  )}
                </div>

                {ddTotalPages > 1 && showDdOnThisPage && !showSkeletons && (
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setDdPage(1)}
                      disabled={ddPage <= 1 || ddLoading}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
                      aria-label="หน้าแรก (DDproperty)"
                    >
                      หน้าแรก
                    </button>
                    <button
                      type="button"
                      onClick={() => setDdPage((p) => Math.max(1, p - 1))}
                      disabled={ddPage <= 1 || ddLoading}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" /> ก่อนหน้า
                    </button>
                    <div className="flex items-center gap-1">
                      {(() => {
                        const show = 5;
                        const total = Math.max(1, ddTotalPages);
                        let start = Math.max(1, ddPage - Math.floor(show / 2));
                        const end = Math.min(total, start + show - 1);
                        if (end - start + 1 < show) start = Math.max(1, end - show + 1);
                        return Array.from({ length: end - start + 1 }, (_, i) => {
                          const p = start + i;
                          const isCurrent = p === ddPage;
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setDdPage(p)}
                              disabled={ddLoading}
                              className={`min-w-[2.25rem] rounded-lg py-2 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50 ${
                                isCurrent ? "text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
                      onClick={() => setDdPage((p) => Math.min(ddTotalPages, p + 1))}
                      disabled={ddPage >= ddTotalPages || ddLoading}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
                    >
                      ถัดไป <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDdPage(ddTotalPages)}
                      disabled={ddPage >= ddTotalPages || ddLoading}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
                      aria-label="หน้าสุดท้าย (DDproperty)"
                    >
                      สุดท้าย
                    </button>
                    <span className="w-full text-center text-sm text-slate-500 sm:w-auto">
                      หน้า {ddPage} จาก {ddTotalPages} (DDproperty)
                    </span>
                  </div>
                )}

                {(listings.length > 0 || (showDdOnThisPage && ddItems.length > 0)) && !showSkeletons && (
                  <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => goToPage(1)}
                      disabled={page <= 1 || loading}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
                      aria-label="หน้าแรก"
                    >
                      หน้าแรก
                    </button>
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
                        const total = Math.max(1, totalPages);
                        let start = Math.max(1, page - Math.floor(show / 2));
                        const end = Math.min(total, start + show - 1);
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
                    <button
                      type="button"
                      onClick={() => goToPage(Math.max(1, totalPages))}
                      disabled={page >= totalPages || loading || totalPages < 1}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
                      aria-label="หน้าสุดท้าย"
                    >
                      สุดท้าย
                    </button>
                    <span className="w-full text-center text-sm text-slate-500 sm:w-auto">
                      หน้า {page} จาก {totalPages || 1} · ทั้งหมด {displayCount} รายการ
                      {totalPages <= 1 && displayCount > 0 && showDdOnThisPage && ddItems.length > 0 && " (รวมจาก DDproperty)"}
                    </span>
                  </div>
                )}
              </div>

              <aside className="hidden shrink-0 lg:block lg:w-72 xl:w-80" aria-label="โซนโฆษณา">
                <div className="sticky top-4 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
                  <p className="text-sm font-medium text-slate-500">โซนโฆษณา</p>
                  <p className="mt-1 text-xs text-slate-400">พื้นที่สำหรับแบนเนอร์หรือโฆษณา</p>
                  <div className="mt-4 aspect-[3/4] max-h-[400px] rounded-lg bg-slate-200/80 flex items-center justify-center text-slate-400 text-sm">
                    Ad
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
        </div>
      </main>
    </div>
  );
}

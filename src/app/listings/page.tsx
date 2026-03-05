"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, ChevronLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { HeaderSimple } from "@/components/HeaderSimple";

const PRIMARY = "#068e7b";

type ListingItem = {
  id: string;
  name: string;
  type: string;
  price: number;
  address: string;
  listingType?: string;
  imageUrl: string | null;
};

export default function ListingsPage() {
  const searchParams = useSearchParams();
  const location = searchParams.get("location") ?? "";
  const listingType = searchParams.get("listingType") ?? "rent";

  const [listings, setListings] = useState<ListingItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(
    async (cursor?: string | null) => {
      if (cursor) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("listingType", listingType);
        if (location) params.set("location", location);
        if (cursor) params.set("cursor", cursor);
        params.set("limit", "12");
        const res = await fetch(`/api/listings?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        if (cursor) {
          setListings((prev) => [...prev, ...(data.listings ?? [])]);
        } else {
          setListings(data.listings ?? []);
        }
        setNextCursor(data.nextCursor ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [listingType, location]
  );

  useEffect(() => {
    fetchListings(null);
  }, [listingType, location, fetchListings]);

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
                  <div className="aspect-[4/3] bg-slate-200">
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

            {nextCursor && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={() => fetchListings(nextCursor)}
                  disabled={loadingMore}
                  className="rounded-lg px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: PRIMARY }}
                >
                  {loadingMore ? "กำลังโหลด..." : "โหลดเพิ่ม"}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

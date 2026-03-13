"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bug, ChevronDown, ChevronUp, Home } from "lucide-react";

const PRIMARY = "#068e7b";

type RecommendedAsset = {
  id: string;
  name: string;
  type: string;
  price: number;
  address: string;
  listingType?: string;
  saleWithTenant?: boolean;
  status: string;
  imageUrl: string | null;
};

type RecommendedAssetsDebug = {
  requestedUrl: string;
  statusCode?: number;
  responseBodySnippet?: string;
  errorMessage?: string;
  itemCount?: number;
};

function CardSkeleton() {
  return (
    <div className="flex min-w-[280px] max-w-[320px] flex-shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white sm:min-w-0">
      <div className="h-40 shrink-0 animate-pulse bg-slate-200" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
        <div className="h-6 w-28 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
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
            ขาย
          </span>
          {item.saleWithTenant && (
            <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 shadow">
              ขายพร้อมผู้เช่า
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col p-4">
        <p className="text-lg font-bold text-slate-900" style={{ color: PRIMARY }}>
          ฿{item.price.toLocaleString()}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
          <span>{item.type}</span>
          {item.saleWithTenant && <span>มีผู้เช่าอยู่</span>}
        </div>
        <p className="mt-2 line-clamp-2 text-sm font-medium text-slate-900">
          {item.name}
        </p>
        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
          {item.address}
        </p>
      </div>
    </Link>
  );
}

export function RecommendedAssetsSection() {
  const [items, setItems] = useState<RecommendedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<RecommendedAssetsDebug | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchItems() {
      setLoading(true);
      setError(null);
      setDebug(null);
      try {
        const url = "/api/recommended-assets";
        const res = await fetch(url);
        const text = await res.text();
        let data: { message?: string; listings?: RecommendedAsset[] } = {};
        try {
          data = JSON.parse(text);
        } catch {
          setDebug({
            requestedUrl: url,
            statusCode: res.status,
            responseBodySnippet: text.slice(0, 500),
            errorMessage: "Response is not JSON",
          });
          throw new Error(`API error ${res.status}: ${res.statusText}`);
        }
        if (!res.ok) {
          setDebug({
            requestedUrl: url,
            statusCode: res.status,
            responseBodySnippet: text.slice(0, 500),
            errorMessage: data.message || "Failed to load recommended assets",
          });
          throw new Error(data.message || "Failed to load recommended assets");
        }
        if (!cancelled) {
          const nextItems = Array.isArray(data.listings) ? data.listings : [];
          setItems(nextItems);
          setDebug({
            requestedUrl: url,
            statusCode: res.status,
            responseBodySnippet: text.slice(0, 500),
            itemCount: nextItems.length,
          });
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
          คัดรายการขายที่น่าสนใจจาก Asset Ace รวมถึงห้องขายพร้อมผู้เช่า
        </p>

        {error && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {(debug || error) && (
          <div className="mt-4 rounded-lg border border-slate-300 bg-slate-100 font-mono text-xs">
            <button
              type="button"
              onClick={() => setDebugOpen((open) => !open)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-700 hover:bg-slate-200"
            >
              <Bug className="h-4 w-4" aria-hidden />
              <span className="font-semibold">Debug view</span>
              {debugOpen ? (
                <ChevronUp className="ml-auto h-4 w-4" />
              ) : (
                <ChevronDown className="ml-auto h-4 w-4" />
              )}
            </button>
            {debugOpen && debug && (
              <div className="space-y-2 border-t border-slate-300 p-3 text-slate-600">
                <div>
                  <span className="font-semibold text-slate-700">Request URL:</span>
                  <pre className="mt-0.5 break-all whitespace-pre-wrap rounded bg-white/80 p-2">
                    {debug.requestedUrl}
                  </pre>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Status:</span>{" "}
                  {debug.statusCode || "(network error)"}
                </div>
                {debug.itemCount != null && (
                  <div>
                    <span className="font-semibold text-slate-700">Item count:</span>{" "}
                    {debug.itemCount}
                  </div>
                )}
                {debug.errorMessage && (
                  <div>
                    <span className="font-semibold text-slate-700">Error:</span>
                    <pre className="mt-0.5 break-all whitespace-pre-wrap rounded bg-white/80 p-2 text-red-700">
                      {debug.errorMessage}
                    </pre>
                  </div>
                )}
                <div>
                  <span className="font-semibold text-slate-700">Response snippet:</span>
                  <pre className="mt-0.5 max-h-40 overflow-auto break-all whitespace-pre-wrap rounded bg-white/80 p-2">
                    {debug.responseBodySnippet || "(empty)"}
                  </pre>
                </div>
              </div>
            )}
            {debugOpen && !debug && error && (
              <div className="border-t border-slate-300 p-3 text-slate-600">
                No debug info (request may have failed before response).
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="mt-6 flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="mt-6 flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-5">
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

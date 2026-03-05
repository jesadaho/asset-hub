"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Heart, MoreVertical, Home, Clock, ChevronDown, ChevronUp, Bug } from "lucide-react";
import type { DDPropertyItem } from "@/lib/ddproperty-api";
import type { DDPropertySearchDebug } from "@/app/api/ddproperty/search/route";

const PRIMARY = "#068e7b";

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function formatTimeAgo(isoDate: string | null): string | null {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffMins < 1) return "เมื่อสักครู่";
  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
  if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
  return null;
}

function formatListedDate(isoDate: string | null): string | null {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  const d = date.getDate();
  const m = THAI_MONTHS[date.getMonth()];
  const y = date.getFullYear() + 543;
  return `${d} ${m} ${y}`;
}

function PropertyCard({ item }: { item: DDPropertyItem }) {
  const timeAgo = formatTimeAgo(item.listedAt);
  const listedDateStr = formatListedDate(item.listedAt);
  const priceText =
    item.price > 0
      ? `฿${item.price.toLocaleString()}`
      : item.priceDisplay || "฿—";
  const hasBedsBaths =
    (item.bedrooms != null && Number(item.bedrooms) > 0) ||
    (item.bathrooms != null && Number(item.bathrooms) > 0);
  const detailPath = `/listings/dd/${encodeURIComponent(item.id)}`;
  const saveAndGo = () => {
    try {
      sessionStorage.setItem(`asset-hub-ddlisting-${item.id}`, JSON.stringify(item));
    } catch {
      // ignore
    }
  };

  return (
    <Link
      href={detailPath}
      onClick={saveAndGo}
      className="group flex min-w-[280px] max-w-[320px] flex-shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md sm:min-w-0"
    >
      <div className="relative h-40 max-h-[180px] shrink-0 overflow-hidden bg-slate-200">
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
        {timeAgo && (
          <div
            className="absolute left-2 top-2 flex items-center gap-1.5 rounded-md bg-white/95 px-2 py-1 text-xs font-medium text-slate-700 shadow"
            aria-label={`ประกาศใหม่ ${timeAgo}`}
          >
            <Clock className="h-3.5 w-3.5" aria-hidden />
            <span>Newly Listed</span>
            <span className="text-slate-500">{timeAgo}</span>
          </div>
        )}
        {!timeAgo && (
          <div className="absolute left-2 top-2 rounded-md bg-white/95 px-2 py-1 text-xs font-medium text-slate-700 shadow">
            Newly Listed
          </div>
        )}
      </div>
      <div className="flex flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-lg font-bold text-slate-900" style={{ color: PRIMARY }}>
            {priceText}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="เพิ่มรายการโปรด"
              onClick={(e) => e.stopPropagation()}
            >
              <Heart className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="ตัวเลือกเพิ่มเติม"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0 text-sm text-slate-600">
          {hasBedsBaths && item.bedrooms != null && Number(item.bedrooms) >= 0 && (
            <span>{String(item.bedrooms)} เตียง</span>
          )}
          {hasBedsBaths && item.bathrooms != null && Number(item.bathrooms) >= 0 && (
            <span>{String(item.bathrooms)} ห้องน้ำ</span>
          )}
          {item.areaSqm != null && (
            <span>{String(item.areaSqm)} ตร.ม.</span>
          )}
          {item.propertyType && (
            <span>{item.propertyType}</span>
          )}
        </div>
        <p className="mt-2 line-clamp-2 text-sm font-medium text-slate-900">
          {item.title}
        </p>
        {item.location && (
          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
            {item.location}
          </p>
        )}
        {listedDateStr && (
          <p className="mt-1.5 text-xs text-slate-400">
            ลงประกาศเมื่อ {listedDateStr}
          </p>
        )}
      </div>
    </Link>
  );
}

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

const DD_API_PARAM_KEYS = [
  "property_type",
  "listing_type",
  "location",
  "min_price",
  "max_price",
  "bedrooms",
  "residential_property_type",
] as const;

export function NewToMarketSection() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<DDPropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<DDPropertySearchDebug | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);

  const apiQueryString = useCallback(() => {
    const params = new URLSearchParams();
    DD_API_PARAM_KEYS.forEach((key) => {
      const value = searchParams.get(key);
      if (value != null && value !== "") params.set(key, value);
    });
    params.set("debug", "1");
    return params.toString();
  }, [searchParams]);

  const fetchItems = useCallback(async () => {
    const qs = apiQueryString();
    const url = `/api/ddproperty/search?${qs}`;
    setLoading(true);
    setError(null);
    setDebug(null);
    try {
      const res = await fetch(url);
      const text = await res.text();
      let data: { message?: string; items?: DDPropertyItem[]; debug?: DDPropertySearchDebug } = {};
      try {
        data = JSON.parse(text);
      } catch {
        setDebug({
          requestedUrl: url,
          statusCode: res.status,
          responseBodySnippet: text.slice(0, 500),
          errorMessage: "Response is not JSON (e.g. 502 HTML from gateway)",
        });
        throw new Error(`API error ${res.status}: ${res.statusText}`);
      }
      if (data.debug) setDebug(data.debug);
      if (!res.ok) {
        throw new Error(data.message || `Failed to load (${res.status})`);
      }
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [apiQueryString]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <section className="border-b border-slate-200 bg-slate-50 px-4 py-10 sm:px-6 lg:px-8" aria-labelledby="new-to-market-title">
      <div className="mx-auto max-w-7xl">
        <h2 id="new-to-market-title" className="text-xl font-bold text-slate-900 sm:text-2xl">
          Explore Homes Near You
        </h2>
        <div className="mt-4 border-b border-slate-200">
          <button
            type="button"
            className="border-b-2 pb-3 pr-6 text-sm font-medium transition"
            style={{ borderColor: PRIMARY, color: PRIMARY }}
            aria-current="true"
          >
            New to Market
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <p className="font-medium">{error}</p>
            <button
              type="button"
              onClick={fetchItems}
              className="mt-2 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              ลองอีกครั้ง
            </button>
          </div>
        )}

        {/* Debug view */}
        {(debug || error) && (
          <div className="mt-4 rounded-lg border border-slate-300 bg-slate-100 font-mono text-xs">
            <button
              type="button"
              onClick={() => setDebugOpen((o) => !o)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-700 hover:bg-slate-200"
            >
              <Bug className="h-4 w-4" aria-hidden />
              <span className="font-semibold">Debug view</span>
              {debugOpen ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
            </button>
            {debugOpen && debug && (
              <div className="border-t border-slate-300 p-3 space-y-2 text-slate-600">
                <div>
                  <span className="font-semibold text-slate-700">Request URL:</span>
                  <pre className="mt-0.5 break-all whitespace-pre-wrap bg-white/80 p-2 rounded">
                    {debug.requestedUrl}
                  </pre>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Status:</span>{" "}
                  {debug.statusCode || "(network error)"}
                </div>
                {debug.errorMessage && (
                  <div>
                    <span className="font-semibold text-slate-700">Error:</span>
                    <pre className="mt-0.5 break-all whitespace-pre-wrap bg-white/80 p-2 rounded text-red-700">
                      {debug.errorMessage}
                    </pre>
                  </div>
                )}
                <div>
                  <span className="font-semibold text-slate-700">Response snippet:</span>
                  <pre className="mt-0.5 max-h-40 overflow-auto break-all whitespace-pre-wrap bg-white/80 p-2 rounded">
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
          <div className="mt-6 flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="mt-6 flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
            {items.map((item) => (
              <PropertyCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <p className="mt-6 text-sm text-slate-500">
            ไม่มีรายการจาก DDproperty ตามเงื่อนไขนี้ในขณะนี้ (เชื่อมต่อ API ได้แล้ว)
          </p>
        )}
      </div>
    </section>
  );
}

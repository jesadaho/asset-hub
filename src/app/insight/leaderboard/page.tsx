"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { Header } from "@/components/Header";

const PRIMARY = "#068e7b";
const MAX_COMPARE = 8;

const yieldPillClasses = {
  high: "bg-green-100 text-green-800 font-semibold",
  good: "bg-amber-100 text-amber-800 font-semibold",
  avg: "bg-orange-100 text-orange-800",
  low: "bg-red-100 text-red-800",
} as const;

function getYieldLevel(y: number): keyof typeof yieldPillClasses {
  if (y >= 7) return "high";
  if (y >= 6) return "good";
  if (y >= 4.5) return "avg";
  return "low";
}

function rankBadge(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return String(rank);
}

type LeaderboardItem = {
  id: string;
  slug: string;
  title?: string;
  projectName?: string;
  developer?: string;
  location?: string;
  yieldPercent?: number;
  occupancyRatePercent?: number;
  priceMin?: number;
  priceMax?: number;
  avgRentPrice?: number;
  metaImage?: string;
  rank: number;
};

export default function LeaderboardPage() {
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState("");
  const [compareSlugs, setCompareSlugs] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/insights/filters")
      .then((res) => (res.ok ? res.json() : { locations: [] }))
      .then((data: { locations?: string[] }) => {
        setLocations(data.locations ?? []);
      })
      .catch(() => setLocations([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (locationFilter.trim()) params.set("location", locationFilter.trim());
    fetch(`/api/insights/leaderboard?${params}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: LeaderboardItem[]) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [locationFilter]);

  const addToCompare = useCallback((slug: string) => {
    setCompareSlugs((prev) => {
      if (prev.includes(slug) || prev.length >= MAX_COMPARE) return prev;
      return [...prev, slug];
    });
  }, []);

  const removeFromCompare = useCallback((slug: string) => {
    setCompareSlugs((prev) => prev.filter((s) => s !== slug));
  }, []);

  const compareHref =
    compareSlugs.length > 0
      ? `/insight/compare?p=${compareSlugs.join(",")}`
      : "/insight/compare";

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main
        className={`mx-auto max-w-7xl px-4 pt-10 pb-6 sm:px-6 sm:pt-12 lg:px-8 ${compareSlugs.length > 0 ? "pb-24" : ""}`}
      >
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          ทำเนียบคอนโดคุ้ม
        </h1>
        <p className="mt-2 text-slate-600">
          สรุปสถิติผลตอบแทนการเช่าและอัตราการเข้าพักจริง อัปเดตล่าสุดปี 2026
        </p>

        {/* Quick filter */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setLocationFilter("")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              locationFilter === ""
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            ทั้งหมด
          </button>
          {locations.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setLocationFilter(loc)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                locationFilter === loc
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {loc}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="mt-8 space-y-3">
          {loading &&
            [1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-nowrap"
              >
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-slate-200" />
                <div className="h-[60px] w-[60px] shrink-0 animate-pulse rounded-lg bg-slate-200" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                </div>
                <div className="flex shrink-0 gap-3">
                  <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
                  <div className="h-7 w-12 animate-pulse rounded-full bg-slate-200" />
                </div>
              </div>
            ))}
          {!loading && items.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-600">
              ไม่พบโครงการในทำเนียบ
            </div>
          )}
          {!loading &&
            items.map((item) => {
              const inCompare = compareSlugs.includes(item.slug);
              const canAdd = compareSlugs.length < MAX_COMPARE;
              const name =
                item.projectName?.trim() || item.title?.trim() || item.slug;
              const priceLabel =
                typeof item.priceMin === "number" && typeof item.priceMax === "number"
                  ? `เริ่ม ${(item.priceMin / 1_000_000).toFixed(2)} ลบ.`
                  : typeof item.priceMin === "number"
                    ? `เริ่ม ${(item.priceMin / 1_000_000).toFixed(2)} ลบ.`
                    : typeof item.priceMax === "number"
                      ? `ถึง ${(item.priceMax / 1_000_000).toFixed(2)} ลบ.`
                      : null;
              return (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:flex-nowrap"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg font-bold text-slate-700"
                    aria-label={`อันดับ ${item.rank}`}
                  >
                    {rankBadge(item.rank)}
                  </span>
                  <div className="h-[60px] w-[60px] shrink-0 overflow-hidden rounded-lg bg-slate-200">
                    {item.metaImage ? (
                      <img
                        src={item.metaImage}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                        ไม่มีรูป
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/insight/${item.slug}`}
                      className="font-semibold text-slate-900 hover:underline"
                    >
                      {name}
                    </Link>
                    {item.location && (
                      <p className="mt-0.5 text-sm text-slate-500">
                        {item.location}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-3 sm:gap-4">
                    {typeof item.occupancyRatePercent === "number" && (
                      <span className="text-sm text-slate-600">
                        คนเช่า {item.occupancyRatePercent}%
                      </span>
                    )}
                    {priceLabel && (
                      <span className="text-sm text-slate-600">{priceLabel}</span>
                    )}
                    {typeof item.avgRentPrice === "number" && (
                      <span className="text-sm text-slate-600">
                        เช่าเฉลี่ย {item.avgRentPrice.toLocaleString()} บาท
                      </span>
                    )}
                    {typeof item.yieldPercent === "number" && (
                      <span
                        title="อัตราผลตอบแทนจากการเช่า (Rental Yield) — ยิ่งสูงยิ่งคุ้มค่า"
                        className={`inline-flex items-center rounded-full px-3 py-1 text-sm ${yieldPillClasses[getYieldLevel(item.yieldPercent)]}`}
                      >
                        {item.yieldPercent}%
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => addToCompare(item.slug)}
                      disabled={inCompare || !canAdd}
                      className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        inCompare
                          ? "border-transparent bg-slate-100 text-slate-500"
                          : "bg-transparent hover:opacity-90"
                      }`}
                      style={
                        inCompare
                          ? undefined
                          : { borderColor: PRIMARY, color: PRIMARY }
                      }
                      title={
                        inCompare
                          ? "เลือกแล้ว"
                          : !canAdd
                            ? `เลือกได้สูงสุด ${MAX_COMPARE} โครงการ`
                            : "เพิ่มเข้าเทียบใน Matrix"
                      }
                    >
                      <Plus className="h-4 w-4" />
                      เทียบ
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </main>

      {/* Floating Compare Bar */}
      {compareSlugs.length > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] sm:px-6"
          role="region"
          aria-label="โครงการที่เลือกสำหรับเปรียบเทียบ"
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="text-sm font-medium text-slate-700">
                {compareSlugs.length} โครงการที่เลือก
              </span>
              <div className="flex flex-wrap gap-1">
                {compareSlugs.map((slug) => {
                  const item = items.find((i) => i.slug === slug);
                  const label =
                    item?.projectName?.trim() ||
                    item?.title ||
                    slug;
                  return (
                    <span
                      key={slug}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                    >
                      {label}
                      <button
                        type="button"
                        onClick={() => removeFromCompare(slug)}
                        className="rounded p-0.5 hover:bg-slate-200"
                        aria-label={`ลบ ${label}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
            <Link
              href={compareHref}
              className="shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
              style={{ backgroundColor: PRIMARY }}
            >
              วิเคราะห์ Matrix
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

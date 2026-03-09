"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, X, ChevronDown } from "lucide-react";
import { Header } from "@/components/Header";

const PRIMARY = "#068e7b";
const MAX_COMPARE = 8;

const RENT_MIN_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "ไม่จำกัด" },
  { value: 5000, label: "5,000 บาทขึ้นไป" },
  { value: 8000, label: "8,000 บาทขึ้นไป" },
  { value: 10000, label: "10,000 บาทขึ้นไป" },
  { value: 15000, label: "15,000 บาทขึ้นไป" },
  { value: 20000, label: "20,000 บาทขึ้นไป" },
];

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
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [districtFilter, setDistrictFilter] = useState("");
  const [rentMin, setRentMin] = useState(8000);
  const [compareSlugs, setCompareSlugs] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/insights/filters")
      .then((res) => (res.ok ? res.json() : { districts: [] }))
      .then((data: { districts?: string[] }) => {
        setDistricts(data.districts ?? []);
      })
      .catch(() => setDistricts([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (districtFilter.trim()) params.set("district", districtFilter.trim());
    if (rentMin > 0) params.set("rentMin", String(rentMin));
    fetch(`/api/insights/leaderboard?${params}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: LeaderboardItem[]) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [districtFilter, rentMin]);

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
        className={`mx-auto max-w-7xl px-4 pt-4 pb-6 sm:px-6 sm:pt-6 lg:px-8 ${compareSlugs.length > 0 ? "pb-24" : ""}`}
      >
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl md:text-3xl">
          ทำเนียบคอนโดผลตอบแทนสูง
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 sm:mt-2 sm:text-base">
          สรุปสถิติผลตอบแทนการเช่าและอัตราการเข้าพักจริง อัปเดตล่าสุดปี 2026
        </p>

        {/* Quick filter: เขต + ค่าเช่าขั้นต่ำ */}
        <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            <button
              type="button"
              onClick={() => setDistrictFilter("")}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition sm:px-4 sm:py-2 ${
                districtFilter === ""
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              ทั้งหมด
            </button>
            {districts.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDistrictFilter(d)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition sm:px-4 sm:py-2 ${
                  districtFilter === d
                    ? "bg-slate-800 text-white"
                    : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:shrink-0">
            <label htmlFor="leaderboard-rent-min" className="shrink-0 text-sm font-medium text-slate-600">
              <span className="hidden sm:inline">ค่าเช่าขั้นต่ำ:</span>
              <span className="sm:hidden">ค่าเช่า:</span>
            </label>
            <div className="relative min-w-0 flex-1 sm:flex-none sm:min-w-[160px]">
              <select
                id="leaderboard-rent-min"
                value={rentMin}
                onChange={(e) => setRentMin(Number(e.target.value))}
                aria-label="ค่าเช่าขั้นต่ำ"
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-9 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 sm:w-auto sm:min-w-[160px]"
              >
                {RENT_MIN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="mt-4 space-y-2 sm:mt-8 sm:space-y-3">
          {loading &&
            [1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-nowrap sm:gap-3 sm:p-4"
              >
                <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-slate-200 sm:h-10 sm:w-10" />
                <div className="h-12 w-12 shrink-0 animate-pulse rounded-lg bg-slate-200 sm:h-[60px] sm:w-[60px]" />
                <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                </div>
                <div className="flex w-full shrink-0 gap-2 sm:w-auto sm:gap-3">
                  <div className="h-4 flex-1 animate-pulse rounded bg-slate-100 sm:flex-none sm:w-16" />
                  <div className="h-4 w-14 animate-pulse rounded bg-slate-100 sm:w-20" />
                  <div className="h-7 w-9 animate-pulse rounded-full bg-slate-200 sm:w-12" />
                </div>
              </div>
            ))}
          {!loading && items.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 sm:p-10 sm:text-base">
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
                  className="flex flex-wrap items-start gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md sm:flex-nowrap sm:items-center sm:gap-3 sm:p-4"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-base font-bold text-slate-700 sm:h-10 sm:w-10 sm:text-lg"
                    aria-label={`อันดับ ${item.rank}`}
                  >
                    {rankBadge(item.rank)}
                  </span>
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-200 sm:h-[60px] sm:w-[60px]">
                    {item.metaImage ? (
                      <img
                        src={item.metaImage}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400 sm:text-xs">
                        ไม่มีรูป
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 sm:min-w-[0]">
                    <Link
                      href={`/insight/${item.slug}`}
                      className="line-clamp-2 font-semibold text-slate-900 hover:underline sm:line-clamp-1"
                    >
                      {name}
                    </Link>
                    {item.location && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 sm:text-sm">
                        {item.location}
                      </p>
                    )}
                  </div>
                  <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap sm:justify-start sm:gap-3 md:gap-4">
                    {typeof item.occupancyRatePercent === "number" && (
                      <span className="text-xs text-slate-600 sm:text-sm">
                        คนเช่า {item.occupancyRatePercent}%
                      </span>
                    )}
                    {priceLabel && (
                      <span className="text-xs text-slate-600 sm:text-sm">{priceLabel}</span>
                    )}
                    {typeof item.avgRentPrice === "number" && (
                      <span className="text-xs text-slate-600 sm:text-sm">
                        เช่า {item.avgRentPrice.toLocaleString()}
                      </span>
                    )}
                    {typeof item.yieldPercent === "number" && (
                      <span
                        className={`group/yield relative inline-flex shrink-0 cursor-help items-center rounded-full px-2.5 py-0.5 text-xs sm:px-3 sm:py-1 sm:text-sm ${yieldPillClasses[getYieldLevel(item.yieldPercent)]}`}
                        title="อัตราผลตอบแทนจากการเช่า (Rental Yield) — ยิ่งสูงยิ่งคุ้มค่า"
                      >
                        {item.yieldPercent}%
                        <span
                          role="tooltip"
                          className="pointer-events-none absolute bottom-full left-1/2 z-[100] mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/yield:opacity-100"
                        >
                          อัตราผลตอบแทนจากการเช่า (Rental Yield) — ยิ่งสูงยิ่งคุ้มค่า
                        </span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => addToCompare(item.slug)}
                      disabled={inCompare || !canAdd}
                      aria-label={
                        inCompare
                          ? "เลือกแล้ว"
                          : !canAdd
                            ? `เลือกได้สูงสุด ${MAX_COMPARE} โครงการ`
                            : "เพิ่มเข้าเทียบในตารางเปรียบเทียบ"
                      }
                      className={`inline-flex shrink-0 items-center justify-center rounded-lg border p-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 sm:gap-1 sm:px-3 sm:py-1.5 ${
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
                            : "เพิ่มเข้าเทียบในตารางเปรียบเทียบ"
                      }
                    >
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">เทียบ</span>
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
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white px-3 py-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] sm:px-6 sm:py-3"
          role="region"
          aria-label="โครงการที่เลือกสำหรับเปรียบเทียบ"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
              <span className="shrink-0 text-xs font-medium text-slate-700 sm:text-sm">
                {compareSlugs.length} โครงการที่เลือก
              </span>
              <div className="flex gap-1 overflow-x-auto pb-0.5 sm:flex-wrap sm:overflow-visible">
                {compareSlugs.map((slug) => {
                  const item = items.find((i) => i.slug === slug);
                  const label =
                    item?.projectName?.trim() ||
                    item?.title ||
                    slug;
                  return (
                    <span
                      key={slug}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                    >
                      <span className="max-w-[120px] truncate sm:max-w-none">{label}</span>
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
              className="shrink-0 rounded-lg px-4 py-2.5 text-center text-sm font-medium text-white transition hover:opacity-90"
              style={{ backgroundColor: PRIMARY }}
            >
              วิเคราะห์ตารางเปรียบเทียบ
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

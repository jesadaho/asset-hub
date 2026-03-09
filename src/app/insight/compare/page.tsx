"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Header } from "@/components/Header";

const PRIMARY = "#068e7b";
const MAX_PROJECTS = 8;

const yieldClasses = {
  high: "text-green-500 font-bold",
  good: "text-yellow-500 font-semibold",
  avg: "text-orange-400",
  low: "text-red-500",
} as const;

function getYieldLevel(y: number): keyof typeof yieldClasses {
  if (y >= 7) return "high";
  if (y >= 6) return "good";
  if (y >= 4.5) return "avg";
  return "low";
}

type CompareProject = {
  id: string;
  slug: string;
  projectName?: string;
  title?: string;
  developer?: string;
  location?: string;
  yieldPercent?: number;
  capitalGainPercent?: number;
  pricePerSqm?: number;
  priceMin?: number;
  priceMax?: number;
  avgRentPrice?: number;
};

type InsightListItem = {
  id: string;
  slug: string;
  title?: string;
  projectName?: string;
  developer?: string;
  location?: string;
};

function parseSlugsFromUrl(searchParams: URLSearchParams): string[] {
  const p = searchParams.get("p");
  if (!p?.trim()) return [];
  return p
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_PROJECTS);
}

const DEFAULT_PROJECT_COUNT = 4;

function InsightCompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(() =>
    parseSlugsFromUrl(searchParams)
  );
  const [projects, setProjects] = useState<CompareProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<InsightListItem[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const defaultLoadedRef = useRef(false);

  // When no slugs in URL: load default 4 projects (top by yield)
  useEffect(() => {
    if (selectedSlugs.length > 0 || defaultLoadedRef.current) return;
    defaultLoadedRef.current = true;
    setLoading(true);
    fetch(`/api/insights/compare?default=${DEFAULT_PROJECT_COUNT}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed"))))
      .then((data: CompareProject[]) => {
        if (data.length > 0) {
          const slugs = data.map((p) => p.slug);
          setSelectedSlugs(slugs);
          setProjects(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedSlugs.length]);

  // Sync URL when selectedSlugs change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedSlugs.length > 0) {
      params.set("p", selectedSlugs.join(","));
    } else {
      params.delete("p");
    }
    const qs = params.toString();
    const newUrl = qs ? `/insight/compare?${qs}` : "/insight/compare";
    router.replace(newUrl, { scroll: false });
  }, [selectedSlugs, router, searchParams]);

  // Fetch compare data when selectedSlugs change (skip if we already have matching projects)
  useEffect(() => {
    if (selectedSlugs.length === 0) {
      setProjects([]);
      return;
    }
    const hasAll =
      projects.length === selectedSlugs.length &&
      selectedSlugs.every((s) => projects.some((p) => p.slug === s));
    if (hasAll) return;

    setLoading(true);
    const slugsParam = selectedSlugs.join(",");
    fetch(`/api/insights/compare?slugs=${encodeURIComponent(slugsParam)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed"))))
      .then((data: CompareProject[]) => {
        setProjects(data);
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [selectedSlugs, projects]);

  // Search: debounce and fetch
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    const q = searchInput.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    searchDebounceRef.current = setTimeout(() => {
      const params = new URLSearchParams({ q, limit: "10" });
      fetch(`/api/insights?${params}`)
        .then((res) => (res.ok ? res.json() : { posts: [] }))
        .then((data: { posts?: InsightListItem[] }) => {
          setSearchResults(data.posts ?? []);
        })
        .catch(() => setSearchResults([]));
      searchDebounceRef.current = null;
    }, 250);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchInput]);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const addProject = useCallback((slug: string) => {
    setSelectedSlugs((prev) => {
      if (prev.includes(slug) || prev.length >= MAX_PROJECTS) return prev;
      return [...prev, slug];
    });
    setSearchInput("");
    setSearchResults([]);
    setSearchOpen(false);
  }, []);

  const removeProject = useCallback((slug: string) => {
    setSelectedSlugs((prev) => prev.filter((s) => s !== slug));
  }, []);

  const projectBySlug = projects.reduce(
    (acc, p) => {
      acc[p.slug] = p;
      return acc;
    },
    {} as Record<string, CompareProject>
  );

  const displayProjects = selectedSlugs
    .map((slug) => projectBySlug[slug])
    .filter(Boolean) as CompareProject[];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto max-w-7xl px-4 pt-10 pb-6 sm:px-6 sm:pt-12 lg:px-8">
        {/* Title and tab bar on same row */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="min-w-0 flex-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            ตารางเปรียบเทียบความคุ้มค่า
          </h1>
          <div
            className="flex shrink-0 rounded-lg border border-slate-200 bg-slate-100/60 p-1 sm:min-w-[280px]"
            role="tablist"
            aria-label="เลือกมุมมอง Insight"
          >
            <Link
              href="/insight"
              role="tab"
              aria-selected="false"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white/80 hover:text-slate-800"
            >
              <span aria-hidden>📑</span>
              บทความ
            </Link>
            <span
              role="tab"
              aria-selected="true"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm"
            >
              <span aria-hidden>📊</span>
              Matrix
            </span>
          </div>
        </div>
        <p className="mb-6 mt-3 text-slate-600 sm:mt-4">
          เลือกโครงการเพื่อเปรียบเทียบ Yield ราคาต่อ ตรม ราคา และค่าเช่า (สูงสุด {MAX_PROJECTS} โครงการ)
        </p>

        {/* Search + Add */}
        <div ref={searchContainerRef} className="relative mb-6 max-w-md">
          <label htmlFor="compare-search" className="sr-only">
            ค้นหาโครงการเพื่อเปรียบเทียบ
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            id="compare-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            placeholder="ค้นหาชื่อโครงการเพื่อเปรียบเทียบ..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 sm:text-sm"
            aria-label="ค้นหาโครงการ"
          />
          {searchOpen && searchResults.length > 0 && (
            <ul
              className="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
              role="listbox"
            >
              {searchResults.map((item) => {
                const slug = item.slug ?? "";
                const name =
                  item.title?.trim() ||
                  item.projectName?.trim() ||
                  "รีวิว";
                const alreadySelected = selectedSlugs.includes(slug);
                const disabled =
                  alreadySelected || selectedSlugs.length >= MAX_PROJECTS;
                return (
                  <li key={item.id} role="option">
                    <button
                      type="button"
                      onClick={() => !disabled && addProject(slug)}
                      disabled={disabled}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {name}
                      {alreadySelected && (
                        <span className="ml-2 text-slate-400">(เลือกแล้ว)</span>
                      )}
                      {!alreadySelected &&
                        selectedSlugs.length >= MAX_PROJECTS && (
                          <span className="ml-2 text-slate-400">
                            (เต็มแล้ว)
                          </span>
                        )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Selected chips */}
        {selectedSlugs.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {selectedSlugs.map((slug) => {
              const proj = projectBySlug[slug];
              const label =
                proj?.projectName?.trim() ||
                proj?.title?.trim() ||
                slug;
              return (
                <span
                  key={slug}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800"
                >
                  {label}
                  <button
                    type="button"
                    onClick={() => removeProject(slug)}
                    className="rounded p-0.5 hover:bg-slate-200"
                    aria-label={`ลบ ${label}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Compare table */}
        {selectedSlugs.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-600">
              ค้นหาและเลือกโครงการด้านบนเพื่อเริ่มเปรียบเทียบ
            </p>
          </div>
        )}

        {selectedSlugs.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
              </div>
            ) : (
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      โครงการ
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      นักพัฒนา
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      ทำเล
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Yield (%)
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      ราคาต่อ ตรม (บาท)
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      ราคา (บาท)
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      ค่าเช่า (บาท)
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Capital Gain (%)
                    </th>
                    <th className="w-12 px-2 py-3" aria-label="ลบ" />
                  </tr>
                </thead>
                <tbody>
                  {displayProjects.map((p) => (
                    <tr
                      key={p.slug}
                      className="border-b border-slate-100 hover:bg-slate-50/50"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">
                        <Link
                          href={`/insight/${p.slug}`}
                          className="hover:underline"
                        >
                          {p.projectName?.trim() || p.title?.trim() || p.slug}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {p.developer?.trim() ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {p.location?.trim() ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {typeof p.yieldPercent === "number" ? (
                          <span
                            className={
                              yieldClasses[getYieldLevel(p.yieldPercent)]
                            }
                          >
                            {p.yieldPercent}%
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-800">
                        {typeof p.pricePerSqm === "number"
                          ? p.pricePerSqm.toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-800">
                        {typeof p.priceMin === "number" &&
                        typeof p.priceMax === "number"
                          ? `${p.priceMin.toLocaleString()} – ${p.priceMax.toLocaleString()}`
                          : typeof p.priceMin === "number"
                            ? `${p.priceMin.toLocaleString()}+`
                            : typeof p.priceMax === "number"
                              ? `ถึง ${p.priceMax.toLocaleString()}`
                              : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-800">
                        {typeof p.avgRentPrice === "number"
                          ? p.avgRentPrice.toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-800">
                        {typeof p.capitalGainPercent === "number"
                          ? `${p.capitalGainPercent}%`
                          : "—"}
                      </td>
                      <td className="px-2 py-3">
                        <button
                          type="button"
                          onClick={() => removeProject(p.slug)}
                          className="rounded p-1.5 hover:bg-slate-200"
                          aria-label={`ลบ ${p.projectName || p.slug}`}
                        >
                          <X className="h-4 w-4 text-slate-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {displayProjects.length > 0 && !loading && (
          <p className="mt-4 text-sm text-slate-500">
            คลิกชื่อโครงการเพื่อไปหน้ารายละเอียด:{" "}
            {displayProjects.map((p, i) => (
              <span key={p.slug}>
                {i > 0 && ", "}
                <Link
                  href={`/insight/${p.slug}`}
                  className="underline hover:no-underline"
                >
                  {p.projectName?.trim() || p.title || p.slug}
                </Link>
              </span>
            ))}
          </p>
        )}
      </main>
    </div>
  );
}

export default function InsightComparePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50">
          <Header />
          <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
            </div>
          </main>
        </div>
      }
    >
      <InsightCompareContent />
    </Suspense>
  );
}

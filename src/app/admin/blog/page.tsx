"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, ChevronUp, ChevronDown } from "lucide-react";

type Post = {
  id: string;
  title: string;
  slug: string;
  status: string;
  type?: string;
  updatedAt: string;
  viewCount?: number;
};

function useOnClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  handler: () => void
) {
  useEffect(() => {
    const listener = (e: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

const PER_PAGE = 20;

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [developer, setDeveloper] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [developers, setDevelopers] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"updatedAt" | "viewCount" | "title">("updatedAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);
  const createDropdownRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(createDropdownRef, () => setCreateDropdownOpen(false));

  useEffect(() => {
    fetch("/api/admin/blog/filters", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { locations: [], developers: [] }))
      .then((data: { locations?: string[]; developers?: string[] }) => {
        setLocations(data.locations ?? []);
        setDevelopers(data.developers ?? []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setError(null);
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PER_PAGE), sortBy, order });
    if (query) params.set("q", query);
    if (location) params.set("location", location);
    if (developer) params.set("developer", developer);
    fetch(`/api/admin/blog?${params.toString()}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data: { posts: Post[]; totalPages: number; totalCount: number }) => {
        setPosts(data.posts ?? []);
        setTotalPages(Math.max(1, data.totalPages ?? 1));
        setTotalCount(data.totalCount ?? 0);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [page, query, location, developer, sortBy, order]);

  function handleSort(column: "title" | "viewCount" | "updatedAt") {
    const defaultOrder: Record<typeof column, "asc" | "desc"> = {
      title: "asc",
      viewCount: "desc",
      updatedAt: "desc",
    };
    if (sortBy === column) {
      setOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setOrder(defaultOrder[column]);
    }
    setPage(1);
  }

  async function handleDelete(id: string) {
    if (!confirm("ลบบทความนี้?")) return;
    const res = await fetch(`/api/admin/blog/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) return;
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Blog</h1>
        <div className="relative" ref={createDropdownRef}>
          <button
            type="button"
            onClick={() => setCreateDropdownOpen((o) => !o)}
            className="rounded-lg bg-[#068e7b] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            สร้างบทความ
          </button>
          {createDropdownOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 min-w-[180px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              <Link
                href="/admin/blog/new/project-review"
                className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setCreateDropdownOpen(false)}
              >
                Project Review
              </Link>
              <Link
                href="/admin/blog/new"
                className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setCreateDropdownOpen(false)}
              >
                บทความทั่วไป
              </Link>
            </div>
          )}
        </div>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="relative max-w-md flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="ค้นหาชื่อเรื่อง, slug, ชื่อโครงการ..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            aria-label="ค้นหาบทความ"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="admin-blog-location" className="text-sm text-slate-600">
              ทำเล
            </label>
            <div className="relative">
              <select
                id="admin-blog-location"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setPage(1);
                }}
                className="min-w-[140px] appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-9 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              >
                <option value="">ทั้งหมด</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="admin-blog-developer" className="text-sm text-slate-600">
              นักพัฒนา
            </label>
            <div className="relative">
              <select
                id="admin-blog-developer"
                value={developer}
                onChange={(e) => {
                  setDeveloper(e.target.value);
                  setPage(1);
                }}
                className="min-w-[140px] appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-9 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              >
                <option value="">ทั้งหมด</option>
                {developers.map((dev) => (
                  <option key={dev} value={dev}>
                    {dev}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
            </div>
          </div>
        </div>
      </div>
      {loading && <p className="text-slate-500">กำลังโหลด...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleSort("title")}
                      className="flex items-center gap-1 rounded hover:bg-slate-100 hover:text-slate-700"
                    >
                      ชื่อเรื่อง
                      {sortBy === "title" && (order === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    ประเภท
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Slug
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    สถานะ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleSort("viewCount")}
                      className="flex items-center gap-1 rounded hover:bg-slate-100 hover:text-slate-700"
                    >
                      จำนวนวิว
                      {sortBy === "viewCount" && (order === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleSort("updatedAt")}
                      className="flex items-center gap-1 rounded hover:bg-slate-100 hover:text-slate-700"
                    >
                      อัปเดต
                      {sortBy === "updatedAt" && (order === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                      {query ? "ไม่พบบทความที่ตรงกับคำค้น" : "ยังไม่มีบทความ"}
                    </td>
                  </tr>
                ) : (
                posts.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {p.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {p.type === "project_review" ? "Project Review" : "บทความทั่วไป"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {p.slug}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline rounded px-2 py-0.5 text-xs ${
                          p.status === "published"
                            ? "bg-green-100 text-green-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                      {typeof p.viewCount === "number" ? p.viewCount.toLocaleString() : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                      {p.updatedAt
                        ? new Date(p.updatedAt).toLocaleString("th-TH")
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <Link
                        href={
                          p.type === "project_review"
                            ? `/admin/blog/${p.id}/edit/project-review`
                            : `/admin/blog/${p.id}/edit`
                        }
                        className="font-medium text-[#068e7b] hover:underline"
                      >
                        แก้ไข
                      </Link>
                      {" · "}
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="font-medium text-red-600 hover:underline"
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))
                )
                }
              </tbody>
            </table>
            </div>
            {totalPages > 1 && (
              <nav
                className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 px-4 py-3"
                aria-label="เลื่อนหน้า"
              >
                <p className="text-sm text-slate-600">
                  แสดง {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, totalCount)} จาก {totalCount} รายการ
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
                  >
                    ก่อนหน้า
                  </button>
                  <span className="px-2 text-sm text-slate-600">
                    หน้า {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
                  >
                    ถัดไป
                  </button>
                </div>
              </nav>
            )}
          </div>
        )}
    </main>
  );
}

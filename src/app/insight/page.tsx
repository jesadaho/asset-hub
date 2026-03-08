"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Header } from "@/components/Header";

const PRIMARY = "#068e7b";

type InsightItem = {
  id: string;
  slug: string;
  title: string;
  projectName?: string;
  metaDescription?: string;
  metaImage?: string;
  location?: string;
  yearBuilt?: number | string;
  yieldPercent?: number;
  updatedAt?: string;
};

function InsightCardRow({ item }: { item: InsightItem }) {
  const headline = item.title?.trim() || item.projectName?.trim() || "รีวิว";
  const hasSlug = Boolean(item.slug?.trim());
  const href = `/insight/${item.slug}`;

  const cardContent = (
    <>
      <div className="w-[38%] shrink-0 overflow-hidden bg-slate-200 aspect-square sm:aspect-auto sm:h-40 sm:w-56">
        {item.metaImage ? (
          <img
            src={item.metaImage}
            alt=""
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <span className="text-xs">ไม่มีรูป</span>
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center py-3 pr-3 pl-3 sm:p-4">
        <p className="text-xs text-slate-500 sm:hidden">รีวิวโครงการ</p>
        <p className="mt-0.5 font-semibold text-slate-900 line-clamp-2 group-hover:underline sm:mt-0 sm:line-clamp-2">
          {headline}
        </p>
        <span
          className="mt-2 inline-block text-sm font-medium"
          style={{ color: PRIMARY }}
        >
          อ่านต่อ →
        </span>
      </div>
    </>
  );

  const className =
    "group flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md";

  if (hasSlug) {
    return <Link href={href} className={className}>{cardContent}</Link>;
  }
  return <div className={className}>{cardContent}</div>;
}

const PER_PAGE = 10;

export default function InsightPage() {
  const [posts, setPosts] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");

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
    const params = new URLSearchParams({ page: String(page), limit: String(PER_PAGE) });
    if (query) params.set("q", query);
    fetch(`/api/insights?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data: { posts: InsightItem[]; totalPages: number; totalCount: number }) => {
        setPosts(data.posts ?? []);
        setTotalPages(Math.max(1, data.totalPages ?? 1));
        setTotalCount(data.totalCount ?? 0);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด"))
      .finally(() => setLoading(false));
  }, [page, query]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page, query]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            รีวิวบ้านและคอนโดทั่วประเทศ
          </h1>
          <p className="mt-2 text-slate-600">
            รีวิวบ้านและคอนโดทั่วประเทศ เจาะลึกด้วยข้อมูลสถิติการลงทุน Rental Yield จริงจากหน้างาน และวิเคราะห์สภาพคล่องรายโครงการ เพื่อเป็นเครื่องมือสำคัญในการตัดสินใจลงทุนของคุณ
          </p>
          <div className="relative mt-4 max-w-md">
            <label htmlFor="insight-search" className="sr-only">
              ค้นหารีวิว
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              id="insight-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ค้นหาชื่อโครงการ, ผู้พัฒนา, ทำเล..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 sm:text-sm"
              aria-label="ค้นหารีวิว"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="h-40 w-[38%] shrink-0 animate-pulse bg-slate-200 sm:w-56" />
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-4">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
                    <div className="mt-2 h-4 w-20 animate-pulse rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
            <aside className="lg:col-span-1">
              <div className="rounded-xl border border-slate-200 bg-slate-100/80 p-5">
                <div className="h-5 w-3/4 animate-pulse rounded bg-slate-300" />
                <div className="mt-2 h-3 w-full animate-pulse rounded bg-slate-200" />
                <div className="mt-1 h-3 w-full animate-pulse rounded bg-slate-200" />
                <div className="mt-4 h-10 w-32 animate-pulse rounded-lg bg-slate-300" />
              </div>
            </aside>
          </div>
        )}

        {!loading && posts.length === 0 && !error && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="font-medium text-slate-700">
              {query ? "ไม่พบรายการที่ตรงกับคำค้น" : "ยังไม่มีรีวิว"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {query
                ? "ลองเปลี่ยนคำค้นหรือลบคำค้นเพื่อดูทั้งหมด"
                : "รีวิวโครงการจะแสดงที่นี่เมื่อมีโพสต์ที่เผยแพร่แล้ว"}
            </p>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {posts.map((item) => (
                <InsightCardRow key={item.id} item={item} />
              ))}
              {totalPages > 1 && (
                <nav
                  className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6"
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
            <aside className="lg:col-span-1">
              <div className="rounded-xl border border-slate-200 bg-slate-100/80 p-5">
                <h2 className="font-semibold text-slate-800">
                  เราอยากได้เรื่องจากคุณ
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  มีประสบการณ์ลงทุนหรือรีวิวโครงการที่อยากแชร์? ส่งเรื่องมาที่ทีมเราได้เลย
                </p>
                <a
                  href="mailto:insight@assethub.in.th"
                  className="mt-4 inline-block rounded-lg px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                  style={{ backgroundColor: PRIMARY }}
                >
                  แชร์เรื่องของคุณ
                </a>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

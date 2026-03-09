"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";

const PRIMARY = "#068e7b";

type BlogListItem = {
  id: string;
  slug: string;
  title: string;
  metaDescription?: string;
  metaImage?: string;
  updatedAt?: string;
};

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/blog?page=${page}&limit=10`)
      .then((res) => (res.ok ? res.json() : { posts: [], totalPages: 1 }))
      .then((data: { posts: BlogListItem[]; totalPages: number }) => {
        setPosts(data.posts ?? []);
        setTotalPages(Math.max(1, data.totalPages ?? 1));
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          บทความ
        </h1>
        <p className="mt-2 text-slate-600">
          บทความและข่าวสารจากทีม AssetHub
        </p>

        {loading && (
          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex overflow-hidden rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="h-24 w-32 shrink-0 animate-pulse rounded-lg bg-slate-200" />
                <div className="ml-4 flex-1 space-y-2">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-600">
            ยังไม่มีบทความ
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="mt-8 space-y-4">
            {posts.map((item) => (
              <Link
                key={item.id}
                href={`/blog/${item.slug}`}
                className="group flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="w-32 shrink-0 overflow-hidden bg-slate-200 sm:w-48 sm:aspect-video sm:h-auto h-28">
                  {item.metaImage ? (
                    <img
                      src={item.metaImage}
                      alt=""
                      className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400 text-xs">
                      ไม่มีรูป
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center p-4">
                  <h2 className="font-semibold text-slate-900 line-clamp-2 group-hover:underline">
                    {item.title || "ไม่มีชื่อเรื่อง"}
                  </h2>
                  {item.metaDescription && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                      {item.metaDescription}
                    </p>
                  )}
                  <span className="mt-2 inline-block text-sm font-medium" style={{ color: PRIMARY }}>
                    อ่านต่อ →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 hover:bg-slate-50"
            >
              ก่อนหน้า
            </button>
            <span className="flex items-center px-4 text-sm text-slate-600">
              หน้า {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 hover:bg-slate-50"
            >
              ถัดไป
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

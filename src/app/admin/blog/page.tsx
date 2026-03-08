"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

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

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);
  const createDropdownRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(createDropdownRef, () => setCreateDropdownOpen(false));

  useEffect(() => {
    fetch("/api/admin/blog", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data: { posts: Post[] }) => setPosts(data.posts ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, []);

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
      {loading && <p className="text-slate-500">กำลังโหลด...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    ชื่อเรื่อง
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
                    จำนวนวิว
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    อัปเดต
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {posts.map((p) => (
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
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

export default function InsightPage() {
  const [posts, setPosts] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/insights?limit=10")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data: { posts: InsightItem[] }) => setPosts(data.posts ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด"))
      .finally(() => setLoading(false));
  }, []);

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
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex min-h-[320px] items-center justify-center">
            <p className="text-slate-500">กำลังโหลด...</p>
          </div>
        )}

        {!loading && posts.length === 0 && !error && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="font-medium text-slate-700">ยังไม่มีรีวิว</p>
            <p className="mt-1 text-sm text-slate-500">
              รีวิวโครงการจะแสดงที่นี่เมื่อมีโพสต์ที่เผยแพร่แล้ว
            </p>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {posts.map((item) => (
                <InsightCardRow key={item.id} item={item} />
              ))}
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

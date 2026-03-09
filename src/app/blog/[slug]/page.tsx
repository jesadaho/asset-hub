"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { Header } from "@/components/Header";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaDescription?: string;
  metaImage?: string;
  updatedAt?: string;
};

export default function BlogSlugPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    fetch(`/api/blog/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setPost)
      .catch(() => setError("ไม่พบบทความ"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-100" />
          <div className="mt-4 h-4 w-3/4 animate-pulse rounded bg-slate-100" />
        </main>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-slate-600">{error ?? "ไม่พบบทความ"}</p>
          <Link href="/blog" className="mt-4 inline-block text-[#068e7b] hover:underline">
            ← กลับไปรายการบทความ
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/blog" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          ← บทความ
        </Link>
        <article className="mt-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {post.title}
          </h1>
          {post.metaImage && (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <img
                src={post.metaImage}
                alt=""
                className="w-full object-cover"
              />
            </div>
          )}
          <div className="prose prose-slate mt-6 max-w-none prose-p:text-slate-700 prose-headings:text-slate-900 [&_img]:rounded-lg">
            <ReactMarkdown remarkPlugins={[remarkBreaks]}>
              {post.content || ""}
            </ReactMarkdown>
          </div>
        </article>
      </main>
    </div>
  );
}

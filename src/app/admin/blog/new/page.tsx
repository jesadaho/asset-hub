"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MarkdownEditor } from "@/components/MarkdownEditor";

export default function AdminBlogNewPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaImage, setMetaImage] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.key ?? data.url)) {
        setMetaImage(data.url ?? data.key ?? "");
      } else {
        setError(data.message ?? "อัปโหลดรูปไม่สำเร็จ");
      }
    } catch {
      setError("อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/admin/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: title.trim(),
        slug: slug.trim() || undefined,
        content: content.trim(),
        metaDescription: metaDescription.trim() || undefined,
        metaImage: metaImage.trim() || undefined,
        status,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.message ?? "เกิดข้อผิดพลาด");
      setSubmitting(false);
      return;
    }
    router.push("/admin/blog");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/admin/blog"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            กลับไปรายการ
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900">สร้างบทความ</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700">
              ชื่อเรื่อง
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            />
          </div>
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-slate-700">
              Slug (เว้นว่างให้สร้างจากชื่อเรื่อง)
            </label>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">รูปภาพ (Meta/OG)</label>
            <p className="mt-0.5 text-xs text-slate-500">ใช้สำหรับแชร์ลิงก์และผลค้นหา</p>
            <input type="file" ref={fileInputRef} accept="image/*" className="sr-only" onChange={handleImageUpload} />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {uploading ? "กำลังอัปโหลด..." : "แนบรูป"}
              </button>
              <input
                type="url"
                value={metaImage}
                onChange={(e) => setMetaImage(e.target.value)}
                placeholder="หรือวาง URL รูป"
                className="min-w-[200px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>
            {metaImage && (
              <div className="mt-2">
                <img
                  src={metaImage}
                  alt=""
                  className="max-h-28 rounded-lg border border-slate-200 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}
          </div>
          <div>
            <label htmlFor="metaDesc" className="block text-sm font-medium text-slate-700">
              คำอธิบายสั้น (SEO)
            </label>
            <textarea
              id="metaDesc"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={2}
              maxLength={320}
              placeholder="ไม่เกิน 160 ตัวอักษรแนะนำ"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </div>
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-slate-700">
              เนื้อหา (Markdown)
            </label>
            <MarkdownEditor
              value={content}
              onChange={setContent}
              placeholder="เขียนเนื้อหาแบบ Markdown..."
              minHeight={320}
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-slate-700">
              สถานะ
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "published")}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#068e7b] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "กำลังบันทึก..." : "สร้างบทความ"}
            </button>
            <Link
              href="/admin/blog"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              ยกเลิก
            </Link>
          </div>
        </form>
    </main>
  );
}

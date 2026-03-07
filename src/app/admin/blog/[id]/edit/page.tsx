"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { ProjectReviewForm } from "@/app/admin/blog/components/ProjectReviewForm";

const PRIMARY = "#068e7b";

export default function AdminBlogEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [postType, setPostType] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaImage, setMetaImage] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<"form" | "preview">("form");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/blog/${id}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data: {
        title: string; slug: string; type?: string;
        metaDescription?: string; metaImage?: string;
        content: string; status: string;
        projectName?: string; imageKeys?: string[];
      }) => {
        const titleStr = typeof data.title === "string" ? data.title : "";
        const isProjectReview =
          data.type === "project_review" ||
          (typeof data.projectName === "string" && data.projectName.trim() !== "") ||
          (Array.isArray(data.imageKeys) && data.imageKeys.length > 0) ||
          /\[รีวิว\]/.test(titleStr);
        setPostType(isProjectReview ? "project_review" : (data.type ?? "article"));
        if (isProjectReview) {
          setLoading(false);
          return;
        }
        setTitle(data.title ?? "");
        setSlug(data.slug ?? "");
        setMetaDescription(data.metaDescription ?? "");
        setMetaImage(data.metaImage ?? "");
        setContent(data.content ?? "");
        setStatus(
          data.status === "published" ? "published" : "draft"
        );
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch(`/api/admin/blog/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: title.trim(),
        slug: slug.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
        metaImage: metaImage.trim() || undefined,
        content: content.trim(),
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

  if (loading) {
    return (
      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-slate-500">กำลังโหลด...</p>
      </main>
    );
  }

  if (postType === "project_review") {
    return <ProjectReviewForm mode="edit" id={id} />;
  }

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center gap-4">
        <Link
          href="/admin/blog"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          กลับไปรายการ
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">แก้ไขบทความ</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-1 rounded-lg bg-slate-200/80 p-1 w-fit">
          <button
            type="button"
            onClick={() => setViewTab("form")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              viewTab === "form"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ฟอร์ม
          </button>
          <button
            type="button"
            onClick={() => setViewTab("preview")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              viewTab === "preview"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Preview
          </button>
        </div>

        {viewTab === "form" && (
          <div className="flex flex-col gap-6">
            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-800">
                ชื่อเรื่อง / Slug
              </h2>
              <div className="space-y-3">
                <input
                  id="title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ชื่อเรื่อง"
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
                <input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="Slug (เว้นว่างให้สร้างจากชื่อเรื่อง)"
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-800">
                Metadata (SEO)
              </h2>
              <label htmlFor="metaDescription" className="mb-1 block text-xs text-slate-500">
                Meta description — ใช้ในผลค้นหาและแชร์ลิงก์ (แนะนำไม่เกิน 160 ตัวอักษร)
              </label>
              <textarea
                id="metaDescription"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="คำอธิบายสั้นๆ สำหรับ SEO..."
                rows={2}
                maxLength={320}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
              {metaDescription.length > 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  {metaDescription.length} ตัวอักษร
                  {metaDescription.length > 160 && " — ยาวเกินไปสำหรับผลค้นหาบางแห่ง"}
                </p>
              )}
              <label htmlFor="metaImage" className="mb-1 mt-3 block text-xs text-slate-500">
                รูปภาพ (Meta/OG) — URL รูปสำหรับแชร์และผลค้นหา
              </label>
              <input
                id="metaImage"
                type="url"
                value={metaImage}
                onChange={(e) => setMetaImage(e.target.value)}
                placeholder="https://..."
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
              {metaImage && (
                <div className="mt-2">
                  <p className="mb-1 text-xs text-slate-500">ตัวอย่าง</p>
                  <img
                    src={metaImage}
                    alt=""
                    className="max-h-32 rounded-lg border border-slate-200 object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-800">
                เนื้อหา (Markdown)
              </h2>
              <MarkdownEditor
                value={content}
                onChange={setContent}
                placeholder="เขียนเนื้อหาแบบ Markdown..."
                minHeight={380}
              />
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-800">
                สถานะ
              </h2>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: PRIMARY }}
              >
                {submitting ? "กำลังบันทึก..." : "บันทึก"}
              </button>
              <Link
                href="/admin/blog"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                ยกเลิก
              </Link>
            </div>
          </div>
        )}

        {viewTab === "preview" && (
          <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-6 max-w-3xl">
            <div className="space-y-4">
              <p className="text-sm font-semibold text-slate-600">AssetHub</p>
              {title && (
                <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
              )}
              {content && (
                <div className="prose prose-sm max-w-none prose-p:text-slate-700 [&_br]:block [&>*]:mb-4 [&>*:last-child]:mb-0 [&_h1]:mt-0 [&_h2]:mt-0 [&_h3]:mt-0">
                  <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                    {content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </main>
  );
}

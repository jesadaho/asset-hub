import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { BlogPost } from "@/lib/db/models/blog";
import type { IBlogPost } from "@/lib/db/models/blog";
import { getPresignedGetUrl } from "@/lib/s3";

async function resolveDisplayImageUrl(metaImage?: string | null): Promise<string | null> {
  if (!metaImage?.trim()) return null;
  const s = metaImage.trim();
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return getPresignedGetUrl(s);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug?.trim()) {
    return NextResponse.json({ message: "Slug required" }, { status: 400 });
  }

  try {
    await connectDB();
    const post = await BlogPost.findOne({
      slug: slug.trim(),
      type: "article",
      status: "published",
    }).lean();

    if (!post) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const doc = post as IBlogPost & { _id: mongoose.Types.ObjectId };
    const metaImageUrl = await resolveDisplayImageUrl(doc.metaImage);
    return NextResponse.json({
      id: doc._id.toString(),
      title: doc.title,
      slug: doc.slug,
      content: doc.content,
      metaDescription: doc.metaDescription,
      metaImage: metaImageUrl ?? undefined,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    console.error("[GET /api/blog/[slug]]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to load post" },
      { status: 500 }
    );
  }
}

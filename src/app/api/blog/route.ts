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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10) || 10));
  const skip = (page - 1) * limit;

  try {
    await connectDB();
    const filter = { type: "article" as const, status: "published" as const };
    const [posts, totalCount] = await Promise.all([
      BlogPost.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      BlogPost.countDocuments(filter),
    ]);
    const totalPages = Math.ceil(totalCount / limit);
    const metaImageUrls = await Promise.all(
      posts.map((p) => resolveDisplayImageUrl((p as IBlogPost).metaImage))
    );
    return NextResponse.json({
      posts: posts.map((p, i) => {
        const doc = p as IBlogPost & { _id: mongoose.Types.ObjectId };
        return {
          id: doc._id.toString(),
          slug: doc.slug,
          title: doc.title,
          metaDescription: doc.metaDescription,
          metaImage: metaImageUrls[i] ?? undefined,
          updatedAt: doc.updatedAt,
        };
      }),
      totalCount,
      totalPages,
      page,
    });
  } catch (err) {
    console.error("[GET /api/blog]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to load blog" },
      { status: 500 }
    );
  }
}

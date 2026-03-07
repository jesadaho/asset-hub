import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { BlogPost } from "@/lib/db/models/blog";
import type { IBlogPost } from "@/lib/db/models/blog";
import { getPresignedGetUrl } from "@/lib/s3";

async function resolveDisplayImageUrl(
  metaImage?: string | null,
  imageKeys?: string[] | null
): Promise<string | null> {
  if (metaImage?.trim()) {
    const s = metaImage.trim();
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    const url = await getPresignedGetUrl(s);
    if (url) return url;
  }
  const firstKey = imageKeys?.[0]?.trim();
  if (firstKey) {
    const url = await getPresignedGetUrl(firstKey);
    if (url) return url;
  }
  return null;
}

function mapInsightListItem(
  p: IBlogPost & { _id: mongoose.Types.ObjectId },
  metaImageUrl: string | null
): Record<string, unknown> {
  return {
    id: p._id.toString(),
    slug: p.slug,
    title: p.title,
    projectName: p.projectName,
    metaDescription: p.metaDescription,
    metaImage: metaImageUrl ?? undefined,
    location: p.location,
    yearBuilt: p.yearBuilt,
    yieldPercent: p.yieldPercent,
    updatedAt: p.updatedAt,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10) || 10));
  const skip = (page - 1) * limit;

  try {
    await connectDB();
    const filter = { type: "project_review" as const, status: "published" as const };
    const [posts, totalCount] = await Promise.all([
      BlogPost.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      BlogPost.countDocuments(filter),
    ]);
    const totalPages = Math.ceil(totalCount / limit);
    const metaImageUrls = await Promise.all(
      posts.map((p) =>
        resolveDisplayImageUrl(
          (p as IBlogPost).metaImage,
          (p as IBlogPost).imageKeys
        )
      )
    );
    return NextResponse.json({
      posts: posts.map((p, i) => {
        const doc = p as typeof p & { _id: mongoose.Types.ObjectId };
        return mapInsightListItem(doc, metaImageUrls[i] ?? null);
      }),
      totalCount,
      totalPages,
      page,
    });
  } catch (err) {
    console.error("[GET /api/insights]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to load insights" },
      { status: 500 }
    );
  }
}

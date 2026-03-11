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
    developer: p.developer,
    metaDescription: p.metaDescription,
    metaImage: metaImageUrl ?? undefined,
    location: p.location,
    yearBuilt: p.yearBuilt,
    yieldPercent: p.yieldPercent,
    updatedAt: p.updatedAt,
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseNum(s: string | null): number | null {
  if (s == null || s.trim() === "") return null;
  const n = Number(s.trim());
  return Number.isFinite(n) ? n : null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10) || 10));
  const skip = (page - 1) * limit;
  const q = (searchParams.get("q") ?? "").trim();
  const district = (searchParams.get("district") ?? "").trim();
  const developer = (searchParams.get("developer") ?? "").trim();
  const rentMin = parseNum(searchParams.get("rentMin"));
  const rentMax = parseNum(searchParams.get("rentMax"));
  const priceMin = parseNum(searchParams.get("priceMin"));
  const priceMax = parseNum(searchParams.get("priceMax"));
  const yieldMin = parseNum(searchParams.get("yieldMin"));
  const yieldMax = parseNum(searchParams.get("yieldMax"));

  try {
    await connectDB();
    const filter: Record<string, unknown> = { type: "project_review", status: "published" };
    if (district.length > 0) {
      const districtCondition = {
        $or: [
          { district },
          {
            $and: [
              { $or: [{ district: null }, { district: "" }, { district: { $exists: false } }] },
              { location: new RegExp(escapeRegex(district), "i") },
            ],
          },
        ],
      };
      if (!filter.$and) filter.$and = [];
      (filter.$and as Record<string, unknown>[]).push(districtCondition);
    }
    if (developer.length > 0) filter.developer = developer;
    if (q.length > 0) {
      const re = new RegExp(escapeRegex(q), "i");
      filter.$or = [
        { title: re },
        { projectName: re },
        { developer: re },
        { location: re },
        { metaDescription: re },
      ];
    }
    if (rentMin != null || rentMax != null) {
      filter.avgRentPrice = {} as Record<string, number>;
      if (rentMin != null) (filter.avgRentPrice as Record<string, number>).$gte = rentMin;
      if (rentMax != null) (filter.avgRentPrice as Record<string, number>).$lte = rentMax;
    }
    if (priceMin != null || priceMax != null) {
      const priceConditions: Record<string, unknown>[] = [];
      if (priceMin != null) priceConditions.push({ priceMax: { $gte: priceMin } });
      if (priceMax != null) priceConditions.push({ priceMin: { $lte: priceMax } });
      if (priceConditions.length > 0) {
        if (!filter.$and) filter.$and = [];
        (filter.$and as Record<string, unknown>[]).push(...priceConditions);
      }
    }
    if (yieldMin != null || yieldMax != null) {
      filter.yieldPercent = {} as Record<string, number>;
      if (yieldMin != null) (filter.yieldPercent as Record<string, number>).$gte = yieldMin;
      if (yieldMax != null) (filter.yieldPercent as Record<string, number>).$lte = yieldMax;
    }
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
    const body = {
      posts: posts.map((p, i) => {
        const doc = p as typeof p & { _id: mongoose.Types.ObjectId };
        return mapInsightListItem(doc, metaImageUrls[i] ?? null);
      }),
      totalCount,
      totalPages,
      page,
    };
    return NextResponse.json(body);
  } catch (err) {
    console.error("[GET /api/insights]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to load insights" },
      { status: 500 }
    );
  }
}

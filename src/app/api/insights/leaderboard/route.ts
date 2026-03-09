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

const MAX_LEADERBOARD = 50;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mapLeaderboardItem(
  p: IBlogPost & { _id: mongoose.Types.ObjectId },
  rank: number,
  metaImageUrl: string | null
): Record<string, unknown> {
  return {
    id: p._id.toString(),
    slug: p.slug,
    title: p.title,
    projectName: p.projectName,
    developer: p.developer,
    location: p.location,
    yieldPercent: p.yieldPercent,
    occupancyRatePercent: p.occupancyRatePercent,
    priceMin: p.priceMin,
    priceMax: p.priceMax,
    avgRentPrice: p.avgRentPrice,
    metaImage: metaImageUrl ?? undefined,
    rank,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const district = (searchParams.get("district") ?? "").trim();

  try {
    await connectDB();
    const filter: Record<string, unknown> = {
      type: "project_review",
      status: "published",
      yieldPercent: { $exists: true, $ne: null },
    };
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

    const posts = await BlogPost.find(filter)
      .sort({ yieldPercent: -1 })
      .limit(MAX_LEADERBOARD)
      .lean()
      .exec();

    const docList = posts as (IBlogPost & { _id: mongoose.Types.ObjectId })[];
    const metaImageUrls = await Promise.all(
      docList.map((p) => resolveDisplayImageUrl(p.metaImage, p.imageKeys))
    );
    const result = docList.map((p, i) =>
      mapLeaderboardItem(p, i + 1, metaImageUrls[i] ?? null)
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/insights/leaderboard]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to load leaderboard" },
      { status: 500 }
    );
  }
}

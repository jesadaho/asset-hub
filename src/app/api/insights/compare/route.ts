import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { BlogPost } from "@/lib/db/models/blog";
import type { IBlogPost } from "@/lib/db/models/blog";

function mapToCompareItem(
  p: IBlogPost & { _id: mongoose.Types.ObjectId }
): Record<string, unknown> {
  return {
    id: p._id.toString(),
    slug: p.slug,
    projectName: p.projectName,
    title: p.title,
    developer: p.developer,
    location: p.location,
    yieldPercent: p.yieldPercent,
    capitalGainPercent: p.capitalGainPercent,
    pricePerSqm: p.pricePerSqm,
    priceMin: p.priceMin,
    priceMax: p.priceMax,
    avgRentPrice: p.avgRentPrice,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slugsParam = searchParams.get("slugs") ?? "";
  const slugs = slugsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const defaultLimit = Math.min(
    8,
    Math.max(1, parseInt(searchParams.get("default") ?? "0", 10) || 0)
  );

  try {
    await connectDB();

    // When no slugs but default=N: return top N by yieldPercent (desc), ค่าเช่าขั้นต่ำ 10000
    if (slugs.length === 0 && defaultLimit > 0) {
      const posts = await BlogPost.find({
        type: "project_review",
        status: "published",
        yieldPercent: { $exists: true, $ne: null },
        avgRentPrice: { $gte: 10000 },
      })
        .sort({ yieldPercent: -1 })
        .limit(defaultLimit)
        .lean()
        .exec();
      const docList = posts as (IBlogPost & { _id: mongoose.Types.ObjectId })[];
      const result = docList.map(mapToCompareItem);
      return NextResponse.json(result);
    }

    if (slugs.length === 0) {
      return NextResponse.json([]);
    }

    // Limit to avoid huge responses
    const limitedSlugs = slugs.slice(0, 12);

    const posts = await BlogPost.find({
      type: "project_review",
      status: "published",
      slug: { $in: limitedSlugs },
    })
      .lean()
      .exec();

    const docList = posts as (IBlogPost & { _id: mongoose.Types.ObjectId })[];
    const result = docList.map(mapToCompareItem);
    // Preserve order of requested slugs
    const orderMap = new Map(limitedSlugs.map((s, i) => [s, i]));
    result.sort((a, b) => {
      const ai = orderMap.get((a.slug as string) ?? "") ?? 999;
      const bi = orderMap.get((b.slug as string) ?? "") ?? 999;
      return ai - bi;
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/insights/compare]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to load compare data" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { BlogPost } from "@/lib/db/models/blog";
import type { IBlogPost } from "@/lib/db/models/blog";
import { getPresignedGetUrl } from "@/lib/s3";

function parseProsCons(content: string): { main: string; pros: string[]; cons: string[] } {
  const full = content ?? "";
  let main = full.trim();
  const pros: string[] = [];
  const cons: string[] = [];
  const prosHeader = /##\s*ข้อดี\s*\n+/i;
  const consHeader = /##\s*ข้อเสีย\s*\n+/i;
  const prosIdx = full.search(prosHeader);
  if (prosIdx >= 0) {
    main = full.slice(0, prosIdx).trim();
    const afterPros = full.slice(prosIdx).replace(prosHeader, "");
    const consIdxRel = afterPros.search(consHeader);
    const prosBlock = consIdxRel >= 0 ? afterPros.slice(0, consIdxRel) : afterPros;
    const consBlock = consIdxRel >= 0 ? afterPros.slice(consIdxRel).replace(consHeader, "") : "";
    prosBlock.split(/\n/).forEach((line) => {
      const m = line.match(/^\s*[-*]\s*(.+)$/);
      if (m && m[1].trim()) pros.push(m[1].trim());
    });
    consBlock.split(/\n/).forEach((line) => {
      const m = line.match(/^\s*[-*]\s*(.+)$/);
      if (m && m[1].trim()) cons.push(m[1].trim());
    });
  }
  return { main, pros, cons };
}

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

function mapDetailToJson(
  p: IBlogPost & { _id: mongoose.Types.ObjectId },
  metaImageUrl: string | null
): Record<string, unknown> {
  const { main, pros, cons } = parseProsCons(p.content ?? "");
  const out: Record<string, unknown> = {
    id: p._id.toString(),
    title: p.title,
    slug: p.slug,
    content: main,
    metaDescription: p.metaDescription,
    metaImage: metaImageUrl ?? undefined,
    projectName: p.projectName,
    developer: p.developer,
    location: p.location,
    yearBuilt: p.yearBuilt,
    yieldPercent: p.yieldPercent,
    capitalGainPercent: p.capitalGainPercent,
    marketRentDisplay: p.marketRentDisplay,
    pricePerSqm: p.pricePerSqm,
    avgRentPrice: p.avgRentPrice,
    occupancyRatePercent: p.occupancyRatePercent,
    avgDaysOnMarket: p.avgDaysOnMarket,
    demandScore: p.demandScore,
    managementQuality: p.managementQuality,
    parkingRatioPercent: p.parkingRatioPercent,
    commonFeePerSqm: p.commonFeePerSqm,
    distanceToTransit: p.distanceToTransit,
    nearbyCatalyst: p.nearbyCatalyst,
    pros,
    cons,
    updatedAt: p.updatedAt,
  };
  return out;
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
      type: "project_review",
      status: "published",
    }).lean();

    if (!post) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const doc = post as IBlogPost & { _id: mongoose.Types.ObjectId };
    const metaImageUrl = await resolveDisplayImageUrl(doc.metaImage, doc.imageKeys);
    return NextResponse.json(mapDetailToJson(doc, metaImageUrl));
  } catch (err) {
    console.error("[GET /api/insights/[slug]]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to load insight" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { BlogPost } from "@/lib/db/models/blog";
import type { IBlogPost } from "@/lib/db/models/blog";
import { requireAdmin } from "@/lib/auth/require-admin";

function mapPostToJson(
  p: IBlogPost & { _id: mongoose.Types.ObjectId }
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    id: p._id.toString(),
    title: p.title,
    slug: p.slug,
    content: p.content,
    status: p.status,
    type: p.type ?? "article",
    authorId: p.authorId,
    metaDescription: p.metaDescription,
    metaImage: p.metaImage,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    projectName: p.projectName,
    developer: p.developer,
    location: p.location,
    yearBuilt: p.yearBuilt,
    yieldPercent: p.yieldPercent,
    capitalGainPercent: p.capitalGainPercent,
    marketRentDisplay: p.marketRentDisplay,
    pricePerSqm: p.pricePerSqm,
    priceMin: p.priceMin,
    priceMax: p.priceMax,
    avgRentPrice: p.avgRentPrice,
    occupancyRatePercent: p.occupancyRatePercent,
    avgDaysOnMarket: p.avgDaysOnMarket,
    demandScore: p.demandScore,
    managementQuality: p.managementQuality,
    parkingRatioPercent: p.parkingRatioPercent,
    commonFeePerSqm: p.commonFeePerSqm,
    distanceToTransit: p.distanceToTransit,
    nearbyCatalyst: p.nearbyCatalyst,
    imageKeys: p.imageKeys ?? [],
  };
  return out;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }

  try {
    await connectDB();
    const post = await BlogPost.findById(id).lean();
    if (!post) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    const p = post as IBlogPost & { _id: mongoose.Types.ObjectId };
    return NextResponse.json(mapPostToJson(p));
  } catch (err) {
    console.error("[GET /api/admin/blog/[id]]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to load post" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }

  let body: {
    title?: string;
    slug?: string;
    content?: string;
    status?: string;
    type?: string;
    metaDescription?: string;
    metaImage?: string;
    projectName?: string;
    developer?: string;
    location?: string;
    yearBuilt?: number | string;
    yieldPercent?: number;
    capitalGainPercent?: number;
    marketRentDisplay?: string;
    pricePerSqm?: number;
    priceMin?: number;
    priceMax?: number;
    avgRentPrice?: number;
    occupancyRatePercent?: number;
    avgDaysOnMarket?: number;
    demandScore?: "high" | "medium" | "low";
    managementQuality?: number;
    parkingRatioPercent?: number;
    commonFeePerSqm?: number;
    distanceToTransit?: string;
    nearbyCatalyst?: string;
    imageKeys?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  try {
    await connectDB();
    const existing = await BlogPost.findById(id);
    if (!existing) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const update: Record<string, unknown> = {};
    if (body.title !== undefined) update.title = body.title.trim() || existing.title;
    if (body.slug !== undefined) update.slug = body.slug.trim() || existing.slug;
    if (typeof body.content === "string") update.content = body.content;
    if (body.status === "published" || body.status === "draft") update.status = body.status;
    if (body.metaDescription !== undefined) update.metaDescription = body.metaDescription?.trim() ?? "";
    if (body.metaImage !== undefined) update.metaImage = body.metaImage?.trim() ?? "";
    if (body.type === "project_review" || body.type === "article") update.type = body.type;

    const isProjectReview =
      existing.type === "project_review" || body.type === "project_review";
    if (isProjectReview) {
      if (body.projectName !== undefined) update.projectName = body.projectName?.trim();
      if (body.developer !== undefined) update.developer = (body.developer ?? "").toString().trim();
      if (body.location !== undefined) update.location = body.location?.trim();
      if (body.yearBuilt !== undefined) update.yearBuilt = body.yearBuilt;
      if (typeof body.yieldPercent === "number") update.yieldPercent = body.yieldPercent;
      if (typeof body.capitalGainPercent === "number") update.capitalGainPercent = body.capitalGainPercent;
      if (body.marketRentDisplay !== undefined) update.marketRentDisplay = body.marketRentDisplay?.trim();
      if (typeof body.pricePerSqm === "number") update.pricePerSqm = body.pricePerSqm;
      if (body.priceMin !== undefined && body.priceMin !== null) {
        const v = typeof body.priceMin === "number" ? body.priceMin : Number(body.priceMin);
        if (!Number.isNaN(v)) update.priceMin = v;
      }
      if (body.priceMax !== undefined && body.priceMax !== null) {
        const v = typeof body.priceMax === "number" ? body.priceMax : Number(body.priceMax);
        if (!Number.isNaN(v)) update.priceMax = v;
      }
      if (typeof body.avgRentPrice === "number") update.avgRentPrice = body.avgRentPrice;
      if (typeof body.occupancyRatePercent === "number") update.occupancyRatePercent = body.occupancyRatePercent;
      if (typeof body.avgDaysOnMarket === "number") update.avgDaysOnMarket = body.avgDaysOnMarket;
      if (
        body.demandScore === "high" ||
        body.demandScore === "medium" ||
        body.demandScore === "low"
      )
        update.demandScore = body.demandScore;
      if (typeof body.managementQuality === "number") update.managementQuality = body.managementQuality;
      if (typeof body.parkingRatioPercent === "number") update.parkingRatioPercent = body.parkingRatioPercent;
      if (typeof body.commonFeePerSqm === "number") update.commonFeePerSqm = body.commonFeePerSqm;
      if (body.distanceToTransit !== undefined) update.distanceToTransit = body.distanceToTransit?.trim();
      if (body.nearbyCatalyst !== undefined) update.nearbyCatalyst = body.nearbyCatalyst?.trim();
      if (Array.isArray(body.imageKeys)) update.imageKeys = body.imageKeys;
    }

    const oid = new mongoose.Types.ObjectId(id);
    await BlogPost.collection.updateOne({ _id: oid }, { $set: update });
    const updated = await BlogPost.findById(id).lean().exec();
    if (!updated) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    const saved = updated as IBlogPost & { _id: mongoose.Types.ObjectId };
    return NextResponse.json(mapPostToJson(saved));
  } catch (err) {
    console.error("[PATCH /api/admin/blog/[id]]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to update post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }

  try {
    await connectDB();
    const result = await BlogPost.findByIdAndDelete(id);
    if (!result) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/blog/[id]]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to delete post" },
      { status: 500 }
    );
  }
}

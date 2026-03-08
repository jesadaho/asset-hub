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
    const post = await BlogPost.findById(id);
    if (!post) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    if (body.title !== undefined) post.title = body.title.trim() || post.title;
    if (body.slug !== undefined) post.slug = body.slug.trim() || post.slug;
    if (typeof body.content === "string") post.content = body.content;
    if (body.status === "published" || body.status === "draft")
      post.status = body.status;
    if (body.metaDescription !== undefined)
      post.metaDescription = body.metaDescription?.trim() ?? "";
    if (body.metaImage !== undefined)
      post.metaImage = body.metaImage?.trim() ?? "";
    if (body.type === "project_review" || body.type === "article")
      post.type = body.type;
    if (post.type === "project_review") {
      if (body.projectName !== undefined)
        post.projectName = body.projectName?.trim();
      if (body.developer !== undefined) post.developer = body.developer?.trim();
      if (body.location !== undefined) post.location = body.location?.trim();
      if (body.yearBuilt !== undefined) post.yearBuilt = body.yearBuilt;
      if (typeof body.yieldPercent === "number")
        post.yieldPercent = body.yieldPercent;
      if (typeof body.capitalGainPercent === "number")
        post.capitalGainPercent = body.capitalGainPercent;
      if (body.marketRentDisplay !== undefined)
        post.marketRentDisplay = body.marketRentDisplay?.trim();
      if (typeof body.pricePerSqm === "number")
        post.pricePerSqm = body.pricePerSqm;
      if (typeof body.avgRentPrice === "number")
        post.avgRentPrice = body.avgRentPrice;
      if (typeof body.occupancyRatePercent === "number")
        post.occupancyRatePercent = body.occupancyRatePercent;
      if (typeof body.avgDaysOnMarket === "number")
        post.avgDaysOnMarket = body.avgDaysOnMarket;
      if (
        body.demandScore === "high" ||
        body.demandScore === "medium" ||
        body.demandScore === "low"
      )
        post.demandScore = body.demandScore;
      if (typeof body.managementQuality === "number")
        post.managementQuality = body.managementQuality;
      if (typeof body.parkingRatioPercent === "number")
        post.parkingRatioPercent = body.parkingRatioPercent;
      if (typeof body.commonFeePerSqm === "number")
        post.commonFeePerSqm = body.commonFeePerSqm;
      if (body.distanceToTransit !== undefined)
        post.distanceToTransit = body.distanceToTransit?.trim();
      if (body.nearbyCatalyst !== undefined)
        post.nearbyCatalyst = body.nearbyCatalyst?.trim();
      if (Array.isArray(body.imageKeys)) post.imageKeys = body.imageKeys;
    }
    await post.save();
    const saved = post.toObject() as IBlogPost & {
      _id: mongoose.Types.ObjectId;
    };
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

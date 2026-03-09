import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { BlogPost } from "@/lib/db/models/blog";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { IBlogPost } from "@/lib/db/models/blog";

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
    viewCount: p.viewCount ?? 0,
  };
  if (p.type === "project_review") {
    out.projectName = p.projectName;
    out.developer = p.developer;
    out.location = p.location;
    out.yearBuilt = p.yearBuilt;
    out.yieldPercent = p.yieldPercent;
    out.capitalGainPercent = p.capitalGainPercent;
    out.marketRentDisplay = p.marketRentDisplay;
    out.pricePerSqm = p.pricePerSqm;
    out.priceMin = p.priceMin;
    out.priceMax = p.priceMax;
    out.avgRentPrice = p.avgRentPrice;
    out.occupancyRatePercent = p.occupancyRatePercent;
    out.avgDaysOnMarket = p.avgDaysOnMarket;
    out.demandScore = p.demandScore;
    out.managementQuality = p.managementQuality;
    out.parkingRatioPercent = p.parkingRatioPercent;
    out.commonFeePerSqm = p.commonFeePerSqm;
    out.distanceToTransit = p.distanceToTransit;
    out.nearbyCatalyst = p.nearbyCatalyst;
    out.imageKeys = p.imageKeys ?? [];
  }
  return out;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugFromTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status")?.trim();
  const location = searchParams.get("location")?.trim();
  const developer = searchParams.get("developer")?.trim();
  const q = (searchParams.get("q") ?? "").trim();
  const sortBy = (searchParams.get("sortBy") ?? "updatedAt").trim();
  const order = (searchParams.get("order") ?? "desc").trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
  const skip = (page - 1) * limit;

  const sortField =
    sortBy === "viewCount" ? "viewCount" : sortBy === "title" ? "title" : "updatedAt";
  const sortDir = (order === "asc" ? 1 : -1) as 1 | -1;
  const sortOption = { [sortField]: sortDir } as Record<string, 1 | -1>;

  try {
    await connectDB();
    const filter: Record<string, unknown> = {};
    if (status === "draft" || status === "published") filter.status = status;
    if (location?.length) filter.location = location;
    if (developer?.length) filter.developer = developer;
    if (q.length > 0) {
      const re = new RegExp(escapeRegex(q), "i");
      filter.$or = [
        { title: re },
        { slug: re },
        { projectName: re },
      ];
    }
    const [posts, totalCount] = await Promise.all([
      BlogPost.find(filter).sort(sortOption).skip(skip).limit(limit).lean(),
      BlogPost.countDocuments(filter),
    ]);
    const totalPages = Math.ceil(totalCount / limit);
    return NextResponse.json({
      posts: posts.map((p) => {
        const doc = p as typeof p & { _id: mongoose.Types.ObjectId };
        return mapPostToJson(doc);
      }),
      totalCount,
      totalPages,
      page,
    });
  } catch (err) {
    console.error("[GET /api/admin/blog]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to load posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

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
  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ message: "title is required" }, { status: 400 });
  }
  const slug = body.slug?.trim() || slugFromTitle(title);
  const content = typeof body.content === "string" ? body.content : "";
  const status =
    body.status === "published" || body.status === "draft"
      ? body.status
      : "draft";
  const type =
    body.type === "project_review" ? "project_review" : "article";

  try {
    await connectDB();
    const existing = await BlogPost.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { message: "Slug already exists" },
        { status: 409 }
      );
    }
    const createPayload: Record<string, unknown> = {
      title,
      slug,
      content,
      status,
      type,
      authorId: auth.user?.id,
    };
    if (typeof body.metaDescription === "string" && body.metaDescription.trim())
      createPayload.metaDescription = body.metaDescription.trim();
    if (typeof body.metaImage === "string" && body.metaImage.trim())
      createPayload.metaImage = body.metaImage.trim();
    if (type === "project_review") {
      createPayload.projectName = body.projectName?.trim();
      createPayload.developer = body.developer?.trim();
      createPayload.location = body.location?.trim();
      createPayload.yearBuilt = body.yearBuilt;
      createPayload.yieldPercent =
        typeof body.yieldPercent === "number" ? body.yieldPercent : undefined;
      createPayload.capitalGainPercent =
        typeof body.capitalGainPercent === "number"
          ? body.capitalGainPercent
          : undefined;
      createPayload.marketRentDisplay = body.marketRentDisplay?.trim();
      createPayload.pricePerSqm =
        typeof body.pricePerSqm === "number" ? body.pricePerSqm : undefined;
      createPayload.priceMin =
        typeof body.priceMin === "number" ? body.priceMin : undefined;
      createPayload.priceMax =
        typeof body.priceMax === "number" ? body.priceMax : undefined;
      createPayload.avgRentPrice =
        typeof body.avgRentPrice === "number" ? body.avgRentPrice : undefined;
      createPayload.occupancyRatePercent =
        typeof body.occupancyRatePercent === "number"
          ? body.occupancyRatePercent
          : undefined;
      createPayload.avgDaysOnMarket =
        typeof body.avgDaysOnMarket === "number"
          ? body.avgDaysOnMarket
          : undefined;
      createPayload.demandScore =
        body.demandScore === "high" ||
        body.demandScore === "medium" ||
        body.demandScore === "low"
          ? body.demandScore
          : undefined;
      createPayload.managementQuality =
        typeof body.managementQuality === "number"
          ? body.managementQuality
          : undefined;
      createPayload.parkingRatioPercent =
        typeof body.parkingRatioPercent === "number"
          ? body.parkingRatioPercent
          : undefined;
      createPayload.commonFeePerSqm =
        typeof body.commonFeePerSqm === "number"
          ? body.commonFeePerSqm
          : undefined;
      createPayload.distanceToTransit = body.distanceToTransit?.trim();
      createPayload.nearbyCatalyst = body.nearbyCatalyst?.trim();
      createPayload.imageKeys = Array.isArray(body.imageKeys)
        ? body.imageKeys
        : [];
    }
    const doc = await BlogPost.create(createPayload);
    const saved = doc.toObject() as IBlogPost & {
      _id: mongoose.Types.ObjectId;
    };
    return NextResponse.json(mapPostToJson(saved));
  } catch (err) {
    console.error("[POST /api/admin/blog]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to create post" },
      { status: 500 }
    );
  }
}

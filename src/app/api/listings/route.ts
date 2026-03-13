import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectAssetAceDB } from "@/lib/db/mongodb";
import { getPropertyModel } from "@/lib/db/models/property";
import { getPresignedGetUrl } from "@/lib/s3";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location")?.trim() ?? "";
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const listingType = searchParams.get("listingType")?.trim(); // "rent" | "sale"
  const limitParam = searchParams.get("limit");
  const limit = Math.min(
    Math.max(limitParam ? parseInt(limitParam, 10) : DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );
  const pageParam = searchParams.get("page");
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 0;
  const cursor = searchParams.get("cursor")?.trim() ?? undefined;

  const minPriceNum =
    minPrice !== null && minPrice !== undefined && minPrice !== ""
      ? Number(minPrice)
      : undefined;
  const maxPriceNum =
    maxPrice !== null && maxPrice !== undefined && maxPrice !== ""
      ? Number(maxPrice)
      : undefined;

  try {
    const assetAceConnection = await connectAssetAceDB();
    const Property = getPropertyModel(assetAceConnection);

    const filter: Record<string, unknown> = {
      publicListing: true,
      status: "Available",
    };

    if (listingType === "sale" || listingType === "rent") {
      filter.listingType = listingType;
    }

    if (location) {
      filter.address = { $regex: location, $options: "i" };
    }

    if (
      (minPriceNum != null && !Number.isNaN(minPriceNum)) ||
      (maxPriceNum != null && !Number.isNaN(maxPriceNum))
    ) {
      const priceCond: Record<string, number> = {};
      if (minPriceNum != null && !Number.isNaN(minPriceNum)) {
        priceCond.$gte = minPriceNum;
      }
      if (maxPriceNum != null && !Number.isNaN(maxPriceNum)) {
        priceCond.$lte = maxPriceNum;
      }
      filter.price = priceCond;
    }

    const usePage = page >= 1;
    if (!usePage && cursor) {
      const parts = cursor.split("_");
      const createdAtMs = parts[0] ? parseInt(parts[0], 10) : NaN;
      const cursorId = parts.slice(1).join("_");
      if (
        !Number.isNaN(createdAtMs) &&
        cursorId &&
        /^[a-f0-9A-F]{24}$/.test(cursorId)
      ) {
        const { ObjectId } = await import("mongodb");
        filter.$or = [
          { createdAt: { $lt: new Date(createdAtMs) } },
          {
            createdAt: new Date(createdAtMs),
            _id: { $lt: new ObjectId(cursorId) },
          },
        ];
      }
    }

    const skip = usePage ? (page - 1) * limit : 0;
    const totalCount = usePage ? await Property.countDocuments(filter) : 0;
    const totalPages = usePage ? Math.ceil(totalCount / limit) : 0;

    const docs = await Property.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(usePage ? limit : limit + 1)
      .lean();

    const hasMore = usePage ? page < totalPages : docs.length > limit;
    const items = usePage ? docs : hasMore ? docs.slice(0, limit) : docs;

    const listings = await Promise.all(
      items.map(async (doc) => {
        const keys = (doc as { imageKeys?: string[] }).imageKeys ?? [];
        const imageUrls: string[] = [];
        for (const key of keys.slice(0, 1)) {
          const url = await getPresignedGetUrl(key);
          if (url) imageUrls.push(url);
        }
        const d = doc as {
          _id: mongoose.Types.ObjectId;
          name: string;
          type: string;
          price: number;
          address: string;
          listingType?: string;
          createdAt: Date;
        };
        return {
          id: d._id.toString(),
          name: d.name,
          type: d.type,
          price: d.price,
          address: d.address,
          listingType: d.listingType,
          imageUrl: imageUrls[0] ?? null,
        };
      })
    );

    let nextCursor: string | null = null;
    if (hasMore && items.length > 0 && !usePage) {
      const last = items[items.length - 1] as { createdAt: Date; _id: mongoose.Types.ObjectId };
      nextCursor = `${last.createdAt.getTime()}_${last._id.toString()}`;
    }

    return NextResponse.json({
      listings,
      nextCursor,
      ...(usePage && { totalCount, totalPages }),
    });
  } catch (err) {
    console.error("[GET /api/listings]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to load listings" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectAssetAceDB } from "@/lib/db/mongodb";
import { getPropertyModel } from "@/lib/db/models/property";
import { getPresignedGetUrl } from "@/lib/s3";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  try {
    const assetAceConnection = await connectAssetAceDB();
    const Property = getPropertyModel(assetAceConnection);
    const doc = await Property.findOne({ _id: id }).lean();
    const publicListing = (doc as { publicListing?: boolean }).publicListing;
    const status = (doc as { status?: string }).status;
    const listingType = (doc as { listingType?: string }).listingType;
    const saleWithTenant = (doc as { saleWithTenant?: boolean }).saleWithTenant;
    const isPublicSaleWithTenant =
      listingType === "sale" && saleWithTenant === true;
    if (!doc || !publicListing || (status !== "Available" && !isPublicSaleWithTenant)) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const keys = (doc as { imageKeys?: string[] }).imageKeys ?? [];
    const imageUrls: string[] = [];
    for (const key of keys) {
      const url = await getPresignedGetUrl(key);
      if (url) imageUrls.push(url);
    }

    const createdAt = (doc as { createdAt?: Date }).createdAt;
    return NextResponse.json({
      id: (doc as { _id: mongoose.Types.ObjectId })._id.toString(),
      name: (doc as { name: string }).name,
      type: (doc as { type: string }).type,
      price: (doc as { price: number }).price,
      address: (doc as { address: string }).address,
      description: (doc as { description?: string }).description,
      bedrooms: (doc as { bedrooms?: string }).bedrooms,
      bathrooms: (doc as { bathrooms?: string }).bathrooms,
      squareMeters: (doc as { squareMeters?: string }).squareMeters,
      amenities: (doc as { amenities?: string[] }).amenities ?? [],
      listingType,
      saleWithTenant: saleWithTenant ?? false,
      imageUrls,
      agentName: (doc as { agentName?: string }).agentName,
      agentLineAccountId: (doc as { agentLineAccountId?: string }).agentLineAccountId,
      listedAt: createdAt ? new Date(createdAt).toISOString() : undefined,
    });
  } catch (err) {
    console.error("[GET /api/listings/[id]]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to load listing" },
      { status: 500 }
    );
  }
}

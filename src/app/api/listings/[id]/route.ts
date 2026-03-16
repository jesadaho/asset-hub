import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectAssetAceDB } from "@/lib/db/mongodb";
import { getPropertyModel } from "@/lib/db/models/property";
import {
  getInferredMonthlyRent,
  getInferredSalePrice,
  getPrimaryDisplayPrice,
} from "@/lib/property-pricing";
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
    const status = (doc as { status?: string }).status;
    const listingType = (doc as { listingType?: string }).listingType;
    const saleWithTenant = (doc as { saleWithTenant?: boolean }).saleWithTenant;
    const publicListing = (doc as { publicListing?: boolean }).publicListing;
    const showOnAssetHub = (doc as { showOnAssetHub?: boolean }).showOnAssetHub;
    const isVisibleSaleWithTenant =
      listingType === "sale" &&
      saleWithTenant === true &&
      status !== "Paused" &&
      status !== "Archived";
    const isVisiblePublicListing = publicListing && status === "Available";
    const showOnHub = showOnAssetHub !== false;
    if (!doc || !showOnHub || (!isVisiblePublicListing && !isVisibleSaleWithTenant)) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const keys = (doc as { imageKeys?: string[] }).imageKeys ?? [];
    const imageUrls: string[] = [];
    for (const key of keys) {
      const url = await getPresignedGetUrl(key);
      if (url) imageUrls.push(url);
    }

    const ownerId = (doc as { ownerId?: string }).ownerId;
    let ownerName: string | undefined;
    let ownerLineAccountId: string | undefined;
    if (ownerId) {
      const owner = await assetAceConnection.collection("users").findOne(
        { lineUserId: ownerId },
        { projection: { name: 1, lineId: 1 } }
      );
      ownerName =
        typeof owner?.name === "string" && owner.name.trim()
          ? owner.name.trim()
          : undefined;
      ownerLineAccountId =
        typeof owner?.lineId === "string" && owner.lineId.trim()
          ? owner.lineId.trim().replace(/^@/, "")
          : undefined;
      if (ownerLineAccountId && /^U[0-9a-f]{32,}$/i.test(ownerLineAccountId)) {
        ownerLineAccountId = undefined;
      }
    }

    const createdAt = (doc as { createdAt?: Date }).createdAt;
    return NextResponse.json({
      id: (doc as { _id: mongoose.Types.ObjectId })._id.toString(),
      name: (doc as { name: string }).name,
      type: (doc as { type: string }).type,
      price: getPrimaryDisplayPrice(doc as {
        listingType?: string;
        saleWithTenant?: boolean;
        price?: number;
        salePrice?: number;
        monthlyRent?: number;
      }),
      salePrice: getInferredSalePrice(doc as {
        listingType?: string;
        saleWithTenant?: boolean;
        price?: number;
        salePrice?: number;
        monthlyRent?: number;
      }),
      monthlyRent: getInferredMonthlyRent(doc as {
        listingType?: string;
        saleWithTenant?: boolean;
        price?: number;
        salePrice?: number;
        monthlyRent?: number;
      }),
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
      ownerName,
      ownerLineAccountId,
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

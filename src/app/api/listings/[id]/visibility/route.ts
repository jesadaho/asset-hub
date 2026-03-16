import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectAssetAceDB } from "@/lib/db/mongodb";
import { getPropertyModel } from "@/lib/db/models/property";

/**
 * GET /api/listings/[id]/visibility
 * Returns visibility-related fields for a listing (from Asset Ace DB) so we can see why it does or doesn't show on Asset Hub.
 * Only available when NODE_ENV !== "production".
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  const { id } = await params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const assetAceConnection = await connectAssetAceDB();
    const Property = getPropertyModel(assetAceConnection);
    const doc = await Property.findOne({ _id: id }).lean();
    if (!doc) {
      return NextResponse.json(
        { found: false, message: "Property not found in Asset Ace DB" },
        { status: 200 }
      );
    }

    const status = (doc as { status?: string }).status;
    const listingType = (doc as { listingType?: string }).listingType;
    const saleWithTenant = (doc as { saleWithTenant?: boolean }).saleWithTenant;
    const publicListing = (doc as { publicListing?: boolean }).publicListing;
    const showOnAssetHub = (doc as { showOnAssetHub?: boolean }).showOnAssetHub;

    const showOnHub = showOnAssetHub !== false;
    const isVisiblePublicListing = Boolean(publicListing && status === "Available");
    const isVisibleSaleWithTenant =
      listingType === "sale" &&
      saleWithTenant === true &&
      status !== "Paused" &&
      status !== "Archived";

    const matchesDetailPage =
      showOnHub && (isVisiblePublicListing || isVisibleSaleWithTenant);

    const rentTabListingType =
      listingType === "rent" ||
      listingType == null ||
      listingType === "" ||
      !("listingType" in doc);
    const matchesListRentTab =
      showOnHub &&
      Boolean(publicListing && status === "Available") &&
      rentTabListingType;
    const matchesListSaleTab =
      showOnHub &&
      Boolean(publicListing && status === "Available") &&
      listingType === "sale";

    const reasons: string[] = [];
    if (!showOnHub) reasons.push("showOnAssetHub is false");
    if (!publicListing) reasons.push("publicListing is not true");
    if (status !== "Available")
      reasons.push(`status is "${status ?? "undefined"}" (need Available)`);
    if (!matchesListRentTab && !matchesListSaleTab) {
      if (listingType !== "sale" && !rentTabListingType)
        reasons.push("listingType not rent/null so excluded from rent tab");
      if (listingType !== "sale") reasons.push("listingType not sale so excluded from sale tab");
    }

    return NextResponse.json({
      found: true,
      id,
      publicListing: publicListing ?? false,
      status: status ?? null,
      showOnAssetHub: showOnAssetHub ?? null,
      listingType: listingType ?? null,
      saleWithTenant: saleWithTenant ?? false,
      matchesDetailPage,
      matchesListRentTab,
      matchesListSaleTab,
      reason: reasons.length > 0 ? reasons.join("; ") : "OK",
    });
  } catch (err) {
    console.error("[GET /api/listings/[id]/visibility]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectAssetAceDB } from "@/lib/db/mongodb";
import { getPropertyModel } from "@/lib/db/models/property";
import type { IProperty } from "@/lib/db/models/property";
import {
  getInferredMonthlyRent,
  getInferredSalePrice,
  getPrimaryDisplayPrice,
} from "@/lib/property-pricing";
import { getPresignedGetUrl } from "@/lib/s3";

const LIMIT = 5;

export async function GET() {
  try {
    const assetAceConnection = await connectAssetAceDB();
    const Property = getPropertyModel(assetAceConnection);

    const docs = await Property.find({
      listingType: "sale",
      showOnAssetHub: { $ne: false },
      $or: [
        { publicListing: true, status: "Available" },
        { saleWithTenant: true, status: { $nin: ["Paused", "Archived"] } },
        { status: "Available" },
      ],
    })
      .sort({ createdAt: -1, _id: -1 })
      .limit(LIMIT)
      .lean()
      .exec();

    const listings = await Promise.all(
      docs.map(async (doc) => {
        const d = doc as IProperty & {
          _id: mongoose.Types.ObjectId;
          createdAt?: Date;
        };
        const firstKey = d.imageKeys?.[0];
        const imageUrl = firstKey ? await getPresignedGetUrl(firstKey) : null;

        return {
          id: d._id.toString(),
          name: d.name,
          type: d.type,
          price: getPrimaryDisplayPrice(d),
          salePrice: getInferredSalePrice(d),
          monthlyRent: getInferredMonthlyRent(d),
          address: d.address,
          listingType: d.listingType,
          saleWithTenant: d.saleWithTenant ?? false,
          status: d.status,
          imageUrl,
        };
      })
    );

    return NextResponse.json({ listings });
  } catch (err) {
    console.error("[GET /api/recommended-assets]", err);
    return NextResponse.json(
      {
        message:
          err instanceof Error ? err.message : "Failed to load recommended assets",
      },
      { status: 500 }
    );
  }
}

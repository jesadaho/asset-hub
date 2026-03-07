import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Property } from "@/lib/db/models/property";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    await connectDB();
    const [totalListings, saleCount, rentCount] = await Promise.all([
      Property.countDocuments({ publicListing: true, status: "Available" }),
      Property.countDocuments({
        publicListing: true,
        status: "Available",
        listingType: "sale",
      }),
      Property.countDocuments({
        publicListing: true,
        status: "Available",
        listingType: "rent",
      }),
    ]);
    return NextResponse.json({
      totalListings,
      saleCount,
      rentCount,
    });
  } catch (err) {
    console.error("[GET /api/admin/stats]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to load stats" },
      { status: 500 }
    );
  }
}

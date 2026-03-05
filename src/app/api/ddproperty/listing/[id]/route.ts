import { NextRequest, NextResponse } from "next/server";
import { fetchDdpropertyItems } from "@/lib/ddproperty-api";

const SEARCH_LIMIT = 100;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !id.trim()) {
    return NextResponse.json({ message: "Missing listing id" }, { status: 400 });
  }

  try {
    const items = await fetchDdpropertyItems({ limit: SEARCH_LIMIT });
    const item = items.find((i) => i.id === id.trim());
    if (!item) {
      return NextResponse.json(
        { message: "Listing not found or no longer in current search results" },
        { status: 404 }
      );
    }
    return NextResponse.json(item);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch listing";
    console.error("[ddproperty/listing/[id]]", err);
    if (message.includes("RAPIDAPI_KEY")) {
      return NextResponse.json({ message }, { status: 503 });
    }
    return NextResponse.json({ message }, { status: 502 });
  }
}

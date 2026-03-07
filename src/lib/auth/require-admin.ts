import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/auth/get-session";

export async function requireAdmin(): Promise<
  { user: Awaited<ReturnType<typeof getSessionWithAdmin>>["user"] } | NextResponse
> {
  const { user } = await getSessionWithAdmin();
  if (!user || !user.isAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  return { user };
}

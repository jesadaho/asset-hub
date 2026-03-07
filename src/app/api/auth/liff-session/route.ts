import { NextRequest, NextResponse } from "next/server";
import { verifyLiffToken } from "@/lib/auth/liff";
import {
  createLineSessionToken,
  LINE_SESSION_COOKIE_NAME,
  LINE_SESSION_COOKIE_OPTIONS,
} from "@/lib/auth/session";

const DASHBOARD_URL =
  process.env.NEXTAUTH_REDIRECT_AFTER_SIGNIN ??
  "https://www.assethub.in.th/admin/dashboard";

export async function POST(request: NextRequest) {
  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const token = body.token?.trim();
  if (!token) {
    return NextResponse.json({ message: "token required" }, { status: 400 });
  }

  const profile = await verifyLiffToken(token);
  if (!profile) {
    return NextResponse.json({ message: "Invalid LINE token" }, { status: 401 });
  }

  const sessionToken = createLineSessionToken({
    userId: profile.userId,
    name: profile.displayName ?? null,
    picture: profile.pictureUrl ?? null,
  });

  const res = NextResponse.json({ ok: true, redirectUrl: DASHBOARD_URL });
  res.cookies.set(LINE_SESSION_COOKIE_NAME, sessionToken, LINE_SESSION_COOKIE_OPTIONS);

  return res;
}

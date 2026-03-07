import { NextResponse } from "next/server";
import {
  createLineSessionToken,
  LINE_SESSION_COOKIE_NAME,
  LINE_SESSION_COOKIE_OPTIONS,
} from "@/lib/auth/session";

const DASHBOARD_URL =
  process.env.NEXTAUTH_REDIRECT_AFTER_SIGNIN ??
  "https://www.assethub.in.th/admin/dashboard";

/**
 * Dev-only: create a fake LINE session so you can test "logged in" state locally
 * without going through LIFF. Only works when NODE_ENV === "development".
 */
export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ message: "Not available" }, { status: 403 });
  }

  try {
    const sessionToken = createLineSessionToken({
      userId: "dev-user",
      name: "Dev Test User",
      picture: null,
    });

    const res = NextResponse.json({ ok: true, redirectUrl: DASHBOARD_URL });
    res.cookies.set(LINE_SESSION_COOKIE_NAME, sessionToken, LINE_SESSION_COOKIE_OPTIONS);
    return res;
  } catch (err) {
    console.error("[dev-session] Failed:", err);
    return NextResponse.json(
      { message: "Failed to create dev session. Set NEXTAUTH_SECRET in .env.local" },
      { status: 500 }
    );
  }
}

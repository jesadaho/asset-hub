import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const LINE_SESSION_COOKIE = "line_session";
const LINE_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type LineSessionPayload = {
  userId: string;
  name?: string | null;
  picture?: string | null;
  exp: number;
};

function getSecret(): string {
  const secret =
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV === "development" ? "dev-secret-replace-in-production" : undefined);
  if (!secret) throw new Error("NEXTAUTH_SECRET required for LINE session");
  return secret;
}

function sign(payload: LineSessionPayload): string {
  const secret = getSecret();
  const data = JSON.stringify(payload);
  const raw = Buffer.from(data, "utf8").toString("base64url");
  const sig = createHmac("sha256", secret).update(raw).digest("base64url");
  return `${raw}.${sig}`;
}

function verify(token: string): LineSessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [raw, sig] = parts;
    const expected = createHmac("sha256", getSecret()).update(raw).digest("base64url");
    if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expected, "utf8")))
      return null;
    const payload = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as LineSessionPayload;
    if (!payload.userId || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createLineSessionToken(payload: Omit<LineSessionPayload, "exp">): string {
  const full: LineSessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + LINE_SESSION_MAX_AGE,
  };
  return sign(full);
}

export function verifyLineSessionToken(token: string | null): LineSessionPayload | null {
  if (!token?.trim()) return null;
  return verify(token);
}

export async function getLineSessionFromCookie(): Promise<LineSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(LINE_SESSION_COOKIE)?.value;
  return verifyLineSessionToken(token ?? null);
}

export const LINE_SESSION_COOKIE_NAME = LINE_SESSION_COOKIE;

export const LINE_SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: LINE_SESSION_MAX_AGE,
  path: "/",
};

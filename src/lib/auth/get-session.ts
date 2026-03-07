import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getLineSessionFromCookie } from "@/lib/auth/session";

export type SessionUser = {
  id: string;
  name: string | null;
  image: string | null;
  provider: string;
  isAdmin: boolean;
};

function isAdminUserId(id: string): boolean {
  const ids = process.env.ADMIN_USER_IDS?.trim();
  // In development, if ADMIN_USER_IDS is not set, treat every logged-in user as admin (test user)
  if (process.env.NODE_ENV === "development" && !ids) return true;
  if (!ids) return false;
  const list = ids.split(",").map((s) => s.trim()).filter(Boolean);
  return list.includes(id);
}

export async function getSessionWithAdmin(): Promise<{ user: SessionUser | null }> {
  const nextAuthSession = await getServerSession(authOptions);
  if (nextAuthSession?.user) {
    const u = nextAuthSession.user as {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    const id = u.id ?? u.email ?? "";
    return {
      user: {
        id,
        name: u.name ?? null,
        image: u.image ?? null,
        provider: "nextauth",
        isAdmin: isAdminUserId(id),
      },
    };
  }

  const lineSession = await getLineSessionFromCookie();
  if (lineSession) {
    const id = lineSession.userId;
    return {
      user: {
        id,
        name: lineSession.name ?? null,
        image: lineSession.picture ?? null,
        provider: "line",
        isAdmin: isAdminUserId(id),
      },
    };
  }

  return { user: null };
}

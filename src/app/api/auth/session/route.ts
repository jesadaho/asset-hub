import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getLineSessionFromCookie } from "@/lib/auth/session";

export async function GET() {
  const nextAuthSession = await getServerSession(authOptions);
  if (nextAuthSession?.user) {
    const u = nextAuthSession.user as { id?: string; name?: string | null; email?: string | null; image?: string | null };
    return Response.json({
      user: {
        id: u.id ?? u.email ?? "",
        name: u.name ?? null,
        image: u.image ?? null,
        provider: "nextauth",
      },
    });
  }

  const lineSession = await getLineSessionFromCookie();
  if (lineSession) {
    return Response.json({
      user: {
        id: lineSession.userId,
        name: lineSession.name ?? null,
        image: lineSession.picture ?? null,
        provider: "line",
      },
    });
  }

  return Response.json({ user: null });
}

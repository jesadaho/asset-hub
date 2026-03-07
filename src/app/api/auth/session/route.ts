import { getSessionWithAdmin } from "@/lib/auth/get-session";
import { upsertUser } from "@/lib/db/upsert-user";

export async function GET() {
  const { user } = await getSessionWithAdmin();
  if (user) {
    try {
      await upsertUser({
        id: user.id,
        name: user.name,
        image: user.image,
        provider: user.provider,
      });
    } catch {
      // Session still works if upsert fails (e.g. DB down)
    }
  }
  return Response.json({ user });
}

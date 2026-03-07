/**
 * Verify LIFF access token with LINE Profile API.
 * Returns profile or null if invalid.
 */
export async function verifyLiffToken(accessToken: string | null): Promise<{
  userId: string;
  displayName?: string;
  pictureUrl?: string;
} | null> {
  if (!accessToken?.trim()) return null;

  try {
    const res = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("[verifyLiffToken] LINE API status:", res.status, text.slice(0, 200));
      return null;
    }

    const data = (await res.json()) as {
      userId?: string;
      displayName?: string;
      pictureUrl?: string;
    };
    if (!data.userId) return null;
    return {
      userId: data.userId,
      displayName: data.displayName,
      pictureUrl: data.pictureUrl,
    };
  } catch {
    return null;
  }
}

import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const DEFAULT_REDIRECT =
  process.env.NEXTAUTH_REDIRECT_AFTER_SIGNIN ?? "/";

function googleProvider(): NextAuthOptions["providers"][0] | null {
  const id = process.env.AUTH_GOOGLE_ID?.trim();
  const secret = process.env.AUTH_GOOGLE_SECRET?.trim();
  if (!id || !secret) return null;
  return GoogleProvider({ clientId: id, clientSecret: secret });
}

export const authOptions: NextAuthOptions = {
  secret:
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV === "development" ? "dev-secret-replace-in-production" : undefined),
  providers: [...(googleProvider() ? [googleProvider()!] : [])],
  callbacks: {
    redirect({ url }) {
      if (url.includes("/api/auth/callback")) return DEFAULT_REDIRECT;
      if (url.startsWith("/")) return url;
      return url;
    },
  },
  pages: {
    signIn: "/sign-in",
    error: "/auth/error",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

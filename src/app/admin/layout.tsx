import { redirect } from "next/navigation";
import { getSessionWithAdmin } from "@/lib/auth/get-session";
import { Header } from "@/components/Header";
import { AdminShell } from "@/components/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getSessionWithAdmin();
  if (!user) redirect("/sign-in");
  if (!user.isAdmin) redirect("/");
  return (
    <>
      <Header />
      <AdminShell>{children}</AdminShell>
    </>
  );
}

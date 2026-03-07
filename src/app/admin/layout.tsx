import { redirect } from "next/navigation";
import { getSessionWithAdmin } from "@/lib/auth/get-session";
import { Header } from "@/components/Header";
import { AdminSideMenu } from "@/components/AdminSideMenu";

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
      <div className="flex min-h-0 flex-1">
        <AdminSideMenu />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </>
  );
}

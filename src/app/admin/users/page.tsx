import { requireAdmin } from "@/lib/auth/require-admin";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/user";

export default async function AdminUsersPage() {
  const auth = await requireAdmin();
  if (auth instanceof Response) redirect("/");
  await connectDB();
  const users = await User.find().sort({ updatedAt: -1 }).limit(100).lean();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">ผู้ใช้</h1>
      </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  ชื่อ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Provider
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  อัปเดตล่าสุด
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-2">
                      {u.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.image}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-slate-200" />
                      )}
                      <span className="text-sm text-slate-900">
                        {u.name ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">
                    {u.id}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                    {u.provider}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                    {u.updatedAt
                      ? new Date(u.updatedAt).toLocaleString("th-TH")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
    </main>
  );
}

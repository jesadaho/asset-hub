import { connectAssetAceDB } from "@/lib/db/mongodb";
import { getPropertyModel } from "@/lib/db/models/property";

export default async function AdminPage() {
  const assetAceConnection = await connectAssetAceDB();
  const Property = getPropertyModel(assetAceConnection);
  const [totalListings, saleCount, rentCount] = await Promise.all([
    Property.countDocuments({ publicListing: true, status: "Available" }),
    Property.countDocuments({
      publicListing: true,
      status: "Available",
      listingType: "sale",
    }),
    Property.countDocuments({
      publicListing: true,
      status: "Available",
      listingType: "rent",
    }),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <p className="mt-2 text-slate-600">
        แดชบอร์ดสำหรับผู้ดูแลระบบ
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">ประกาศทั้งหมด</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {totalListings}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">ประกาศขาย</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {saleCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">ประกาศเช่า</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {rentCount}
          </p>
        </div>
      </div>
    </main>
  );
}

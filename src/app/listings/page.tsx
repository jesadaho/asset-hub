import { Suspense } from "react";
import ListingsPageClient from "./ListingsPageClient";

function ListingsPageFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-500 text-sm">กำลังโหลด...</p>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<ListingsPageFallback />}>
      <ListingsPageClient />
    </Suspense>
  );
}

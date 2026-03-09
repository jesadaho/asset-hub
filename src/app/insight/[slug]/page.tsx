"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { Header } from "@/components/Header";
import { ArticleShareButton } from "@/components/ArticleShareButton";

const PRIMARY = "#068e7b";

const yieldClasses = {
  high: "text-green-500 font-bold", // > 7%
  good: "text-yellow-500 font-semibold", // 6-7%
  avg: "text-orange-400", // 4.5-6%
  low: "text-red-500", // < 4.5%
} as const;

function getYieldLevel(y: number): keyof typeof yieldClasses {
  if (y >= 7) return "high";
  if (y >= 6) return "good";
  if (y >= 4.5) return "avg";
  return "low";
}

type MarketRentEntry = { roomType: string; priceRange: string };

function parseMarketRentDisplay(s: string): MarketRentEntry[] {
  const raw = (s || "").trim();
  if (!raw) return [];
  const segments = raw.split(/\s*\|\s*/).map((t) => t.trim()).filter(Boolean);
  const out: MarketRentEntry[] = [];
  for (const seg of segments) {
    const idx = seg.indexOf(": ");
    if (idx > 0) {
      out.push({
        roomType: seg.slice(0, idx).trim(),
        priceRange: seg.slice(idx + 2).trim(),
      });
    } else if (seg) {
      out.push({ roomType: seg, priceRange: "" });
    }
  }
  return out;
}

type InsightDetail = {
  id: string;
  slug: string;
  title: string;
  content: string;
  projectName?: string;
  developer?: string;
  location?: string;
  yearBuilt?: number | string;
  metaImage?: string;
  yieldPercent?: number;
  capitalGainPercent?: number;
  marketRentDisplay?: string;
  pricePerSqm?: number;
  priceMin?: number;
  priceMax?: number;
  avgRentPrice?: number;
  occupancyRatePercent?: number;
  avgDaysOnMarket?: number;
  demandScore?: string;
  managementQuality?: number;
  parkingRatioPercent?: number;
  commonFeePerSqm?: number;
  distanceToTransit?: string;
  nearbyCatalyst?: string;
  pros: string[];
  cons: string[];
  updatedAt?: string;
};

type InsightListItem = { id: string; slug: string; projectName?: string; title?: string };

export default function InsightDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<InsightDetail | null>(null);
  const [otherInsights, setOtherInsights] = useState<InsightListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const viewRecordedRef = useRef(false);

  useEffect(() => {
    viewRecordedRef.current = false;
  }, [slug]);

  useEffect(() => {
    if (!data?.slug || viewRecordedRef.current) return;
    viewRecordedRef.current = true;
    fetch(`/api/insights/${encodeURIComponent(data.slug)}/view`, { method: "POST" }).catch(() => {});
  }, [data?.slug]);

  useEffect(() => {
    if (!slug?.trim()) {
      setLoading(false);
      setError("ไม่พบหน้านี้");
      return;
    }
    fetch(`/api/insights/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (res.status === 404) throw new Error("Not found");
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด"))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!data?.id) return;
    fetch("/api/insights?limit=6")
      .then((res) => res.ok ? res.json() : { posts: [] })
      .then((json: { posts?: InsightListItem[] }) => {
        const list = (json.posts ?? []).filter((p) => p.slug !== data.slug).slice(0, 5);
        setOtherInsights(list);
      })
      .catch(() => setOtherInsights([]));
  }, [data?.id, data?.slug]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div
          className="relative z-20 w-full overflow-hidden"
          style={{
            height: "400px",
            background: "linear-gradient(120deg, #1b3d52 0%, #0f4c4c 50%, #0a5c5a 100%)",
            boxShadow: "inset 0 0 120px rgba(255,255,255,0.04)",
          }}
        >
          <div className="mx-auto flex h-full max-w-6xl flex-col px-4 pt-3 pb-5 sm:px-6 lg:px-8">
            <div className="h-5 w-24 animate-pulse rounded bg-white/20" />
          </div>
        </div>
        <div
          className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
          style={{ marginTop: "-20rem", marginBottom: "-2.5rem" }}
        >
          <div className="flex min-h-[200px] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-xl sm:flex-row sm:items-stretch">
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 px-5 py-6 sm:px-8 md:px-10">
              <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
              <div className="h-7 w-3/4 animate-pulse rounded bg-slate-200 sm:h-8" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-4 w-24 animate-pulse rounded bg-slate-200" />
            </div>
            <div className="h-32 w-full shrink-0 animate-pulse bg-slate-200 sm:h-full sm:min-h-[188px] sm:w-[48%] sm:rounded-r-2xl" />
          </div>
        </div>
        <div className="mx-auto max-w-3xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded bg-slate-200" style={{ width: i === 2 ? "60%" : i === 4 ? "80%" : "100%" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen">
        <div
          className="w-full"
          style={{
            background: "linear-gradient(120deg, #1b3d52 0%, #0f4c4c 50%, #0a5c5a 100%)",
          }}
        >
          <Header />
        </div>
        <div className="w-full bg-white">
          <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="font-medium text-slate-700">
                {error === "Not found" ? "ไม่พบรายการนี้" : error ?? "เกิดข้อผิดพลาด"}
              </p>
              <Link
                href="/insight"
                className="mt-4 inline-block text-sm font-medium"
                style={{ color: PRIMARY }}
              >
                ← กลับไป Insight
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const marketRentEntries = parseMarketRentDisplay(data.marketRentDisplay ?? "");

  return (
    <div className="min-h-screen">
      <Header />
      {/* Zone บน: BG สีเขียว — ปุ่มกลับอยู่ระหว่าง topbar กับการ์ด */}
      <div
        className="relative z-20 w-full overflow-hidden"
        style={{
          height: "400px",
          background: "linear-gradient(120deg, #1b3d52 0%, #0f4c4c 50%, #0a5c5a 100%)",
          boxShadow: "inset 0 0 120px rgba(255,255,255,0.04)",
        }}
      >
        <div className="mx-auto flex h-full max-w-6xl flex-col px-4 pt-3 pb-5 sm:px-6 lg:px-8">
          <div className="flex-shrink-0">
            <Link
              href="/insight"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-white"
              aria-label="กลับไป Insight"
            >
              <span aria-hidden>←</span>
              กลับไป Insight
            </Link>
          </div>
        </div>
      </div>

      {/* การ์ด Cover: อยู่ระหว่าง Zone บนกับ Zone ล่าง (z-20) */}
      <div
        className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        style={{ marginTop: "-20rem", marginBottom: "-2.5rem" }}
      >
        <div className="flex min-h-[160px] w-full flex-col overflow-hidden rounded-2xl bg-slate-100 shadow-xl sm:max-h-[380px] sm:min-h-[188px] sm:flex-row sm:items-stretch md:min-h-[204px]">
          <div className="flex min-w-0 flex-1 flex-col justify-center px-5 py-6 sm:px-8 sm:py-8 md:px-10 md:py-10">
            <nav className="text-sm text-slate-500">
              <Link href="/insight" className="hover:text-slate-700">
                Insight
              </Link>
              <span className="mx-1.5 text-slate-400">/</span>
              <span className="text-slate-700">
                {data.title || data.projectName}
              </span>
            </nav>
            <h1 className="mt-2 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl md:text-4xl">
              {data.title || data.projectName}
            </h1>
            {(data.developer || data.location || data.yearBuilt) && (
              <p className="mt-1.5 text-sm text-slate-600">
                {[data.developer, data.location, data.yearBuilt].filter(Boolean).join(" · ")}
              </p>
            )}
            <div className="mt-4">
              <ArticleShareButton title={data.title || data.projectName} />
            </div>
          </div>
          {data.metaImage && (
            <div className="relative h-32 w-full shrink-0 overflow-hidden sm:h-full sm:min-h-[188px] sm:w-[48%] md:min-h-[204px] sm:rounded-r-2xl">
              <img
                src={data.metaImage}
                alt=""
                className="h-full w-full object-cover object-right"
              />
            </div>
          )}
        </div>
      </div>

      {/* Zone ล่าง: BG สีขาว ที่เหลือทั้งหมด */}
      <div
        className="relative z-10 w-full bg-white"
        style={{
          marginTop: "-2.5rem",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
        }}
      >
        <main className="mx-auto max-w-6xl px-4 pt-14 pb-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
          {/* ข้อมูลโครงการ: นักพัฒนา, ทำเล, ปีที่สร้าง */}
          {(data.developer || data.location || data.yearBuilt) && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                ข้อมูลโครงการ
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.developer && (
                  <div>
                    <span className="block text-xs text-slate-500">นักพัฒนา</span>
                    <span className="text-sm font-medium text-slate-800">{data.developer}</span>
                  </div>
                )}
                {data.location && (
                  <div>
                    <span className="block text-xs text-slate-500">ทำเล</span>
                    <span className="text-sm text-slate-800">{data.location}</span>
                  </div>
                )}
                {data.yearBuilt != null && data.yearBuilt !== "" && (
                  <div>
                    <span className="block text-xs text-slate-500">ปีที่สร้าง</span>
                    <span className="text-sm text-slate-800">{String(data.yearBuilt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Financial */}
          {(typeof data.yieldPercent === "number" ||
            typeof data.capitalGainPercent === "number" ||
            marketRentEntries.length > 0 ||
            typeof data.pricePerSqm === "number" ||
            typeof data.avgRentPrice === "number") && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Financial Performance
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {typeof data.yieldPercent === "number" && (
                  <div>
                    <span className="block text-xs text-slate-500">Rental Yield</span>
                    <span className={`text-lg ${yieldClasses[getYieldLevel(data.yieldPercent)]}`}>
                      {data.yieldPercent}%
                    </span>
                  </div>
                )}
                {typeof data.capitalGainPercent === "number" && (
                  <div>
                    <span className="block text-xs text-slate-500">Capital Gain</span>
                    <span className="text-lg font-semibold" style={{ color: PRIMARY }}>
                      {data.capitalGainPercent}%
                    </span>
                  </div>
                )}
                {typeof data.pricePerSqm === "number" && (
                  <div>
                    <span className="block text-xs text-slate-500">Price/Sq.m.</span>
                    <span className="text-lg font-semibold" style={{ color: PRIMARY }}>
                      {data.pricePerSqm.toLocaleString()} THB
                    </span>
                  </div>
                )}
                <div>
                  <span className="block text-xs text-slate-500">ช่วงราคา (Price)</span>
                  <span className="text-lg font-semibold" style={{ color: PRIMARY }}>
                    {typeof data.priceMin === "number" && typeof data.priceMax === "number"
                      ? `${data.priceMin.toLocaleString()} - ${data.priceMax.toLocaleString()} THB`
                      : typeof data.priceMin === "number"
                        ? `${data.priceMin.toLocaleString()}+ THB`
                        : typeof data.priceMax === "number"
                          ? `ถึง ${data.priceMax.toLocaleString()} THB`
                          : "—"}
                  </span>
                </div>
                {typeof data.avgRentPrice === "number" && (
                  <div>
                    <span className="block text-xs text-slate-500">ราคาปล่อยเช่าเฉลี่ย</span>
                    <span className="text-lg font-semibold" style={{ color: PRIMARY }}>
                      {data.avgRentPrice.toLocaleString()} THB
                    </span>
                  </div>
                )}
              </div>
              {marketRentEntries.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <span className="block text-xs font-medium text-slate-500">Market Rent</span>
                  <ul className="mt-1.5 space-y-1 text-sm">
                    {marketRentEntries
                      .filter((e) => e.roomType.trim() || e.priceRange.trim())
                      .map((e, i) => (
                        <li key={i} className="flex justify-between gap-2" style={{ color: PRIMARY }}>
                          <span>{e.roomType.trim() || "—"}</span>
                          <span>{e.priceRange.trim() || "—"}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Liquidity */}
          {(typeof data.occupancyRatePercent === "number" ||
            typeof data.avgDaysOnMarket === "number" ||
            data.demandScore) && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Liquidity
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {typeof data.occupancyRatePercent === "number" && (
                  <div>
                    <span className="block text-xs text-slate-500">Occupancy</span>
                    <span className="text-lg font-semibold" style={{ color: PRIMARY }}>
                      {data.occupancyRatePercent}%
                    </span>
                  </div>
                )}
                {typeof data.avgDaysOnMarket === "number" && (
                  <div>
                    <span className="block text-xs text-slate-500">Days on Market</span>
                    <span className="text-lg font-semibold" style={{ color: PRIMARY }}>
                      {data.avgDaysOnMarket}
                    </span>
                  </div>
                )}
                {data.demandScore && (
                  <div>
                    <span className="block text-xs text-slate-500">Demand</span>
                    <span className="text-lg font-semibold capitalize" style={{ color: PRIMARY }}>
                      {data.demandScore}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Operational */}
          {(typeof data.managementQuality === "number" ||
            typeof data.parkingRatioPercent === "number" ||
            typeof data.commonFeePerSqm === "number") && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Operational
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {typeof data.managementQuality === "number" && (
                  <div>
                    <span className="block text-xs text-slate-500">Management</span>
                    <span className="text-lg font-semibold" style={{ color: PRIMARY }}>
                      {data.managementQuality} ★
                    </span>
                  </div>
                )}
                {typeof data.parkingRatioPercent === "number" && (
                  <div>
                    <span className="block text-xs text-slate-500">Parking</span>
                    <span className="text-lg font-semibold" style={{ color: PRIMARY }}>
                      {data.parkingRatioPercent}%
                    </span>
                  </div>
                )}
                {typeof data.commonFeePerSqm === "number" && (
                  <div>
                    <span className="block text-xs text-slate-500">Common Fee</span>
                    <span className="text-lg font-semibold" style={{ color: PRIMARY }}>
                      {data.commonFeePerSqm} THB/ตร.ม.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Location */}
          {(data.distanceToTransit || data.nearbyCatalyst) && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Location
              </p>
              <div className="space-y-2 text-sm text-slate-700">
                {data.distanceToTransit && (
                  <p>
                    <span className="text-slate-500">Transit: </span>
                    <span style={{ color: PRIMARY }}>{data.distanceToTransit}</span>
                  </p>
                )}
                {data.nearbyCatalyst && (
                  <p>
                    <span className="text-slate-500">Catalyst: </span>
                    <span style={{ color: PRIMARY }}>{data.nearbyCatalyst}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {data.content && (
            <div className="prose prose-sm max-w-none prose-p:text-slate-700 [&_br]:block [&>*]:mb-4 [&>*:last-child]:mb-0 [&_h1]:!mt-0 [&_h1]:!mb-2 [&_h1]:!text-2xl [&_h1]:!font-bold [&_h1]:!text-slate-900 [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-800 [&_h3]:mt-4 [&_h3]:mb-1.5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-800">
              <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                {data.content}
              </ReactMarkdown>
            </div>
          )}

          {(data.pros?.length > 0 || data.cons?.length > 0) && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {data.pros?.length > 0 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4">
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-800">
                    ข้อดี
                  </h3>
                  <ul className="space-y-1.5 text-sm text-emerald-900">
                    {data.pros.map((p, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 text-emerald-600" aria-hidden>✓</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.cons?.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-800">
                    ข้อเสีย
                  </h3>
                  <ul className="space-y-1.5 text-sm text-amber-900">
                    {data.cons.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 text-amber-600" aria-hidden>✕</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          </div>

          {/* Sidebar: รีวิวอื่นๆ */}
          <aside className="lg:col-span-1">
            <div className="sticky top-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
                รีวิวอื่นๆ
              </h2>
              <Link
                href="/insight"
                className="mb-3 block text-sm font-medium"
                style={{ color: PRIMARY }}
              >
                ← กลับไป Insight
              </Link>
              <ul className="space-y-2">
                {otherInsights.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/insight/${item.slug}`}
                      className="block text-sm text-slate-700 hover:underline"
                      style={{ color: item.slug === slug ? PRIMARY : undefined }}
                    >
                      {item.title?.trim() || item.projectName?.trim() || "รีวิว"}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-xs font-medium text-slate-600">
                  เราอยากได้เรื่องจากคุณ
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  มีประสบการณ์ลงทุนหรือรีวิวโครงการที่อยากแชร์?
                </p>
                <a
                  href="mailto:insight@assethub.in.th"
                  className="mt-2 inline-block rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                  style={{ backgroundColor: PRIMARY }}
                >
                  แชร์เรื่องของคุณ
                </a>
              </div>
            </div>
          </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

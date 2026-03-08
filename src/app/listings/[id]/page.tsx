"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ImageIcon,
  Home,
  Bed,
  Bath,
  Square,
  Share2,
  Heart,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { Header } from "@/components/Header";

const PRIMARY = "#068e7b";

type ListingData = {
  id: string;
  name: string;
  type: string;
  price: number;
  address: string;
  description?: string;
  bedrooms?: string;
  bathrooms?: string;
  squareMeters?: string;
  amenities?: string[];
  listingType?: string;
  imageUrls?: string[];
  agentName?: string;
  agentLineAccountId?: string;
  listedAt?: string;
};

function formatListedDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    async function fetchListing() {
      try {
        const res = await fetch(`/api/listings/${id}`);
        if (cancelled) return;
        if (res.status === 404) {
          setNotFound(true);
          setListing(null);
          return;
        }
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setListing(data);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchListing();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <p className="text-slate-500 text-sm">กำลังโหลด...</p>
      </div>
    );
  }

  if (notFound || !listing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <p className="text-slate-600 text-sm">ไม่พบรายการนี้</p>
        <button
          type="button"
          onClick={() => router.push("/listings")}
          className="mt-4 rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: PRIMARY }}
        >
          กลับไปรายการ
        </button>
      </div>
    );
  }

  const urls = listing.imageUrls?.length ? listing.imageUrls : [];
  const mainImageUrl = urls[selectedImageIndex] ?? urls[0];
  const hasLineAgent = !!(
    listing.agentLineAccountId &&
    listing.agentLineAccountId.trim() &&
    !/^U[0-9a-f]{32,}$/i.test(listing.agentLineAccountId.trim())
  );
  const lineHref = hasLineAgent
    ? `https://line.me/ti/p/~${listing.agentLineAccountId!.trim().replace(/^@/, "")}`
    : "https://assethub.in.th";
  const agentLabel = listing.agentName?.trim() || "AssetHub";
  const listedStr = formatListedDate(listing.listedAt);
  const descriptionShort =
    listing.description && listing.description.length > 200
      ? listing.description.slice(0, 200) + "..."
      : listing.description;
  const showReadMore =
    listing.description && listing.description.length > 200 && !descriptionExpanded;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/listings"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ChevronLeft className="h-4 w-4" /> กลับไปรายการ
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* Left column: gallery + content */}
          <article className="min-w-0">
            {/* Gallery */}
            <div className="flex gap-2">
              <div className="relative flex-1 aspect-[3/2] min-h-[240px] overflow-hidden rounded-xl bg-slate-200">
                {mainImageUrl ? (
                  <img
                    src={mainImageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <ImageIcon className="h-16 w-16" aria-hidden />
                  </div>
                )}
                {urls.length > 1 && (
                  <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
                    {selectedImageIndex + 1}/{urls.length}
                  </div>
                )}
              </div>
              {urls.length > 1 && (
                <div className="flex w-20 flex-shrink-0 flex-col gap-2 overflow-y-auto">
                  {urls.slice(0, 5).map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedImageIndex(i)}
                      className={`relative aspect-square overflow-hidden rounded-lg border-2 bg-slate-200 ${
                        selectedImageIndex === i
                          ? "border-slate-700"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Address + actions */}
            <div className="mt-6 flex flex-wrap items-start justify-between gap-2">
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                {listing.address}
              </h1>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="แชร์"
                >
                  <Share2 className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="เก็บรายการโปรด"
                >
                  <Heart className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Price + listed date */}
            <div className="mt-2 flex flex-wrap items-baseline gap-3">
              <p className="text-sm font-medium text-slate-500">
                {listing.listingType === "sale" ? "ราคาขาย" : "ราคาเช่า"}
              </p>
              <p className="text-2xl font-bold text-slate-900" style={{ color: PRIMARY }}>
                ฿{listing.price.toLocaleString()}
                {listing.listingType !== "sale" && (
                  <span className="text-base font-normal text-slate-500">/ เดือน</span>
                )}
              </p>
              {listedStr && (
                <p className="text-sm text-slate-500">ลงประกาศเมื่อ {listedStr}</p>
              )}
            </div>

            {/* Key details grid */}
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5 text-slate-400" aria-hidden />
                <span className="text-sm text-slate-700">{listing.type}</span>
              </div>
              {listing.bedrooms != null && listing.bedrooms !== "" && (
                <div className="flex items-center gap-2">
                  <Bed className="h-5 w-5 text-slate-400" aria-hidden />
                  <span className="text-sm text-slate-700">{listing.bedrooms} ห้องนอน</span>
                </div>
              )}
              {listing.bathrooms != null && listing.bathrooms !== "" && (
                <div className="flex items-center gap-2">
                  <Bath className="h-5 w-5 text-slate-400" aria-hidden />
                  <span className="text-sm text-slate-700">{listing.bathrooms} ห้องน้ำ</span>
                </div>
              )}
              {listing.squareMeters != null && listing.squareMeters !== "" && (
                <div className="flex items-center gap-2">
                  <Square className="h-5 w-5 text-slate-400" aria-hidden />
                  <span className="text-sm text-slate-700">{listing.squareMeters} ตร.ม.</span>
                </div>
              )}
            </div>

            {/* Key features (amenities as bullets) */}
            {listing.amenities && listing.amenities.length > 0 && (
              <div className="mt-8 border-t border-slate-200 pt-6">
                <h2 className="text-lg font-semibold text-slate-900">จุดเด่น</h2>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-600">
                  {listing.amenities.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Description */}
            {(listing.description ?? "").length > 0 && (
              <div className="mt-8 border-t border-slate-200 pt-6">
                <h2 className="text-lg font-semibold text-slate-900">รายละเอียด</h2>
                <p className="mt-2 whitespace-pre-wrap text-slate-600">
                  {descriptionExpanded ? listing.description : descriptionShort}
                </p>
                {showReadMore && (
                  <button
                    type="button"
                    onClick={() => setDescriptionExpanded(true)}
                    className="mt-2 text-sm font-medium"
                    style={{ color: PRIMARY }}
                  >
                    อ่านเพิ่มเติม
                  </button>
                )}
              </div>
            )}

            {/* Map link */}
            {listing.address && (
              <div className="mt-8 border-t border-slate-200 pt-6">
                <h2 className="text-lg font-semibold text-slate-900">ตำแหน่ง</h2>
                <p className="mt-2 text-slate-600">{listing.address}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium"
                  style={{ color: PRIMARY }}
                >
                  <MapPin className="h-4 w-4" /> เปิดใน Google Maps
                </a>
              </div>
            )}
          </article>

          {/* Right sidebar: ขายโดย + CTAs */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                ขายโดย
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{agentLabel}</p>
              <p className="mt-1 text-sm text-slate-600">ติดต่อผ่านแพลตฟอร์ม</p>
              <Link
                href="/listings"
                className="mt-2 inline-block text-sm font-medium"
                style={{ color: PRIMARY }}
              >
                รายการอื่นจากเอเจนต์นี้
              </Link>

              <div className="mt-6 flex flex-col gap-3">
                <a
                  href={lineHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ backgroundColor: PRIMARY }}
                >
                  <Phone className="h-4 w-4" aria-hidden />
                  {hasLineAgent ? "ติดต่อเอเจนต์" : "ติดต่อผ่าน AssetHub"}
                </a>
                <a
                  href="https://assethub.in.th"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition hover:opacity-90"
                  style={{ borderColor: PRIMARY, color: PRIMARY }}
                >
                  <Mail className="h-4 w-4" aria-hidden />
                  ขอรายละเอียด
                </a>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

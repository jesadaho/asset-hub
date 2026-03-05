"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ImageIcon,
  Home,
  Bed,
  Bath,
  Square,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { Header } from "@/components/Header";
import type { DDPropertyItem } from "@/lib/ddproperty-api";

const PRIMARY = "#068e7b";
const FALLBACK_DDPROPERTY_URL = "https://www.ddproperty.com/";

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function formatListedDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DDListingDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [item, setItem] = useState<DDPropertyItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    const storageKey = `asset-hub-ddlisting-${id}`;
    try {
      const stored = typeof window !== "undefined" ? sessionStorage.getItem(storageKey) : null;
      if (stored) {
        const parsed = JSON.parse(stored) as DDPropertyItem;
        if (parsed && parsed.id === id) {
          setItem(parsed);
          setLoading(false);
          // อย่าลบ storage ทันที — ในโหมด dev (Strict Mode) effect รัน 2 ครั้ง ถ้าลบรอบแรก รอบสองจะไม่เจอแล้วไป fetch → 404
          return;
        }
      }
    } catch {
      // ignore invalid stored data
    }
    let cancelled = false;
    async function fetchItem() {
      try {
        const res = await fetch(`/api/ddproperty/listing/${encodeURIComponent(id)}`);
        if (cancelled) return;
        if (res.status === 404) {
          setNotFound(true);
          setItem(null);
          return;
        }
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setItem(data);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchItem();
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

  if (notFound || !item) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <p className="text-slate-600 text-sm">ไม่พบรายการนี้</p>
        <Link
          href="/"
          className="mt-4 rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: PRIMARY }}
        >
          กลับหน้าหลัก
        </Link>
      </div>
    );
  }

  const priceText =
    item.price > 0
      ? `฿${item.price.toLocaleString()}`
      : item.priceDisplay || "฿—";
  const listedStr = formatListedDate(item.listedAt);
  const detailUrl = item.detailUrl ?? FALLBACK_DDPROPERTY_URL;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ChevronLeft className="h-4 w-4" /> กลับหน้าหลัก
        </Link>

        <p className="mb-4 text-sm font-medium uppercase tracking-wide text-slate-500">
          ตัวอย่างรายการ
        </p>

        <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="aspect-[16/10] bg-slate-200">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-400">
                <ImageIcon className="h-16 w-16" aria-hidden />
              </div>
            )}
          </div>

          <div className="p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-slate-900">{item.title}</h1>
            <p className="mt-2 text-2xl font-bold text-slate-900" style={{ color: PRIMARY }}>
              {priceText}
            </p>
            {item.location && (
              <p className="mt-2 flex items-center gap-2 text-slate-600">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                {item.location}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-4">
              {item.bedrooms != null && Number(item.bedrooms) >= 0 && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Bed className="h-5 w-5 text-slate-400" aria-hidden />
                  <span>{String(item.bedrooms)} เตียง</span>
                </div>
              )}
              {item.bathrooms != null && Number(item.bathrooms) >= 0 && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Bath className="h-5 w-5 text-slate-400" aria-hidden />
                  <span>{String(item.bathrooms)} ห้องน้ำ</span>
                </div>
              )}
              {item.areaSqm != null && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Square className="h-5 w-5 text-slate-400" aria-hidden />
                  <span>{String(item.areaSqm)} ตร.ม.</span>
                </div>
              )}
              {item.propertyType && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Home className="h-5 w-5 text-slate-400" aria-hidden />
                  <span>{item.propertyType}</span>
                </div>
              )}
            </div>

            {listedStr && (
              <p className="mt-4 text-sm text-slate-500">
                ลงประกาศเมื่อ {listedStr}
              </p>
            )}

            <p className="mt-6 text-sm text-slate-500">
              ข้อมูลจาก DDproperty
            </p>

            <a
              href={detailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: PRIMARY }}
            >
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
              ดูรายละเอียดเพิ่มเติม
            </a>
          </div>
        </article>
      </main>
    </div>
  );
}

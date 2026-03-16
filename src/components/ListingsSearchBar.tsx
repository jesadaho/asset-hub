"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, X, Search, Bookmark } from "lucide-react";

const PRIMARY = "#068e7b";

const PROPERTY_TYPE_OPTIONS = [
  { property_type: "RESIDENTIAL", residential_property_type: "ALL", label: "ทั้งหมด" },
  { property_type: "RESIDENTIAL", residential_property_type: "CONDO", label: "คอนโด" },
  { property_type: "RESIDENTIAL", residential_property_type: "DETACHED_HOUSE", label: "บ้าน" },
  { property_type: "RESIDENTIAL", residential_property_type: "APARTMENT", label: "อพาร์ตเมนต์" },
  { property_type: "COMMERCIAL", residential_property_type: "ALL", label: "อาคารพานิช" },
] as const;

const BEDROOM_OPTIONS = [
  { value: "", label: "ห้องนอน" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
] as const;

const PRICE_PRESETS = [
  { min: "", max: "", label: "ราคา" },
  { min: "0", max: "1000000", label: "ไม่เกิน 1 ล้าน" },
  { min: "1000000", max: "3000000", label: "1–3 ล้าน" },
  { min: "3000000", max: "5000000", label: "3–5 ล้าน" },
  { min: "5000000", max: "10000000", label: "5–10 ล้าน" },
  { min: "10000000", max: "", label: "10 ล้านขึ้นไป" },
];

function useOnClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

export function ListingsSearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [locationInput, setLocationInput] = useState(searchParams.get("location") ?? "");
  const [propertyTypeOpen, setPropertyTypeOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [bedsOpen, setBedsOpen] = useState(false);
  const propertyTypeRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const bedsRef = useRef<HTMLDivElement>(null);

  const listingType = (searchParams.get("listingType") ?? "rent").toString().toLowerCase() === "sale" ? "sale" : "rent";
  const propertyType = searchParams.get("property_type") ?? "RESIDENTIAL";
  const residentialPropertyType = searchParams.get("residential_property_type") ?? "ALL";
  const minPrice = searchParams.get("minPrice") ?? searchParams.get("min_price") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? searchParams.get("max_price") ?? "";
  const bedrooms = searchParams.get("bedrooms") ?? "";

  useOnClickOutside(propertyTypeRef, () => setPropertyTypeOpen(false));
  useOnClickOutside(priceRef, () => setPriceOpen(false));
  useOnClickOutside(bedsRef, () => setBedsOpen(false));

  useEffect(() => {
    setLocationInput(searchParams.get("location") ?? "");
  }, [searchParams]);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === "" || value == null) params.delete(key);
        else params.set(key, value);
      }
      params.delete("page");
      params.delete("listing_type");
      params.delete("min_price");
      params.delete("max_price");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams]
  );

  const handleLocationBlur = useCallback(() => {
    const v = locationInput.trim();
    updateParams({ location: v });
  }, [locationInput, updateParams]);

  const handleLocationClear = useCallback(() => {
    setLocationInput("");
    updateParams({ location: "" });
  }, [updateParams]);

  const propertyTypeLabel =
    PROPERTY_TYPE_OPTIONS.find(
      (p) => p.property_type === propertyType && p.residential_property_type === residentialPropertyType
    )?.label ?? "ทั้งหมด";
  const priceLabel =
    minPrice || maxPrice
      ? PRICE_PRESETS.find((p) => String(p.min) === minPrice && String(p.max) === maxPrice)?.label ??
        (minPrice || maxPrice ? `฿${minPrice || "0"}–${maxPrice || "∞"}` : "ราคา")
      : "ราคา";
  const bedsLabel = bedrooms ? `${bedrooms}+` : "ห้องนอน";

  return (
    <div className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Breadcrumbs */}
        <nav className="mb-4 flex items-center gap-1.5 text-sm text-slate-500" aria-label="breadcrumb">
          <Link href="/" className="hover:text-slate-700">
            หน้าแรก
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
          <span className="text-slate-700">
            {listingType === "rent" ? "ประกาศเช่า" : "ประกาศขาย"}
          </span>
          {locationInput.trim() && (
            <>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <span className="text-slate-700">{locationInput.trim()}</span>
            </>
          )}
        </nav>

        {/* Location search bar + Save Search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 sm:py-3">
            <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onBlur={handleLocationBlur}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              placeholder="พื้นที่ เช่น บางเขน กรุงเทพ"
              className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-base"
              aria-label="พื้นที่"
            />
            {locationInput && (
              <button
                type="button"
                onClick={handleLocationClear}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
                aria-label="ล้างพื้นที่"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            )}
          </div>
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:py-3"
            aria-label="บันทึกการค้นหา"
          >
            <Bookmark className="h-4 w-4 text-slate-500" aria-hidden />
            บันทึกการค้นหา
          </button>
        </div>

        {/* แถว filter: เหมือนหน้าแรก — ประเภท ราคา ห้องนอน */}
        <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative" ref={propertyTypeRef}>
            <button
              type="button"
              onClick={() => setPropertyTypeOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              aria-expanded={propertyTypeOpen}
              aria-haspopup="listbox"
            >
              {propertyTypeLabel}
              <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden />
            </button>
            {propertyTypeOpen && (
              <ul
                className="absolute left-0 top-full z-20 mt-1 min-w-[140px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                role="listbox"
              >
                {PROPERTY_TYPE_OPTIONS.map((opt) => (
                  <li key={`${opt.property_type}-${opt.residential_property_type}`} role="option">
                    <button
                      type="button"
                      onClick={() => {
                        updateParams({
                          property_type: opt.property_type,
                          residential_property_type: opt.residential_property_type,
                        });
                        setPropertyTypeOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="relative" ref={priceRef}>
            <button
              type="button"
              onClick={() => setPriceOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              aria-expanded={priceOpen}
              aria-haspopup="listbox"
            >
              {priceLabel}
              <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden />
            </button>
            {priceOpen && (
              <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                <p className="mb-2 text-xs font-medium text-slate-500">เลือกช่วงราคา</p>
                <div className="space-y-1">
                  {PRICE_PRESETS.slice(1).map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        updateParams({ minPrice: preset.min, maxPrice: preset.max });
                        setPriceOpen(false);
                      }}
                      className="block w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-100"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="relative" ref={bedsRef}>
            <button
              type="button"
              onClick={() => setBedsOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              aria-expanded={bedsOpen}
              aria-haspopup="listbox"
            >
              {bedsLabel}
              <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden />
            </button>
            {bedsOpen && (
              <ul
                className="absolute left-0 top-full z-20 mt-1 min-w-[120px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                role="listbox"
              >
                {BEDROOM_OPTIONS.map((opt) => (
                  <li key={opt.value || "all"} role="option">
                    <button
                      type="button"
                      onClick={() => {
                        updateParams({ bedrooms: opt.value });
                        setBedsOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

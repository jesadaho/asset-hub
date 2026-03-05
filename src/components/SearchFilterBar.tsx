"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useEffect, useState } from "react";
import { ChevronDown, MapPin, X, Search } from "lucide-react";

const PRIMARY = "#068e7b";

const LISTING_TYPES = [
  { value: "SALE", label: "ขาย" },
  { value: "RENT", label: "เช่า" },
] as const;

const MAJOR_PROPERTY_TYPES = [
  { value: "COMMERCIAL", label: "อาคารพานิช" },
  { value: "RESIDENTIAL", label: "ที่อยู่อาศัย" },
] as const;

const PROPERTY_TYPES = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "CONDO", label: "คอนโด" },
  { value: "DETACHED_HOUSE", label: "บ้าน" },
  { value: "APARTMENT", label: "อพาร์ตเมนต์" },
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

export function SearchFilterBar({ embeddedInHero = false }: { embeddedInHero?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [locationInput, setLocationInput] = useState(searchParams.get("location") ?? "");
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [majorTypeOpen, setMajorTypeOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [bedsOpen, setBedsOpen] = useState(false);
  const [propertyTypeOpen, setPropertyTypeOpen] = useState(false);
  const transactionRef = useRef<HTMLDivElement>(null);
  const majorTypeRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const bedsRef = useRef<HTMLDivElement>(null);
  const propertyTypeRef = useRef<HTMLDivElement>(null);

  const listingType = searchParams.get("listing_type") ?? "SALE";
  const propertyType = searchParams.get("property_type") ?? "COMMERCIAL";
  const minPrice = searchParams.get("min_price") ?? "";
  const maxPrice = searchParams.get("max_price") ?? "";
  const bedrooms = searchParams.get("bedrooms") ?? "";
  const residentialPropertyType = searchParams.get("residential_property_type") ?? "ALL";

  useOnClickOutside(transactionRef, () => setTransactionOpen(false));
  useOnClickOutside(majorTypeRef, () => setMajorTypeOpen(false));
  useOnClickOutside(priceRef, () => setPriceOpen(false));
  useOnClickOutside(bedsRef, () => setBedsOpen(false));
  useOnClickOutside(propertyTypeRef, () => setPropertyTypeOpen(false));

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === "" || value == null) params.delete(key);
        else params.set(key, value);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    setLocationInput(searchParams.get("location") ?? "");
  }, [searchParams]);

  const handleLocationBlur = useCallback(() => {
    const v = locationInput.trim();
    updateParams({ location: v });
  }, [locationInput, updateParams]);

  const handleLocationClear = useCallback(() => {
    setLocationInput("");
    updateParams({ location: "" });
  }, [updateParams]);

  const priceLabel =
    minPrice || maxPrice
      ? PRICE_PRESETS.find(
          (p) => String(p.min) === minPrice && String(p.max) === maxPrice
        )?.label ?? (minPrice || maxPrice ? `฿${minPrice || "0"}–${maxPrice || "∞"}` : "ราคา")
      : "ราคา";

  const bedsLabel = bedrooms ? `${bedrooms}+` : "ห้องนอน";
  const propertyTypeLabel =
    PROPERTY_TYPES.find((p) => p.value === residentialPropertyType)?.label ?? "ประเภท";
  const majorTypeLabel =
    MAJOR_PROPERTY_TYPES.find((m) => m.value === propertyType)?.label ?? "ประเภท";

  const card = (
      <div className={embeddedInHero ? "mx-auto w-full" : "mx-auto max-w-5xl"}>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.05)" }}>
          {/* แถวบน: dropdowns */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative" ref={transactionRef}>
              <button
                type="button"
                onClick={() => setTransactionOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {LISTING_TYPES.find((t) => t.value === listingType)?.label ?? "ขาย"}
                <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden />
              </button>
              {transactionOpen && (
                <ul
                  className="absolute left-0 top-full z-20 mt-1 min-w-[120px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                  role="listbox"
                >
                  {LISTING_TYPES.map((t) => (
                    <li key={t.value} role="option">
                      <button
                        type="button"
                        onClick={() => {
                          updateParams({ listing_type: t.value });
                          setTransactionOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
                      >
                        {t.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="relative" ref={majorTypeRef}>
              <button
                type="button"
                onClick={() => setMajorTypeOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {majorTypeLabel}
                <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden />
              </button>
              {majorTypeOpen && (
                <ul
                  className="absolute left-0 top-full z-20 mt-1 min-w-[140px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                  role="listbox"
                >
                  {MAJOR_PROPERTY_TYPES.map((m) => (
                    <li key={m.value} role="option">
                      <button
                        type="button"
                        onClick={() => {
                          updateParams({ property_type: m.value });
                          setMajorTypeOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
                      >
                        {m.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Location */}
            <div className="relative flex min-w-0 flex-1 basis-[200px] items-center rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2">
              <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onBlur={handleLocationBlur}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                placeholder="พื้นที่ เช่น บางเขน กรุงเทพ"
                className="min-w-0 flex-1 border-0 bg-transparent pl-2 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-0"
                aria-label="พื้นที่"
              />
              {locationInput && (
                <button
                  type="button"
                  onClick={handleLocationClear}
                  className="rounded p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
                  aria-label="ล้างพื้นที่"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>
          </div>

          {/* แถวสอง: ราคา, ห้องนอน, ประเภท + ปุ่มค้นหา */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 sm:mt-4 sm:gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="relative" ref={priceRef}>
                <button
                  type="button"
                  onClick={() => setPriceOpen((o) => !o)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
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
                            updateParams({
                              min_price: preset.min,
                              max_price: preset.max,
                            });
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

              <div className="relative" ref={propertyTypeRef}>
                <button
                  type="button"
                  onClick={() => setPropertyTypeOpen((o) => !o)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  {propertyTypeLabel}
                  <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden />
                </button>
                {propertyTypeOpen && (
                  <ul
                    className="absolute left-0 top-full z-20 mt-1 min-w-[140px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                    role="listbox"
                  >
                    {PROPERTY_TYPES.map((p) => (
                      <li key={p.value} role="option">
                        <button
                          type="button"
                          onClick={() => {
                            updateParams({ residential_property_type: p.value });
                            setPropertyTypeOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
                        >
                          {p.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {}}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
              style={{ backgroundColor: PRIMARY }}
              aria-label="ค้นหา"
            >
              <Search className="h-4 w-4" aria-hidden />
              ค้นหา
            </button>
          </div>
        </div>
      </div>
    );

  if (embeddedInHero) return card;

  return (
    <section
      className="relative px-4 pb-8 pt-6 sm:px-6 lg:px-8"
      style={{
        background: "linear-gradient(135deg, rgba(1,92,80,0.06) 0%, rgba(255,255,255,0) 50%)",
      }}
    >
      {card}
    </section>
  );
}

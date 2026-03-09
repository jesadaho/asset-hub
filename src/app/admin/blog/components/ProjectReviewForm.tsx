"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { DISTRICTS } from "@/lib/districts";

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

function slugFromTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

type ImageEntry = { key: string; url: string | null };

export type MarketRentEntry = { roomType: string; priceRange: string };

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

function serializeMarketRentEntries(entries: MarketRentEntry[]): string {
  return entries
    .filter((e) => e.roomType.trim() || e.priceRange.trim())
    .map((e) => `${e.roomType.trim()}: ${e.priceRange.trim()}`)
    .join(" | ");
}

function formatPriceRangeFromObject(pr: unknown): string {
  if (typeof pr === "string") return pr.trim();
  if (pr && typeof pr === "object" && "min" in pr && "max" in pr) {
    const min = Number((pr as { min: number }).min);
    const max = Number((pr as { max: number }).max);
    if (!Number.isNaN(min) && !Number.isNaN(max))
      return `${min.toLocaleString()} - ${max.toLocaleString()} THB`;
  }
  return "";
}

function formatRentalKey(key: string): string {
  const k = key.trim().toLowerCase();
  if (k === "studio_28sqm" || k === "studio_28") return "Studio (28 sqm)";
  if (k === "one_bed_28sqm" || k === "one_bed_28") return "1 Bed (28 sqm)";
  if (k === "two_bed_28sqm" || k === "two_bed_28") return "2 Bed (28 sqm)";
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseContentProsCons(full: string): { main: string; pros: string[]; cons: string[] } {
  let main = full.trim();
  const pros: string[] = [];
  const cons: string[] = [];
  const prosHeader = /##\s*ข้อดี\s*\n+/i;
  const consHeader = /##\s*ข้อเสีย\s*\n+/i;
  const prosIdx = full.search(prosHeader);
  if (prosIdx >= 0) {
    main = full.slice(0, prosIdx).trim();
    const afterPros = full.slice(prosIdx).replace(prosHeader, "");
    const consIdxRel = afterPros.search(consHeader);
    const prosBlock = consIdxRel >= 0 ? afterPros.slice(0, consIdxRel) : afterPros;
    const consBlock = consIdxRel >= 0 ? afterPros.slice(consIdxRel).replace(consHeader, "") : "";
    prosBlock.split(/\n/).forEach((line) => {
      const m = line.match(/^\s*[-*]\s*(.+)$/);
      if (m && m[1].trim()) pros.push(m[1].trim());
    });
    consBlock.split(/\n/).forEach((line) => {
      const m = line.match(/^\s*[-*]\s*(.+)$/);
      if (m && m[1].trim()) cons.push(m[1].trim());
    });
  }
  return { main, pros, cons };
}

function buildContentWithProsCons(main: string, pros: string[], cons: string[]): string {
  const parts = [main.trim()];
  if (pros.length > 0) parts.push("\n\n## ข้อดี\n\n" + pros.map((p) => `- ${p}`).join("\n"));
  if (cons.length > 0) parts.push("\n\n## ข้อเสีย\n\n" + cons.map((c) => `- ${c}`).join("\n"));
  return parts.join("");
}

type PostData = {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: string;
  type?: string;
  projectName?: string;
  developer?: string;
  location?: string;
  district?: string;
  yearBuilt?: number | string;
  yieldPercent?: number;
  capitalGainPercent?: number;
  marketRentDisplay?: string;
  pricePerSqm?: number;
  priceMin?: number;
  priceMax?: number;
  avgRentPrice?: number;
  occupancyRatePercent?: number;
  avgDaysOnMarket?: number;
  demandScore?: "high" | "medium" | "low";
  managementQuality?: number;
  parkingRatioPercent?: number;
  commonFeePerSqm?: number;
  distanceToTransit?: string;
  nearbyCatalyst?: string;
  imageKeys?: string[];
  metaDescription?: string;
  metaImage?: string;
};

type ProjectReviewFormProps = {
  mode: "edit" | "create";
  id?: string;
};

export function ProjectReviewForm({ mode, id }: ProjectReviewFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [projectName, setProjectName] = useState("");
  const [developer, setDeveloper] = useState("");
  const [location, setLocation] = useState("");
  const [yearBuilt, setYearBuilt] = useState<string>("");
  const [yieldPercent, setYieldPercent] = useState<number | "">("");
  const [avgRentPrice, setAvgRentPrice] = useState<number | "">("");
  const [capitalGainPercent, setCapitalGainPercent] = useState<number | "">("");
  const [marketRentEntries, setMarketRentEntries] = useState<MarketRentEntry[]>([]);
  const [pricePerSqm, setPricePerSqm] = useState<number | "">("");
  const [priceMin, setPriceMin] = useState<number | "">("");
  const [priceMax, setPriceMax] = useState<number | "">("");
  const [occupancyRatePercent, setOccupancyRatePercent] = useState<
    number | ""
  >("");
  const [avgDaysOnMarket, setAvgDaysOnMarket] = useState<number | "">("");
  const [demandScore, setDemandScore] = useState<
    "high" | "medium" | "low" | ""
  >("");
  const [managementQuality, setManagementQuality] = useState<number | "">("");
  const [parkingRatioPercent, setParkingRatioPercent] = useState<
    number | ""
  >("");
  const [commonFeePerSqm, setCommonFeePerSqm] = useState<number | "">("");
  const [distanceToTransit, setDistanceToTransit] = useState("");
  const [nearbyCatalyst, setNearbyCatalyst] = useState("");
  const [district, setDistrict] = useState("");
  const [subDistrict, setSubDistrict] = useState("");
  const [neighborhoodTags, setNeighborhoodTags] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaImage, setMetaImage] = useState("");
  const [content, setContent] = useState("");
  const [pros, setPros] = useState<string[]>([]);
  const [cons, setCons] = useState<string[]>([]);
  const [imageEntries, setImageEntries] = useState<ImageEntry[]>([]);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [loading, setLoading] = useState(mode === "edit");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [manualJson, setManualJson] = useState("");
  const [manualJsonError, setManualJsonError] = useState<string | null>(null);
  const [editorContentKey, setEditorContentKey] = useState(0);
  const [dataSourceTab, setDataSourceTab] = useState<"ai" | "manual">("ai");
  const [viewTab, setViewTab] = useState<"form" | "preview">("form");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const developerRef = useRef("");
  const priceMinRef = useRef<number | "">("");
  const priceMaxRef = useRef<number | "">("");

  const addImage = useCallback((key: string, url: string | null) => {
    setImageEntries((prev) => [...prev, { key, url }]);
  }, []);

  const removeImage = useCallback((key: string) => {
    setImageEntries((prev) => prev.filter((e) => e.key !== key));
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      setUploading(true);
      setError(null);
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          credentials: "include",
          body: form,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data.message ?? "Upload failed";
          if (msg === "S3 bucket not configured") {
            setError(
              "ยังไม่ได้ตั้งค่า S3 สำหรับอัพรูป — กรุณาตั้งค่าใน .env.local: AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION"
            );
          } else {
            setError(msg);
          }
          return;
        }
        addImage(data.key, data.url ?? null);
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
      } finally {
        setUploading(false);
      }
    },
    [addImage]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
      e.target.value = "";
    },
    [handleFile]
  );

  async function fetchAiProjectData() {
    const name = projectName.trim();
    if (!name) {
      setError("กรุณากรอกชื่อโครงการก่อน");
      return;
    }
    setError(null);
    setAiLoading(true);
    try {
      const res = await fetch("/api/admin/ai/project-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ projectName: name }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message ?? "ไม่สามารถดึงข้อมูลได้");
        return;
      }
      const d = json.data as {
        project_basics?: {
          completion_year?: number;
          distance_to_transit?: string;
        };
        financial_insights?: {
          avg_rental_yield_pct?: number;
          capital_gain_3yr_pct?: number;
          avg_rent_per_sqm?: number;
          market_price_per_sqm?: number;
        };
        liquidity_score?: {
          occupancy_rate_pct?: number;
          demand_level?: string;
          avg_days_on_market?: number;
        };
        operational_data?: {
          common_fee_per_sqm?: number;
          parking_ratio_pct?: number;
          management_sentiment?: string;
        };
        summary_pros_cons?: { pros?: string[]; cons?: string[] };
      } | undefined;

      if (!d) return;

      const pb = d.project_basics;
      if (pb?.completion_year != null)
        setYearBuilt(String(pb.completion_year));
      if (pb?.distance_to_transit != null)
        setDistanceToTransit(pb.distance_to_transit);

      const fi = d.financial_insights;
      if (typeof fi?.avg_rental_yield_pct === "number")
        setYieldPercent(fi.avg_rental_yield_pct);
      if (typeof fi?.capital_gain_3yr_pct === "number")
        setCapitalGainPercent(fi.capital_gain_3yr_pct);
      if (typeof fi?.market_price_per_sqm === "number")
        setPricePerSqm(fi.market_price_per_sqm);
      if (typeof fi?.avg_rent_per_sqm === "number")
        setMarketRentEntries([
          {
            roomType: "เฉลี่ย",
            priceRange: `ประมาณ ${fi.avg_rent_per_sqm.toLocaleString()} บาท/ตร.ม.`,
          },
        ]);

      const ls = d.liquidity_score;
      if (typeof ls?.occupancy_rate_pct === "number")
        setOccupancyRatePercent(ls.occupancy_rate_pct);
      if (typeof ls?.avg_days_on_market === "number")
        setAvgDaysOnMarket(ls.avg_days_on_market);
      if (ls?.demand_level) {
        const level = ls.demand_level.toLowerCase();
        if (level === "high" || level === "medium" || level === "low")
          setDemandScore(level);
      }

      const od = d.operational_data;
      if (typeof od?.common_fee_per_sqm === "number")
        setCommonFeePerSqm(od.common_fee_per_sqm);
      if (typeof od?.parking_ratio_pct === "number")
        setParkingRatioPercent(od.parking_ratio_pct);
      if (od?.management_sentiment) {
        const match = od.management_sentiment.match(/[1-5]/);
        if (match) setManagementQuality(Number(match[0]));
      }

      const sc = d.summary_pros_cons;
      if (sc && (Array.isArray(sc.pros) || Array.isArray(sc.cons))) {
        if (Array.isArray(sc.pros) && sc.pros.length > 0) setPros(sc.pros);
        if (Array.isArray(sc.cons) && sc.cons.length > 0) setCons(sc.cons);
      }
    } finally {
      setAiLoading(false);
    }
  }

  function applyManualJson() {
    setManualJsonError(null);
    const raw = manualJson.trim();
    if (!raw) {
      setManualJsonError("กรุณาวาง JSON");
      return;
    }
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      setManualJsonError("JSON ไม่ถูกต้อง: " + (e instanceof Error ? e.message : String(e)));
      return;
    }
    if (!data || typeof data !== "object") {
      setManualJsonError("ต้องเป็น object");
      return;
    }
    const o = data as Record<string, unknown>;

    // รูปแบบ manual (project_info, investment_stats, verdict) หรือ (project_info, financial_performance, liquidity, operational, location, verdict)
    const projectInfo = o.project_info as Record<string, unknown> | undefined;
    const investmentStats = o.investment_stats as Record<string, unknown> | undefined;
    const projectLiquidity = o.project_liquidity as Record<string, unknown> | undefined;
    const operationalInsight = o.operational_insight as Record<string, unknown> | undefined;
    const locationContext = o.location_context as Record<string, unknown> | undefined;
    const verdict = o.verdict as Record<string, unknown> | undefined;
    const financialPerf = o.financial_performance as Record<string, unknown> | undefined;
    const liquidity = o.liquidity as Record<string, unknown> | undefined;
    const operational = o.operational as Record<string, unknown> | undefined;
    const locationData = o.location as Record<string, unknown> | undefined;

    if (projectInfo && typeof projectInfo === "object") {
      if (typeof projectInfo.name === "string") setProjectName(projectInfo.name.trim());
      if (typeof projectInfo.developer === "string") {
        const d = projectInfo.developer.trim();
        setDeveloper(d);
        developerRef.current = d;
      }
      if (typeof projectInfo.location === "string") setLocation(projectInfo.location.trim());
      if (projectInfo.completion_year != null) setYearBuilt(String(projectInfo.completion_year));
      if (typeof projectInfo.type === "string" && !locationContext?.nearby_catalyst) setNearbyCatalyst(projectInfo.type.trim());
    }

    if (investmentStats && typeof investmentStats === "object") {
      if (typeof investmentStats.price_per_sqm === "number") setPricePerSqm(investmentStats.price_per_sqm);
      const avgRent = investmentStats.average_rent_price ?? investmentStats.avg_rent_price;
      if (typeof avgRent === "number") setAvgRentPrice(avgRent);
      const marketRentArr = investmentStats.market_rent;
      if (Array.isArray(marketRentArr) && marketRentArr.length > 0) {
        const entries: MarketRentEntry[] = marketRentArr
          .filter((x): x is Record<string, unknown> => x && typeof x === "object")
          .map((x) => {
            const roomType = typeof x.room_type === "string" ? x.room_type.trim() : "";
            const pr = x.price_range;
            const priceRange = formatPriceRangeFromObject(pr) || (typeof pr === "string" ? pr.trim() : "");
            return { roomType, priceRange };
          });
        if (entries.length > 0) setMarketRentEntries(entries);
      } else {
        const rentalRange = investmentStats.rental_range;
        if (rentalRange && typeof rentalRange === "object") {
          const entries: MarketRentEntry[] = Object.entries(
            rentalRange as Record<string, unknown>
          )
            .filter(([, v]) => typeof v === "string")
            .map(([k, v]) => ({
              roomType: formatRentalKey(k),
              priceRange: String(v),
            }));
          if (entries.length > 0) setMarketRentEntries(entries);
        } else if (typeof investmentStats.rental_range === "string") {
          setMarketRentEntries(parseMarketRentDisplay(investmentStats.rental_range));
        }
      }
      const yieldStr = investmentStats.estimated_yield_percent ?? investmentStats.estimated_yield ?? investmentStats.rental_yield_percent;
      if (typeof yieldStr === "string") {
        const match = yieldStr.match(/[\d.]+/);
        if (match) setYieldPercent(parseFloat(match[0]));
      } else if (typeof yieldStr === "number") setYieldPercent(yieldStr);
      const gainStr = investmentStats.capital_gain_avg_percent ?? investmentStats.capital_gain_avg ?? investmentStats.capital_gain_percent;
      if (typeof gainStr === "string") {
        const match = gainStr.match(/[\d.]+/);
        if (match) setCapitalGainPercent(parseFloat(match[0]));
      } else if (typeof gainStr === "number") setCapitalGainPercent(gainStr);
    }

    if (projectLiquidity && typeof projectLiquidity === "object") {
      if (typeof projectLiquidity.occupancy_rate_percent === "number") setOccupancyRatePercent(projectLiquidity.occupancy_rate_percent);
      const daysVal = projectLiquidity.avg_days_on_market ?? projectLiquidity.days_on_market;
      if (typeof daysVal === "number") setAvgDaysOnMarket(daysVal);
      else if (typeof daysVal === "string") {
        const match = daysVal.match(/\d+/);
        if (match) setAvgDaysOnMarket(parseInt(match[0], 10));
      }
      const demandStr = projectLiquidity.demand_score ?? projectLiquidity.demand;
      if (typeof demandStr === "string") {
        const level = demandStr.toLowerCase();
        if (level === "high" || level === "medium" || level === "low") setDemandScore(level);
      }
    }

    if (operationalInsight && typeof operationalInsight === "object") {
      if (typeof operationalInsight.management_quality_stars === "number") setManagementQuality(operationalInsight.management_quality_stars);
      if (typeof operationalInsight.parking_ratio_percent === "number") setParkingRatioPercent(operationalInsight.parking_ratio_percent);
      if (typeof operationalInsight.common_fee_per_sqm === "number") setCommonFeePerSqm(operationalInsight.common_fee_per_sqm);
    }

    if (financialPerf && typeof financialPerf === "object") {
      if (typeof financialPerf.rental_yield_percent === "number") setYieldPercent(financialPerf.rental_yield_percent);
      if (typeof financialPerf.capital_gain_percent === "number") setCapitalGainPercent(financialPerf.capital_gain_percent);
      if (typeof financialPerf.price_per_sqm === "number") setPricePerSqm(financialPerf.price_per_sqm);
      if (typeof financialPerf.avg_rent_price === "number") setAvgRentPrice(financialPerf.avg_rent_price);
      const priceObj = financialPerf.price;
      if (priceObj && typeof priceObj === "object" && !Array.isArray(priceObj)) {
        if (typeof (priceObj as { min?: number }).min === "number") {
          const v = (priceObj as { min: number }).min;
          setPriceMin(v);
          priceMinRef.current = v;
        }
        if (typeof (priceObj as { max?: number }).max === "number") {
          const v = (priceObj as { max: number }).max;
          setPriceMax(v);
          priceMaxRef.current = v;
        }
      }
      const marketRent = financialPerf.market_rent;
      const rentalRange = financialPerf.rental_range;
      if (Array.isArray(marketRent) && marketRent.length > 0) {
        const entries: MarketRentEntry[] = marketRent
          .filter((x): x is Record<string, unknown> => x && typeof x === "object")
          .map((x) => {
            const roomType = typeof x.room_type === "string" ? x.room_type.trim() : "";
            const pr = x.price_range;
            const priceRange = formatPriceRangeFromObject(pr) || (typeof pr === "string" ? pr.trim() : "");
            return { roomType, priceRange };
          });
        if (entries.length > 0) setMarketRentEntries(entries);
      } else if (rentalRange != null) {
        if (Array.isArray(rentalRange) && rentalRange.length > 0) {
          const entries: MarketRentEntry[] = rentalRange
            .filter((x): x is Record<string, unknown> => x && typeof x === "object")
            .map((x) => ({
              roomType: typeof x.room_type === "string" ? x.room_type.trim() : "",
              priceRange: typeof x.price_range === "string" ? x.price_range.trim() : "",
            }));
          if (entries.length > 0) setMarketRentEntries(entries);
        } else if (typeof rentalRange === "object" && !Array.isArray(rentalRange)) {
          const entries: MarketRentEntry[] = Object.entries(
            rentalRange as Record<string, unknown>
          )
            .filter(([, v]) => typeof v === "string")
            .map(([k, v]) => ({
              roomType: formatRentalKey(k),
              priceRange: String(v),
            }));
          if (entries.length > 0) setMarketRentEntries(entries);
        } else if (typeof rentalRange === "string") {
          setMarketRentEntries(parseMarketRentDisplay(rentalRange));
        }
      }
    }
    if (liquidity && typeof liquidity === "object") {
      if (typeof liquidity.occupancy_rate_percent === "number") setOccupancyRatePercent(liquidity.occupancy_rate_percent);
      const daysVal = liquidity.days_on_market ?? liquidity.avg_days_on_market;
      if (typeof daysVal === "number") setAvgDaysOnMarket(daysVal);
      if (typeof liquidity.demand === "string") {
        const level = liquidity.demand.toLowerCase();
        if (level === "high" || level === "medium" || level === "low") setDemandScore(level);
      }
    }
    if (operational && typeof operational === "object") {
      if (typeof operational.management_stars === "number") setManagementQuality(operational.management_stars);
      if (typeof operational.parking_percent === "number") setParkingRatioPercent(operational.parking_percent);
      if (typeof operational.common_fee_per_sqm === "number") setCommonFeePerSqm(operational.common_fee_per_sqm);
    }
    if (locationData && typeof locationData === "object") {
      if (typeof locationData.transit === "string") setDistanceToTransit(locationData.transit.trim());
      if (typeof locationData.catalyst === "string") setNearbyCatalyst(locationData.catalyst.trim());
      const dist = typeof locationData.district === "string" ? locationData.district.trim() : "";
      const subDist = typeof locationData.sub_district === "string" ? locationData.sub_district.trim() : "";
      setDistrict(dist);
      setSubDistrict(subDist);
      if (dist || subDist) {
        const locParts = [subDist, dist].filter(Boolean);
        if (locParts.length) setLocation(locParts.join(", "));
      }
      const tags = locationData.neighborhood_tags;
      if (Array.isArray(tags) && tags.length > 0) {
        setNeighborhoodTags(tags.map((t) => String(t).trim()).filter(Boolean).join(", "));
      }
    }

    if (locationContext && typeof locationContext === "object") {
      if (typeof locationContext.distance_to_transit === "string") setDistanceToTransit(locationContext.distance_to_transit.trim());
      if (typeof locationContext.nearby_catalyst === "string") setNearbyCatalyst(locationContext.nearby_catalyst.trim());
    }

    if (verdict && typeof verdict === "object") {
      const vPros = verdict.pros;
      const vCons = verdict.cons;
      if (Array.isArray(vPros) && vPros.length > 0) setPros(vPros.map((p) => String(p)));
      if (Array.isArray(vCons) && vCons.length > 0) setCons(vCons.map((c) => String(c)));
    }

    // รูปแบบ Gemini (project_basics, financial_insights, ...)
    const pb = o.project_basics as Record<string, unknown> | undefined;
    const fi = o.financial_insights as Record<string, unknown> | undefined;
    const ls = o.liquidity_score as Record<string, unknown> | undefined;
    const od = o.operational_data as Record<string, unknown> | undefined;
    const sc = o.summary_pros_cons as { pros?: string[]; cons?: string[] } | undefined;

    if (pb && typeof pb === "object") {
      if (pb.completion_year != null) setYearBuilt(String(pb.completion_year));
      if (typeof pb.distance_to_transit === "string") setDistanceToTransit(pb.distance_to_transit);
    }
    if (fi && typeof fi === "object") {
      if (typeof fi.avg_rental_yield_pct === "number") setYieldPercent(fi.avg_rental_yield_pct);
      if (typeof fi.capital_gain_3yr_pct === "number") setCapitalGainPercent(fi.capital_gain_3yr_pct);
      if (typeof fi.market_price_per_sqm === "number") setPricePerSqm(fi.market_price_per_sqm);
      if (typeof fi.avg_rent_per_sqm === "number") {
        setMarketRentEntries([
          {
            roomType: "เฉลี่ย",
            priceRange: `ประมาณ ${fi.avg_rent_per_sqm.toLocaleString()} บาท/ตร.ม.`,
          },
        ]);
      }
    }
    if (ls && typeof ls === "object") {
      if (typeof ls.occupancy_rate_pct === "number") setOccupancyRatePercent(ls.occupancy_rate_pct);
      if (typeof ls.avg_days_on_market === "number") setAvgDaysOnMarket(ls.avg_days_on_market);
      if (typeof ls.demand_level === "string") {
        const level = ls.demand_level.toLowerCase();
        if (level === "high" || level === "medium" || level === "low") setDemandScore(level);
      }
    }
    if (od && typeof od === "object") {
      if (typeof od.common_fee_per_sqm === "number") setCommonFeePerSqm(od.common_fee_per_sqm);
      if (typeof od.parking_ratio_pct === "number") setParkingRatioPercent(od.parking_ratio_pct);
      if (typeof od.management_sentiment === "string") {
        const match = od.management_sentiment.match(/[1-5]/);
        if (match) setManagementQuality(Number(match[0]));
      }
    }
    if (sc && (Array.isArray(sc.pros) || Array.isArray(sc.cons))) {
      if (Array.isArray(sc.pros) && sc.pros.length > 0) setPros(sc.pros);
      if (Array.isArray(sc.cons) && sc.cons.length > 0) setCons(sc.cons);
    }

    setManualJsonError(null);
    setEditorContentKey((k) => k + 1);
  }

  useEffect(() => {
    if (mode !== "edit" || !id) {
      if (mode === "create") setLoading(false);
      return;
    }
    fetch(`/api/admin/blog/${id}`, { credentials: "include", cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then(async (data: PostData) => {
        setTitle(data.title ?? "");
        setSlug(data.slug ?? "");
        setProjectName(data.projectName ?? "");
        const devStr = data.developer ?? "";
        setDeveloper(devStr);
        developerRef.current = devStr;
        setLocation(data.location ?? "");
        setDistrict(data.district ?? "");
        setYearBuilt(
          data.yearBuilt !== undefined && data.yearBuilt !== null
            ? String(data.yearBuilt)
            : ""
        );
        setYieldPercent(
          typeof data.yieldPercent === "number" ? data.yieldPercent : ""
        );
        setAvgRentPrice(
          typeof data.avgRentPrice === "number" ? data.avgRentPrice : ""
        );
        setCapitalGainPercent(
          typeof data.capitalGainPercent === "number"
            ? data.capitalGainPercent
            : ""
        );
        setMarketRentEntries(parseMarketRentDisplay(data.marketRentDisplay ?? ""));
        setPricePerSqm(
          typeof data.pricePerSqm === "number" ? data.pricePerSqm : ""
        );
        const pMinVal = typeof data.priceMin === "number" ? data.priceMin : "";
        const pMaxVal = typeof data.priceMax === "number" ? data.priceMax : "";
        setPriceMin(pMinVal);
        setPriceMax(pMaxVal);
        priceMinRef.current = pMinVal;
        priceMaxRef.current = pMaxVal;
        setOccupancyRatePercent(
          typeof data.occupancyRatePercent === "number"
            ? data.occupancyRatePercent
            : ""
        );
        setAvgDaysOnMarket(
          typeof data.avgDaysOnMarket === "number" ? data.avgDaysOnMarket : ""
        );
        setDemandScore(
          data.demandScore === "high" ||
            data.demandScore === "medium" ||
            data.demandScore === "low"
            ? data.demandScore
            : ""
        );
        setManagementQuality(
          typeof data.managementQuality === "number"
            ? data.managementQuality
            : ""
        );
        setParkingRatioPercent(
          typeof data.parkingRatioPercent === "number"
            ? data.parkingRatioPercent
            : ""
        );
        setCommonFeePerSqm(
          typeof data.commonFeePerSqm === "number" ? data.commonFeePerSqm : ""
        );
        setDistanceToTransit(data.distanceToTransit ?? "");
        const savedCatalyst = data.nearbyCatalyst ?? "";
        if (savedCatalyst.includes(" · ")) {
          const idx = savedCatalyst.indexOf(" · ");
          setNearbyCatalyst(savedCatalyst.slice(0, idx).trim());
          setNeighborhoodTags(savedCatalyst.slice(idx + 3).trim());
        } else {
          setNearbyCatalyst(savedCatalyst);
          setNeighborhoodTags("");
        }
        if (!(data.district ?? "").trim()) {
          setSubDistrict("");
          if (typeof data.location === "string" && data.location.includes(", ")) {
            const parts = data.location.split(",").map((s) => s.trim());
            if (parts.length >= 2) {
              setSubDistrict(parts[0] ?? "");
              setDistrict(parts[1] ?? "");
            } else {
              setDistrict("");
            }
          } else {
            setDistrict("");
          }
        }
        setMetaDescription(data.metaDescription ?? "");
        setMetaImage(data.metaImage ?? "");
        const { main, pros: loadedPros, cons: loadedCons } = parseContentProsCons(data.content ?? "");
        setContent(main);
        setPros(loadedPros);
        setCons(loadedCons);
        setEditorContentKey((k) => k + 1);
        setStatus(
          data.status === "published" ? "published" : "draft"
        );
        const keys = data.imageKeys ?? [];
        if (keys.length === 0) {
          setImageEntries([]);
          return;
        }
        const urlRes = await fetch(
          `/api/admin/presigned-url?keys=${encodeURIComponent(keys.join(","))}`,
          { credentials: "include" }
        );
        const { urls } = (await urlRes.json().catch(() => ({}))) as {
          urls: (string | null)[];
        };
        setImageEntries(
          keys.map((key, i) => ({ key, url: urls?.[i] ?? null }))
        );
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [mode, id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const finalTitle = title.trim();
    if (!finalTitle) {
      setError("กรุณากรอกชื่อเรื่อง");
      return;
    }
    const dev = developerRef.current.trim();
    const pMin = priceMinRef.current;
    const pMax = priceMaxRef.current;
    const numPriceMin = typeof pMin === "number" && !Number.isNaN(pMin) ? pMin : undefined;
    const numPriceMax = typeof pMax === "number" && !Number.isNaN(pMax) ? pMax : undefined;
    setSubmitting(true);
    const payload = {
      type: "project_review" as const,
      title: finalTitle,
      slug: slug.trim() || slugFromTitle(finalTitle),
      content: buildContentWithProsCons(content, pros, cons),
      status,
      projectName: projectName.trim(),
      developer: dev,
      location: (subDistrict || district) ? [subDistrict, district].filter(Boolean).join(", ") : location.trim(),
      district: district.trim() || undefined,
      yearBuilt: yearBuilt.trim() || undefined,
      yieldPercent: typeof yieldPercent === "number" ? yieldPercent : undefined,
      capitalGainPercent:
        typeof capitalGainPercent === "number" ? capitalGainPercent : undefined,
      marketRentDisplay: serializeMarketRentEntries(marketRentEntries) || undefined,
      pricePerSqm: typeof pricePerSqm === "number" ? pricePerSqm : undefined,
      priceMin: numPriceMin,
      priceMax: numPriceMax,
      avgRentPrice: typeof avgRentPrice === "number" ? avgRentPrice : undefined,
      occupancyRatePercent:
        typeof occupancyRatePercent === "number"
          ? occupancyRatePercent
          : undefined,
      avgDaysOnMarket:
        typeof avgDaysOnMarket === "number" ? avgDaysOnMarket : undefined,
      demandScore:
        demandScore === "high" ||
        demandScore === "medium" ||
        demandScore === "low"
          ? demandScore
          : undefined,
      managementQuality:
        typeof managementQuality === "number" ? managementQuality : undefined,
      parkingRatioPercent:
        typeof parkingRatioPercent === "number"
          ? parkingRatioPercent
          : undefined,
      commonFeePerSqm:
        typeof commonFeePerSqm === "number" ? commonFeePerSqm : undefined,
      distanceToTransit: distanceToTransit.trim() || undefined,
      nearbyCatalyst: [nearbyCatalyst.trim(), neighborhoodTags.trim()].filter(Boolean).join(" · ") || undefined,
      metaDescription: metaDescription.trim() || undefined,
      metaImage: metaImage.trim() || undefined,
      imageKeys: imageEntries.map((e) => e.key),
    };
    const url = mode === "edit" && id ? `/api/admin/blog/${id}` : "/api/admin/blog";
    const method = mode === "edit" && id ? "PATCH" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? "เกิดข้อผิดพลาด");
        return;
      }
      router.push("/admin/blog");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-slate-500">กำลังโหลด...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center gap-4">
        <Link
          href="/admin/blog"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          กลับไปรายการ
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">
          {mode === "edit" ? "แก้ไข Project Review" : "สร้าง Project Review"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-1 rounded-lg bg-slate-200/80 p-1 w-fit">
          <button
            type="button"
            onClick={() => setViewTab("form")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              viewTab === "form"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ฟอร์ม
          </button>
          <button
            type="button"
            onClick={() => setViewTab("preview")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              viewTab === "preview"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Preview
          </button>
        </div>

        {viewTab === "form" && (
        <div className="flex flex-col gap-6">
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">
              ชื่อเรื่อง / Slug
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ชื่อเรื่อง"
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Slug"
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">
              Metadata (SEO)
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500">
                  Meta description — สำหรับผลค้นหาและแชร์ลิงก์
                </label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="คำอธิบายสั้นๆ..."
                  rows={2}
                  maxLength={320}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500">
                  รูปภาพ (Meta/OG) — URL รูปสำหรับแชร์
                </label>
                <input
                  type="url"
                  value={metaImage}
                  onChange={(e) => setMetaImage(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
                {metaImage && (
                  <img
                    src={metaImage}
                    alt=""
                    className="mt-2 max-h-24 rounded-lg border border-slate-200 object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">
              Project Meta
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs text-slate-500">
                  ชื่อโครงการ
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500">นักพัฒนา</label>
                <input
                  name="developer"
                  type="text"
                  value={developer}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDeveloper(v);
                    developerRef.current = v;
                  }}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  placeholder="เช่น Ananda Development"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500">เขต</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                >
                  <option value="">— เลือกเขต —</option>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500">ทำเล (ข้อความเต็ม)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  placeholder="เช่น อ่อนนุช บางนา"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500">
                  ปีที่สร้าง
                </label>
                <input
                  type="text"
                  value={yearBuilt}
                  onChange={(e) => setYearBuilt(e.target.value)}
                  placeholder="เช่น 2023"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-4">
            <div className="mb-3 flex gap-1 rounded-lg bg-slate-200/80 p-1">
              <button
                type="button"
                onClick={() => setDataSourceTab("ai")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  dataSourceTab === "ai"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ดึงจาก AI
              </button>
              <button
                type="button"
                onClick={() => setDataSourceTab("manual")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  dataSourceTab === "manual"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                วาง JSON
              </button>
            </div>
            {dataSourceTab === "ai" ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={fetchAiProjectData}
                  disabled={!projectName.trim() || aiLoading}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: projectName.trim() && !aiLoading ? PRIMARY : "#94a3b8",
                  }}
                >
                  {aiLoading ? "กำลังดึงข้อมูล..." : "ดึงข้อมูลจาก AI"}
                </button>
                {!projectName.trim() && (
                  <span className="text-sm text-slate-500">
                    กรุณากรอกชื่อโครงการด้านบนก่อน
                  </span>
                )}
              </div>
            ) : (
              <>
                <textarea
                  value={manualJson}
                  onChange={(e) => {
                    setManualJson(e.target.value);
                    if (manualJsonError) setManualJsonError(null);
                  }}
                  placeholder='วาง JSON เช่น {"project_info":{...},"investment_stats":{...},"verdict":{...}}'
                  rows={6}
                  className="mb-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900"
                />
                {manualJsonError && (
                  <p className="mb-2 text-sm text-red-600">{manualJsonError}</p>
                )}
                <button
                  type="button"
                  onClick={applyManualJson}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  นำ JSON เข้าฟอร์ม
                </button>
              </>
            )}
          </div>

          {/* 1. Financial Performance */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">
              1. Financial Performance (ตัวเลขผลตอบแทน)
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-xs text-slate-500">
                  Rental Yield (%)
                </label>
                <div className="mt-1 flex rounded-lg border border-slate-300 bg-white">
                  <input
                    type="number"
                    step="any"
                    value={yieldPercent === "" ? "" : yieldPercent}
                    onChange={(e) =>
                      setYieldPercent(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="w-full rounded-l-lg px-3 py-2 text-sm text-slate-900"
                  />
                  <span className="flex items-center rounded-r-lg bg-slate-100 px-2 text-sm text-slate-500">
                    %
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500">
                  Capital Gain (%)
                </label>
                <div className="mt-1 flex rounded-lg border border-slate-300 bg-white">
                  <input
                    type="number"
                    step="any"
                    value={capitalGainPercent === "" ? "" : capitalGainPercent}
                    onChange={(e) =>
                      setCapitalGainPercent(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="w-full rounded-l-lg px-3 py-2 text-sm text-slate-900"
                  />
                  <span className="flex items-center rounded-r-lg bg-slate-100 px-2 text-sm text-slate-500">
                    %
                  </span>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-500">
                  Market Rent (ช่วงราคาค่าเช่าจริง)
                </label>
                <div className="mt-1 overflow-x-auto rounded-lg border border-slate-300 bg-white">
                  <table className="w-full min-w-[280px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-2 py-1.5 text-left text-xs font-medium text-slate-500">
                          Room Type
                        </th>
                        <th className="px-2 py-1.5 text-left text-xs font-medium text-slate-500">
                          Price Range
                        </th>
                        <th className="w-8 px-1 py-1.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {marketRentEntries.map((entry, i) => (
                        <tr key={i} className="border-b border-slate-100 last:border-0">
                          <td className="px-2 py-1">
                            <input
                              type="text"
                              value={entry.roomType}
                              onChange={(e) => {
                                const next = [...marketRentEntries];
                                next[i] = { ...next[i], roomType: e.target.value };
                                setMarketRentEntries(next);
                              }}
                              placeholder="เช่น Studio (28 sqm)"
                              className="w-full rounded border border-slate-200 px-2 py-1 text-slate-900"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="text"
                              value={entry.priceRange}
                              onChange={(e) => {
                                const next = [...marketRentEntries];
                                next[i] = { ...next[i], priceRange: e.target.value };
                                setMarketRentEntries(next);
                              }}
                              placeholder="เช่น 8,500 - 9,500 THB"
                              className="w-full rounded border border-slate-200 px-2 py-1 text-slate-900"
                            />
                          </td>
                          <td className="px-1 py-1">
                            <button
                              type="button"
                              onClick={() =>
                                setMarketRentEntries(
                                  marketRentEntries.filter((_, j) => j !== i)
                                )
                              }
                              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                              title="ลบแถว"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="border-t border-slate-200 p-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setMarketRentEntries([
                          ...marketRentEntries,
                          { roomType: "", priceRange: "" },
                        ])
                      }
                      className="rounded border border-dashed border-slate-300 px-2 py-1 text-xs text-slate-500 hover:border-slate-400 hover:text-slate-700"
                    >
                      + เพิ่มแถว
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500">
                  Price per Sq.m.
                </label>
                <div className="mt-1 flex rounded-lg border border-slate-300 bg-white">
                  <input
                    type="number"
                    step="any"
                    value={pricePerSqm === "" ? "" : pricePerSqm}
                    onChange={(e) =>
                      setPricePerSqm(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="w-full rounded-l-lg px-3 py-2 text-sm text-slate-900"
                  />
                  <span className="flex items-center rounded-r-lg bg-slate-100 px-2 text-sm text-slate-500">
                    THB
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500">Price (min) THB</label>
                <div className="mt-1 flex rounded-lg border border-slate-300 bg-white">
                  <input
                    name="priceMin"
                    type="number"
                    step="1"
                    value={priceMin === "" ? "" : priceMin}
                    onChange={(e) => {
                      const v = e.target.value === "" ? "" : Number(e.target.value);
                      setPriceMin(v);
                      priceMinRef.current = v;
                    }}
                    placeholder="เช่น 3900000"
                    className="w-full rounded-l-lg px-3 py-2 text-sm text-slate-900"
                  />
                  <span className="flex items-center rounded-r-lg bg-slate-100 px-2 text-sm text-slate-500">
                    THB
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500">Price (max) THB</label>
                <div className="mt-1 flex rounded-lg border border-slate-300 bg-white">
                  <input
                    name="priceMax"
                    type="number"
                    step="1"
                    value={priceMax === "" ? "" : priceMax}
                    onChange={(e) => {
                      const v = e.target.value === "" ? "" : Number(e.target.value);
                      setPriceMax(v);
                      priceMaxRef.current = v;
                    }}
                    placeholder="เช่น 9000000"
                    className="w-full rounded-l-lg px-3 py-2 text-sm text-slate-900"
                  />
                  <span className="flex items-center rounded-r-lg bg-slate-100 px-2 text-sm text-slate-500">
                    THB
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500">
                  ราคาปล่อยเช่าเฉลี่ย
                </label>
                <div className="mt-1 flex rounded-lg border border-slate-300 bg-white">
                  <input
                    type="number"
                    step="any"
                    value={avgRentPrice === "" ? "" : avgRentPrice}
                    onChange={(e) =>
                      setAvgRentPrice(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="w-full rounded-l-lg px-3 py-2 text-sm text-slate-900"
                  />
                  <span className="flex items-center rounded-r-lg bg-slate-100 px-2 text-sm text-slate-500">
                    THB
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Project Liquidity */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">
              2. Project Liquidity (สภาพคล่อง)
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs text-slate-500">
                  Occupancy Rate (%)
                </label>
                <div className="mt-1 flex rounded-lg border border-slate-300 bg-white">
                  <input
                    type="number"
                    step="any"
                    value={
                      occupancyRatePercent === "" ? "" : occupancyRatePercent
                    }
                    onChange={(e) =>
                      setOccupancyRatePercent(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="w-full rounded-l-lg px-3 py-2 text-sm text-slate-900"
                  />
                  <span className="flex items-center rounded-r-lg bg-slate-100 px-2 text-sm text-slate-500">
                    %
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500">
                  Avg. Days on Market
                </label>
                <input
                  type="number"
                  value={avgDaysOnMarket === "" ? "" : avgDaysOnMarket}
                  onChange={(e) =>
                    setAvgDaysOnMarket(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500">
                  Demand Score
                </label>
                <select
                  value={demandScore}
                  onChange={(e) =>
                    setDemandScore(
                      e.target.value as "high" | "medium" | "low" | ""
                    )
                  }
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                >
                  <option value="">— เลือก —</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Operational Insight */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">
              3. Operational Insight (ข้อมูลการจัดการ)
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs text-slate-500">
                  Management Quality (1-5 ดาว)
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  step="0.1"
                  value={managementQuality === "" ? "" : managementQuality}
                  onChange={(e) => {
                    const v = e.target.value;
                    const n = Number(v);
                    setManagementQuality(
                      v === "" ? "" : (Number.isFinite(n) ? Math.min(5, Math.max(1, n)) : "")
                    );
                  }}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500">
                  Parking Ratio (%)
                </label>
                <div className="mt-1 flex rounded-lg border border-slate-300 bg-white">
                  <input
                    type="number"
                    step="any"
                    value={
                      parkingRatioPercent === "" ? "" : parkingRatioPercent
                    }
                    onChange={(e) =>
                      setParkingRatioPercent(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="w-full rounded-l-lg px-3 py-2 text-sm text-slate-900"
                  />
                  <span className="flex items-center rounded-r-lg bg-slate-100 px-2 text-sm text-slate-500">
                    %
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500">
                  Common Fee (ต่อ ตร.ม.)
                </label>
                <div className="mt-1 flex rounded-lg border border-slate-300 bg-white">
                  <input
                    type="number"
                    step="any"
                    value={commonFeePerSqm === "" ? "" : commonFeePerSqm}
                    onChange={(e) =>
                      setCommonFeePerSqm(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="w-full rounded-l-lg px-3 py-2 text-sm text-slate-900"
                  />
                  <span className="flex items-center rounded-r-lg bg-slate-100 px-2 text-sm text-slate-500">
                    THB
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Location Context */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">
              4. Location Context (ข้อมูลทำเล)
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-slate-500">เขต (District)</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    if (!subDistrict && !e.target.value) setLocation((l) => l);
                    else setLocation([subDistrict, e.target.value].filter(Boolean).join(", "));
                  }}
                  placeholder="เช่น พระโขนง"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500">แขวง (Sub-district)</label>
                <input
                  type="text"
                  value={subDistrict}
                  onChange={(e) => {
                    setSubDistrict(e.target.value);
                    if (!district && !e.target.value) setLocation((l) => l);
                    else setLocation([e.target.value, district].filter(Boolean).join(", "));
                  }}
                  placeholder="เช่น บางจาก"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-500">
                  Distance to Transit
                </label>
                <input
                  type="text"
                  value={distanceToTransit}
                  onChange={(e) => setDistanceToTransit(e.target.value)}
                  placeholder="เช่น 0m to BTS Bang Chak"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-500">
                  Nearby Catalyst (จุดดึงดูด)
                </label>
                <input
                  type="text"
                  value={nearbyCatalyst}
                  onChange={(e) => setNearbyCatalyst(e.target.value)}
                  placeholder="เช่น Starbucks & MaxValu Under Building, Bang Chak Market"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-500">
                  Neighborhood tags (คั่นด้วย comma)
                </label>
                <input
                  type="text"
                  value={neighborhoodTags}
                  onChange={(e) => setNeighborhoodTags(e.target.value)}
                  placeholder="เช่น Sukhumvit-Late, BTS-BangChak, High-Rise-Living"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">
              Main Review (Markdown)
            </h2>
            <MarkdownEditor
              key={editorContentKey}
              value={content}
              onChange={setContent}
              placeholder="เขียนเนื้อหาแบบ Markdown..."
              minHeight={380}
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">
              ข้อดี / ข้อเสีย
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">ข้อดี</label>
                <div className="space-y-1.5">
                  {pros.map((item, i) => (
                    <div key={i} className="flex gap-1">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const next = [...pros];
                          next[i] = e.target.value;
                          setPros(next);
                        }}
                        placeholder="ข้อดี..."
                        className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setPros(pros.filter((_, j) => j !== i))}
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="ลบ"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPros([...pros, ""])}
                    className="rounded border border-dashed border-slate-300 px-2 py-1 text-xs text-slate-500 hover:border-slate-400"
                  >
                    + เพิ่มข้อดี
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">ข้อเสีย</label>
                <div className="space-y-1.5">
                  {cons.map((item, i) => (
                    <div key={i} className="flex gap-1">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const next = [...cons];
                          next[i] = e.target.value;
                          setCons(next);
                        }}
                        placeholder="ข้อเสีย..."
                        className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setCons(cons.filter((_, j) => j !== i))}
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="ลบ"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCons([...cons, ""])}
                    className="rounded border border-dashed border-slate-300 px-2 py-1 text-xs text-slate-500 hover:border-slate-400"
                  >
                    + เพิ่มข้อเสีย
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">
              รูปภาพ
            </h2>
            <p className="mb-3 text-xs text-slate-500">
              อัปโหลดรูปใหม่ได้ตลอด — ลากวางหรือกดปุ่มด้านล่าง
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onFileInput}
              disabled={uploading}
              className="hidden"
              id="project-review-image-upload-edit"
            />
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`rounded-lg border-2 border-dashed p-6 text-center ${
                dragOver ? "border-[#068e7b] bg-emerald-50/50" : "border-slate-300"
              }`}
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: PRIMARY }}
              >
                {uploading ? "กำลังอัปโหลด..." : "อัพรูปใหม่"}
              </button>
              <p className="mt-2 text-sm text-slate-500">
                หรือลากวางรูปมาวางในกรอบนี้
              </p>
            </div>
            {imageEntries.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {imageEntries.map(({ key, url }) => (
                  <li
                    key={key}
                    className="relative inline-block rounded-lg border border-slate-200 bg-slate-50"
                  >
                    {url ? (
                      <img
                        src={url}
                        alt=""
                        className="h-20 w-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-slate-200 text-xs text-slate-500">
                        …
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(key)}
                      className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white hover:bg-red-600"
                    >
                      ลบ
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: PRIMARY }}
            >
              {submitting ? "กำลังบันทึก..." : "บันทึก"}
            </button>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "draft" | "published")
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <Link
              href="/admin/blog"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              ยกเลิก
            </Link>
          </div>
        </div>
        )}

        {viewTab === "preview" && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-6 max-w-3xl">
          <div className="space-y-8">
            <div>
              <p className="text-sm font-semibold text-slate-500">
                AssetHub | Insight
              </p>
              {projectName && (
                <h2 className="mt-1 text-xl font-semibold text-slate-900">
                  {projectName}
                </h2>
              )}
              {(location || yearBuilt) && (
                <p className="mt-0.5 text-sm text-slate-600">
                  {[location, yearBuilt].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>

            {/* ข้อมูลโครงการ (รวม location ใหม่: ทำเล, Transit, Catalyst) */}
            {(developer || location || yearBuilt || distanceToTransit || nearbyCatalyst || neighborhoodTags) && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  ข้อมูลโครงการ
                </p>
                <div className="space-y-2 text-sm text-slate-700">
                  {developer && (
                    <p>
                      <span className="text-slate-500">นักพัฒนา: </span>
                      <span style={{ color: PRIMARY }}>{developer}</span>
                    </p>
                  )}
                  {location && (
                    <p>
                      <span className="text-slate-500">ทำเล: </span>
                      <span style={{ color: PRIMARY }}>{location}</span>
                    </p>
                  )}
                  {yearBuilt && (
                    <p>
                      <span className="text-slate-500">ปีที่สร้าง: </span>
                      <span style={{ color: PRIMARY }}>{yearBuilt}</span>
                    </p>
                  )}
                  {distanceToTransit && (
                    <p>
                      <span className="text-slate-500">ระยะทาง BTS/Transit: </span>
                      <span style={{ color: PRIMARY }}>{distanceToTransit}</span>
                    </p>
                  )}
                  {nearbyCatalyst && (
                    <p>
                      <span className="text-slate-500">จุดดึงดูด (Catalyst): </span>
                      <span style={{ color: PRIMARY }}>{nearbyCatalyst}</span>
                    </p>
                  )}
                  {neighborhoodTags && (
                    <p>
                      <span className="text-slate-500">Neighborhood tags: </span>
                      <span style={{ color: PRIMARY }}>{neighborhoodTags}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Financial — card + grid */}
            {(typeof yieldPercent === "number" ||
              typeof capitalGainPercent === "number" ||
              marketRentEntries.length > 0 ||
              typeof pricePerSqm === "number" ||
              typeof avgRentPrice === "number") && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Financial Performance
                </p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {typeof yieldPercent === "number" && (
                    <div>
                      <span className="block text-xs text-slate-500">Rental Yield</span>
                      <span className={`text-lg ${yieldClasses[getYieldLevel(yieldPercent)]}`}>
                        {yieldPercent}%
                      </span>
                    </div>
                  )}
                  {typeof capitalGainPercent === "number" && (
                    <div>
                      <span className="block text-xs text-slate-500">Capital Gain</span>
                      <span className="text-lg font-semibold" style={{ color: PRIMARY }}>
                        {capitalGainPercent}%
                      </span>
                    </div>
                  )}
                  {typeof pricePerSqm === "number" && (
                    <div>
                      <span className="block text-xs text-slate-500">Price/Sq.m.</span>
                      <span className="text-lg font-semibold" style={{ color: PRIMARY }}>
                        {pricePerSqm.toLocaleString()} THB
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="block text-xs text-slate-500">ช่วงราคา (Price)</span>
                    <span className="text-lg font-semibold" style={{ color: PRIMARY }}>
                      {typeof priceMin === "number" && typeof priceMax === "number"
                        ? `${priceMin.toLocaleString()} - ${priceMax.toLocaleString()} THB`
                        : typeof priceMin === "number"
                          ? `${priceMin.toLocaleString()}+ THB`
                          : typeof priceMax === "number"
                            ? `ถึง ${priceMax.toLocaleString()} THB`
                            : "—"}
                    </span>
                  </div>
                  {typeof avgRentPrice === "number" && (
                    <div>
                      <span className="block text-xs text-slate-500">ราคาปล่อยเช่าเฉลี่ย</span>
                      <span className="text-lg font-semibold" style={{ color: PRIMARY }}>
                        {avgRentPrice.toLocaleString()} THB
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

            {/* Liquidity — card + grid */}
            {(typeof occupancyRatePercent === "number" ||
              typeof avgDaysOnMarket === "number" ||
              demandScore) && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Liquidity
                </p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {typeof occupancyRatePercent === "number" && (
                    <div>
                      <span className="block text-xs text-slate-500">Occupancy</span>
                      <span className="text-lg font-semibold" style={{ color: PRIMARY }}>
                        {occupancyRatePercent}%
                      </span>
                    </div>
                  )}
                  {typeof avgDaysOnMarket === "number" && (
                    <div>
                      <span className="block text-xs text-slate-500">Days on Market</span>
                      <span className="text-lg font-semibold" style={{ color: PRIMARY }}>
                        {avgDaysOnMarket}
                      </span>
                    </div>
                  )}
                  {demandScore && (
                    <div>
                      <span className="block text-xs text-slate-500">Demand</span>
                      <span className="text-lg font-semibold capitalize" style={{ color: PRIMARY }}>
                        {demandScore}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Operational — card + grid */}
            {(typeof managementQuality === "number" ||
              typeof parkingRatioPercent === "number" ||
              typeof commonFeePerSqm === "number") && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Operational
                </p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {typeof managementQuality === "number" && (
                    <div>
                      <span className="block text-xs text-slate-500">Management</span>
                      <span className="text-lg font-semibold" style={{ color: PRIMARY }}>
                        {managementQuality} ★
                      </span>
                    </div>
                  )}
                  {typeof parkingRatioPercent === "number" && (
                    <div>
                      <span className="block text-xs text-slate-500">Parking</span>
                      <span className="text-lg font-semibold" style={{ color: PRIMARY }}>
                        {parkingRatioPercent}%
                      </span>
                    </div>
                  )}
                  {typeof commonFeePerSqm === "number" && (
                    <div>
                      <span className="block text-xs text-slate-500">Common Fee</span>
                      <span className="text-lg font-semibold" style={{ color: PRIMARY }}>
                        {commonFeePerSqm} THB/ตร.ม.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {content && (
              <div className="prose prose-sm max-w-none prose-p:text-slate-700 [&_br]:block [&>*]:mb-4 [&>*:last-child]:mb-0 [&_h1]:mt-0 [&_h2]:mt-0 [&_h3]:mt-0">
                <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                  {content}
                </ReactMarkdown>
              </div>
            )}
            {(pros.length > 0 || cons.length > 0) && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {pros.length > 0 && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4">
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-800">
                      ข้อดี
                    </h3>
                    <ul className="space-y-1.5 text-sm text-emerald-900">
                      {pros.map((p, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-0.5 shrink-0 text-emerald-600" aria-hidden>✓</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {cons.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-800">
                      ข้อเสีย
                    </h3>
                    <ul className="space-y-1.5 text-sm text-amber-900">
                      {cons.map((c, i) => (
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
            {imageEntries.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {imageEntries.map(
                  ({ key, url }) =>
                    url && (
                      <img
                        key={key}
                        src={url}
                        alt=""
                        className="max-h-40 rounded-lg object-cover"
                      />
                    )
                )}
              </div>
            )}
          </div>
        </div>
        )}
      </form>
    </main>
  );
}

/**
 * Shared DDproperty API fetch + mapping for search and listing-by-id.
 * Used by /api/ddproperty/search and /api/ddproperty/listing/[id].
 */

const DDPROPERTY_BASE =
  "https://ddproperty-realtimeapi.p.rapidapi.com/ddproperty/properties/search";
const HOST = "ddproperty-realtimeapi.p.rapidapi.com";

const DEFAULT_QUERY_PARAMS: Record<string, string> = {
  property_type: "COMMERCIAL",
  listing_type: "SALE",
  residential_property_type: "CONDO",
  commercial_property_type: "ALL",
  location: "bangkok",
  language: "th",
};

export type DDPropertyItem = {
  id: string;
  imageUrl: string | null;
  price: number;
  priceDisplay: string | null;
  bedrooms: string | number | null;
  bathrooms: string | number | null;
  areaSqm: string | number | null;
  propertyType: string | null;
  title: string;
  location: string;
  listedAt: string | null;
  /** URL to listing detail on DDproperty (if API provides it) */
  detailUrl: string | null;
};

function pickFirstImage(obj: unknown): string | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  if (typeof o.imageUrl === "string" && o.imageUrl) return o.imageUrl;
  if (typeof o.image === "string" && o.image) return o.image;
  if (typeof o.thumbnail === "string" && o.thumbnail) return o.thumbnail;
  if (typeof o.cover_image === "string" && o.cover_image) return o.cover_image;
  const images =
    o.images ??
    o.photos ??
    o.imageUrls ??
    o.listingImages ??
    o.media ??
    o.photos_list;
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") {
      const f = first as Record<string, unknown>;
      const url = f.url ?? f.src ?? f.image ?? f.medium ?? f.large;
      if (typeof url === "string" && url) return url;
    }
  }
  return null;
}

function unwrapItem(raw: unknown): Record<string, unknown> {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const inner = o.listingData ?? o.listing ?? o.property ?? o.data;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    const innerObj = inner as Record<string, unknown>;
    const deep = innerObj.listingData ?? innerObj.listing ?? innerObj.data;
    const merged = { ...innerObj, ...o };
    if (deep && typeof deep === "object" && !Array.isArray(deep)) {
      Object.assign(merged, deep as Record<string, unknown>);
    }
    return merged;
  }
  return o;
}

function getTitleFromListingItem(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "";
  const item = raw as Record<string, unknown>;
  const listingData = item.listingData;
  if (listingData && typeof listingData === "object") {
    const ld = listingData as Record<string, unknown>;
    const v = ld.localizedTitle;
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  const segment = item.segment;
  if (segment && typeof segment === "object") {
    const seg = segment as Record<string, unknown>;
    const params = seg.parameters;
    if (params && typeof params === "object") {
      const p = params as Record<string, unknown>;
      const meta = p.metaData;
      if (meta && typeof meta === "object") {
        const m = meta as Record<string, unknown>;
        const ld = m.listingData;
        if (ld && typeof ld === "object") {
          const ldObj = ld as Record<string, unknown>;
          const t = ldObj.listingTitle;
          if (typeof t === "string" && t.trim()) return t.trim();
        }
      }
    }
  }
  const gaProduct = item.gaProduct;
  if (gaProduct && typeof gaProduct === "object") {
    const ga = gaProduct as Record<string, unknown>;
    const n = ga.name;
    if (typeof n === "string" && n.trim()) return n.trim();
  }
  return "";
}

function extractTitleString(obj: unknown): string {
  if (!obj || typeof obj !== "object") return "";
  const o = obj as Record<string, unknown>;
  const keys = [
    "localizedTitle", "title", "headline", "name", "subject", "listingTitle",
    "projectName", "titleEn", "titleTh", "displayName", "label", "caption", "text", "summary", "description",
  ];
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  if (o.listingData && typeof o.listingData === "object") {
    const s = extractTitleString(o.listingData);
    if (s) return s;
  }
  if (o.additionalData && typeof o.additionalData === "object") {
    const ad = o.additionalData as Record<string, unknown>;
    const v = ad.displayText ?? ad.title ?? ad.name ?? ad.area;
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function locationFromAdditionalData(additionalData: unknown): string {
  if (!additionalData || typeof additionalData !== "object") return "";
  const ad = additionalData as Record<string, unknown>;
  const parts: string[] = [];
  for (const key of ["district", "subdistrict", "area", "province", "region", "displayText"]) {
    const v = ad[key];
    if (typeof v === "string" && v.trim()) parts.push(v.trim());
  }
  return parts.join(", ");
}

function parsePrice(value: unknown): { num: number; display: string | null } {
  if (value == null) return { num: 0, display: null };
  if (typeof value === "number" && !Number.isNaN(value)) return { num: value, display: null };
  if (typeof value === "string") {
    const trimmed = value.trim();
    const num = Number(trimmed.replace(/[^\d.]/g, ""));
    if (!Number.isNaN(num) && num > 0) return { num, display: null };
    if (trimmed) return { num: 0, display: trimmed };
    return { num: 0, display: null };
  }
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    const num =
      Number(o.value ?? o.amount ?? o.min ?? o.price ?? 0) ||
      (typeof o.display === "string" ? Number(o.display.replace(/[^\d.]/g, "")) : 0) || 0;
    const display =
      typeof o.display === "string" ? o.display.trim()
        : typeof o.displayText === "string" ? o.displayText.trim()
          : typeof o.formatted === "string" ? o.formatted.trim()
            : null;
    return { num: num || 0, display: display || null };
  }
  return { num: 0, display: null };
}

function fromAdditionalData<T>(additionalData: unknown, ...keys: string[]): T | null {
  if (!additionalData || typeof additionalData !== "object") return null;
  const ad = additionalData as Record<string, unknown>;
  for (const key of keys) {
    const v = ad[key];
    if (v != null && v !== "") return v as T;
  }
  return null;
}

function asStringOrNumber(v: unknown): string | number | null {
  if (v == null) return null;
  if (typeof v === "string" || typeof v === "number") return v;
  return null;
}

function pickDetailUrl(obj: Record<string, unknown>): string | null {
  const keys = [
    "url",
    "detailUrl",
    "listingUrl",
    "permalink",
    "link",
    "href",
    "listing_url",
    "detail_url",
    "canonical_url",
  ];
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string" && v.trim().startsWith("http")) return v.trim();
  }
  const segment = obj.segment;
  if (segment && typeof segment === "object") {
    const seg = segment as Record<string, unknown>;
    const params = seg.parameters;
    if (params && typeof params === "object") {
      const p = params as Record<string, unknown>;
      const url = p.url ?? p.link ?? p.href;
      if (typeof url === "string" && url.trim().startsWith("http")) return url.trim();
    }
  }
  const listingData = obj.listingData;
  if (listingData && typeof listingData === "object") {
    const ld = listingData as Record<string, unknown>;
    const u = ld.url ?? ld.detailUrl ?? ld.permalink ?? ld.link;
    if (typeof u === "string" && u.trim().startsWith("http")) return u.trim();
  }
  return null;
}

function mapItem(raw: unknown, index: number): DDPropertyItem {
  const o = unwrapItem(raw);
  const id =
    typeof o.id === "string"
      ? o.id
      : typeof o._id === "string"
        ? o._id
        : typeof o.listing_id === "string"
          ? o.listing_id
          : String(o.id ?? o._id ?? o.listing_id ?? index);

  const priceSrc =
    o.price ?? o.list_price ?? o.asking_price ?? o.price_display ?? o.priceDisplay ?? o.priceFormatted;
  const { num: priceNum, display: priceDisplay } = parsePrice(priceSrc);

  const title =
    getTitleFromListingItem(raw) ||
    extractTitleString(o) ||
    extractTitleString(raw) ||
    (typeof o.description === "string" && o.description.trim().slice(0, 120)) ||
    "";

  const location =
    typeof o.location === "string"
      ? o.location
      : typeof o.address === "string"
        ? o.address
        : typeof o.area === "string"
          ? o.area
          : typeof o.subdistrict === "string"
            ? o.subdistrict
            : locationFromAdditionalData(o.additionalData) || "";

  const ad = o.additionalData;
  const bedrooms =
    o.bedrooms ?? o.beds ?? o.bed ?? o.bedroom ?? fromAdditionalData(ad, "bedrooms", "beds", "bedroom") ?? null;
  const bathrooms =
    o.bathrooms ?? o.baths ?? o.bath ?? o.bathroom ?? fromAdditionalData(ad, "bathrooms", "baths", "bathroom") ?? null;

  let listedAt: string | null = null;
  if (typeof o.listedAt === "string") listedAt = o.listedAt;
  else if (typeof o.createdAt === "string") listedAt = o.createdAt;
  else if (typeof o.date_listed === "string") listedAt = o.date_listed;
  else if (o.list_date && typeof o.list_date === "string") listedAt = o.list_date;
  else if (typeof o.published_at === "string") listedAt = o.published_at;

  return {
    id,
    imageUrl: pickFirstImage(o),
    price: priceNum,
    priceDisplay: priceDisplay || null,
    bedrooms: asStringOrNumber(bedrooms),
    bathrooms: asStringOrNumber(bathrooms),
    areaSqm: asStringOrNumber(
      o.areaSqm ?? o.sqm ?? o.area_sqm ?? o.square_meters ?? o.sqft ?? o.size_sqm ?? null,
    ),
    propertyType:
      typeof o.propertyType === "string"
        ? o.propertyType
        : typeof o.type === "string"
          ? o.type
          : typeof o.property_type === "string"
            ? o.property_type
            : null,
    title: title.trim() || "Property",
    location: location || "",
    listedAt,
    detailUrl: pickDetailUrl(o),
  };
}

function extractArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  const o = data as Record<string, unknown>;
  const pageProps = o.pageProps as Record<string, unknown> | undefined;
  const pageData = pageProps?.pageData as Record<string, unknown> | undefined;
  const dataObj = pageData?.data as Record<string, unknown> | undefined;
  const listingsData = dataObj?.listingsData;
  if (Array.isArray(listingsData)) return listingsData;
  for (const key of ["data", "results", "properties", "listings", "items"]) {
    if (Array.isArray(o[key])) return o[key] as unknown[];
  }
  if (dataObj && typeof dataObj === "object") {
    const keys = ["listingsData", "listings", "searchResults", "propertyList", "results", "data", "properties", "items", "listing"];
    for (const key of keys) {
      const val = dataObj[key];
      if (Array.isArray(val)) return val;
    }
    const searchResult = dataObj.searchResult ?? dataObj.searchResults;
    if (searchResult && typeof searchResult === "object") {
      const sr = searchResult as Record<string, unknown>;
      for (const k of ["listings", "results", "data", "properties", "items"]) {
        if (Array.isArray(sr[k])) return sr[k] as unknown[];
      }
    }
  }
  return [];
}

export type FetchOptions = {
  limit?: number;
  extraParams?: Record<string, string>;
};

/**
 * Fetch DDproperty search results and return mapped items.
 * Used by search API and by listing-by-id to find one item.
 */
export async function fetchDdpropertyItems(options: FetchOptions = {}): Promise<DDPropertyItem[]> {
  const key = process.env.RAPIDAPI_KEY?.trim();
  if (!key) {
    throw new Error("RAPIDAPI_KEY is not configured");
  }
  const limit = Math.min(Math.max(options.limit ?? 12, 1), 100);
  const params = new URLSearchParams(DEFAULT_QUERY_PARAMS);
  if (options.extraParams) {
    Object.entries(options.extraParams).forEach(([k, v]) => params.set(k, v));
  }
  const url = `${DDPROPERTY_BASE}?${params.toString()}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-host": HOST,
      "x-rapidapi-key": key,
    },
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`DDproperty API error: ${res.status} ${res.statusText}`);
  }
  const json: unknown = await res.json();
  const rawList = extractArray(json);
  return rawList.slice(0, limit).map((raw, i) => mapItem(raw, i));
}

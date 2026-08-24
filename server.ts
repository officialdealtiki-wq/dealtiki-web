import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

const BACKEND_BASE_URL =
  process.env.DEALTIKI_API_BASE_URL?.trim() ||
  "https://deal-intelligence-platform-nine.vercel.app";

// Server synchronization secret (strictly from env)
const DEALTIKI_SYNC_SECRET = process.env.DEALTIKI_SYNC_SECRET?.trim() || "";

// Supabase Service Client (server-side only, strictly using server envs)
const SUPABASE_URL = process.env.SUPABASE_URL?.trim() || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

let supabase: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    console.log("[DealTiki Server] Supabase persistence initialized with Service Role.");
  } catch (err) {
    console.warn("[DealTiki Server] Supabase initialization failed:", err);
  }
}

// In-memory cache for fast read performance
interface CacheEntry {
  timestamp: number;
  data: any[];
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

export function createSlug(title: string, id: string): string {
  const clean = (title || "deal")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const suffix = id
    ? id.replace(/[^a-z0-9]/gi, "").slice(-6).toLowerCase()
    : "dt";
  return `${clean}-${suffix}`;
}

export function simpleStableHash(str: string): string {
  let hash1 = 5381;
  let hash2 = 52711;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) ^ char;
    hash2 = ((hash2 << 5) + hash2) ^ char;
  }
  const part1 = Math.abs(hash1).toString(16).padStart(8, "0");
  const part2 = Math.abs(hash2).toString(16).padStart(8, "0");
  return `dt-${part1}${part2}`;
}

export function extractCuelinksOfferId(raw: any): string | null {
  if (!raw) return null;
  if (raw.offer_id) return String(raw.offer_id).trim();
  if (raw.offerId) return String(raw.offerId).trim();

  const urlStr =
    raw.affiliate_url ||
    raw.affiliateUrl ||
    raw.affiliateLink ||
    raw.trackingUrl ||
    raw.tracking_url;

  if (typeof urlStr === "string" && urlStr.includes("linksredirect.com")) {
    try {
      const u = new URL(urlStr);
      const offer = u.searchParams.get("offer_id") || u.searchParams.get("offerId");
      if (offer && offer.trim()) return offer.trim();
    } catch {
      // ignore
    }
  }
  return null;
}

export function extractCanonicalDestination(raw: any): string {
  const urlStr =
    raw.affiliate_url ||
    raw.affiliateUrl ||
    raw.affiliateLink ||
    raw.trackingUrl ||
    raw.tracking_url ||
    raw.source_url ||
    raw.url;

  if (typeof urlStr !== "string") return "";

  try {
    const parsed = new URL(urlStr);
    if (parsed.hostname.includes("linksredirect.com")) {
      const nested = parsed.searchParams.get("url");
      if (nested) {
        return nested.split("?")[0].toLowerCase();
      }
    }
    return `${parsed.origin}${parsed.pathname}`.toLowerCase();
  } catch {
    return urlStr.toLowerCase().slice(0, 100);
  }
}

/**
 * Deterministic Deal ID Generation Utility
 *
 * Priority:
 * 1. Explicit id (valid, non-empty, non-placeholder)
 * 2. post_key / postKey / duplicateKey
 * 3. source_id / sourceId
 * 4. Authentic offer_id ONLY (offer_id uniquely identifies an offer)
 * 5. Deterministic hash of: (campaign_id or merchant) + normalized title + canonical destination
 *
 * CRITICAL: A single campaign_id (e.g. Croma 201) can have many offers.
 * campaign_id MUST NEVER be used as a standalone unique ID.
 */
export function buildServerStableDealId(d: any): string {
  if (!d || typeof d !== "object") return "dt-unknown";

  // 1. Explicit ID
  if (d.id && typeof d.id === "string" && d.id.trim() && !d.id.startsWith("dt-undefined")) {
    return d.id.trim();
  }
  if (typeof d.id === "number") {
    return String(d.id);
  }

  // 2. post_key / postKey / duplicateKey
  const postKey = d.post_key || d.postKey || d.duplicateKey;
  if (postKey && typeof postKey === "string" && postKey.trim()) {
    return `post-${postKey.trim()}`;
  }

  // 3. source_id / sourceId
  const sourceId = d.source_id || d.sourceId;
  if (sourceId && typeof sourceId === "string" && sourceId.trim()) {
    return `src-${sourceId.trim()}`;
  }

  // 4. Authentic Cuelinks offer_id ONLY
  const offerId = extractCuelinksOfferId(d);
  if (offerId) {
    return `cue-off-${offerId}`;
  }

  // 5. Deterministic hash of: (campaign_id or merchant) + normalized title + canonical destination
  const campaignOrMerchant = (
    d.campaign_id ||
    d.campaignId ||
    d.campaign_name ||
    d.campaignName ||
    d.merchant ||
    d.platform ||
    d.store ||
    "merchant"
  )
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const title = (d.title || d.name || d.productName || "deal")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 50);

  const dest = extractCanonicalDestination(d);

  const signature = `${campaignOrMerchant}:${title}:${dest}`;
  return simpleStableHash(signature);
}

function parseServerNumber(val: any): number | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  if (typeof val === "number") return isNaN(val) || val <= 0 ? undefined : val;
  if (typeof val === "string") {
    const cleaned = val.replace(/[^0-9.]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) || num <= 0 ? undefined : num;
  }
  return undefined;
}

export function sanitizePlatformFilter(value: string): string {
  if (!value || typeof value !== "string") return "";
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 50);
}

export function normalizeStoreSlug(slug: string): { platform: string; names: string[] } {
  const sanitized = sanitizePlatformFilter(slug);
  const s = sanitized.replace(/[^a-z0-9]/g, "");
  if (s.includes("croma")) return { platform: "croma", names: ["croma", "croma retail"] };
  if (s.includes("reliance") || s.includes("reliancedigital")) {
    return { platform: "reliancedigital", names: ["reliancedigital", "reliance digital", "reliance"] };
  }
  if (s.includes("amazon")) return { platform: "amazon", names: ["amazon", "amazon india"] };
  if (s.includes("flipkart")) return { platform: "flipkart", names: ["flipkart"] };
  if (s.includes("myntra")) return { platform: "myntra", names: ["myntra"] };
  if (s.includes("ajio")) return { platform: "ajio", names: ["ajio"] };
  if (s.includes("meesho")) return { platform: "meesho", names: ["meesho"] };
  if (s.includes("oppo")) return { platform: "oppo", names: ["oppo", "oppo store"] };
  if (s.includes("klook")) return { platform: "klook", names: ["klook"] };
  if (s.includes("igp")) return { platform: "igp", names: ["igp", "indian gifts portal"] };
  return { platform: sanitized || "others", names: [sanitized || "others"] };
}

function detectServerPlatform(d: any): string {
  const p = (
    d.platform ||
    d.affiliatePlatform ||
    d.merchant ||
    d.source ||
    d.campaign_name ||
    d.campaignName ||
    ""
  ).toLowerCase();

  if (p.includes("amazon")) return "amazon";
  if (p.includes("flipkart")) return "flipkart";
  if (p.includes("myntra")) return "myntra";
  if (p.includes("ajio")) return "ajio";
  if (p.includes("croma")) return "croma";
  if (p.includes("reliance") || p.includes("reliancedigital")) return "reliancedigital";
  if (p.includes("meesho")) return "meesho";
  if (p.includes("oppo")) return "oppo";
  if (p.includes("klook")) return "klook";
  if (p.includes("igp") || p.includes("indian gifts")) return "igp";
  return "others";
}

function detectServerMerchant(platform: string): string {
  const map: Record<string, string> = {
    amazon: "Amazon",
    flipkart: "Flipkart",
    myntra: "Myntra",
    ajio: "AJIO",
    croma: "Croma",
    reliancedigital: "Reliance Digital",
    meesho: "Meesho",
    oppo: "Oppo Store",
    klook: "Klook",
    igp: "Indian Gifts Portal",
    others: "Online Merchant",
  };
  return map[platform] || "DealTiki Partner";
}

/**
 * Normalizes a raw deal object for Supabase public_deals persistence.
 * Preserves Cuelinks tracking URLs exactly. Never unwraps linksredirect.com.
 */
function formatDealForPersistence(d: any) {
  const id = buildServerStableDealId(d);
  const title = (d.title || d.name || d.productName || d.campaignName || "Special Deal").trim();
  const slug = d.slug || createSlug(title, id);
  const platform = (d.platform || detectServerPlatform(d) || "others").toLowerCase();
  const merchant =
    d.merchant ||
    d.store ||
    d.campaign_name ||
    d.campaignName ||
    detectServerMerchant(platform);

  const rawStatus = (d.status || "").toLowerCase().trim();
  let status = "active";
  if (rawStatus === "expired" || rawStatus === "inactive" || rawStatus === "ended") {
    status = "expired";
  } else if (rawStatus === "hidden") {
    status = "hidden";
  } else if (rawStatus === "live" || rawStatus === "active" || !rawStatus) {
    status = "active";
  }

  const expiresAt = d.expires_at ?? d.expiresAt ?? d.endDate ?? d.end_date ?? null;
  if (expiresAt) {
    const expMs = new Date(expiresAt).getTime();
    if (!isNaN(expMs) && expMs <= Date.now()) {
      status = "expired";
    }
  }

  const affiliateUrl =
    d.affiliate_url ??
    d.affiliateUrl ??
    d.affiliateLink ??
    d.trackingUrl ??
    d.tracking_url ??
    null;

  const dealPrice = parseServerNumber(
    d.deal_price ?? d.dealPrice ?? d.discount_price ?? d.price
  );
  const mrp = parseServerNumber(
    d.mrp ?? d.originalPrice ?? d.original_price
  );
  let discountPercent = parseServerNumber(
    d.discount_percent ?? d.discountPercent ?? d.discount
  );
  if (!discountPercent && dealPrice && mrp && mrp > dealPrice) {
    discountPercent = Math.round(((mrp - dealPrice) / mrp) * 100);
  }

  const nowIso = new Date().toISOString();

  return {
    id,
    slug,
    source_id: d.source_id ?? d.sourceId ?? (d.id && String(d.id) !== id ? String(d.id) : null),
    post_key: d.post_key ?? d.postKey ?? d.duplicateKey ?? null,
    title,
    description: d.description || null,
    image_url: d.image_url ?? d.imageUrl ?? d.image ?? d.productImage ?? null,
    merchant,
    platform,
    category: d.category || "General",
    deal_type: (d.deal_type || d.dealType || d.type || "product").toLowerCase(),
    mrp: mrp || null,
    deal_price: dealPrice || null,
    discount_percent: discountPercent || null,
    rating: parseServerNumber(d.rating ?? d.stars) || null,
    review_count: parseServerNumber(d.review_count ?? d.reviewCount) || null,
    coupon_code: d.coupon_code ?? d.couponCode ?? null,
    affiliate_url: affiliateUrl,
    affiliate_provider:
      d.affiliate_provider ??
      d.affiliateProvider ??
      (affiliateUrl && affiliateUrl.includes("linksredirect") ? "Cuelinks" : null),
    campaign_name: d.campaign_name ?? d.campaignName ?? null,
    status,
    starts_at: d.starts_at ?? d.startsAt ?? d.startDate ?? d.start_date ?? null,
    expires_at: expiresAt,
    source: d.source || "DealTiki Engine",
    source_url: d.source_url || null,
    last_seen_at: nowIso,
    updated_at: nowIso,
  };
}

interface PersistResult {
  success: boolean;
  count: number;
  error?: string;
}

/**
 * Persists live deals into public_deals table safely, preserving first_seen_at.
 * Returns a typed success/failure result and logs outcomes explicitly.
 */
async function persistDealsToSupabase(rawDeals: any[]): Promise<PersistResult> {
  if (!supabase) {
    return { success: false, count: 0, error: "Supabase client not initialized" };
  }
  if (!Array.isArray(rawDeals) || rawDeals.length === 0) {
    return { success: true, count: 0 };
  }
  try {
    const formatted = rawDeals.slice(0, 100).map(formatDealForPersistence);

    // Call batch upsert with ON CONFLICT (id)
    const { error } = await supabase
      .from("public_deals")
      .upsert(formatted, { onConflict: "id" });

    if (error) {
      console.warn("[DealTiki Persist Error]:", error.message);
      return { success: false, count: 0, error: error.message };
    } else {
      console.log(`[DealTiki Persist] Successfully persisted ${formatted.length} deals to public_deals.`);
      return { success: true, count: formatted.length };
    }
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.warn("[DealTiki Persist Exception]:", errMsg);
    return { success: false, count: 0, error: errMsg };
  }
}

/**
 * Sanitizes visitor search text to prevent PostgREST syntax errors.
 */
function sanitizeSearchKeyword(raw: string): string {
  return raw
    .slice(0, 120)
    .replace(/[,().%\\:;"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Helper to fetch live deals from upstream DealTiki engine with post=false.
 */
async function fetchUpstreamDeals(params: {
  keyword?: string;
  platform?: string;
  freshMinutes?: string;
}) {
  const targetUrl = new URL(`${BACKEND_BASE_URL}/api/search`);
  if (params.keyword) targetUrl.searchParams.set("keyword", params.keyword);
  if (params.platform && params.platform !== "all") {
    targetUrl.searchParams.set("affiliatePlatform", params.platform);
  }
  targetUrl.searchParams.set("freshMinutes", params.freshMinutes || "2880");
  targetUrl.searchParams.set("post", "false"); // STRICT: Never post to Telegram

  console.log(`[DealTiki Proxy] Upstream query: ${targetUrl.toString()}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(targetUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "DealTiki-Web/1.0",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`Upstream returned HTTP ${res.status}`);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : data.deals || data.results || data.data || [];
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error("[DealTiki Proxy Upstream Error]:", err?.message || err);
    return [];
  }
}

/**
 * Build deterministic Cache Key for /api/deals including ALL 12 parameters.
 */
export function buildDealsCacheKey(params: {
  keyword?: string;
  platform?: string;
  category?: string;
  minDiscount?: number;
  minPrice?: number;
  maxPrice?: number;
  couponOnly?: boolean;
  sort?: string;
  freshMinutes?: string | number;
  page?: number;
  limit?: number;
}): string {
  return [
    "deals",
    (params.keyword || "").trim().toLowerCase(),
    (params.platform || "").trim().toLowerCase(),
    (params.category || "").trim().toLowerCase(),
    Number(params.minDiscount) || 0,
    params.minPrice !== undefined && params.minPrice !== null ? Number(params.minPrice) : "",
    params.maxPrice !== undefined && params.maxPrice !== null ? Number(params.maxPrice) : "",
    Boolean(params.couponOnly),
    params.sort || "latest",
    params.freshMinutes || "2880",
    params.page || 1,
    params.limit || 50,
  ].join("::");
}

/**
 * Deduplicates list of normalized raw deals server-side.
 */
function deduplicateServerDeals(deals: any[]): any[] {
  const seen = new Set<string>();
  const out: any[] = [];

  for (const d of deals) {
    if (!d) continue;
    const id = d.id || buildServerStableDealId(d);
    const postKey = d.post_key || d.postKey;
    const sourceId = d.source_id || d.sourceId;
    const offerId = extractCuelinksOfferId(d);

    const title = (d.title || d.name || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
    const dest = extractCanonicalDestination(d);
    const campaign = (d.campaign_name || d.campaignName || d.campaign_id || d.campaignId || "").toString().toLowerCase().replace(/[^a-z0-9]/g, "");
    const merchant = (d.merchant || d.platform || "").toLowerCase().replace(/[^a-z0-9]/g, "");

    const keys: string[] = [];
    if (id && id !== "dt-unknown") keys.push(`id:${id}`);
    if (postKey) keys.push(`post:${postKey}`);
    if (sourceId) keys.push(`src:${sourceId}`);
    if (offerId) keys.push(`cue_off:${offerId}`);
    if (campaign) keys.push(`camp:${campaign}:${title}:${dest}`);
    keys.push(`m_t_d:${merchant}:${title}:${dest}`);

    const hasDuplicate = keys.some((k) => seen.has(k));
    if (!hasDuplicate) {
      keys.forEach((k) => seen.add(k));
      out.push(d);
    }
  }

  return out;
}

/**
 * Core Unified Discovery Query Helper
 * Reads primarily from public.public_deals (Active + Non-Expired).
 * Falls back to upstream DealTiki search only when DB has no matching rows.
 */
async function getDiscoveryDeals(params: {
  keyword?: string;
  platform?: string;
  category?: string;
  minDiscount?: number;
  minPrice?: number;
  maxPrice?: number;
  couponOnly?: boolean;
  sort?: string;
  freshMinutes?: string;
  page?: number;
  limit?: number;
  forceRefresh?: boolean;
}): Promise<{
  deals: any[];
  source: "supabase" | "live_api" | "cached";
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}> {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(Math.max(1, Number(params.limit) || 50), 100);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const cacheKey = buildDealsCacheKey({
    keyword: params.keyword,
    platform: params.platform,
    category: params.category,
    minDiscount: params.minDiscount,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    couponOnly: params.couponOnly,
    sort: params.sort,
    freshMinutes: params.freshMinutes,
    page,
    limit,
  });

  if (!params.forceRefresh) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return {
        deals: cached.data,
        source: "cached",
        total: cached.total,
        page: cached.page,
        limit: cached.limit,
        hasMore: cached.hasMore,
      };
    }
  }

  let dealsList: any[] = [];
  let totalCount = 0;
  let source: "supabase" | "live_api" = "live_api";

  // 1. PRIMARY SOURCE: Supabase public_deals (active, non-expired)
  if (supabase) {
    try {
      const nowIso = new Date().toISOString();
      let query = supabase
        .from("public_deals")
        .select("*", { count: "exact" })
        .eq("status", "active")
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`);

      if (params.platform && params.platform !== "all") {
        const storeInfo = normalizeStoreSlug(params.platform);
        const safePlatform = sanitizePlatformFilter(storeInfo.platform);
        const safeMerchant = sanitizeSearchKeyword(storeInfo.platform);
        if (safePlatform && safeMerchant) {
          query = query.or(
            `platform.eq.${safePlatform},merchant.ilike.%${safeMerchant}%`
          );
        }
      }

      if (params.category && params.category !== "all") {
        query = query.ilike("category", `%${params.category}%`);
      }

      if (params.minDiscount && params.minDiscount > 0) {
        query = query.gte("discount_percent", params.minDiscount);
      }

      if (params.minPrice !== undefined && params.minPrice !== null) {
        query = query.gte("deal_price", params.minPrice);
      }

      if (params.maxPrice !== undefined && params.maxPrice !== null) {
        query = query.lte("deal_price", params.maxPrice);
      }

      if (params.couponOnly) {
        query = query.not("coupon_code", "is", null);
      }

      if (params.keyword) {
        const clean = sanitizeSearchKeyword(params.keyword);
        if (clean) {
          query = query.or(
            `title.ilike.%${clean}%,description.ilike.%${clean}%,merchant.ilike.%${clean}%,category.ilike.%${clean}%`
          );
        }
      }

      // Sort Order
      if (params.sort === "discount") {
        query = query.order("discount_percent", { ascending: false, nullsFirst: false });
      } else if (params.sort === "price_asc") {
        query = query.order("deal_price", { ascending: true, nullsFirst: false });
      } else if (params.sort === "price_desc") {
        query = query.order("deal_price", { ascending: false, nullsFirst: false });
      } else if (params.sort === "trending" || params.sort === "popular") {
        query = query
          .order("discount_percent", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false });
      } else {
        // latest default: order by created_at / first_seen_at
        query = query.order("created_at", { ascending: false });
      }

      query = query.range(from, to);

      const { data, error, count } = await query;
      if (!error && data && data.length > 0) {
        dealsList = data;
        totalCount = count ?? data.length;
        source = "supabase";
      }
    } catch (err) {
      console.warn("[DealTiki Primary DB Query Error]:", err);
    }
  }

  // 2. LIVE UPSTREAM FALLBACK (Sequence: fetch -> normalize -> remove invalid/expired -> filter -> deduplicate -> sort -> total -> paginate -> persist -> return)
  if (dealsList.length === 0) {
    const rawUpstream = await fetchUpstreamDeals({
      keyword: params.keyword,
      platform: params.platform,
      freshMinutes: params.freshMinutes || "2880",
    });

    source = "live_api";

    // Step A: Normalize
    const normalized = rawUpstream.map(formatDealForPersistence);

    // Step B: Remove invalid/expired
    const nowMs = Date.now();
    const activeOnly = normalized.filter((d) => {
      if (d.status === "expired" || d.status === "hidden") return false;
      if (d.expires_at) {
        const exp = new Date(d.expires_at).getTime();
        if (!isNaN(exp) && exp <= nowMs) return false;
      }
      return true;
    });

    // Step C: Filter by all parameters
    const filtered = activeOnly.filter((d) => {
      if (params.platform && params.platform !== "all") {
        const storeInfo = normalizeStoreSlug(params.platform);
        const matchPlatform = d.platform === storeInfo.platform;
        const matchMerchant = storeInfo.names.some((n) =>
          d.merchant.toLowerCase().includes(n)
        );
        if (!matchPlatform && !matchMerchant) return false;
      }

      if (params.category && params.category !== "all") {
        const catLower = params.category.toLowerCase();
        if (!d.category?.toLowerCase().includes(catLower)) return false;
      }

      if (params.minDiscount && params.minDiscount > 0) {
        if (!d.discount_percent || d.discount_percent < params.minDiscount) return false;
      }

      if (params.minPrice !== undefined && params.minPrice !== null) {
        if (!d.deal_price || d.deal_price < params.minPrice) return false;
      }

      if (params.maxPrice !== undefined && params.maxPrice !== null) {
        if (!d.deal_price || d.deal_price > params.maxPrice) return false;
      }

      if (params.couponOnly && !d.coupon_code) {
        return false;
      }

      if (params.keyword) {
        const clean = sanitizeSearchKeyword(params.keyword).toLowerCase();
        if (clean) {
          const matchTitle = d.title.toLowerCase().includes(clean);
          const matchDesc = d.description?.toLowerCase().includes(clean);
          const matchMerc = d.merchant.toLowerCase().includes(clean);
          const matchCat = d.category?.toLowerCase().includes(clean);
          if (!matchTitle && !matchDesc && !matchMerc && !matchCat) return false;
        }
      }

      return true;
    });

    // Step D: Deduplicate
    const deduped = deduplicateServerDeals(filtered);

    // Step E: Sort
    if (params.sort === "discount") {
      deduped.sort((a, b) => (b.discount_percent || 0) - (a.discount_percent || 0));
    } else if (params.sort === "price_asc") {
      deduped.sort((a, b) => (a.deal_price || 999999) - (b.deal_price || 999999));
    } else if (params.sort === "price_desc") {
      deduped.sort((a, b) => (b.deal_price || 0) - (a.deal_price || 0));
    } else if (params.sort === "trending" || params.sort === "popular") {
      deduped.sort((a, b) => (b.discount_percent || 0) - (a.discount_percent || 0));
    } else {
      deduped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Step F: Total count & Paginate
    totalCount = deduped.length;
    dealsList = deduped.slice(from, to + 1);

    // Step G: Persist fallback deals into public_deals (awaited)
    if (normalized.length > 0 && supabase) {
      const persistRes = await persistDealsToSupabase(normalized);
      if (!persistRes.success) {
        console.warn("[DealTiki Fallback Discovery Persist Notice]:", persistRes.error);
      }
    }
  }

  const hasMore = totalCount > to + 1;

  cache.set(cacheKey, {
    timestamp: Date.now(),
    data: dealsList,
    total: totalCount,
    hasMore,
    page,
    limit,
  });

  return {
    deals: dealsList,
    source,
    total: totalCount,
    page,
    limit,
    hasMore,
  };
}

// -------------------------------------------------------------
// 1. GET /api/deals (Main Read Endpoint)
// -------------------------------------------------------------
app.get("/api/deals", async (req, res) => {
  try {
    const rawKeyword = typeof req.query.q === "string"
      ? req.query.q
      : typeof req.query.keyword === "string"
      ? req.query.keyword
      : "";

    const platform = typeof req.query.platform === "string"
      ? req.query.platform.trim()
      : typeof req.query.affiliatePlatform === "string"
      ? req.query.affiliatePlatform.trim()
      : "";

    const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
    const minDiscount = Number(req.query.minDiscount) || 0;
    const minPrice = req.query.minPrice !== undefined && req.query.minPrice !== "" ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice !== undefined && req.query.maxPrice !== "" ? Number(req.query.maxPrice) : undefined;
    const couponOnly = req.query.coupon === "true" || req.query.onlyCoupons === "true";
    const sort = typeof req.query.sort === "string" ? req.query.sort : "latest";
    const freshMinutes = typeof req.query.freshMinutes === "string" ? req.query.freshMinutes : "2880";
    const forceRefresh = req.query.refresh === "true";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;

    const result = await getDiscoveryDeals({
      keyword: rawKeyword,
      platform,
      category,
      minDiscount,
      minPrice,
      maxPrice,
      couponOnly,
      sort,
      freshMinutes,
      page,
      limit,
      forceRefresh,
    });

    return res.json({
      success: true,
      ...result,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error("[/api/deals Error]:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to retrieve deals",
      deals: [],
    });
  }
});

// -------------------------------------------------------------
// 2. GET /api/deals/latest (Primary from public_deals)
// -------------------------------------------------------------
app.get("/api/deals/latest", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const result = await getDiscoveryDeals({
      sort: "latest",
      page,
      limit,
    });
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Failed to fetch latest deals", deals: [] });
  }
});

// -------------------------------------------------------------
// 3. GET /api/deals/trending (Primary from public_deals)
// -------------------------------------------------------------
app.get("/api/deals/trending", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const result = await getDiscoveryDeals({
      sort: "trending",
      page,
      limit,
    });
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Failed to fetch trending deals", deals: [] });
  }
});

// -------------------------------------------------------------
// 4. GET /api/deals/:id (Single Deal View by id, post_key, or slug)
// -------------------------------------------------------------
app.get("/api/deals/:id", async (req, res) => {
  const target = req.params.id;
  if (!target) {
    return res.status(400).json({ success: false, error: "Deal identifier is required" });
  }

  // 1. Safe sequential Supabase checks (exact id, exact post_key, exact slug)
  if (supabase) {
    try {
      // Check exact id
      const { data: byId } = await supabase
        .from("public_deals")
        .select("*")
        .eq("id", target)
        .maybeSingle();

      if (byId) return res.json({ success: true, deal: byId });

      // Check exact post_key
      const { data: byPostKey } = await supabase
        .from("public_deals")
        .select("*")
        .eq("post_key", target)
        .maybeSingle();

      if (byPostKey) return res.json({ success: true, deal: byPostKey });

      // Check exact slug
      const { data: bySlug } = await supabase
        .from("public_deals")
        .select("*")
        .eq("slug", target)
        .maybeSingle();

      if (bySlug) return res.json({ success: true, deal: bySlug });
    } catch (err) {
      console.warn("[/api/deals/:id Supabase Error]:", err);
    }
  }

  // 2. Upstream fallback if not found in DB
  const rawList = await fetchUpstreamDeals({ freshMinutes: "2880" });
  const normalized = rawList.map(formatDealForPersistence);

  const matched = normalized.find((d) => {
    return (
      d.id === target ||
      d.post_key === target ||
      d.slug === target ||
      d.source_id === target
    );
  });

  if (matched) {
    if (supabase) {
      const persistRes = await persistDealsToSupabase([matched]);
      if (!persistRes.success) {
        console.warn("[DealTiki Single Deal Persist Notice]:", persistRes.error);
      }
    }
    return res.json({ success: true, deal: matched });
  }

  return res.status(404).json({ success: false, error: "Deal not found" });
});

// -------------------------------------------------------------
// 5. GET /api/stores/:slug/deals (Primary from public_deals)
// -------------------------------------------------------------
app.get("/api/stores/:slug/deals", async (req, res) => {
  try {
    const { slug } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const result = await getDiscoveryDeals({
      platform: slug,
      page,
      limit,
    });
    return res.json({ success: true, store: slug, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Failed to fetch store deals", deals: [] });
  }
});

// -------------------------------------------------------------
// 6. GET /api/categories/:slug/deals (Primary from public_deals)
// -------------------------------------------------------------
app.get("/api/categories/:slug/deals", async (req, res) => {
  try {
    const { slug } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const result = await getDiscoveryDeals({
      category: slug,
      page,
      limit,
    });
    return res.json({ success: true, category: slug, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Failed to fetch category deals", deals: [] });
  }
});

// -------------------------------------------------------------
// 7. POST /api/public-deals/upsert (Backend Persistence Webhook)
// -------------------------------------------------------------
app.post("/api/public-deals/upsert", async (req, res) => {
  if (!DEALTIKI_SYNC_SECRET) {
    return res.status(503).json({
      success: false,
      error: "Deal synchronization is not configured",
    });
  }

  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ") || authHeader.substring(7).trim() !== DEALTIKI_SYNC_SECRET) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized: Invalid or missing Bearer token in Authorization header",
    });
  }

  if (!supabase) {
    return res.status(503).json({
      success: false,
      error: "Deal persistence is not configured",
    });
  }

  const { deals } = req.body;
  if (!deals || !Array.isArray(deals) || deals.length === 0) {
    return res.status(400).json({ success: false, error: "Deals array is required." });
  }

  if (deals.length > 100) {
    return res.status(400).json({
      success: false,
      error: "Batch size exceeds maximum limit of 100 deals per request",
    });
  }

  try {
    const formatted = deals.map(formatDealForPersistence);

    const { error } = await supabase
      .from("public_deals")
      .upsert(formatted, { onConflict: "id" });

    if (error) {
      console.error("[DealTiki Upsert Error]:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    cache.clear();

    return res.json({
      success: true,
      upserted: formatted.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[DealTiki Upsert Exception]:", err);
    return res.status(500).json({ success: false, error: err?.message || "Internal server error" });
  }
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  res.json({
    status: "ok",
    app: "DealTiki",
    backend: BACKEND_BASE_URL,
    syncConfigured: Boolean(DEALTIKI_SYNC_SECRET),
    supabaseConfigured: Boolean(supabase),
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`⚡ DealTiki server running on http://localhost:${PORT}`);
  });
}

const isDirectExecution =
  process.argv[1]?.endsWith("server.ts") ||
  process.argv[1]?.endsWith("server.cjs") ||
  process.env.npm_lifecycle_event === "dev" ||
  process.env.npm_lifecycle_event === "start";

if (isDirectExecution && !process.env.DEALTIKI_TEST_RUN) {
  startServer();
}

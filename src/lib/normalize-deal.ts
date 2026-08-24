import { Deal, DealType } from "../types";
import { inferCategoryFromText } from "./categories";
import { calculateDiscount } from "./calculate-discount";
import { buildStableDealId } from "./deterministic-id";

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

export function parseNumber(val: any): number | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  if (typeof val === "number") return isNaN(val) || val <= 0 ? undefined : val;
  if (typeof val === "string") {
    const cleaned = val.replace(/[^0-9.]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) || num <= 0 ? undefined : num;
  }
  return undefined;
}

export function extractCouponCode(raw: any): string | undefined {
  if (raw.coupon_code && typeof raw.coupon_code === "string" && raw.coupon_code.trim()) {
    return raw.coupon_code.trim();
  }
  if (raw.couponCode && typeof raw.couponCode === "string" && raw.couponCode.trim()) {
    return raw.couponCode.trim();
  }
  if (raw.coupon && typeof raw.coupon === "string" && raw.coupon.trim()) {
    return raw.coupon.trim();
  }
  if (raw.code && typeof raw.code === "string" && raw.code.trim()) {
    return raw.code.trim();
  }
  if (raw.promoCode && typeof raw.promoCode === "string" && raw.promoCode.trim()) {
    return raw.promoCode.trim();
  }

  // Look in title or description for "Use Code: XXX" or "Code - XXX"
  const text = `${raw.title || ""} ${raw.description || ""}`;
  const codeMatch = text.match(/(?:use code|coupon code|promo code|voucher code|code)\s*[:\-]\s*([A-Z0-9_-]{3,15})/i);
  if (codeMatch && codeMatch[1]) {
    return codeMatch[1].toUpperCase();
  }

  return undefined;
}

export function extractImage(raw: any): string | undefined {
  const candidate =
    raw.image_url ||
    raw.imageUrl ||
    raw.image ||
    raw.productImage ||
    raw.photo ||
    raw.thumb ||
    raw.thumbnail ||
    raw.banner ||
    raw.logo;

  if (typeof candidate === "string" && candidate.startsWith("http")) {
    return candidate.trim();
  }
  return undefined;
}

export function detectPlatform(raw: any): string {
  const p = (
    raw.platform ||
    raw.affiliatePlatform ||
    raw.merchant ||
    raw.source ||
    raw.campaign_name ||
    raw.campaignName ||
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
  if (p.includes("swiggy") || p.includes("zomato")) return "others";
  return "others";
}

export function detectMerchantName(raw: any, platform: string): string {
  if (raw.merchant && typeof raw.merchant === "string" && raw.merchant.trim()) {
    return raw.merchant.trim();
  }
  if (raw.campaign_name && typeof raw.campaign_name === "string" && raw.campaign_name.trim()) {
    return raw.campaign_name.trim();
  }
  if (raw.campaignName && typeof raw.campaignName === "string" && raw.campaignName.trim()) {
    return raw.campaignName.trim();
  }
  if (raw.source && typeof raw.source === "string" && raw.source.trim() && !raw.source.includes("telegram")) {
    return raw.source.trim();
  }

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
 * Normalizes raw backend objects from DealTiki search endpoint or Supabase public_deals.
 * Maps all known field variants and preserves authentic Cuelinks affiliate links.
 */
export function normalizeDeal(raw: any, _index: number = 0): Deal | null {
  if (!raw || typeof raw !== "object") return null;

  const rawTitle =
    raw.title ||
    raw.name ||
    raw.productName ||
    raw.campaign_name ||
    raw.campaignName ||
    raw.text;
  if (!rawTitle || typeof rawTitle !== "string") return null;

  const title = rawTitle.trim();
  const id = buildStableDealId(raw);
  const slug = raw.slug || createSlug(title, id);

  const platform = detectPlatform(raw);
  const merchant = detectMerchantName(raw, platform);

  // Field mappings according to Requirement 4
  const sourceId = raw.source_id ?? raw.sourceId ?? (raw.id && String(raw.id) !== id ? String(raw.id) : undefined);
  const postKey = raw.post_key ?? raw.postKey ?? raw.duplicateKey;

  // PRESERVE AUTHENTIC AFFILIATE TRACKING URL EXACTLY AS RETURNED
  // Never strip query parameters (cid, source, url, subid) and never fallback to backend URL!
  const rawAffiliate =
    raw.affiliate_url ??
    raw.affiliateUrl ??
    raw.affiliateLink ??
    raw.trackingUrl ??
    raw.tracking_url ??
    raw.link ??
    raw.url;

  const affiliateLink =
    typeof rawAffiliate === "string" && rawAffiliate.trim().startsWith("http")
      ? rawAffiliate.trim()
      : null;

  const price = parseNumber(
    raw.deal_price ?? raw.dealPrice ?? raw.discount_price ?? raw.price ?? raw.salePrice ?? raw.currentPrice
  );
  const mrp = parseNumber(
    raw.mrp ?? raw.originalPrice ?? raw.original_price ?? raw.listPrice ?? raw.regularPrice
  );
  const reportedDiscount = parseNumber(
    raw.discount_percent ?? raw.discountPercent ?? raw.discount ?? raw.discountPct
  );

  const discountPercent = calculateDiscount(price, mrp, reportedDiscount);

  const rawRating = parseNumber(raw.rating ?? raw.stars ?? raw.score);
  const rating =
    rawRating && rawRating >= 1 && rawRating <= 5
      ? Number(rawRating.toFixed(1))
      : undefined;

  const reviewCount = parseNumber(
    raw.review_count ?? raw.reviewCount ?? raw.reviews ?? raw.ratings_count
  );

  const couponCode = extractCouponCode(raw);
  const image = extractImage(raw);

  const rawCategory = raw.category || raw.categoryName || raw.tag;
  const category =
    rawCategory && typeof rawCategory === "string" && rawCategory.trim()
      ? rawCategory.trim()
      : inferCategoryFromText(title, raw.description || "");

  const campaignName = raw.campaign_name ?? raw.campaignName;

  // Determine deal type
  let dealType: DealType = "product";
  const typeField = (raw.deal_type || raw.type || raw.dealType || "").toLowerCase();
  if (
    typeField === "cuelinks-offer" ||
    typeField === "cuelinks" ||
    typeField === "campaign" ||
    (!price && !image)
  ) {
    dealType = "campaign";
  } else if (couponCode && !price) {
    dealType = "coupon";
  } else if (raw.source === "telegram" || typeField === "telegram") {
    dealType = price ? "product" : "telegram";
  }

  // Parse status / expiry (Requirement 16)
  const startsAt = raw.starts_at ?? raw.startsAt ?? raw.startDate ?? raw.start_date;
  const expiresAt = raw.expires_at ?? raw.expiresAt ?? raw.endDate ?? raw.end_date ?? raw.expiryDate ?? raw.validTill;

  const rawStatus = (raw.status || "").toLowerCase().trim();
  let status: "active" | "expired" | "expiring_soon" | "hidden" = "active";
  if (rawStatus === "expired" || rawStatus === "inactive" || rawStatus === "ended") {
    status = "expired";
  } else if (rawStatus === "hidden") {
    status = "hidden";
  } else if (rawStatus === "live" || rawStatus === "active" || !rawStatus) {
    status = "active";
  }

  if (expiresAt) {
    const expTime = new Date(expiresAt).getTime();
    if (!isNaN(expTime)) {
      const diff = expTime - Date.now();
      if (diff <= 0) {
        status = "expired";
      } else if (diff < 2 * 86400 * 1000 && status === "active") {
        status = "expiring_soon";
      }
    }
  }

  // Calculate deterministic trending score (Requirement 15 - NO fabricated default ratings or discounts)
  const createdAt =
    raw.created_at || raw.createdAt || raw.first_seen_at || raw.fetchedAt || new Date().toISOString();
  const ageHrs = createdAt
    ? (Date.now() - new Date(createdAt).getTime()) / (1000 * 3600)
    : 1;
  const freshnessScore = Math.max(0, 50 - Math.max(0, ageHrs) * 2);
  const discountScore = (discountPercent ?? 0) * 0.8;
  const ratingScore = (rating ?? 0) * 10;
  const trendingScore = Math.round(freshnessScore + discountScore + ratingScore);

  return {
    id,
    slug,
    title,
    description: typeof raw.description === "string" ? raw.description.trim() : undefined,
    image,
    source: raw.source || raw.affiliate_provider || raw.affiliateProvider || "DealTiki Engine",
    merchant,
    platform,
    category,
    mrp,
    price,
    discountPercent,
    rating,
    reviewCount,
    couponCode,
    affiliateLink,
    affiliateProvider:
      raw.affiliate_provider ||
      raw.affiliateProvider ||
      (affiliateLink && affiliateLink.includes("linksredirect") ? "Cuelinks" : undefined),
    campaignName: campaignName || (dealType === "campaign" ? merchant : undefined),
    postKey,
    sourceId,
    status,
    startsAt,
    expiresAt,
    createdAt,
    fetchedAt: raw.fetchedAt || raw.last_seen_at || new Date().toISOString(),
    updatedAt: raw.updated_at || raw.updatedAt,
    dealType,
    trendingScore,
    raw,
  };
}

/**
 * Builds stable deduplication keys for comparison without mutating the deal or its affiliateLink.
 * Priority:
 * 1. Specific deal ID / post_key / source_id
 * 2. Authentic offer ID (e.g. Cuelinks offer_id)
 * 3. campaign + normalized offer title + destination identity
 * 4. merchant + normalized title + destination identity
 */
export function buildDealIdentity(deal: Deal): string[] {
  const keys: string[] = [];

  if (deal.id && deal.id !== "dt-unknown") {
    keys.push(`id:${deal.id}`);
  }
  if (deal.postKey) {
    keys.push(`post:${deal.postKey}`);
  }
  if (deal.sourceId) {
    keys.push(`source:${deal.sourceId}`);
  }

  let offerId: string | null = null;
  let destIdentity = "";

  if (deal.affiliateLink) {
    try {
      const parsedUrl = new URL(deal.affiliateLink);
      if (parsedUrl.hostname.includes("linksredirect.com")) {
        const off = parsedUrl.searchParams.get("offer_id") || parsedUrl.searchParams.get("offerId");
        if (off) offerId = off.trim();
        const nestedDest = parsedUrl.searchParams.get("url");
        if (nestedDest) {
          destIdentity = nestedDest.split("?")[0].toLowerCase();
        }
      } else {
        destIdentity = `${parsedUrl.origin}${parsedUrl.pathname}`.toLowerCase();
      }
    } catch {
      // ignore URL parsing error
    }
  }

  // Also check raw offer_id if present
  if (!offerId && deal.raw) {
    if (deal.raw.offer_id) offerId = String(deal.raw.offer_id).trim();
    else if (deal.raw.offerId) offerId = String(deal.raw.offerId).trim();
  }

  if (offerId) {
    keys.push(`cue_offer:${offerId}`);
  }

  const cleanTitle = deal.title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 40);

  const campaign = (
    deal.campaignName ||
    deal.raw?.campaign_id ||
    deal.raw?.campaignId ||
    deal.raw?.campaign_name ||
    deal.raw?.campaignName ||
    ""
  )
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (campaign) {
    keys.push(`camp_title_dest:${campaign}:${cleanTitle}:${destIdentity}`);
  }

  const merchantOrPlatform = (deal.merchant || deal.platform || "merchant")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  keys.push(`m_title_dest:${merchantOrPlatform}:${cleanTitle}:${destIdentity}`);

  return keys;
}

/**
 * Deduplicates list of deals stably.
 */
export function deduplicateDeals(deals: Deal[]): Deal[] {
  const seenKeys = new Set<string>();
  const results: Deal[] = [];

  for (const deal of deals) {
    if (!deal) continue;

    const identityKeys = buildDealIdentity(deal);
    const hasDuplicate = identityKeys.some((k) => seenKeys.has(k));

    if (!hasDuplicate) {
      identityKeys.forEach((k) => seenKeys.add(k));
      results.push(deal);
    }
  }

  return results;
}

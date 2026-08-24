/**
 * Deterministic Deal ID Generation Utility
 *
 * Guarantees that the same deal processed twice receives the exact same stable ID.
 * Priority:
 * 1. Explicit id (if valid, non-empty, and not a placeholder)
 * 2. post_key / postKey / duplicateKey
 * 3. source_id / sourceId (e.g., ASIN, Telegram message ID, upstream product ID)
 * 4. Cuelinks offer_id / offerId (CRITICAL: offer_id uniquely identifies an offer, whereas campaign_id does NOT!)
 * 5. Deterministic hash of: (campaign_id or merchant) + normalized title + canonical destination URL
 *
 * IMPORTANT:
 * - A single campaign (e.g. Croma Campaign 201) can contain MULTIPLE offers.
 * - campaign_id MUST NEVER be used as a standalone unique ID (i.e. `cue-${campaignId}` is FORBIDDEN).
 * - Campaign ID participates in the hash along with title and destination.
 * - Never uses Date.now() or Math.random().
 * - Does NOT alter original affiliate tracking links.
 */

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

/**
 * Extracts authentic Cuelinks offer_id ONLY.
 * Note: Does NOT return campaign_id, because campaign_id is not a unique offer identifier.
 */
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
      // ignore URL parsing error
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

export function buildStableDealId(raw: any): string {
  if (!raw || typeof raw !== "object") {
    return "dt-unknown";
  }

  // 1. Explicit ID (valid, non-empty, non-placeholder)
  if (raw.id && typeof raw.id === "string" && raw.id.trim() && !raw.id.startsWith("dt-undefined")) {
    return raw.id.trim();
  }
  if (typeof raw.id === "number") {
    return String(raw.id);
  }

  // 2. post_key / postKey / duplicateKey (telegram posts, indexed feed items)
  const postKey = raw.post_key || raw.postKey || raw.duplicateKey;
  if (postKey && typeof postKey === "string" && postKey.trim()) {
    return `post-${postKey.trim()}`;
  }

  // 3. source_id / sourceId (upstream product/item/message identifier)
  const sourceId = raw.source_id || raw.sourceId;
  if (sourceId && typeof sourceId === "string" && sourceId.trim()) {
    return `src-${sourceId.trim()}`;
  }

  // 4. Authentic Cuelinks Offer ID ONLY (offer_id uniquely identifies one specific offer)
  const cuelinksOfferId = extractCuelinksOfferId(raw);
  if (cuelinksOfferId) {
    return `cue-off-${cuelinksOfferId}`;
  }

  // 5. Deterministic hash of: (campaign_id or campaign_name or merchant) + normalized title + canonical destination
  // Campaign ID participates in the signature, but DOES NOT uniquely identify the offer alone.
  const campaignOrMerchant = (
    raw.campaign_id ||
    raw.campaignId ||
    raw.campaign_name ||
    raw.campaignName ||
    raw.merchant ||
    raw.platform ||
    raw.store ||
    "merchant"
  )
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const title = (raw.title || raw.name || raw.productName || "deal")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 50);

  const dest = extractCanonicalDestination(raw);

  const signature = `${campaignOrMerchant}:${title}:${dest}`;
  return simpleStableHash(signature);
}

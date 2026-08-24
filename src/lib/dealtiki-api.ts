import { Deal } from "../types";
import { normalizeDeal, deduplicateDeals } from "./normalize-deal";
import { getSupabaseClient } from "./supabase";

export interface FetchDealsParams {
  keyword?: string;
  platform?: string;
  category?: string;
  minDiscount?: number;
  minPrice?: number;
  maxPrice?: number;
  onlyCoupons?: boolean;
  freshMinutes?: number;
  sort?: string;
  forceRefresh?: boolean;
  limit?: number;
  page?: number;
}

export interface FetchDealsResponse {
  deals: Deal[];
  source: "live_api" | "supabase" | "proxy_api" | "cached";
  total: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
  timestamp: number;
  error?: string;
}

class DealTikiApiClient {
  private inMemoryCache = new Map<string, { data: Deal[]; total: number; hasMore: boolean; timestamp: number }>();
  private cacheTTL = 30 * 1000; // 30s cache for fast in-session responses
  private activeAbortController: AbortController | null = null;

  async searchDeals(params: FetchDealsParams = {}): Promise<FetchDealsResponse> {
    const {
      keyword = "",
      platform = "",
      category = "",
      minDiscount = 0,
      minPrice,
      maxPrice,
      onlyCoupons = false,
      freshMinutes = 2880,
      sort = "latest",
      forceRefresh = false,
      limit = 50,
      page = 1,
    } = params;

    const cacheKey = [
      "dt_client",
      keyword.trim().toLowerCase(),
      platform.trim().toLowerCase(),
      category.trim().toLowerCase(),
      Number(minDiscount) || 0,
      minPrice !== undefined && minPrice !== null ? Number(minPrice) : "",
      maxPrice !== undefined && maxPrice !== null ? Number(maxPrice) : "",
      Boolean(onlyCoupons),
      freshMinutes,
      sort,
      page,
      limit,
    ].join("::");

    // Return in-memory cache if valid and not forcing refresh
    if (!forceRefresh) {
      const cached = this.inMemoryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return {
          deals: cached.data,
          source: "cached",
          total: cached.total,
          hasMore: cached.hasMore,
          page,
          limit,
          timestamp: cached.timestamp,
        };
      }
    }

    // Cancel previous in-flight request if any
    if (this.activeAbortController) {
      this.activeAbortController.abort();
    }
    const currentController = new AbortController();
    this.activeAbortController = currentController;

    let rawDeals: any[] = [];
    let fetchSource: "proxy_api" | "supabase" | "live_api" = "proxy_api";
    let serverTotal = 0;
    let serverHasMore = false;

    // Set 10-second timeout that genuinely aborts the request
    const timeoutId = setTimeout(() => {
      currentController.abort();
    }, 10000);

    try {
      // 1. Try fetching via website server proxy (/api/deals)
      const proxyUrl = new URL("/api/deals", window.location.origin);
      if (keyword) proxyUrl.searchParams.set("q", keyword);
      if (platform && platform !== "all") proxyUrl.searchParams.set("platform", platform);
      if (category && category !== "all") proxyUrl.searchParams.set("category", category);
      if (minDiscount > 0) proxyUrl.searchParams.set("minDiscount", String(minDiscount));
      if (minPrice !== undefined && minPrice !== null) proxyUrl.searchParams.set("minPrice", String(minPrice));
      if (maxPrice !== undefined && maxPrice !== null) proxyUrl.searchParams.set("maxPrice", String(maxPrice));
      if (onlyCoupons) proxyUrl.searchParams.set("coupon", "true");
      if (sort) proxyUrl.searchParams.set("sort", sort);
      proxyUrl.searchParams.set("freshMinutes", String(freshMinutes));
      proxyUrl.searchParams.set("page", String(page));
      proxyUrl.searchParams.set("limit", String(limit));
      if (forceRefresh) proxyUrl.searchParams.set("refresh", "true");

      const res = await fetch(proxyUrl.toString(), {
        signal: currentController.signal,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.deals && Array.isArray(json.deals)) {
          rawDeals = json.deals;
          fetchSource = json.source || "proxy_api";
          serverTotal = json.total || rawDeals.length;
          serverHasMore = Boolean(json.hasMore);
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        // If aborted by a newer request or 10s timeout
        if (this.activeAbortController !== currentController) {
          throw err; // Superseded by a newer search call
        }
        console.warn("[DealTiki] Request aborted after 10s timeout");
      } else {
        console.warn("[DealTiki] Proxy fetch failed:", err?.message || err);
      }
    } finally {
      clearTimeout(timeoutId);
    }

    // 2. Direct Supabase fallback if configured and proxy returned no deals
    if (rawDeals.length === 0 && !currentController.signal.aborted) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const nowIso = new Date().toISOString();
          let query = supabase
            .from("public_deals")
            .select("*", { count: "exact" })
            .eq("status", "active")
            .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
            .order("created_at", { ascending: false });

          if (platform && platform !== "all") {
            query = query.eq("platform", platform.toLowerCase());
          }
          if (category && category !== "all") {
            query = query.ilike("category", `%${category}%`);
          }
          if (onlyCoupons) {
            query = query.not("coupon_code", "is", null);
          }
          if (keyword) {
            const clean = keyword.slice(0, 120).replace(/[,().%\\:;"']/g, " ").trim();
            if (clean) {
              query = query.or(`title.ilike.%${clean}%,description.ilike.%${clean}%,merchant.ilike.%${clean}%`);
            }
          }

          const from = (page - 1) * limit;
          const to = from + limit - 1;
          query = query.range(from, to);

          const { data, error, count } = await query;
          if (!error && data && data.length > 0) {
            rawDeals = data;
            fetchSource = "supabase";
            serverTotal = count ?? data.length;
            serverHasMore = serverTotal > to + 1;
          }
        } catch (supabaseErr) {
          console.warn("[DealTiki] Supabase direct query fallback skipped:", supabaseErr);
        }
      }
    }

    // 3. Normalize all received real deals (NO SEED BLENDING)
    const normalizedDeals: Deal[] = rawDeals
      .map((item, idx) => normalizeDeal(item, idx))
      .filter(Boolean) as Deal[];

    // 4. Stable deduplication
    let finalDeals = deduplicateDeals(normalizedDeals);

    // Apply in-memory filters if needed
    if (category && category !== "all") {
      const catLower = category.toLowerCase();
      finalDeals = finalDeals.filter(
        (d) =>
          (d.category && d.category.toLowerCase().includes(catLower)) ||
          d.title.toLowerCase().includes(catLower)
      );
    }

    if (onlyCoupons) {
      finalDeals = finalDeals.filter((d) => Boolean(d.couponCode));
    }

    if (minDiscount > 0) {
      finalDeals = finalDeals.filter(
        (d) => d.discountPercent && d.discountPercent >= minDiscount
      );
    }

    const totalCount = serverTotal || finalDeals.length;

    // Cache the real result
    this.inMemoryCache.set(cacheKey, {
      data: finalDeals,
      total: totalCount,
      hasMore: serverHasMore,
      timestamp: Date.now(),
    });

    return {
      deals: finalDeals,
      source: fetchSource,
      total: totalCount,
      page,
      limit,
      hasMore: serverHasMore,
      timestamp: Date.now(),
    };
  }

  async getDealByIdOrSlug(idOrSlug: string): Promise<Deal | null> {
    if (!idOrSlug) return null;

    // Check in-memory cache first
    for (const entry of this.inMemoryCache.values()) {
      const match = entry.data.find(
        (d) => d.id === idOrSlug || d.slug === idOrSlug
      );
      if (match) return match;
    }

    // Try server endpoint /api/deals/:id
    try {
      const res = await fetch(`/api/deals/${encodeURIComponent(idOrSlug)}`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.deal) {
          return normalizeDeal(json.deal);
        }
      }
    } catch (err) {
      console.warn("[DealTiki] Fetch single deal failed:", err);
    }

    // Fallback: search deals list
    const searchRes = await this.searchDeals({ limit: 100 });
    return (
      searchRes.deals.find((d) => d.id === idOrSlug || d.slug === idOrSlug) ||
      null
    );
  }

  async getLatestDeals(): Promise<Deal[]> {
    const res = await this.searchDeals({ freshMinutes: 2880 });
    return res.deals;
  }

  async getStoreDeals(platform: string): Promise<Deal[]> {
    const res = await this.searchDeals({ platform });
    return res.deals;
  }

  async getCategoryDeals(categorySlug: string): Promise<Deal[]> {
    const res = await this.searchDeals({ category: categorySlug });
    return res.deals;
  }
}

export const dealTikiClient = new DealTikiApiClient();

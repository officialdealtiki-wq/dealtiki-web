import { Deal } from "../types";

const FAVORITES_KEY = "dealtiki_favorites_v1";
const RECENTLY_VIEWED_KEY = "dealtiki_recently_viewed_v1";

export function getFavoriteIds(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isFavorite(id: string): boolean {
  const ids = getFavoriteIds();
  return ids.includes(id);
}

export function toggleFavorite(deal: Deal): boolean {
  try {
    const ids = getFavoriteIds();
    const exists = ids.includes(deal.id);
    let nextIds: string[];

    if (exists) {
      nextIds = ids.filter((i) => i !== deal.id);
    } else {
      nextIds = [deal.id, ...ids];
    }

    localStorage.setItem(FAVORITES_KEY, JSON.stringify(nextIds));

    // Also store full deal payload in saved deals cache
    const savedCacheKey = `dealtiki_saved_deal_${deal.id}`;
    if (!exists) {
      localStorage.setItem(savedCacheKey, JSON.stringify(deal));
    } else {
      localStorage.removeItem(savedCacheKey);
    }

    window.dispatchEvent(new CustomEvent("dealtiki:favorites_updated", { detail: { ids: nextIds, dealId: deal.id, added: !exists } }));
    return !exists;
  } catch {
    return false;
  }
}

export function getSavedFavoriteDeals(currentDeals: Deal[]): Deal[] {
  const ids = getFavoriteIds();
  const resultMap = new Map<string, Deal>();

  // First check in current pool
  currentDeals.forEach((d) => {
    if (ids.includes(d.id)) {
      resultMap.set(d.id, d);
    }
  });

  // Check saved deal caches
  ids.forEach((id) => {
    if (!resultMap.has(id)) {
      try {
        const raw = localStorage.getItem(`dealtiki_saved_deal_${id}`);
        if (raw) {
          resultMap.set(id, JSON.parse(raw));
        }
      } catch {
        // ignore
      }
    }
  });

  return ids.map((id) => resultMap.get(id)).filter(Boolean) as Deal[];
}

export function trackRecentlyViewed(deal: Deal) {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    const existing: Deal[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((d) => d.id !== deal.id);
    const updated = [deal, ...filtered].slice(0, 10);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("dealtiki:recently_viewed_updated", { detail: updated }));
  } catch {
    // ignore
  }
}

export function getRecentlyViewed(): Deal[] {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

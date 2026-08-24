export type DealType =
  | "product"
  | "coupon"
  | "campaign"
  | "telegram"
  | "cuelinks-offer";

export type AffiliatePlatform =
  | "amazon"
  | "flipkart"
  | "myntra"
  | "ajio"
  | "croma"
  | "reliancedigital"
  | "meesho"
  | "oppo"
  | "klook"
  | "igp"
  | "others"
  | "all";

export interface Deal {
  id: string;
  slug: string;
  title: string;
  description?: string;
  image?: string;
  source?: string;
  merchant?: string;
  platform: string;
  category?: string;

  mrp?: number;
  price?: number;
  discountPercent?: number;

  rating?: number;
  reviewCount?: number;

  couponCode?: string;

  // Real affiliate tracking URL or undefined if none exists. Never fabricate fake URLs.
  affiliateLink?: string | null;
  affiliateProvider?: string;
  campaignName?: string;
  postKey?: string;
  sourceId?: string;

  status?: "active" | "expired" | "expiring_soon" | "hidden";
  expiresAt?: string;
  startsAt?: string;

  createdAt?: string;
  fetchedAt?: string;
  updatedAt?: string;

  dealType: DealType;
  featured?: boolean;
  trendingScore?: number;
  raw?: any;
}

export interface StoreInfo {
  id: string;
  name: string;
  slug: string;
  platform: string;
  tagline: string;
  logoColor: string;
  badgeBg: string;
  badgeText: string;
  websiteUrl: string;
  popularCategories: string[];
}

export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  description: string;
  keywords: string[];
}

export type SortOption =
  | "latest"
  | "discount"
  | "price_asc"
  | "price_desc"
  | "popular";

export interface FilterState {
  keyword: string;
  platform: string;
  category: string;
  minDiscount: number;
  maxPrice: number | null;
  onlyCoupons: boolean;
  sortBy: SortOption;
  storeSlug?: string;
}

export type ActiveView =
  | "home"
  | "deals"
  | "categories"
  | "stores"
  | "coupons"
  | "favorites"
  | "trending"
  | "search"
  | "deal-detail";

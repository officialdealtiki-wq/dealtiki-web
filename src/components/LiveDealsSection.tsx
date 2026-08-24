import React, { useState } from "react";
import {
  Flame,
  RotateCw,
  SlidersHorizontal,
  ArrowUpDown,
  X,
} from "lucide-react";
import { Deal, SortOption } from "../types";
import { PlatformFilters } from "./PlatformFilters";
import { CategoryNav } from "./CategoryNav";
import { DealGrid } from "./DealGrid";

interface LiveDealsSectionProps {
  deals: Deal[];
  loading: boolean;
  isRefreshing: boolean;
  secondsUntilRefresh: number;
  onRefreshDeals: () => void;
  selectedPlatform: string;
  onSelectPlatform: (platform: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onOpenDetail: (deal: Deal) => void;
  onResetFilters: () => void;
  countsByPlatform: Record<string, number>;
  sourceBadge?: string;
}

export const LiveDealsSection: React.FC<LiveDealsSectionProps> = ({
  deals,
  loading,
  isRefreshing,
  secondsUntilRefresh,
  onRefreshDeals,
  selectedPlatform,
  onSelectPlatform,
  selectedCategory,
  onSelectCategory,
  sortBy,
  onSortChange,
  onOpenDetail,
  onResetFilters,
  countsByPlatform,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [onlyCoupons, setOnlyCoupons] = useState(false);

  // Apply in-memory category, platform, discount & coupon filters
  let filteredDeals = deals.filter((d) => {
    // 1. Platform Filter
    if (selectedPlatform && selectedPlatform !== "all") {
      if (d.platform.toLowerCase() !== selectedPlatform.toLowerCase()) {
        return false;
      }
    }

    // 2. Category Filter (Fixed: checks both d.category and title/merchant keywords)
    if (selectedCategory && selectedCategory !== "all") {
      const catLower = selectedCategory.toLowerCase();
      const hasCategory =
        (d.category && d.category.toLowerCase().includes(catLower)) ||
        d.title.toLowerCase().includes(catLower) ||
        (d.description && d.description.toLowerCase().includes(catLower));
      if (!hasCategory) {
        return false;
      }
    }

    // 3. Min Discount Filter
    if (minDiscount > 0) {
      if (!d.discountPercent || d.discountPercent < minDiscount) {
        return false;
      }
    }

    // 4. Coupons Only Filter
    if (onlyCoupons) {
      if (!d.couponCode) {
        return false;
      }
    }

    return true;
  });

  // Sort deals
  filteredDeals.sort((a, b) => {
    if (sortBy === "discount") {
      return (b.discountPercent || 0) - (a.discountPercent || 0);
    }
    if (sortBy === "price_asc") {
      return (a.price || Infinity) - (b.price || Infinity);
    }
    if (sortBy === "price_desc") {
      return (b.price || 0) - (a.price || 0);
    }
    if (sortBy === "popular") {
      return (b.trendingScore || 0) - (a.trendingScore || 0);
    }
    // Default: latest
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  return (
    <section id="live-deals-section" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-yellow-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Live Deals
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] font-bold text-green-400 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {filteredDeals.length > 0
                ? `Showing ${filteredDeals.length} verified offers across online stores`
                : "Continuous scanning for new verified deals..."}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 60s background refresh counter + Manual Button */}
          <button
            id="refresh-deals-btn"
            onClick={onRefreshDeals}
            disabled={isRefreshing}
            title="Fetch latest deals from DealTiki backend"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 text-xs font-semibold text-slate-300 transition-all active:scale-95 disabled:opacity-50"
          >
            <RotateCw
              className={`w-3.5 h-3.5 text-yellow-400 ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
            <span>{isRefreshing ? "Refreshing..." : `Refresh (${secondsUntilRefresh}s)`}</span>
          </button>

          {/* Sort Dropdown */}
          <div className="relative inline-flex items-center">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#161B22] border border-white/10 text-xs font-semibold text-slate-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="sort-deals-select"
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                aria-label="Sort Deals"
                className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer pr-1"
              >
                <option value="latest" className="bg-[#161B22] text-slate-100">
                  Latest Drops
                </option>
                <option value="discount" className="bg-[#161B22] text-slate-100">
                  Highest Discount %
                </option>
                <option value="popular" className="bg-[#161B22] text-slate-100">
                  Most Popular
                </option>
                <option value="price_asc" className="bg-[#161B22] text-slate-100">
                  Lowest Price (₹)
                </option>
                <option value="price_desc" className="bg-[#161B22] text-slate-100">
                  Highest Price (₹)
                </option>
              </select>
            </div>
          </div>

          {/* Advanced Filter Toggle */}
          <button
            id="toggle-filter-btn"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              showAdvancedFilters || minDiscount > 0 || onlyCoupons
                ? "bg-yellow-400/10 border-yellow-400/40 text-yellow-400"
                : "bg-white/5 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {(minDiscount > 0 || onlyCoupons) && (
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            )}
          </button>
        </div>
      </div>

      {/* Platform Tabs */}
      <div className="mb-4">
        <PlatformFilters
          selectedPlatform={selectedPlatform}
          onSelectPlatform={onSelectPlatform}
          countsByPlatform={countsByPlatform}
        />
      </div>

      {/* Category Nav */}
      <div className="mb-6">
        <CategoryNav
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
        />
      </div>

      {/* Advanced Filter Drawer / Bar */}
      {showAdvancedFilters && (
        <div className="p-4 rounded-xl bg-[#161B22] border border-white/5 mb-6 flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex flex-wrap items-center gap-6">
            {/* Min Discount Slider */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-400">Min Discount:</span>
              <div className="flex items-center gap-1.5">
                {[0, 20, 40, 60].map((d) => (
                  <button
                    key={d}
                    onClick={() => setMinDiscount(d)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      minDiscount === d
                        ? "bg-yellow-400 text-black"
                        : "bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    {d === 0 ? "Any" : `${d}%+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Coupons Only Toggle */}
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyCoupons}
                onChange={(e) => setOnlyCoupons(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-yellow-400 focus:ring-yellow-400/20"
              />
              <span>Promo Codes Only</span>
            </label>
          </div>

          {(minDiscount > 0 || onlyCoupons) && (
            <button
              onClick={() => {
                setMinDiscount(0);
                setOnlyCoupons(false);
              }}
              className="text-xs text-yellow-400 hover:underline inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear extra filters</span>
            </button>
          )}
        </div>
      )}

      {/* Grid of Deals */}
      <DealGrid
        deals={filteredDeals}
        loading={loading}
        onOpenDetail={onOpenDetail}
        onResetFilters={onResetFilters}
      />
    </section>
  );
};

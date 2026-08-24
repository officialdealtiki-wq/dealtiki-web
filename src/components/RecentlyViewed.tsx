import React, { useState, useEffect } from "react";
import { History, Eye } from "lucide-react";
import { Deal } from "../types";
import { getRecentlyViewed } from "../lib/storage";
import { formatPrice } from "../lib/format-price";
import { StoreBadge } from "./StoreBadge";
import { DiscountBadge } from "./DiscountBadge";

interface RecentlyViewedProps {
  onOpenDetail: (deal: Deal) => void;
}

export const RecentlyViewed: React.FC<RecentlyViewedProps> = ({ onOpenDetail }) => {
  const [recentDeals, setRecentDeals] = useState<Deal[]>([]);

  useEffect(() => {
    setRecentDeals(getRecentlyViewed());

    const handleUpdate = (e: any) => {
      if (e.detail) setRecentDeals(e.detail);
    };

    window.addEventListener("dealtiki:recently_viewed_updated", handleUpdate);
    return () => {
      window.removeEventListener("dealtiki:recently_viewed_updated", handleUpdate);
    };
  }, []);

  if (recentDeals.length === 0) return null;

  return (
    <section id="recently-viewed-section" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
        <History className="w-4 h-4 text-amber-400" />
        <h3 className="text-base font-bold text-white tracking-tight">
          Recently Viewed Deals
        </h3>
      </div>

      <div className="flex items-stretch gap-4 overflow-x-auto pb-4 scrollbar-none no-scrollbar">
        {recentDeals.map((deal) => (
          <div
            key={deal.id}
            onClick={() => onOpenDetail(deal)}
            className="flex-shrink-0 w-64 p-3.5 rounded-2xl bg-[#111827] hover:bg-[#151e32] border border-slate-800 hover:border-amber-400/40 cursor-pointer transition-all flex flex-col justify-between gap-3 shadow-md"
          >
            <div className="flex items-center justify-between gap-1">
              <StoreBadge platform={deal.platform} merchant={deal.merchant} size="sm" />
              {deal.discountPercent && <DiscountBadge percent={deal.discountPercent} size="sm" />}
            </div>

            <p className="text-xs font-semibold text-slate-200 line-clamp-2 leading-snug">
              {deal.title}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span className="text-xs font-black text-amber-400 font-mono">
                {formatPrice(deal.price) || "Special Offer"}
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Eye className="w-3 h-3" />
                View
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

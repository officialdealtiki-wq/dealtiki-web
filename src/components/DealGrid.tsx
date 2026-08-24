import React from "react";
import { Deal } from "../types";
import { DealCard } from "./DealCard";
import { CampaignDealCard } from "./CampaignDealCard";
import { DealGridSkeleton } from "./LoadingSkeleton";
import { SearchX, RefreshCw } from "lucide-react";

interface DealGridProps {
  deals: Deal[];
  loading?: boolean;
  onOpenDetail?: (deal: Deal) => void;
  onResetFilters?: () => void;
}

export const DealGrid: React.FC<DealGridProps> = ({
  deals,
  loading = false,
  onOpenDetail,
  onResetFilters,
}) => {
  if (loading && deals.length === 0) {
    return <DealGridSkeleton count={8} />;
  }

  if (deals.length === 0) {
    return (
      <div
        id="zero-deals-state"
        className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-[#161B22] border border-white/5 my-8"
      >
        <div className="p-4 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 mb-4">
          <SearchX className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">No fresh deals found</h3>
        <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
          DealTiki is continuously scanning for new offers across Amazon, Croma, Flipkart and partner stores. Try clearing your filters or check back shortly.
        </p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Clear Filters / Show All</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      id="dealtiki-deal-grid"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
    >
      {deals.map((deal) =>
        deal.dealType === "campaign" ? (
          <CampaignDealCard
            key={deal.id}
            deal={deal}
            onOpenDetail={onOpenDetail}
          />
        ) : (
          <DealCard
            key={deal.id}
            deal={deal}
            onOpenDetail={onOpenDetail}
          />
        )
      )}
    </div>
  );
};

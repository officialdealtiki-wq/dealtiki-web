import React, { useState } from "react";
import { ExternalLink, Heart, Copy, Check, TicketPercent, Calendar } from "lucide-react";
import { Deal } from "../types";
import { formatExpiry, formatFreshness } from "../lib/format-price";
import { StoreBadge } from "./StoreBadge";
import { isFavorite, toggleFavorite } from "../lib/storage";
import { showToast } from "./Toast";

interface CampaignDealCardProps {
  deal: Deal;
  onOpenDetail?: (deal: Deal) => void;
}

export const CampaignDealCard: React.FC<CampaignDealCardProps> = ({
  deal,
  onOpenDetail,
}) => {
  const [fav, setFav] = useState(() => isFavorite(deal.id));
  const [copied, setCopied] = useState(false);

  const freshness = formatFreshness(deal.createdAt || deal.fetchedAt);
  const expiry = formatExpiry(deal.expiresAt);

  const handleToggleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = toggleFavorite(deal);
    setFav(nextState);
    showToast(
      nextState ? "Added to Favorites" : "Removed from Favorites",
      "info",
      2000
    );
  };

  const handleCopyCoupon = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!deal.couponCode) return;

    navigator.clipboard.writeText(deal.couponCode);
    setCopied(true);
    showToast(`Coupon code ${deal.couponCode} copied!`, "success", 2500);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleViewDeal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!deal.affiliateLink) {
      showToast("Direct store link unavailable. Opening deal details.", "info");
      if (onOpenDetail) onOpenDetail(deal);
      return;
    }
    window.open(deal.affiliateLink, "_blank", "noopener,noreferrer,sponsored");
  };

  return (
    <div
      id={`campaign-card-${deal.id}`}
      onClick={() => onOpenDetail && onOpenDetail(deal)}
      className="group relative flex flex-col h-full rounded-xl bg-[#161B22] hover:bg-[#1c222b] border border-white/5 hover:border-yellow-400/40 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden p-4"
    >
      {/* Top Bar with Store & Heart */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <StoreBadge platform={deal.platform} merchant={deal.merchant} />
        
        <div className="flex items-center gap-2">
          {deal.affiliateProvider && (
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
              {deal.affiliateProvider}
            </span>
          )}
          <button
            id={`fav-btn-camp-${deal.id}`}
            onClick={handleToggleFav}
            aria-label="Save Deal"
            className="p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/10 transition-all active:scale-90"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                fav ? "fill-yellow-400 text-yellow-400" : "text-slate-400 hover:text-white"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Offer Icon & Title */}
      <div className="flex items-start gap-2.5 mb-2.5">
        <div className="p-2 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 shrink-0">
          <TicketPercent className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-bold text-white group-hover:text-yellow-400 transition-colors leading-snug line-clamp-2">
          {deal.title}
        </h3>
      </div>

      {/* Description */}
      {deal.description && (
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
          {deal.description}
        </p>
      )}

      {/* Coupon Code Section if exists */}
      {deal.couponCode && (
        <div className="mb-3 flex items-center justify-between gap-2 p-2 rounded-lg bg-[#0F1219] border border-dashed border-yellow-400/40">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Code:</span>
            <span className="font-mono text-xs font-black text-yellow-400 tracking-wider truncate">
              {deal.couponCode}
            </span>
          </div>
          <button
            onClick={handleCopyCoupon}
            className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-400/20 hover:bg-yellow-400 text-yellow-400 hover:text-black text-xs font-bold transition-colors shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Bottom Footer Info */}
      <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between gap-3">
        <div className="flex flex-col">
          {expiry ? (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-medium ${
                expiry.isExpired
                  ? "text-red-400"
                  : expiry.isSoon
                  ? "text-yellow-400"
                  : "text-slate-400"
              }`}
            >
              <Calendar className="w-3 h-3" />
              {expiry.text}
            </span>
          ) : (
            <span className="text-[10px] text-slate-400">{freshness}</span>
          )}
          <span className="text-[10px] text-slate-500 font-medium">
            {deal.category || "Online Offer"}
          </span>
        </div>

        {deal.affiliateLink ? (
          <button
            id={`view-camp-btn-${deal.id}`}
            onClick={handleViewDeal}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-black text-xs font-extrabold uppercase tracking-wider transition-all shadow active:scale-95 shrink-0"
          >
            <span>View Deal</span>
            <ExternalLink className="w-3 h-3 stroke-[2.5]" />
          </button>
        ) : (
          <button
            id={`view-camp-btn-${deal.id}`}
            onClick={() => onOpenDetail && onOpenDetail(deal)}
            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all shrink-0"
          >
            <span>Details</span>
          </button>
        )}
      </div>
    </div>
  );
};

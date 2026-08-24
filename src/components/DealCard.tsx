import React, { useState } from "react";
import { ExternalLink, Heart, Star, Sparkles, Tag, AlertCircle } from "lucide-react";
import { Deal } from "../types";
import { formatPrice, formatFreshness } from "../lib/format-price";
import { isFavorite, toggleFavorite } from "../lib/storage";
import { showToast } from "./Toast";

interface DealCardProps {
  deal: Deal;
  onOpenDetail?: (deal: Deal) => void;
}

export const DealCard: React.FC<DealCardProps> = ({ deal, onOpenDetail }) => {
  const [fav, setFav] = useState(() => isFavorite(deal.id));
  const [imgError, setImgError] = useState(false);

  const formattedPrice = formatPrice(deal.price);
  const formattedMrp = formatPrice(deal.mrp);
  const freshness = formatFreshness(deal.createdAt || deal.fetchedAt);

  const handleToggleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = toggleFavorite(deal);
    setFav(nextState);
    showToast(
      nextState ? "Added to Saved Deals" : "Removed from Saved Deals",
      "info",
      2000
    );
  };

  const handleBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!deal.affiliateLink) {
      showToast("Direct store link is currently unavailable for this deal.", "warning");
      return;
    }
    window.open(deal.affiliateLink, "_blank", "noopener,noreferrer,sponsored");
  };

  const merchantName = (deal.merchant || deal.platform || "Online").toUpperCase();

  return (
    <div
      id={`deal-card-${deal.id}`}
      onClick={() => onOpenDetail && onOpenDetail(deal)}
      className="bg-[#161B22] rounded-xl border border-white/5 hover:border-white/20 flex flex-col group overflow-hidden transition-all duration-200 cursor-pointer shadow-lg hover:shadow-2xl"
    >
      {/* Top Image Container */}
      <div className="relative h-44 shrink-0 overflow-hidden rounded-t-xl bg-white flex items-center justify-center p-3">
        {deal.image && !imgError ? (
          <img
            src={deal.image}
            alt={deal.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-1 p-4 text-center">
            <Sparkles className="w-8 h-8 text-yellow-500/60" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              {merchantName}
            </span>
          </div>
        )}

        {/* Store Badge - Professional Polish */}
        <div className="absolute top-2 left-2 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider backdrop-blur-sm">
          {merchantName}
        </div>

        {/* Discount Badge */}
        {deal.discountPercent ? (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
            {deal.discountPercent}% OFF
          </div>
        ) : null}

        {/* Favorite Button */}
        <button
          id={`fav-btn-${deal.id}`}
          onClick={handleToggleFav}
          aria-label="Save Deal"
          className="absolute bottom-2 right-2 p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-slate-300 border border-slate-700/60 backdrop-blur-md transition-all active:scale-90"
        >
          <Heart
            className={`w-3.5 h-3.5 ${
              fav ? "fill-yellow-400 text-yellow-400" : "text-slate-300"
            }`}
          />
        </button>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Title */}
          <h3 className="text-sm font-bold line-clamp-2 mb-2 group-hover:text-yellow-400 text-slate-100 transition-colors leading-snug">
            {deal.title}
          </h3>

          {/* Rating */}
          {deal.rating ? (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex text-yellow-400 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < Math.round(deal.rating || 0)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-slate-600"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-slate-400 font-medium ml-1">
                {deal.rating}
                {deal.reviewCount ? ` (${deal.reviewCount})` : ""}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium mb-2">
              <Tag className="w-3 h-3 text-slate-600" />
              <span>{deal.category || "Verified Deal"}</span>
            </div>
          )}
        </div>

        {/* Pricing & CTA */}
        <div>
          <div className="flex items-baseline gap-2 mb-3">
            {formattedPrice ? (
              <>
                <span className="text-lg font-black text-white font-mono">
                  {formattedPrice}
                </span>
                {formattedMrp && formattedMrp !== formattedPrice && (
                  <span className="text-xs text-slate-500 line-through font-mono">
                    {formattedMrp}
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
                Special Offer
              </span>
            )}
          </div>

          {deal.affiliateLink ? (
            <button
              id={`buy-btn-${deal.id}`}
              onClick={handleBuyClick}
              className="w-full bg-yellow-400 text-black py-2 rounded-lg text-xs font-bold uppercase tracking-tighter hover:bg-yellow-300 transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
            >
              <span>Buy Deal</span>
              <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          ) : (
            <button
              id={`view-btn-${deal.id}`}
              onClick={() => onOpenDetail && onOpenDetail(deal)}
              className="w-full bg-white/5 hover:bg-white/10 text-slate-400 py-2 rounded-lg text-xs font-bold uppercase tracking-tighter transition-colors flex items-center justify-center gap-1.5 border border-white/5"
            >
              <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>View Deal Details</span>
            </button>
          )}
        </div>
      </div>

      {/* Card Footer Bar */}
      <div className="px-4 py-2 border-t border-white/5 flex justify-between items-center bg-black/20 text-[9px] text-slate-500 uppercase tracking-widest font-semibold">
        <span>Verified Deal</span>
        <span>{freshness}</span>
      </div>
    </div>
  );
};

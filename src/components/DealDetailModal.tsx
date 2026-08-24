import React, { useState, useEffect } from "react";
import {
  X,
  ExternalLink,
  Heart,
  Star,
  Clock,
  Calendar,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  TicketPercent,
  Sparkles,
  MessageCircle,
  Send,
} from "lucide-react";
import { Deal } from "../types";
import { formatPrice, formatFreshness, formatExpiry } from "../lib/format-price";
import { StoreBadge } from "./StoreBadge";
import { DiscountBadge } from "./DiscountBadge";
import { isFavorite, toggleFavorite, trackRecentlyViewed } from "../lib/storage";
import { injectProductSchema, updatePageSEO } from "../lib/seo";
import { showToast } from "./Toast";

interface DealDetailModalProps {
  deal: Deal | null;
  onClose: () => void;
  onSelectDeal: (deal: Deal) => void;
  allDeals: Deal[];
}

export const DealDetailModal: React.FC<DealDetailModalProps> = ({
  deal,
  onClose,
  onSelectDeal,
  allDeals,
}) => {
  const [fav, setFav] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (deal) {
      setFav(isFavorite(deal.id));
      trackRecentlyViewed(deal);
      injectProductSchema(deal);
      updatePageSEO(
        deal.title,
        deal.description || `Get ${deal.discountPercent || ""}% off on ${deal.title} at ${deal.merchant || "DealTiki"}`
      );
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [deal]);

  if (!deal) return null;

  const formattedPrice = formatPrice(deal.price);
  const formattedMrp = formatPrice(deal.mrp);
  const freshness = formatFreshness(deal.createdAt || deal.fetchedAt);
  const expiry = formatExpiry(deal.expiresAt);

  const handleToggleFav = () => {
    const next = toggleFavorite(deal);
    setFav(next);
    showToast(next ? "Saved to Favorites" : "Removed from Favorites", "info");
  };

  const handleCopyCode = () => {
    if (!deal.couponCode) return;
    navigator.clipboard.writeText(deal.couponCode);
    setCopiedCode(true);
    showToast(`Code "${deal.couponCode}" copied!`, "success");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyDealLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast("Deal link copied to clipboard!", "success");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Check out this hot deal on DealTiki: ${deal.title} ${
        formattedPrice ? `for only ${formattedPrice}` : ""
      }\n${deal.affiliateLink}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(
      `🔥 Deal Alert on DealTiki: ${deal.title}\n${deal.affiliateLink}`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(deal.affiliateLink)}&text=${text}`, "_blank");
  };

  const handleBuyNow = () => {
    window.open(deal.affiliateLink, "_blank", "noopener,noreferrer,sponsored");
  };

  // Find 3 related deals from same category or merchant
  const relatedDeals = allDeals
    .filter(
      (d) =>
        d.id !== deal.id &&
        (d.platform === deal.platform || d.category === deal.category)
    )
    .slice(0, 3);

  return (
    <div
      id="deal-detail-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="deal-detail-modal"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0F1219] border border-white/10 shadow-2xl overflow-hidden my-auto"
      >
        {/* Header Close Button */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={handleToggleFav}
            aria-label="Save Deal"
            className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 transition-all active:scale-90"
          >
            <Heart
              className={`w-4 h-4 ${
                fav ? "fill-yellow-400 text-yellow-400" : "hover:text-white"
              }`}
            />
          </button>
          <button
            id="close-detail-modal-btn"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          {/* Main Product/Deal Hero Box */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left: Image / Visual Banner */}
            <div className="md:col-span-5 w-full aspect-square rounded-xl bg-white border border-white/10 p-6 flex items-center justify-center relative overflow-hidden">
              {deal.image && !imgError ? (
                <img
                  src={deal.image}
                  alt={deal.title}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-contain object-center"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 gap-3">
                  <div className="p-3 rounded-xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-500">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    {deal.merchant || "DealTiki Verified Offer"}
                  </span>
                </div>
              )}

              {deal.discountPercent && (
                <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-black px-2.5 py-1 rounded shadow">
                  {deal.discountPercent}% OFF
                </div>
              )}
            </div>

            {/* Right: Deal Core Information */}
            <div className="md:col-span-7 flex flex-col gap-4">
              {/* Badges & Freshness */}
              <div className="flex flex-wrap items-center gap-2">
                <StoreBadge platform={deal.platform} merchant={deal.merchant} size="md" />
                {deal.category && (
                  <span className="px-2.5 py-1 rounded-md bg-white/5 text-slate-300 text-xs font-semibold border border-white/5">
                    {deal.category}
                  </span>
                )}
                <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {freshness}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
                {deal.title}
              </h1>

              {/* Rating & Reviews */}
              {deal.rating && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span>{deal.rating}</span>
                  </div>
                  {deal.reviewCount && (
                    <span className="text-xs text-slate-400">
                      Based on {deal.reviewCount.toLocaleString("en-IN")} buyer reviews
                    </span>
                  )}
                </div>
              )}

              {/* Pricing Section */}
              <div className="p-4 rounded-xl bg-[#161B22] border border-white/5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-400 font-medium block mb-1">
                    Special Offer Price
                  </span>
                  {formattedPrice ? (
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-black text-white font-mono tracking-tight">
                        {formattedPrice}
                      </span>
                      {formattedMrp && formattedMrp !== formattedPrice && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500 line-through font-mono">
                            MRP {formattedMrp}
                          </span>
                          {deal.discountPercent && (
                            <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                              Save {deal.discountPercent}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-lg font-bold text-yellow-400">
                      Promotional Deal Available
                    </span>
                  )}
                </div>

                {expiry && (
                  <div className="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-400/10 px-3 py-1.5 rounded-lg border border-yellow-400/20">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{expiry.text}</span>
                  </div>
                )}
              </div>

              {/* Coupon Code Box */}
              {deal.couponCode && (
                <div className="p-3.5 rounded-xl bg-[#161B22] border-2 border-dashed border-yellow-400/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-yellow-400/10 text-yellow-400">
                      <TicketPercent className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Exclusive Promo Code
                      </span>
                      <span className="font-mono text-base font-black text-yellow-400 tracking-wider">
                        {deal.couponCode}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-extrabold transition-all active:scale-95 shrink-0"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Primary Buy Button */}
              <div className="space-y-2 pt-2">
                <button
                  id="detail-buy-now-cta"
                  onClick={handleBuyNow}
                  className="w-full flex items-center justify-center gap-2.5 py-3 px-6 rounded-xl bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-black font-extrabold text-sm uppercase tracking-wider transition-all shadow-md active:scale-[0.99]"
                >
                  <span>
                    {deal.dealType === "campaign" ? "View Offer at Store" : "Buy Deal on Official Store"}
                  </span>
                  <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                </button>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                  <span>Secure redirect to verified official merchant store</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description & Details */}
          {deal.description && (
            <div className="p-5 rounded-xl bg-[#161B22] border border-white/5 space-y-2">
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Deal Overview
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                {deal.description}
              </p>
            </div>
          )}

          {/* Share & Social Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#161B22] border border-white/5">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-yellow-400" />
              Share this deal:
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShareWhatsApp}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={handleShareTelegram}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </button>
              <button
                onClick={handleCopyDealLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Link Copied" : "Copy Link"}</span>
              </button>
            </div>
          </div>

          {/* Related Deals Section */}
          {relatedDeals.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-white/5">
              <h2 className="text-sm font-bold text-white">
                More Deals from {deal.merchant || "Related Categories"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {relatedDeals.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => onSelectDeal(r)}
                    className="p-3.5 rounded-xl bg-[#161B22] hover:bg-slate-800 border border-white/5 hover:border-yellow-400/40 cursor-pointer transition-all flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <StoreBadge platform={r.platform} merchant={r.merchant} size="sm" />
                      {r.discountPercent && <DiscountBadge percent={r.discountPercent} size="sm" />}
                    </div>
                    <p className="text-xs font-semibold text-slate-200 line-clamp-2">
                      {r.title}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-bold text-white font-mono">
                        {formatPrice(r.price) || "Special Offer"}
                      </span>
                      <span className="text-[10px] text-yellow-400 font-bold uppercase">View</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Affiliate Disclosure in Modal */}
          <div className="p-3 rounded-lg bg-black/20 border border-white/5 text-center">
            <p className="text-[10px] text-slate-400 leading-relaxed">
              <strong>Affiliate Disclosure:</strong> DealTiki may earn a commission when you purchase through links on our site, at no additional cost to you. Pricing and availability are verified periodically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

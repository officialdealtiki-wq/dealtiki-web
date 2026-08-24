import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
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
  ArrowLeft,
  MessageCircle,
  Send,
  AlertCircle,
} from "lucide-react";
import { Deal } from "../types";
import { formatPrice, formatFreshness, formatExpiry } from "../lib/format-price";
import { StoreBadge } from "./StoreBadge";
import { DiscountBadge } from "./DiscountBadge";
import { isFavorite, toggleFavorite, trackRecentlyViewed } from "../lib/storage";
import { injectProductSchema, updatePageSEO } from "../lib/seo";
import { showToast } from "./Toast";
import { dealTikiClient } from "../lib/dealtiki-api";
import { DealDetailSkeleton } from "./LoadingSkeleton";

interface DealDetailPageProps {
  allDeals: Deal[];
}

export const DealDetailPage: React.FC<DealDetailPageProps> = ({ allDeals }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [fav, setFav] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    async function loadDeal() {
      if (!slug) return;

      // Check allDeals array first
      const foundInProps = allDeals.find(
        (d) => d.slug === slug || d.id === slug
      );
      if (foundInProps) {
        setDeal(foundInProps);
        setLoading(false);
        return;
      }

      // Fetch from API
      setLoading(true);
      try {
        const fetched = await dealTikiClient.getDealByIdOrSlug(slug);
        setDeal(fetched);
      } catch (err) {
        console.error("[DealTiki] Error loading deal detail:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDeal();
  }, [slug, allDeals]);

  useEffect(() => {
    if (deal) {
      setFav(isFavorite(deal.id));
      trackRecentlyViewed(deal);
      injectProductSchema(deal);
      updatePageSEO({
        title: `${deal.title} | Best Price on DealTiki`,
        description:
          deal.description ||
          `Get ${deal.discountPercent ? `${deal.discountPercent}% OFF` : "best discount"} on ${deal.title} from ${deal.merchant || "DealTiki partner store"}.`,
        imageUrl: deal.image,
        type: "product",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [deal]);

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-8">
        <DealDetailSkeleton />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="p-4 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 inline-block mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Deal Not Found</h1>
        <p className="text-xs text-slate-400 mb-6">
          This deal may have expired or been removed. Explore hundreds of other verified active deals.
        </p>
        <Link
          to="/deals"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse All Deals</span>
        </Link>
      </div>
    );
  }

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
      }\n${window.location.href}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(
      `🔥 Deal Alert on DealTiki: ${deal.title}\n${window.location.href}`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${text}`, "_blank");
  };

  const handleBuyNow = () => {
    if (!deal.affiliateLink) {
      showToast("Direct store link is currently unavailable.", "warning");
      return;
    }
    window.open(deal.affiliateLink, "_blank", "noopener,noreferrer,sponsored");
  };

  const relatedDeals = allDeals
    .filter(
      (d) =>
        d.id !== deal.id &&
        (d.platform === deal.platform || d.category === deal.category)
    )
    .slice(0, 3);

  return (
    <div id="deal-detail-page" className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Back Button */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleFav}
            aria-label="Save Deal"
            className="p-2 rounded-lg bg-slate-900 border border-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <Heart
              className={`w-4 h-4 ${
                fav ? "fill-yellow-400 text-yellow-400" : ""
              }`}
            />
          </button>
          <button
            onClick={handleCopyDealLink}
            aria-label="Share Deal"
            className="p-2 rounded-lg bg-slate-900 border border-white/10 text-slate-300 hover:text-white transition-colors"
          >
            {copiedLink ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Deal Card Box */}
      <div className="rounded-2xl bg-[#0F1219] border border-white/10 shadow-2xl p-4 sm:p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left: Image */}
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
            <div className="flex flex-wrap items-center gap-2">
              <StoreBadge platform={deal.platform} merchant={deal.merchant} size="md" />
              {deal.status === "expired" ? (
                <span className="px-2.5 py-1 rounded-md bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30 uppercase tracking-wider">
                  Expired Deal
                </span>
              ) : deal.category ? (
                <span className="px-2.5 py-1 rounded-md bg-white/5 text-slate-300 text-xs font-semibold border border-white/5">
                  {deal.category}
                </span>
              ) : null}
              <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {freshness}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
              {deal.title}
            </h1>

            {deal.rating && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span>{deal.rating}</span>
                </div>
                {deal.reviewCount && (
                  <span className="text-xs text-slate-400">
                    Based on {deal.reviewCount.toLocaleString("en-IN")} buyer ratings
                  </span>
                )}
              </div>
            )}

            {/* Pricing Section */}
            <div className="p-4 rounded-xl bg-[#161B22] border border-white/5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400 font-medium block mb-1">
                  Offer Price
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
                    Promotional Offer Active
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

            {/* Promo Code Box */}
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

            {/* CTA Buy Button */}
            <div className="space-y-2 pt-2">
              {deal.affiliateLink ? (
                <button
                  id="detail-page-buy-cta"
                  onClick={handleBuyNow}
                  className="w-full flex items-center justify-center gap-2.5 py-3 px-6 rounded-xl bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-black font-extrabold text-sm uppercase tracking-wider transition-all shadow-md active:scale-[0.99]"
                >
                  <span>
                    {deal.dealType === "campaign" ? "View Offer at Store" : "Buy Deal on Official Store"}
                  </span>
                  <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-slate-400">
                  Direct store link currently unavailable for this deal.
                </div>
              )}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
                <ShieldCheck className="w-4 h-4 text-green-400" />
                <span>Verified official merchant redirect</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
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
                <Link
                  key={r.id}
                  to={`/deal/${r.slug || r.id}`}
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
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Affiliate Disclosure */}
        <div className="p-3 rounded-lg bg-black/20 border border-white/5 text-center">
          <p className="text-[10px] text-slate-400 leading-relaxed">
            <strong>Affiliate Disclosure:</strong> DealTiki may earn an affiliate commission when you purchase through links on our site, at no additional cost to you.
          </p>
        </div>
      </div>
    </div>
  );
};

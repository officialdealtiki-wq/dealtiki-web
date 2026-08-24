import React, { useState } from "react";
import { TicketPercent, Copy, Check, ExternalLink, Calendar } from "lucide-react";
import { Deal } from "../types";
import { StoreBadge } from "./StoreBadge";
import { formatExpiry } from "../lib/format-price";
import { showToast } from "./Toast";

interface CouponsViewProps {
  allDeals: Deal[];
  onOpenDetail: (deal: Deal) => void;
}

export const CouponsView: React.FC<CouponsViewProps> = ({
  allDeals,
  onOpenDetail,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Deals that have couponCode or are coupon/campaign type
  const couponDeals = allDeals.filter(
    (d) => Boolean(d.couponCode) || d.dealType === "coupon" || d.dealType === "campaign"
  );

  const handleCopy = (code: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    showToast(`Coupon code ${code} copied!`, "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleVisit = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, "_blank", "noopener,noreferrer,sponsored");
  };

  return (
    <div id="coupons-page-view" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-white/5">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="p-2 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-yellow-400">
            <TicketPercent className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Verified Coupon Codes & Vouchers
          </h1>
        </div>
        <p className="text-xs text-slate-400">
          Save extra with tested promo codes for Amazon, Myntra, Croma, AJIO and partner stores.
        </p>
      </div>

      {couponDeals.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs">
          No active coupon codes right now. Check back shortly as DealTiki scans for new vouchers.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {couponDeals.map((deal) => {
            const expiry = formatExpiry(deal.expiresAt);
            const isCopied = copiedId === deal.id;

            return (
              <div
                key={deal.id}
                onClick={() => onOpenDetail(deal)}
                className="group relative p-5 rounded-xl bg-[#161B22] hover:bg-[#1c222b] border border-white/5 hover:border-yellow-400/40 cursor-pointer transition-all flex flex-col justify-between gap-3 shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <StoreBadge platform={deal.platform} merchant={deal.merchant} />
                    {expiry && (
                      <span className="text-[10px] font-medium text-yellow-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {expiry.text}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-yellow-400 transition-colors leading-snug line-clamp-2 mb-2">
                    {deal.title}
                  </h3>

                  {deal.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {deal.description}
                    </p>
                  )}
                </div>

                {/* Coupon Code Strip */}
                {deal.couponCode ? (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0F1219] border border-dashed border-yellow-400/40">
                    <span className="font-mono text-xs font-black text-yellow-400 tracking-wider">
                      {deal.couponCode}
                    </span>
                    <button
                      onClick={(e) => handleCopy(deal.couponCode!, deal.id, e)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-yellow-400 text-black text-xs font-extrabold hover:bg-yellow-300 transition-all active:scale-95 uppercase tracking-wider"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                ) : null}

                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500 font-medium">
                    {deal.category || "Promo Offer"}
                  </span>
                  <button
                    onClick={(e) => handleVisit(deal.affiliateLink, e)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-yellow-400 hover:underline uppercase tracking-wider"
                  >
                    <span>Redeem at Store</span>
                    <ExternalLink className="w-3 h-3 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

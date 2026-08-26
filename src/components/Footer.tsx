import React from "react";
import { ShieldCheck, Send } from "lucide-react";
import { ActiveView } from "../types";
import { STORES } from "../lib/stores";
import { CATEGORIES } from "../lib/categories";

interface FooterProps {
  onNavigate: (view: ActiveView) => void;
  onSelectStore: (platform: string) => void;
  onSelectCategory: (categorySlug: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onSelectStore,
  onSelectCategory,
}) => {
  return (
    <footer
      id="dealtiki-footer"
      className="w-full bg-[#0F1219] border-t border-white/5 text-slate-400 text-xs mt-16 pt-12 pb-24 sm:pb-12"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Col 1: Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-yellow-400 text-black font-black px-2 py-0.5 rounded text-base italic tracking-tighter shadow-sm">
                TIKI
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Deal<span className="text-yellow-400">Tiki</span>
              </span>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              DealTiki automatically discovers and organizes fresh online deals to help shoppers find better prices faster across Amazon, Flipkart, Croma and top Indian merchants.
            </p>

            {/* Telegram Channel Banner */}
            <div className="p-4 rounded-xl bg-[#161B22] border border-white/5 flex items-center justify-between gap-3 max-w-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-400/10 text-yellow-400">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white text-xs block">Join Telegram Channel</span>
                  <span className="text-[11px] text-slate-400">Instant price drop alerts</span>
                </div>
              </div>
              <a
                href="https://t.me/dealtiki"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs transition-colors"
              >
                Join
              </a>
            </div>
          </div>

          {/* Col 2: Top Stores */}
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider text-xs">
              Popular Stores
            </h4>
            <ul className="space-y-2">
              {STORES.slice(0, 6).map((store) => (
                <li key={store.id}>
                  <button
                    onClick={() => {
                      onSelectStore(store.platform);
                      onNavigate("deals");
                    }}
                    className="hover:text-yellow-400 transition-colors text-left"
                  >
                    {store.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Categories */}
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider text-xs">
              Top Categories
            </h4>
            <ul className="space-y-2">
              {CATEGORIES.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => {
                      onSelectCategory(cat.slug);
                      onNavigate("deals");
                    }}
                    className="hover:text-yellow-400 transition-colors text-left"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider text-xs">
              Navigation & Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate("deals")} className="hover:text-yellow-400 transition-colors">
                  Latest Deals Feed
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("coupons")} className="hover:text-yellow-400 transition-colors">
                  Verified Coupons
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("trending")} className="hover:text-yellow-400 transition-colors">
                  Trending Price Drops
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("favorites")} className="hover:text-yellow-400 transition-colors">
                  My Saved Deals
                </button>
              </li>
              <li className="pt-2 text-[11px] text-slate-500">
                <span>Terms of Service & Privacy Policy</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Affiliate Disclosure Box */}
        <div className="p-4 rounded-xl bg-[#161B22] border border-white/5 mb-8 space-y-2">
          <div className="flex items-center gap-2 text-slate-300 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-green-400" />
            <span>Affiliate Disclosure</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            DealTiki may earn a commission when you purchase through links on our site, at no additional cost to you. We partner with Amazon Associates, Cuelinks, and official merchant affiliate programs to bring you the best deals and price drop alerts.
          </p>
        </div>

        {/* Bottom Copyright & Status */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/5 text-slate-500 text-xs">
          <span>&copy; {new Date().getFullYear()} DealTiki. All rights reserved.</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-slate-400 font-medium">Live Deal Engine: Online</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

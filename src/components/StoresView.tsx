import React, { useState } from "react";
import { Store, ArrowRight, Search } from "lucide-react";
import { STORES } from "../lib/stores";
import { Deal } from "../types";
import { DealGrid } from "./DealGrid";

interface StoresViewProps {
  allDeals: Deal[];
  onOpenDetail: (deal: Deal) => void;
  onSelectStore: (platform: string) => void;
}

export const StoresView: React.FC<StoresViewProps> = ({
  allDeals,
  onOpenDetail,
  onSelectStore,
}) => {
  const [selectedStoreSlug, setSelectedStoreSlug] = useState<string | null>(null);
  const [storeSearch, setStoreSearch] = useState("");

  const filteredStores = STORES.filter(
    (s) =>
      s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
      s.tagline.toLowerCase().includes(storeSearch.toLowerCase())
  );

  const selectedStore = selectedStoreSlug
    ? STORES.find((s) => s.slug === selectedStoreSlug)
    : null;

  const storeDeals = selectedStore
    ? allDeals.filter(
        (d) =>
          d.platform.toLowerCase() === selectedStore.platform.toLowerCase() ||
          (d.merchant && d.merchant.toLowerCase().includes(selectedStore.platform.toLowerCase()))
      )
    : [];

  return (
    <div id="stores-page-view" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-yellow-400">
              <Store className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Supported Merchant Stores
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Browse verified offers directly from official brands, ecommerce giants and travel platforms.
          </p>
        </div>

        {/* Search stores */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={storeSearch}
            onChange={(e) => setStoreSearch(e.target.value)}
            placeholder="Search stores..."
            className="w-full bg-[#161B22] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:border-yellow-400 outline-none"
          />
        </div>
      </div>

      {/* If a store is selected, show store hero & store deals */}
      {selectedStore ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedStoreSlug(null)}
              className="text-xs font-bold text-yellow-400 hover:underline inline-flex items-center gap-1"
            >
              ← Back to all stores
            </button>
            <span className="text-xs text-slate-400">
              Showing {storeDeals.length} deals for {selectedStore.name}
            </span>
          </div>

          <div className="p-5 rounded-xl bg-[#161B22] border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <span
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: selectedStore.logoColor }}
                />
                <h2 className="text-xl font-extrabold text-white">
                  {selectedStore.name}
                </h2>
              </div>
              <p className="text-xs text-slate-300 max-w-xl">
                {selectedStore.tagline}
              </p>
            </div>

            <button
              onClick={() => onSelectStore(selectedStore.platform)}
              className="px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs uppercase tracking-wider transition-all"
            >
              Filter in Main Feed
            </button>
          </div>

          <DealGrid
            deals={storeDeals}
            onOpenDetail={onOpenDetail}
          />
        </div>
      ) : (
        /* Store Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStores.map((store) => {
            const count = allDeals.filter(
              (d) =>
                d.platform.toLowerCase() === store.platform.toLowerCase() ||
                (d.merchant && d.merchant.toLowerCase().includes(store.platform.toLowerCase()))
            ).length;

            return (
              <div
                key={store.id}
                onClick={() => setSelectedStoreSlug(store.slug)}
                className="group p-5 rounded-xl bg-[#161B22] hover:bg-[#1c222b] border border-white/5 hover:border-yellow-400/40 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: store.logoColor }}
                      />
                      <h3 className="text-base font-bold text-white group-hover:text-yellow-400 transition-colors">
                        {store.name}
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-[#0F1219] border border-white/5 text-[11px] font-mono font-bold text-slate-300">
                      {count} deals
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    {store.tagline}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {store.popularCategories.map((c) => (
                      <span
                        key={c}
                        className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-yellow-400 group-hover:translate-x-0.5 transition-transform uppercase tracking-wider">
                  <span>Explore Store</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

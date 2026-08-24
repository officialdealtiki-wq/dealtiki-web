import React, { useState, useEffect } from "react";
import { Heart, Trash2, ArrowRight } from "lucide-react";
import { Deal } from "../types";
import { getSavedFavoriteDeals } from "../lib/storage";
import { DealGrid } from "./DealGrid";
import { showToast } from "./Toast";

interface FavoritesViewProps {
  allDeals: Deal[];
  onOpenDetail: (deal: Deal) => void;
  onExploreDeals: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  allDeals,
  onOpenDetail,
  onExploreDeals,
}) => {
  const [favoriteDeals, setFavoriteDeals] = useState<Deal[]>([]);

  const loadFavorites = () => {
    setFavoriteDeals(getSavedFavoriteDeals(allDeals));
  };

  useEffect(() => {
    loadFavorites();

    const handleUpdate = () => loadFavorites();
    window.addEventListener("dealtiki:favorites_updated", handleUpdate);
    return () => {
      window.removeEventListener("dealtiki:favorites_updated", handleUpdate);
    };
  }, [allDeals]);

  const handleClearAll = () => {
    localStorage.removeItem("dealtiki_favorites_v1");
    setFavoriteDeals([]);
    window.dispatchEvent(new CustomEvent("dealtiki:favorites_updated", { detail: { ids: [] } }));
    showToast("Cleared all saved favorites", "info");
  };

  return (
    <div id="favorites-page-view" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-yellow-400">
              <Heart className="w-5 h-5 fill-yellow-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Saved Favorite Deals
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Keep track of price drops on your shortlisted products and promo codes.
          </p>
        </div>

        {favoriteDeals.length > 0 && (
          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#161B22] hover:bg-slate-800 border border-white/10 text-xs font-bold text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Favorites</span>
          </button>
        )}
      </div>

      {favoriteDeals.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl bg-[#161B22] border border-white/5 my-8">
          <div className="p-3.5 rounded-full bg-yellow-400/10 text-yellow-400 mb-4">
            <Heart className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">
            No saved deals yet
          </h2>
          <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
            Click the heart icon on any deal card to save it here for fast price monitoring and future reference.
          </p>
          <button
            onClick={onExploreDeals}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow active:scale-95"
          >
            <span>Explore Live Deals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <DealGrid
          deals={favoriteDeals}
          onOpenDetail={onOpenDetail}
        />
      )}
    </div>
  );
};

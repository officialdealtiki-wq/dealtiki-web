import React from "react";
import { Flame, Zap, Search, Layers, Heart } from "lucide-react";
import { ActiveView } from "../types";

interface MobileBottomNavProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  favoritesCount: number;
  onOpenSearch: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  onNavigate,
  favoritesCount,
  onOpenSearch,
}) => {
  return (
    <div
      id="mobile-bottom-nav"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0F1219]/95 backdrop-blur-xl border-t border-white/5 px-2 py-1.5 flex items-center justify-around shadow-2xl"
    >
      {/* Home */}
      <button
        onClick={() => onNavigate("home")}
        className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ${
          activeView === "home" ? "text-yellow-400 font-bold" : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <Flame className="w-5 h-5" />
        <span className="text-[10px]">Home</span>
      </button>

      {/* Deals */}
      <button
        onClick={() => onNavigate("deals")}
        className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ${
          activeView === "deals" ? "text-yellow-400 font-bold" : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <Zap className="w-5 h-5" />
        <span className="text-[10px]">Deals</span>
      </button>

      {/* Search trigger */}
      <button
        onClick={onOpenSearch}
        className="flex flex-col items-center gap-1 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-all"
      >
        <div className="p-1 rounded-full bg-yellow-400 text-black">
          <Search className="w-4 h-4" />
        </div>
        <span className="text-[10px]">Search</span>
      </button>

      {/* Categories */}
      <button
        onClick={() => onNavigate("categories")}
        className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ${
          activeView === "categories" ? "text-yellow-400 font-bold" : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <Layers className="w-5 h-5" />
        <span className="text-[10px]">Categories</span>
      </button>

      {/* Favorites */}
      <button
        onClick={() => onNavigate("favorites")}
        className={`relative flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ${
          activeView === "favorites" ? "text-yellow-400 font-bold" : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <Heart className={`w-5 h-5 ${favoritesCount > 0 && activeView === "favorites" ? "fill-yellow-400 text-yellow-400" : ""}`} />
        <span className="text-[10px]">Favorites</span>
        {favoritesCount > 0 && (
          <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-yellow-400 text-black text-[9px] font-black flex items-center justify-center">
            {favoritesCount}
          </span>
        )}
      </button>
    </div>
  );
};

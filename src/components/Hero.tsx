import React, { useState } from "react";
import { Search, X, TrendingUp, Zap, ShieldCheck, Sparkles } from "lucide-react";

interface HeroProps {
  keyword: string;
  onSearchChange: (kw: string) => void;
  onQuickSearch: (tag: string) => void;
  totalDealsCount: number;
}

export const Hero: React.FC<HeroProps> = ({
  keyword,
  onSearchChange,
  onQuickSearch,
  totalDealsCount,
}) => {
  const [localInput, setLocalInput] = useState(keyword);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalInput(val);
    onSearchChange(val);
  };

  const handleClear = () => {
    setLocalInput("");
    onSearchChange("");
  };

  const suggestions = [
    "iPhone 15",
    "MacBook",
    "Sony XM5",
    "Sneakers",
    "Smart TV",
    "Coupons",
  ];

  return (
    <section
      id="dealtiki-hero"
      className="bg-gradient-to-b from-[#0F1219] via-[#0E121B] to-[#0B0E14] pt-10 pb-8 px-4 sm:px-8 text-center shrink-0 border-b border-white/5"
    >
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        {/* Live Engine Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold mb-4">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span>Real-time intelligence across 100+ Indian merchant stores</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-3">
          India's Smartest <span className="text-yellow-400">Deal Finder</span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto mb-6 leading-relaxed">
          Fresh deals from Amazon, Croma, Reliance Digital and hundreds of online stores — automatically discovered by DealTiki.
        </p>

        {/* Search Bar - Professional Polish Pill */}
        <div className="w-full max-w-2xl relative mb-4">
          <div className="relative flex items-center w-full bg-slate-800/60 border border-white/10 rounded-full py-1.5 pl-4 pr-1.5 focus-within:ring-2 focus-within:ring-yellow-400/50 focus-within:border-yellow-400 transition-all shadow-xl">
            <span className="text-slate-400 mr-2 shrink-0">
              <Search className="w-4 h-4 text-yellow-400" />
            </span>
            <input
              id="hero-search-input"
              type="text"
              value={localInput}
              onChange={handleInputChange}
              placeholder="Search mobiles, laptops, shoes, travel deals..."
              className="w-full bg-transparent text-white text-sm font-medium placeholder:text-slate-500 outline-none pr-2"
            />
            {localInput && (
              <button
                onClick={handleClear}
                aria-label="Clear Search"
                className="p-1 rounded-full text-slate-400 hover:text-white mr-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onSearchChange(localInput)}
              className="bg-yellow-400 hover:bg-yellow-300 text-black px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all shrink-0"
            >
              Search
            </button>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-yellow-400" />
            Trending:
          </span>
          {suggestions.map((item) => (
            <button
              key={item}
              onClick={() => {
                setLocalInput(item);
                onQuickSearch(item);
              }}
              className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-yellow-400/40 text-xs font-medium text-slate-300 hover:text-yellow-400 transition-all active:scale-95"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

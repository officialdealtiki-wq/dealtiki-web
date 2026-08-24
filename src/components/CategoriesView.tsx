import React, { useState } from "react";
import {
  Layers,
  Smartphone,
  Laptop,
  Headphones,
  Tv,
  Shirt,
  Sparkles,
  UtensilsCrossed,
  Gamepad2,
  Plane,
  ShoppingBag,
  Glasses,
  TicketPercent,
  ArrowRight,
} from "lucide-react";
import { CATEGORIES } from "../lib/categories";
import { Deal } from "../types";
import { DealGrid } from "./DealGrid";

interface CategoriesViewProps {
  allDeals: Deal[];
  onOpenDetail: (deal: Deal) => void;
  onSelectCategoryFilter: (categorySlug: string) => void;
}

const iconMap: Record<string, React.ElementType> = {
  Smartphone,
  Laptop,
  Headphones,
  Tv,
  Shirt,
  Sparkles,
  UtensilsCrossed,
  Gamepad2,
  Plane,
  ShoppingBag,
  Glasses,
  TicketPercent,
};

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  allDeals,
  onOpenDetail,
  onSelectCategoryFilter,
}) => {
  const [selectedCatSlug, setSelectedCatSlug] = useState<string | null>(null);

  const selectedCategory = selectedCatSlug
    ? CATEGORIES.find((c) => c.slug === selectedCatSlug)
    : null;

  const categoryDeals = selectedCategory
    ? allDeals.filter(
        (d) =>
          (d.category && d.category.toLowerCase().includes(selectedCategory.slug)) ||
          (d.category && d.category.toLowerCase().includes(selectedCategory.name.toLowerCase().split("&")[0].trim())) ||
          selectedCategory.keywords.some((kw) => d.title.toLowerCase().includes(kw))
      )
    : [];

  return (
    <div id="categories-page-view" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-white/5">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="p-2 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-yellow-400">
            <Layers className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Browse Deal Categories
          </h1>
        </div>
        <p className="text-xs text-slate-400">
          Find curated discounts, promotions and price drops organized across 12 shopping categories.
        </p>
      </div>

      {selectedCategory ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedCatSlug(null)}
              className="text-xs font-bold text-yellow-400 hover:underline inline-flex items-center gap-1"
            >
              ← Back to all categories
            </button>
            <span className="text-xs text-slate-400">
              Showing {categoryDeals.length} deals in {selectedCategory.name}
            </span>
          </div>

          <div className="p-5 rounded-xl bg-[#161B22] border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 shrink-0">
                {React.createElement(iconMap[selectedCategory.iconName] || Layers, {
                  className: "w-6 h-6",
                })}
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">
                  {selectedCategory.name}
                </h2>
                <p className="text-xs text-slate-300 max-w-xl">
                  {selectedCategory.description}
                </p>
              </div>
            </div>

            <button
              onClick={() => onSelectCategoryFilter(selectedCategory.slug)}
              className="px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs uppercase tracking-wider transition-all"
            >
              Filter in Main Feed
            </button>
          </div>

          <DealGrid
            deals={categoryDeals}
            onOpenDetail={onOpenDetail}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {CATEGORIES.map((cat) => {
            const Icon = iconMap[cat.iconName] || Layers;
            const count = allDeals.filter(
              (d) =>
                (d.category && d.category.toLowerCase().includes(cat.slug)) ||
                (d.category && d.category.toLowerCase().includes(cat.name.toLowerCase().split("&")[0].trim())) ||
                cat.keywords.some((kw) => d.title.toLowerCase().includes(kw))
            ).length;

            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCatSlug(cat.slug)}
                className="group p-5 rounded-xl bg-[#161B22] hover:bg-[#1c222b] border border-white/5 hover:border-yellow-400/40 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-lg bg-yellow-400/10 group-hover:bg-yellow-400 text-yellow-400 group-hover:text-black transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-[#0F1219] border border-white/5 text-[11px] font-mono font-bold text-slate-300">
                      {count} deals
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-yellow-400 transition-colors mb-1">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-yellow-400 group-hover:translate-x-0.5 transition-transform uppercase tracking-wider">
                  <span>Explore</span>
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

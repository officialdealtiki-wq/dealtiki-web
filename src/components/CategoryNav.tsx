import React from "react";
import {
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
  Layers,
} from "lucide-react";
import { CATEGORIES } from "../lib/categories";

interface CategoryNavProps {
  selectedCategory: string;
  onSelectCategory: (categorySlug: string) => void;
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

export const CategoryNav: React.FC<CategoryNavProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div
      id="category-nav-bar"
      className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar"
    >
      {/* All Categories Option */}
      <button
        id="category-chip-all"
        onClick={() => onSelectCategory("")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all shrink-0 ${
          !selectedCategory
            ? "bg-white/10 border-yellow-400 text-yellow-400 font-bold"
            : "bg-[#161B22] border-white/5 text-slate-400 hover:text-white hover:border-white/15"
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
        <span>All Categories</span>
      </button>

      {CATEGORIES.map((cat) => {
        const IconComponent = iconMap[cat.iconName] || Smartphone;
        const isSelected = selectedCategory.toLowerCase() === cat.slug.toLowerCase();

        return (
          <button
            key={cat.id}
            id={`category-chip-${cat.slug}`}
            onClick={() => onSelectCategory(cat.slug)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all shrink-0 ${
              isSelected
                ? "bg-white/10 border-yellow-400 text-yellow-400 font-bold"
                : "bg-[#161B22] border-white/5 text-slate-400 hover:text-white hover:border-white/15"
            }`}
          >
            <IconComponent className="w-3.5 h-3.5" />
            <span>{cat.name.split("&")[0].trim()}</span>
          </button>
        );
      })}
    </div>
  );
};

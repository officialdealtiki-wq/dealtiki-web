import React from "react";

interface PlatformFiltersProps {
  selectedPlatform: string;
  onSelectPlatform: (platform: string) => void;
  countsByPlatform?: Record<string, number>;
}

export const PlatformFilters: React.FC<PlatformFiltersProps> = ({
  selectedPlatform,
  onSelectPlatform,
  countsByPlatform = {},
}) => {
  const platforms = [
    { id: "all", label: "All Stores", count: countsByPlatform["all"] },
    { id: "amazon", label: "Amazon", count: countsByPlatform["amazon"] },
    { id: "flipkart", label: "Flipkart", count: countsByPlatform["flipkart"] },
    { id: "croma", label: "Croma", count: countsByPlatform["croma"] },
    { id: "reliancedigital", label: "Reliance Digital", count: countsByPlatform["reliancedigital"] },
    { id: "myntra", label: "Myntra", count: countsByPlatform["myntra"] },
    { id: "ajio", label: "AJIO", count: countsByPlatform["ajio"] },
    { id: "meesho", label: "Meesho", count: countsByPlatform["meesho"] },
    { id: "others", label: "Other Stores", count: countsByPlatform["others"] },
  ];

  return (
    <div
      id="platform-quick-filters"
      className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar py-1"
    >
      {platforms.map((p) => {
        const isSelected =
          selectedPlatform === p.id ||
          (p.id === "all" && (!selectedPlatform || selectedPlatform === "all"));

        return (
          <button
            key={p.id}
            id={`platform-filter-${p.id}`}
            onClick={() => onSelectPlatform(p.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 border shrink-0 ${
              isSelected
                ? "bg-yellow-400 border-yellow-400 text-black shadow-md shadow-yellow-400/20"
                : "bg-[#161B22] border-white/5 text-slate-300 hover:border-white/20 hover:text-white"
            }`}
          >
            <span>{p.label}</span>
            {p.count !== undefined && p.count > 0 && (
              <span
                className={`ml-1.5 text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? "bg-black/20 text-black font-extrabold"
                    : "bg-white/10 text-slate-400"
                }`}
              >
                {p.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

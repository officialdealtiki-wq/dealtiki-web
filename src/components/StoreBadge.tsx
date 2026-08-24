import React from "react";
import { getStoreByPlatformOrName } from "../lib/stores";

interface StoreBadgeProps {
  platform: string;
  merchant?: string;
  className?: string;
  size?: "sm" | "md";
}

export const StoreBadge: React.FC<StoreBadgeProps> = ({
  platform,
  merchant,
  className = "",
  size = "sm",
}) => {
  const store = getStoreByPlatformOrName(platform || merchant);
  const displayName = merchant || store?.badgeText || platform || "Deal";

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-xs font-semibold"
      : "px-2.5 py-1 text-xs font-bold uppercase tracking-wider";

  const colorStyles = store?.badgeBg || "bg-slate-800/80 border-slate-700 text-slate-300";

  return (
    <span
      id={`store-badge-${platform.toLowerCase()}`}
      className={`inline-flex items-center gap-1.5 rounded-md border backdrop-blur-md transition-colors ${sizeClasses} ${colorStyles} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      <span className="truncate max-w-[120px]">{displayName}</span>
    </span>
  );
};

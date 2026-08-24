import React from "react";
import { Tag } from "lucide-react";

interface DiscountBadgeProps {
  percent?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const DiscountBadge: React.FC<DiscountBadgeProps> = ({
  percent,
  className = "",
  size = "md",
}) => {
  if (!percent || percent <= 0) return null;

  const sizeClasses = {
    sm: "text-[11px] px-1.5 py-0.5 font-bold",
    md: "text-xs px-2 py-0.5 font-bold",
    lg: "text-sm px-2.5 py-1 font-extrabold",
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono tracking-tight ${sizeClasses} ${className}`}
    >
      <Tag className="w-3 h-3 text-emerald-400" />
      <span>{percent}% OFF</span>
    </span>
  );
};

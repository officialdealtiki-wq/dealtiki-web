import React from "react";

export const DealCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-full rounded-xl bg-[#161B22] border border-white/5 p-3.5 animate-pulse overflow-hidden">
      {/* Image Skeleton */}
      <div className="w-full aspect-[4/3] rounded-lg bg-slate-800/60 mb-3" />
      
      {/* Badges Skeleton */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="h-4 w-16 bg-slate-800/70 rounded" />
        <div className="h-4 w-12 bg-slate-800/70 rounded" />
      </div>

      {/* Title Skeleton */}
      <div className="h-3.5 w-full bg-slate-800/70 rounded mb-1.5" />
      <div className="h-3.5 w-3/4 bg-slate-800/50 rounded mb-3" />

      {/* Pricing / Footer Skeleton */}
      <div className="mt-auto pt-2.5 border-t border-white/5 flex items-end justify-between">
        <div className="space-y-1">
          <div className="h-5 w-20 bg-slate-800/80 rounded" />
          <div className="h-3 w-14 bg-slate-800/50 rounded" />
        </div>
        <div className="h-7 w-16 bg-slate-800/80 rounded-lg" />
      </div>
    </div>
  );
};

export const DealGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <DealCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const DealDetailSkeleton: React.FC = () => {
  return (
    <div className="rounded-2xl bg-[#0F1219] border border-white/10 p-6 md:p-8 animate-pulse space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-5 aspect-square rounded-xl bg-slate-800/60" />
        <div className="md:col-span-7 space-y-4">
          <div className="flex gap-2">
            <div className="h-6 w-24 bg-slate-800/80 rounded" />
            <div className="h-6 w-20 bg-slate-800/80 rounded" />
          </div>
          <div className="h-8 w-full bg-slate-800/70 rounded" />
          <div className="h-8 w-2/3 bg-slate-800/70 rounded" />
          <div className="h-24 w-full bg-slate-800/50 rounded-xl" />
          <div className="h-12 w-full bg-slate-800/80 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

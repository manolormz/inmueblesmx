import React from "react";
export default function PropertySkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow-card">
      <div className="h-40 w-full bg-secondary/60 animate-pulse" />
      <div className="p-4 space-y-2">
        <div className="h-5 w-2/3 bg-secondary/60 rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-secondary/50 rounded animate-pulse" />
        <div className="h-4 w-1/3 bg-secondary/50 rounded animate-pulse" />
      </div>
    </div>
  );
}

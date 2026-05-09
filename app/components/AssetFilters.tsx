"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

const filters = ["All", "Script", "Thumbnail", "Music", "Video"];

export function AssetFilters() {
  const [activeFilter, setActiveFilter] = useState("All");

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Filter Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer ${
              activeFilter === filter
                ? "bg-[#8B5CF6]/20 text-white border border-[#8B5CF6]/40"
                : "bg-white/[0.04] text-[#8B8FA3] border border-white/[0.08] hover:text-white/80 hover:bg-white/[0.06]"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Sort Dropdowns */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F1118] border border-white/[0.08] text-xs text-white hover:border-white/[0.14] transition-colors duration-150 cursor-pointer">
          <span>Date</span>
          <ChevronDown className="w-3 h-3 text-[#8B8FA3]" />
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F1118] border border-white/[0.08] text-xs text-white hover:border-white/[0.14] transition-colors duration-150 cursor-pointer">
          <span>Newest</span>
          <ChevronDown className="w-3 h-3 text-[#8B8FA3]" />
        </button>
      </div>
    </div>
  );
}

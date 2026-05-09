"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
}

export function SearchBar({ placeholder = "Search..." }: SearchBarProps) {
  return (
    <div className="relative w-full">
      <Search
        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3"
        strokeWidth={1.5}
      />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-line text-sm text-ink placeholder:text-ink-3 outline-none hover:border-line-hi focus:border-accent/40 focus:ring-1 focus:ring-accent/15 transition-colors duration-150"
      />
    </div>
  );
}

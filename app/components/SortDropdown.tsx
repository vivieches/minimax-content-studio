"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface SortDropdownProps {
  label: string;
  options: string[];
}

export function SortDropdown({ label, options }: SortDropdownProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(label);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-hover border border-line text-xs font-medium text-ink-2 hover:border-line-hi hover:text-ink transition-all duration-150 cursor-pointer"
      >
        <span>{selected}</span>
        <ChevronDown className="w-3.5 h-3.5 text-ink-3" strokeWidth={1.5} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 min-w-[120px] rounded-xl bg-card border border-line shadow-lg z-50 overflow-hidden">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => { setSelected(option); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs transition-colors duration-100 cursor-pointer ${
                  option === selected
                    ? "text-accent bg-accent-soft"
                    : "text-ink-2 hover:text-ink hover:bg-hover"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

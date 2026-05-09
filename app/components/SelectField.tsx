"use client";

import { ChevronDown } from "lucide-react";

interface SelectFieldProps {
  label: string;
  value: string;
}

export function SelectField({ label, value }: SelectFieldProps) {
  return (
    <div className="group cursor-pointer">
      <p className="text-[11px] text-[#8B8FA3] mb-1.5 uppercase tracking-wider">
        {label}
      </p>
      <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#090B12] border border-white/[0.08] hover:border-white/[0.14] transition-colors duration-150">
        <span className="text-sm text-white font-medium">{value}</span>
        <ChevronDown className="w-3.5 h-3.5 text-[#8B8FA3]" />
      </div>
    </div>
  );
}

"use client";

import { ChevronDown, RotateCcw } from "lucide-react";

const settings = [
  { label: "Tone", value: "Casual" },
  { label: "Audience", value: "Tech Enthusiasts" },
  { label: "Language", value: "English" },
  { label: "Video Type", value: "YouTube Video" },
  { label: "Estimated Duration", value: "8 - 10 min" },
];

export function ScriptSettingsCard() {
  return (
      <div className="flex flex-col h-full bg-[#11151b] border border-white/[0.07] rounded-lg overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-sm font-semibold text-white">Script Settings</h3>
      </div>

      <div className="flex-1 px-5 space-y-1 overflow-y-auto">
        {settings.map((item) => (
          <div
            key={item.label}
            className="group cursor-pointer"
          >
            <div className="py-2.5">
              <p className="text-[11px] text-[#8B8FA3] mb-1 uppercase tracking-wider">
                {item.label}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white font-medium">
                  {item.value}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8B8FA3] group-hover:text-white/70 transition-colors duration-150" />
              </div>
            </div>
            <div className="h-px bg-white/[0.06]" />
          </div>
        ))}
      </div>

      <div className="p-5 pt-3">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#E94BCB] text-white text-sm font-medium hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all duration-150 cursor-pointer shadow-lg shadow-[#8B5CF6]/20">
          <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
          Regenerate Script
        </button>
      </div>
    </div>
  );
}

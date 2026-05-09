"use client";

import { ArrowRight, FileText, Image, Music, Video, Layers } from "lucide-react";
import { useState } from "react";
import { useT } from "@/lib/i18n";

const chips = [
  { icon: FileText, labelKey: "nav.scripts" },
  { icon: Image, labelKey: "nav.thumbnails" },
  { icon: Music, labelKey: "nav.music" },
  { icon: Video, labelKey: "nav.video" },
  { icon: Layers, labelKey: "nav.pipeline" },
];

export function CreateBar() {
  const { t } = useT();
  const [inputValue, setInputValue] = useState("");

  return (
    <div className="w-full max-w-[620px] mx-auto">
      <div className="relative bg-[rgba(15,17,25,0.85)] backdrop-blur-md border border-white/[0.08] rounded-[18px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-1.5">
        <div className="flex items-center gap-3 px-4 py-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t("createBar.placeholder")}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-[#8B8FA3]/70 outline-none"
          />
          <button className="w-9 h-9 rounded-full bg-gradient-to-r from-[#E94BCB] to-[#8B5CF6] flex items-center justify-center hover:opacity-90 hover:scale-105 transition-all duration-150 cursor-pointer shadow-lg shadow-[#E94BCB]/20 flex-shrink-0">
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap items-center gap-2 px-4 pb-3 pt-1">
          {chips.map((chip) => {
            const Icon = chip.icon;
            return (
              <button
                key={chip.labelKey}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-[#8B8FA3] hover:text-white hover:border-[#8B5CF6]/40 hover:bg-[#8B5CF6]/10 transition-all duration-150 cursor-pointer"
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>{t(chip.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

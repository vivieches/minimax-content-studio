"use client";

import { useState } from "react";
import { SelectField } from "./SelectField";
import { Wand2 } from "lucide-react";

export function ThumbnailPromptCard() {
  const [prompt, setPrompt] = useState(
    "Futuristic AI robot with neon lights, cyberpunk style, shocked expression"
  );

  return (
    <div className="flex flex-col h-full bg-[#0F1118] border border-white/[0.08] rounded-2xl overflow-hidden">
      <div className="flex-1 px-5 py-5 space-y-5 overflow-y-auto">
        {/* Prompt */}
        <div>
          <p className="text-[11px] text-[#8B8FA3] mb-1.5 uppercase tracking-wider">
            Prompt
          </p>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-3 rounded-xl bg-[#090B12] border border-white/[0.08] text-sm text-white/90 placeholder:text-[#8B8FA3]/50 outline-none resize-none hover:border-white/[0.14] focus:border-[#8B5CF6]/40 transition-colors duration-150 leading-relaxed"
            />
            <span className="absolute bottom-2 right-3 text-[10px] text-[#8B8FA3]/60">
              {prompt.length}/500
            </span>
          </div>
        </div>

        {/* Style */}
        <SelectField label="Style" value="Cyberpunk" />

        {/* Aspect Ratio */}
        <SelectField label="Aspect Ratio" value="16:9 (YouTube)" />

        {/* Brand Kit */}
        <SelectField label="Brand Kit" value="Tech Channel" />
      </div>

      {/* Generate Button */}
      <div className="p-5 pt-2">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#E94BCB] text-white text-sm font-medium hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all duration-150 cursor-pointer shadow-lg shadow-[#8B5CF6]/20">
          <Wand2 className="w-4 h-4" strokeWidth={1.5} />
          Generate Thumbnails
        </button>
      </div>
    </div>
  );
}

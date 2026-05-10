"use client";

import { SelectField } from "./SelectField";
import { Toggle } from "./Toggle";
import { Wand2 } from "lucide-react";

export function PipelineSettingsCard() {
  return (
      <div className="flex flex-col h-full bg-[#11151b] border border-white/[0.07] rounded-lg overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-sm font-semibold text-white">Pipeline Settings</h3>
      </div>

      <div className="flex-1 px-5 space-y-4 overflow-y-auto">
        <SelectField label="Output Format" value="YouTube Video" />
        <SelectField label="Quality" value="1080p" />
        <SelectField label="Estimated Time" value="15–20 min" />

        <div className="h-px bg-white/[0.06] my-2" />

        <Toggle label="Auto-publish" enabled={false} />
        <Toggle label="Save to Assets" enabled={true} />
      </div>

      <div className="p-5 pt-3">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#E94BCB] text-white text-sm font-medium hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all duration-150 cursor-pointer shadow-lg shadow-[#8B5CF6]/20">
          <Wand2 className="w-4 h-4" strokeWidth={1.5} />
          Run Pipeline
        </button>
      </div>
    </div>
  );
}

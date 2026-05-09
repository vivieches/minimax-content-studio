"use client";

import { SelectField } from "./SelectField";
import { Wand2 } from "lucide-react";

const settings = [
  { label: "Mood", value: "Energetic" },
  { label: "Genre", value: "Electronic" },
  { label: "Tempo", value: "120 BPM" },
  { label: "Duration", value: "3:00" },
  { label: "Instruments", value: "Synth, Drums, Bass" },
];

export function MusicSettingsCard() {
  return (
    <div className="flex flex-col h-full bg-[#0F1118] border border-white/[0.08] rounded-2xl overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-sm font-semibold text-white">Music Settings</h3>
      </div>

      <div className="flex-1 px-5 space-y-4 overflow-y-auto">
        {settings.map((item) => (
          <SelectField key={item.label} label={item.label} value={item.value} />
        ))}
      </div>

      <div className="p-5 pt-3">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#E94BCB] text-white text-sm font-medium hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all duration-150 cursor-pointer shadow-lg shadow-[#8B5CF6]/20">
          <Wand2 className="w-4 h-4" strokeWidth={1.5} />
          Generate Music
        </button>
      </div>
    </div>
  );
}

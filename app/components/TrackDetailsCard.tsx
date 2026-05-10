"use client";

const details = [
  { label: "File Size", value: "7.2 MB" },
  { label: "Format", value: "MP3" },
  { label: "Quality", value: "320 kbps" },
  { label: "BPM", value: "120" },
  { label: "Key", value: "A Minor" },
];

export function TrackDetailsCard() {
  return (
      <div className="flex flex-col h-full bg-[#11151b] border border-white/[0.07] rounded-lg overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-sm font-semibold text-white">Track Details</h3>
      </div>

      <div className="flex-1 px-5 space-y-0 overflow-y-auto">
        {details.map((item, i) => (
          <div key={item.label}>
            <div className="py-2.5">
              <p className="text-[11px] text-[#8B8FA3] mb-1 uppercase tracking-wider">
                {item.label}
              </p>
              <p className="text-sm text-white font-medium">{item.value}</p>
            </div>
            {i < details.length - 1 && <div className="h-px bg-white/[0.06]" />}
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

interface ToggleProps {
  label: string;
  enabled: boolean;
}

export function Toggle({ label, enabled }: ToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-white font-medium">{label}</span>
      <button
        className={`relative w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer ${
          enabled ? "bg-[#8B5CF6]" : "bg-white/[0.12]"
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            enabled ? "left-[18px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

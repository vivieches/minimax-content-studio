"use client";

interface ExportTabsProps {
  tabs: readonly string[];
  activeTab: string;
  onChange: (tab: string) => void;
}

export function ExportTabs({ tabs, activeTab, onChange }: ExportTabsProps) {
  return (
    <div className="flex items-center gap-1 mb-0">
      {tabs.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`relative px-3.5 py-2 text-xs font-medium transition-colors duration-150 cursor-pointer rounded-md ${
              isActive
                ? "text-[#E94BCB]"
                : "text-[#8B8FA3] hover:text-white/80"
            }`}
          >
            {tab}
            {isActive && (
              <span className="absolute bottom-0 left-1.5 right-1.5 h-[2px] rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#E94BCB]" />
            )}
          </button>
        );
      })}
    </div>
  );
}

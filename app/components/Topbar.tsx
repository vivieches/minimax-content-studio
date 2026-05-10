"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Search, Command } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/": "Inicio",
  "/scripts": "Guiones",
  "/thumbnails": "Miniaturas",
  "/music": "Música",
  "/video": "Video",
  "/assets": "Assets",
  "/templates": "Plantillas",
  "/exports": "Exports",
  "/pipeline": "Pipeline",
  "/settings": "Ajustes",
};

export function Topbar() {
  const pathname = usePathname();
  const [searchFocused, setSearchFocused] = useState(false);

  const title =
    Object.entries(PAGE_TITLES).find(([path]) =>
      path === "/" ? pathname === "/" : pathname?.startsWith(path)
    )?.[1] ?? "Inicio";

  return (
    <header className="h-[72px] flex-shrink-0">
      <div className="mx-auto flex h-full max-w-[1378px] items-center justify-between px-5 md:px-0">
        <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-[#F4F6FA]">
          {title}
        </h1>

        <div className="flex items-center gap-10">
          <div
            className={`
              hidden h-10 items-center gap-2.5 rounded-lg border px-3 md:flex
              bg-[rgba(255,255,255,0.025)] transition-all duration-200
              ${
                searchFocused
                  ? "border-[rgba(255,79,163,0.35)] bg-[rgba(255,79,163,0.05)]"
                  : "border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]"
              }
            `}
            style={{ width: "310px" }}
          >
            <Search className="h-[18px] w-[18px] flex-shrink-0 text-[#9CA3AF]" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Buscar..."
              className="flex-1 bg-transparent text-[14px] text-[#F4F6FA] outline-none placeholder:text-[#787e8e]"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <div className="flex items-center gap-0.5 rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5">
              <Command className="h-3 w-3 text-[#7b8190]" strokeWidth={1.5} />
              <span className="text-[10px] font-medium text-[#7b8190]">K</span>
            </div>
          </div>

          <button
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#9CA3AF] transition-colors duration-200 hover:bg-white/[0.04] hover:text-[#F4F6FA]"
            aria-label="Notificaciones"
          >
            <Bell className="h-[21px] w-[21px]" strokeWidth={1.5} />
            <span className="absolute right-[9px] top-[7px] h-2 w-2 rounded-full bg-accent" />
          </button>
        </div>
      </div>
    </header>
  );
}

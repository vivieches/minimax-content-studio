"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { useT } from "@/lib/i18n";

const PAGE_TITLES: Record<string, string> = {
  "/": "nav.home",
  "/scripts": "nav.scripts",
  "/thumbnails": "nav.thumbnails",
  "/music": "nav.music",
  "/video": "nav.video",
  "/assets": "nav.assets",
  "/templates": "nav.templates",
  "/exports": "nav.exports",
  "/pipeline": "nav.pipeline",
  "/settings": "nav.settings",
};

export function Topbar() {
  const { t } = useT();
  const pathname = usePathname();

  const titleKey = Object.entries(PAGE_TITLES).find(
    ([path]) => path === "/" ? pathname === "/" : pathname?.startsWith(path)
  )?.[1] ?? "nav.home";

  return (
    <header className="flex items-center justify-between h-[52px] px-6 flex-shrink-0 border-b border-line">
      <h2 className="text-sm font-semibold text-ink">{t(titleKey)}</h2>

      <div className="flex items-center gap-2">
        <button
          className="relative w-8 h-8 rounded-lg bg-hover flex items-center justify-center hover:bg-line-hi transition-colors duration-100"
          aria-label={t("nav.notifications")}
        >
          <Bell className="w-[15px] h-[15px] text-ink-2" strokeWidth={1.5} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent" />
        </button>
      </div>
    </header>
  );
}

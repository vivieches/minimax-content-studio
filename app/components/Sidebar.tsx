"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Layers,
  FileText,
  Image,
  Music,
  Box,
  LayoutTemplate,
  Download,
  Settings,
  Sun,
  Menu,
  X,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { LanguageSwitcher } from "./LanguageSwitcher";

const navGroups = [
  {
    items: [{ icon: Home, labelKey: "nav.home", href: "/" }],
  },
  {
    labelKey: "nav.create",
    items: [
      { icon: Layers, labelKey: "nav.pipeline", href: "/pipeline" },
      { icon: FileText, labelKey: "nav.scripts", href: "/scripts" },
      { icon: Image, labelKey: "nav.thumbnails", href: "/thumbnails" },
      { icon: Music, labelKey: "nav.music", href: "/music" },
    ],
  },
  {
    labelKey: "nav.library",
    items: [
      { icon: Box, labelKey: "nav.assets", href: "/assets" },
      { icon: LayoutTemplate, labelKey: "nav.templates", href: "/templates" },
      { icon: Download, labelKey: "nav.exports", href: "/exports" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useT();
  const { toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <div className="w-7 h-7 rounded-lg bg-accent-soft flex items-center justify-center flex-shrink-0">
          <img
            src="/minimax-logo.svg"
            alt="MiniMax"
            className="w-4 h-4 object-contain"
          />
        </div>
        <span className="text-[13.5px] font-semibold text-ink tracking-tight leading-none">
          MiniMax Studio
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto py-1 space-y-4">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.labelKey && (
              <p className="px-3 mb-1 text-[10px] font-semibold text-ink-3 uppercase tracking-widest select-none">
                {t(group.labelKey)}
              </p>
            )}
            <div className="space-y-px">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] font-medium transition-colors duration-100 ${
                      active
                        ? "bg-accent-soft text-accent"
                        : "text-ink-2 hover:bg-hover hover:text-ink"
                    }`}
                  >
                    <Icon
                      className={`w-[15px] h-[15px] flex-shrink-0 transition-colors ${
                        active ? "text-accent" : "text-ink-3"
                      }`}
                      strokeWidth={active ? 2 : 1.5}
                    />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 pt-3 border-t border-line space-y-px">
        <Link
          href="/settings"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] font-medium transition-colors duration-100 ${
            pathname === "/settings"
              ? "bg-accent-soft text-accent"
              : "text-ink-2 hover:bg-hover hover:text-ink"
          }`}
        >
          <Settings
            className={`w-[15px] h-[15px] flex-shrink-0 ${
              pathname === "/settings" ? "text-accent" : "text-ink-3"
            }`}
            strokeWidth={pathname === "/settings" ? 2 : 1.5}
          />
          <span>{t("nav.settings")}</span>
        </Link>

        <div className="flex items-center gap-1 pt-1">
          <button
            onClick={toggleTheme}
            title={t("nav.toggleTheme")}
            className="flex flex-1 items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] text-ink-2 hover:bg-hover hover:text-ink transition-colors duration-100"
          >
            <Sun className="w-[15px] h-[15px] text-ink-3" strokeWidth={1.5} />
            <span className="text-[12px]">{t("nav.theme")}</span>
          </button>
          <LanguageSwitcher />
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="md:hidden fixed inset-x-0 top-0 z-40 flex h-[52px] items-center justify-between border-b border-line bg-sidebar px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent-soft flex items-center justify-center flex-shrink-0">
            <img src="/minimax-logo.svg" alt="MiniMax" className="w-4 h-4 object-contain" />
          </div>
          <span className="text-[13.5px] font-semibold text-ink tracking-tight leading-none">
            MiniMax Studio
          </span>
        </div>
        <button
          onClick={() => setMobileOpen((open) => !open)}
          className="w-9 h-9 rounded-lg bg-hover flex items-center justify-center text-ink-2 hover:text-ink"
          aria-label={mobileOpen ? t("nav.closeNavigation") : t("nav.openNavigation")}
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileOpen(false)}>
          <aside
            className="flex flex-col w-[264px] h-screen bg-sidebar border-r border-line"
            onClick={(event) => event.stopPropagation()}
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      <aside className="hidden md:flex flex-col w-[232px] h-screen bg-sidebar border-r border-line flex-shrink-0">
        {sidebarContent}
      </aside>
    </>
  );
}

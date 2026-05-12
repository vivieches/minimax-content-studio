"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import NextImage from "next/image";
import { Menu, X } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { appRoutes, uiCopy } from "@/lib/ui/copy";

const navItems = appRoutes.filter((item) => item.href !== "/settings");
const settingsItem = appRoutes.find((item) => item.href === "/settings");

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const SettingsIcon = settingsItem?.icon;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  const sidebarContent = (
    <>
      <div className="flex items-center justify-center pb-[54px] pt-[34px]">
        <NextImage
          src="/logo.png"
          alt="Open Studio"
          width={36}
          height={36}
          priority
          className="h-9 w-9 rounded-[9px] object-cover"
        />
      </div>

      <nav className="flex-1 space-y-[21px] px-[11px]" aria-label="Navegação principal">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              title={item.label}
              onClick={() => setMobileOpen(false)}
              className={`
                group relative flex h-12 w-full items-center justify-center rounded-[7px]
                transition-all duration-200 ease-out
                ${
                  active
                    ? "bg-[#141620] text-accent"
                    : "text-[#8D91A0] opacity-90 hover:bg-white/[0.045] hover:text-[#F5F2F4] hover:opacity-100"
                }
              `}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" strokeWidth={1.5} />
              {active && (
                <span className="absolute left-0 top-1/2 h-[39px] w-px -translate-y-1/2 rounded-r-full bg-accent" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-[18px] px-[11px] pb-[24px]">
        {/* Language switcher — troca o idioma de toda a interface */}
        <div className="flex h-10 w-full items-center justify-center">
          <LanguageSwitcher />
        </div>

        {settingsItem && SettingsIcon ? (
          <Link
            href={settingsItem.href}
            title={settingsItem.label}
            className={`
              relative flex h-10 w-full items-center justify-center rounded-[7px]
              transition-all duration-200 ease-out
              ${
                isActive(settingsItem.href)
                  ? "bg-[#141620] text-accent"
                  : "text-[#8D91A0] hover:bg-white/[0.045] hover:text-[#F5F2F4]"
              }
            `}
          >
            <SettingsIcon className="h-5 w-5" strokeWidth={1.5} />
            {isActive(settingsItem.href) && (
              <span className="absolute left-0 top-1/2 h-[34px] w-px -translate-y-1/2 rounded-r-full bg-accent" />
            )}
          </Link>
        ) : null}

        {/* Avatar */}
        <div className="flex h-[51px] w-full items-center justify-center pt-[7px]">
          <div className="flex h-[46px] w-[46px] items-center justify-center rounded-full border border-white/[0.08] bg-[#0E1018]">
            <NextImage
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 rounded-full object-cover"
            />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        className="fixed left-4 top-3.5 z-[60] flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-card md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? uiCopy.closeNavigation : uiCopy.openNavigation}
      >
        {mobileOpen ? (
          <X className="h-4 w-4 text-ink" />
        ) : (
          <Menu className="h-4 w-4 text-ink" />
        )}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-[56] flex h-screen w-[95px] flex-col
          border-r border-white/[0.06] bg-[#101012] transition-transform duration-300 ease-out
          md:sticky md:z-auto
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

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
  Menu,
  X,
} from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";

const navItems = [
  { icon: Home, label: "Inicio", href: "/" },
  { icon: Layers, label: "Proyectos", href: "/pipeline" },
  { icon: FileText, label: "Guiones", href: "/scripts" },
  { icon: Image, label: "Miniaturas", href: "/thumbnails" },
  { icon: Music, label: "Música", href: "/music" },
  { icon: Box, label: "Assets", href: "/assets" },
  { icon: LayoutTemplate, label: "Plantillas", href: "/templates" },
  { icon: Download, label: "Exports", href: "/exports" },
];

const bottomItems = [{ icon: Settings, label: "Ajustes", href: "/settings" }];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  const sidebarContent = (
    <>
      <div className="flex items-center justify-center pb-[41px] pt-7">
        <div className="flex h-[43px] w-[43px] flex-shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-[#171920] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <span className="select-none text-[14px] font-bold text-accent">OS</span>
        </div>
      </div>

      <nav className="flex-1 space-y-[19px] px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              onClick={() => setMobileOpen(false)}
              className={`
                group relative flex h-[45px] w-full items-center justify-center rounded-md
                transition-all duration-200
                ${
                  active
                    ? "bg-[#171821] text-accent"
                    : "text-[#8B91A2] hover:bg-white/[0.05] hover:text-[#F4F6FA]"
                }
              `}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" strokeWidth={1.5} />
              {active && (
                <span className="absolute -right-3 top-1/2 h-[41px] w-[2px] -translate-y-1/2 rounded-l-full bg-accent" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-5 px-3 pb-6">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              onClick={() => setMobileOpen(false)}
              className={`
                relative flex h-[35px] w-full items-center justify-center rounded-md
                transition-all duration-200
                ${
                  active
                    ? "bg-[#171821] text-accent"
                    : "text-[#8B91A2] hover:bg-white/[0.05] hover:text-[#F4F6FA]"
                }
              `}
            >
              <Icon className="h-5 w-5" strokeWidth={1.5} />
              {active && (
                <span className="absolute -right-3 top-1/2 h-[35px] w-[2px] -translate-y-1/2 rounded-l-full bg-accent" />
              )}
            </Link>
          );
        })}

        <div className="flex h-[35px] w-full items-center justify-center">
          <LanguageSwitcher />
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        className="fixed left-4 top-3.5 z-[60] flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-card md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Cerrar navegación" : "Abrir navegación"}
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
          border-r border-line bg-sidebar transition-transform duration-300 ease-out
          md:sticky md:z-auto
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

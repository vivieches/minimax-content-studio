"use client";

import { Topbar } from "../components/Topbar";
import { RecentProjects } from "../components/RecentProjects";
import { FileText, Image, Music, Layers } from "lucide-react";
import Link from "next/link";
import { useT } from "@/lib/i18n";

const quickActions = [
  {
    href: "/scripts",
    icon: FileText,
    labelKey: "home.newScript",
    iconClass: "text-blue-400",
    bgClass: "bg-blue-400/10 group-hover:bg-blue-400/18",
    borderHoverClass: "hover:border-blue-400/25",
  },
  {
    href: "/thumbnails",
    icon: Image,
    labelKey: "home.newThumbnail",
    iconClass: "text-orange-400",
    bgClass: "bg-orange-400/10 group-hover:bg-orange-400/18",
    borderHoverClass: "hover:border-orange-400/25",
  },
  {
    href: "/music",
    icon: Music,
    labelKey: "home.newMusic",
    iconClass: "text-violet-400",
    bgClass: "bg-violet-400/10 group-hover:bg-violet-400/18",
    borderHoverClass: "hover:border-violet-400/25",
  },
  {
    href: "/pipeline",
    icon: Layers,
    labelKey: "home.pipeline",
    iconClass: "text-green-400",
    bgClass: "bg-green-400/10 group-hover:bg-green-400/18",
    borderHoverClass: "hover:border-green-400/25",
  },
];

export default function HomePage() {
  const { t } = useT();

  return (
    <>
      <Topbar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
        {/* Subtle teal glow */}
        <div
          className="absolute inset-x-0 top-0 flex justify-center pointer-events-none"
          aria-hidden
        >
          <div
            style={{
              width: "560px",
              height: "240px",
              background:
                "radial-gradient(ellipse 50% 50% at 50% 0%, rgba(255,75,139,0.10) 0%, transparent 80%)",
              filter: "blur(40px)",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-full px-6 py-12">
          {/* Hero */}
          <div className="text-center mb-10">
            <h1 className="text-[32px] sm:text-[38px] lg:text-[44px] font-bold leading-[1.12] tracking-tight mb-3">
              <span className="text-ink">{t("home.heroLine1")}</span>
              <br />
              <span className="text-accent">{t("home.heroLine2")}</span>
            </h1>
            <p className="text-sm text-ink-2 max-w-sm mx-auto leading-relaxed">
              {t("home.subtitle")}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="w-full max-w-[580px] mb-12">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={`group flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-card border border-line ${action.borderHoverClass} hover:bg-card-hi transition-all duration-150`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${action.bgClass}`}
                    >
                      <Icon
                        className={`w-5 h-5 ${action.iconClass}`}
                        strokeWidth={1.5}
                      />
                    </div>
                    <span className="text-xs font-medium text-ink">
                      {t(action.labelKey)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Projects */}
          <div className="w-full max-w-[720px]">
            <RecentProjects />
          </div>
        </div>
      </main>
    </>
  );
}

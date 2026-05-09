"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Image, Music, Box } from "lucide-react";
import type { AssetRecord } from "@/lib/minimax/types";
import { useT } from "@/lib/i18n";

const typeIcon: Record<string, typeof FileText> = {
  script:    FileText,
  thumbnail: Image,
  music:     Music,
};

const typeBg: Record<string, string> = {
  script:    "bg-blue-400/10",
  thumbnail: "bg-orange-400/10",
  music:     "bg-violet-400/10",
  video:     "bg-red-400/10",
};

const typeColor: Record<string, string> = {
  script:    "text-blue-400",
  thumbnail: "text-orange-400",
  music:     "text-violet-400",
  video:     "text-red-400",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function RecentProjects() {
  const { t } = useT();
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/assets?limit=3")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setAssets(d.assets.slice(0, 3)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-sm font-semibold text-ink">{t("home.recentProjects")}</h2>
        <Link
          href="/assets"
          className="text-xs text-ink-2 hover:text-ink transition-colors duration-150"
        >
          {t("home.viewAll")}
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[120px] rounded-2xl bg-card border border-line animate-pulse" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-ink-2 bg-card border border-line rounded-2xl">
          <Box className="w-7 h-7 mb-2 opacity-30" />
          <p className="text-sm">{t("home.noProjects")}</p>
          <p className="text-xs text-ink-3 mt-1">{t("home.noProjectsHint")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => {
            const Icon = typeIcon[asset.type] ?? Box;
            return (
              <Link
                key={asset.id}
                href="/assets"
                className="group flex flex-col bg-card border border-line rounded-2xl overflow-hidden hover:border-line-hi transition-all duration-150"
              >
                <div className={`flex items-center justify-center h-[72px] ${typeBg[asset.type] ?? "bg-hover"}`}>
                  {asset.thumbnailPath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.thumbnailPath}
                      alt={asset.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icon
                      className={`w-6 h-6 ${typeColor[asset.type] ?? "text-ink-3"}`}
                      strokeWidth={1.5}
                    />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium text-ink truncate group-hover:text-accent transition-colors">
                    {asset.title}
                  </p>
                  <p className="text-[10px] text-ink-3 mt-0.5">{timeAgo(asset.createdAt)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

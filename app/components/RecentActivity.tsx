"use client";

import { useEffect, useState } from "react";
import { FileText, Image, Package, Sparkles } from "lucide-react";
import type { AssetRecord } from "@/lib/minimax/types";
import { useT } from "@/lib/i18n";

function iconForType(type: AssetRecord["type"]) {
  if (type === "thumbnail") return Image;
  if (type === "export") return Package;
  if (type === "prompt") return Sparkles;
  return FileText;
}

function subtitleForType(type: AssetRecord["type"], t: (key: string) => string) {
  if (type === "thumbnail") return t("home.asset.thumbnail");
  if (type === "export") return t("home.asset.export");
  if (type === "prompt") return t("home.asset.prompt");
  if (type === "music" || type === "video") return t("home.asset.legacy");
  return t("home.asset.script");
}

function relativeTime(value: string, nowLabel: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return nowLabel;
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 60) return nowLabel;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

function latestActivities(activities: AssetRecord[]) {
  return [...activities]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);
}

export function ActivityPanel() {
  const { t } = useT();
  const [activities, setActivities] = useState<AssetRecord[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/assets")
      .then((response) => response.json())
      .then((data) => {
        if (active && data.ok) setActivities(latestActivities(data.assets));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return (
    <aside className="flex flex-1 flex-col rounded-[14px] border border-white/[0.075] bg-[#151516] px-[26px] pb-[22px] pt-[24px]">
      <h2 className="mb-[26px] text-[16px] font-semibold text-[#F5F2F4]">
        {t("home.recentActivity")}
      </h2>

      <div className="space-y-[26px]">
        {activities.length === 0 ? (
          <p className="text-[13px] leading-5 text-[#858A98]">
            {t("home.activityEmpty")}
          </p>
        ) : activities.map((activity) => {
          const Icon = iconForType(activity.type);
          return (
            <div key={activity.id} className="grid grid-cols-[28px_minmax(0,1fr)_28px] items-start gap-[14px]">
              <div className="flex h-[28px] w-[28px] flex-shrink-0 items-center justify-center text-[#C2C6D0]">
                <Icon className="h-[22px] w-[22px]" strokeWidth={1.45} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium leading-[1.25] text-[#F1EEF1]">
                  {activity.title}
                </p>
                <p className="mt-[5px] text-[13px] leading-none text-[#858A98]">{subtitleForType(activity.type, t)}</p>
              </div>
              <span className="pt-[3px] text-right text-[13px] leading-none text-[#858A98]">
                {relativeTime(activity.updatedAt, t("home.now"))}
              </span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export const RecentActivity = ActivityPanel;

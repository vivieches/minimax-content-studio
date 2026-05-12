"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import type { AssetRecord } from "@/lib/minimax/types";
import { useT } from "@/lib/i18n";

function relativeTime(value: string, nowLabel: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return nowLabel;
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 60) return nowLabel;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
}

function ProjectArtwork({ type }: { type: string }) {
  if (type === "copper") {
    return (
      <div className="relative h-full w-full overflow-hidden bg-[#090808]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_86%_38%,rgba(137,71,42,0.42),transparent_26%),linear-gradient(90deg,#090808_0%,#100c0a_42%,#2B160F_100%)]" />
        <div className="absolute bottom-0 right-[48px] h-[124px] w-[108px] rounded-t-full bg-[linear-gradient(90deg,#3B2019_0%,#C58B69_46%,#43231A_86%)]" />
        <div className="absolute bottom-[28px] right-[77px] h-[58px] w-[71px] rounded-[0_0_0_56px] bg-[#E3B690]" />
        <div className="absolute right-[40px] top-0 h-[71px] w-[58px] bg-[linear-gradient(180deg,#A36A4F,#47261B)] opacity-75" />
        <div className="absolute left-[42px] top-[32px] h-[38px] w-[38px] rounded-[8px] border border-[#F2B178]/30 bg-[radial-gradient(circle_at_42%_38%,#F1A35E_0%,#A85128_45%,#23100B_100%)] shadow-[0_0_24px_rgba(226,126,66,0.38)]" />
        <div className="absolute inset-x-0 bottom-0 h-[34px] bg-[linear-gradient(180deg,transparent,rgba(7,8,13,0.35))]" />
      </div>
    );
  }

  if (type === "blueSphere") {
    return (
      <div className="relative h-full w-full overflow-hidden bg-[linear-gradient(135deg,#15191B_0%,#11151A_48%,#0A0C12_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(73,112,73,0.23),transparent_34%),radial-gradient(circle_at_16%_90%,rgba(52,68,120,0.14),transparent_38%)]" />
        <div className="absolute -bottom-[59px] left-[26px] h-[165px] w-[165px] rounded-full bg-[radial-gradient(circle_at_36%_28%,#323A58_0%,#1B213C_55%,#0C1020_100%)] shadow-[inset_-26px_-34px_50px_rgba(6,7,12,0.36)]" />
        <div className="absolute inset-x-0 bottom-0 h-[33px] bg-[linear-gradient(180deg,transparent,rgba(7,8,13,0.34))]" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[linear-gradient(135deg,#19131C_0%,#11131B_58%,#0E1017_100%)]">
      <div className="absolute left-[28px] top-[30px] h-[57px] w-[57px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#C184A0_0%,#7F4D69_48%,#362137_100%)] shadow-[0_0_25px_rgba(208,111,167,0.14)]" />
      <div className="absolute bottom-[-63px] right-[42px] h-[128px] w-[188px] rounded-t-full bg-[radial-gradient(ellipse_at_48%_11%,#B7835F_0%,#7B563F_42%,#201721_82%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_42%_14%,rgba(208,111,167,0.12),transparent_33%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[33px] bg-[linear-gradient(180deg,transparent,rgba(7,8,13,0.35))]" />
    </div>
  );
}

export function RecentProjects() {
  const { t } = useT();
  const [projects, setProjects] = useState<AssetRecord[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/assets?limit=3")
      .then((response) => response.json())
      .then((data) => {
        if (active && data.ok) setProjects(data.assets);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="flex w-full flex-1 flex-col" aria-labelledby="recent-projects-title">
      <div className="mb-[19px] flex items-center justify-between">
        <h2 id="recent-projects-title" className="text-[16px] font-semibold text-[#F5F2F4]">
          {t("home.recentProjects")}
        </h2>
        <Link
          href="/assets"
          className="text-[14px] font-medium text-accent transition-colors duration-150 hover:text-accent-hi"
        >
          {t("home.viewAll")}
        </Link>
      </div>

      <div className="grid min-h-0 grid-cols-1 gap-[18px] sm:grid-cols-3">
        {projects.length === 0 ? (
          <div className="col-span-full grid min-h-[220px] place-items-center rounded-[12px] border border-white/[0.075] bg-[#151516] px-6 text-center">
            <div>
              <p className="text-[14px] font-semibold text-[#F5F2F4]">{t("home.emptyAssets")}</p>
              <p className="mt-2 max-w-[42ch] text-[13px] leading-5 text-[#7C818F]">
                {t("home.emptyAssetsHint")}
              </p>
            </div>
          </div>
        ) : projects.map((project, index) => (
          <div
            key={project.id}
            className="group flex h-[252px] flex-col overflow-hidden rounded-[12px] border border-white/[0.075] bg-[#151516] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[rgba(208,111,167,0.22)]"
          >
            <div className="relative min-h-[130px] flex-1 overflow-hidden">
              {project.thumbnailPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={project.thumbnailPath} alt="" className="h-full w-full object-cover" />
              ) : (
                <ProjectArtwork type={["copper", "blueSphere", "roseCopper"][index] ?? "roseCopper"} />
              )}
            </div>

            <div className="flex min-h-[85px] items-start justify-between px-[16px] pb-[16px] pt-[16px]">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold leading-[1.25] text-[#F5F2F4] transition-colors duration-150 group-hover:text-accent">
                  {project.title}
                </p>
                <p className="mt-[14px] text-[13px] leading-none text-[#7C818F]">{relativeTime(project.updatedAt, t("home.now"))}</p>
              </div>
              <button
                className="ml-2 mt-[28px] rounded-md p-1 text-[#A2A7B3] transition-colors duration-150 hover:bg-white/[0.05] hover:text-[#F5F2F4]"
                aria-label={t("home.moreOptions")}
              >
                <MoreHorizontal className="h-4 w-4" strokeWidth={1.55} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

const projects = [
  {
    title: "Thumbnail - Split-frame YouTube",
    time: "4h ago",
    artwork: "thumbnail",
  },
  {
    title: "Script - Improve this tone",
    time: "4h ago",
    artwork: "orbGreen",
  },
  {
    title: "Script - IDEA: Quiero un video sobre...",
    time: "4h ago",
    artwork: "orbViolet",
  },
];

function ProjectArtwork({ type }: { type: string }) {
  if (type === "thumbnail") {
    return (
      <div className="relative h-full w-full overflow-hidden bg-[#070708]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_36%,rgba(165,102,74,0.55),transparent_18%),radial-gradient(circle_at_47%_24%,rgba(75,48,37,0.65),transparent_18%),linear-gradient(90deg,#070707_0%,#0d0b0a_42%,#2b170f_100%)]" />
        <div className="absolute bottom-0 right-[35px] h-[150px] w-[122px] rounded-t-full bg-[linear-gradient(90deg,#4b2a20,#c99578_46%,#4a271d_82%)] opacity-95" />
        <div className="absolute bottom-[24px] right-[64px] h-[58px] w-[72px] rounded-[55%_45%_50%_50%] bg-[#d5a48d]" />
        <div className="absolute bottom-[56px] right-[48px] h-[86px] w-[70px] rounded-t-full bg-[linear-gradient(90deg,#3d211b,#7a4638)]" />
        <div className="absolute left-[42px] top-[30px] text-[18px] font-semibold tracking-[-0.04em] text-white/90">minimax</div>
        <div className="absolute left-[64px] top-[58px] text-[43px] font-medium tracking-[-0.08em] text-[#f1d6c3]">GPT</div>
        <div className="absolute left-[42px] top-[45px] h-[38px] w-[38px] rounded-lg border border-[#e8b994]/40 bg-[radial-gradient(circle_at_42%_42%,#f1a865,#6b2f18_54%,#18100c)]" />
      </div>
    );
  }

  if (type === "orbGreen") {
    return (
      <div className="relative h-full w-full overflow-hidden bg-[linear-gradient(135deg,#151b1f,#15171c_58%,#0f1117)]">
        <div className="absolute -bottom-[42px] left-[24px] h-[154px] w-[154px] rounded-full bg-[radial-gradient(circle_at_33%_30%,#394057,#171b30_62%,#0f1220)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_77%_20%,rgba(88,136,87,0.22),transparent_36%)]" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[linear-gradient(135deg,#1b151c,#10131a_60%,#11131A)]">
      <div className="absolute left-[28px] top-[35px] h-[56px] w-[56px] rounded-full bg-[radial-gradient(circle_at_35%_32%,#bb8797,#3c2439_70%)]" />
      <div className="absolute bottom-[-48px] right-[18px] h-[120px] w-[188px] rounded-[50%] bg-[radial-gradient(circle_at_45%_18%,#a47557,#211a24_74%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(161,85,154,0.16),transparent_38%)]" />
    </div>
  );
}

export function RecentProjects() {
  return (
    <div className="w-full pt-[18px]">
      <div className="mb-[18px] flex items-center justify-between px-0.5">
        <h2 className="text-[16px] font-semibold text-[#F4F6FA]">Proyectos recientes</h2>
        <Link
          href="/assets"
          className="text-[14px] text-[#9CA3AF] transition-colors duration-150 hover:text-[#F4F6FA]"
        >
          Ver todos
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {projects.map((project) => (
          <div
            key={project.title}
            className="group overflow-hidden rounded-lg border border-white/[0.07] bg-[#11131A] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.14]"
          >
            <div className="relative h-[130px] overflow-hidden">
              <ProjectArtwork type={project.artwork} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>

            <div className="flex items-start justify-between px-[14px] pb-[17px] pt-[16px]">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-[#F4F6FA] transition-colors duration-150 group-hover:text-[#FF4FA3]">
                  {project.title}
                </p>
                <p className="mt-[14px] text-[13px] text-[#777d8a]">
                  {project.time} · Actualizado
                </p>
              </div>
              <button
                className="ml-2 mt-[31px] rounded-lg p-1 text-[#a7acb8] transition-colors duration-150 hover:bg-white/[0.05] hover:text-[#F4F6FA]"
                aria-label="Más opciones"
              >
                <MoreHorizontal className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

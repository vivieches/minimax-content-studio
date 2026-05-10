"use client";

import { FileText, Image, Music, Box, ChevronRight } from "lucide-react";

const activities = [
  {
    icon: FileText,
    title: "Script - Improve this tone",
    subtitle: "Editado",
    time: "4h",
  },
  {
    icon: Image,
    title: "Thumbnail - Split-frame YouTube",
    subtitle: "Imagen exportada",
    time: "5h",
  },
  {
    icon: Music,
    title: "Música de ambientación",
    subtitle: "Archivo generado",
    time: "8h",
  },
  {
    icon: Box,
    title: "Transición minimal 03",
    subtitle: "Asset agregado",
    time: "1d",
  },
];

export function RecentActivity() {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-[#11131A] px-[22px] pb-[20px] pt-[20px]">
      <h3 className="mb-[18px] text-[16px] font-semibold text-[#F4F6FA]">
        Actividad reciente
      </h3>

      <div className="space-y-[17px]">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div key={activity.title} className="group flex items-center gap-[17px]">
              <div className="flex h-[31px] w-[31px] flex-shrink-0 items-center justify-center rounded-lg text-[#d2d5df]">
                <Icon className="h-[22px] w-[22px]" strokeWidth={1.45} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-[#c8ccd5]">
                  {activity.title}
                </p>
                <p className="mt-0.5 text-[13px] text-[#707684]">{activity.subtitle}</p>
              </div>
              <span className="flex-shrink-0 text-[13px] text-[#707684]">{activity.time}</span>
            </div>
          );
        })}
      </div>

      <button className="group mt-[22px] flex items-center gap-1 text-[14px] text-[#9CA3AF] transition-colors duration-200 hover:text-accent">
        Ver toda la actividad
        <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={1.5} />
      </button>
    </div>
  );
}

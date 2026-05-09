"use client";

import { FileText, Image, Music, Video, Download, MessageSquare } from "lucide-react";

interface PipelineNodeProps {
  title: string;
  subtitle: string;
  icon: "briefing" | "script" | "thumbnail" | "music" | "video" | "export";
  color: string;
  glowColor: string;
}

const iconMap = {
  briefing: MessageSquare,
  script: FileText,
  thumbnail: Image,
  music: Music,
  video: Video,
  export: Download,
};

export function PipelineNode({ title, subtitle, icon, color, glowColor }: PipelineNodeProps) {
  const Icon = iconMap[icon];

  return (
    <div
      className="relative flex flex-col items-center gap-2 px-4 py-3 rounded-xl bg-[#10131B] border transition-all duration-200 cursor-pointer group"
      style={{
        borderColor: `${color}30`,
        boxShadow: `0 0 0 ${glowColor}00`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${color}60`;
        e.currentTarget.style.boxShadow = `0 0 20px ${glowColor}20`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${color}30`;
        e.currentTarget.style.boxShadow = `0 0 0 ${glowColor}00`;
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${color}18` }}
      >
        <Icon className="w-4 h-4" style={{ color }} strokeWidth={1.5} />
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-white">{title}</p>
        <p className="text-[10px] text-[#8B8FA3] mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

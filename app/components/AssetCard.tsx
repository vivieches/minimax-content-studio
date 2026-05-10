"use client";

import { MoreHorizontal, Play, FileText, Music, Image, Video } from "lucide-react";
import { AudioWaveform } from "./AudioWaveform";

type AssetType = "script" | "thumbnail" | "music" | "video";

interface AssetCardProps {
  title: string;
  type: AssetType;
  time: string;
  duration?: string;
  imageUrl?: string;
  gradient?: string;
}

const typeConfig = {
  script: { icon: FileText, label: "Script", color: "#8B5CF6" },
  thumbnail: { icon: Image, label: "Thumbnail", color: "#FACC15" },
  music: { icon: Music, label: "Music", color: "#E94BCB" },
  video: { icon: Video, label: "Video", color: "#38BDF8" },
};

export function AssetCard({ title, type, time, duration, imageUrl, gradient }: AssetCardProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  const renderPreview = () => {
    if (type === "script") {
      return (
        <div className="w-full h-[140px] flex items-center justify-center bg-[#0A0C14]">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${config.color}18` }}
          >
            <Icon className="w-6 h-6" style={{ color: config.color }} strokeWidth={1.5} />
          </div>
        </div>
      );
    }

    if (type === "music") {
      return (
        <div className="w-full h-[140px] flex items-center justify-center bg-[#0A0C14] relative overflow-hidden">
          <AudioWaveform bars={48} colorFrom="#E94BCB" colorTo="#8B5CF6" />
          {duration && (
            <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-[10px] text-white font-medium">
              {duration}
            </span>
          )}
        </div>
      );
    }

    if (type === "thumbnail" || type === "video") {
      return (
        <div className="w-full h-[140px] relative overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          {type === "thumbnail" && (
            <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-[10px] text-white font-medium">
              {duration || "00:33"}
            </span>
          )}
          {type === "video" && (
            <>
              <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-[10px] text-white font-medium">
                {duration}
              </span>
              <div className="absolute bottom-2.5 left-2.5 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <Play className="w-3 h-3 text-white fill-white" />
              </div>
            </>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="group bg-[#11151b] border border-white/[0.07] rounded-lg overflow-hidden hover:border-[#8B5CF6]/25 hover:shadow-[0_0_20px_rgba(139,92,246,0.08)] transition-all duration-200 cursor-pointer">
      {/* Preview */}
      <div className="relative">
        {renderPreview()}
      </div>

      {/* Content */}
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate group-hover:text-[#E94BCB] transition-colors duration-150">
              {title}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-[#8B8FA3]">{config.label}</span>
              <span className="w-0.5 h-0.5 rounded-full bg-[#8B8FA3]/40" />
              <span className="text-xs text-[#8B8FA3]/60">{time}</span>
            </div>
          </div>
          <button className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8B8FA3] hover:text-white hover:bg-white/[0.06] opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer flex-shrink-0 mt-0.5">
            <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

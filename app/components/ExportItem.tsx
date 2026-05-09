"use client";

import { Package, Video, Music, FileText, Download, Loader2 } from "lucide-react";

export interface ExportData {
  id: string;
  title: string;
  metadata: string;
  status: "completed" | "processing" | "failed" | "pending";
  time: string;
  iconColor: string;
  iconType: "package" | "video" | "music" | "document";
  progress?: number;
}

interface ExportItemProps {
  data: ExportData;
}

const iconMap = {
  package: Package,
  video: Video,
  music: Music,
  document: FileText,
};

export function ExportItem({ data }: ExportItemProps) {
  const Icon = iconMap[data.iconType];
  const isCompleted = data.status === "completed";
  const isProcessing = data.status === "processing";

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 py-4 rounded-[14px] bg-[#0F1118] border border-white/[0.08] hover:border-[#E94BCB]/30 transition-all duration-200">
      {/* Top row: icon + content + status/action */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        {/* Icon */}
        <div
          className="flex-shrink-0 w-[42px] h-[42px] rounded-[10px] flex items-center justify-center"
          style={{ backgroundColor: `${data.iconColor}20` }}
        >
          <Icon
            className="w-5 h-5"
            style={{ color: data.iconColor }}
            strokeWidth={1.5}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">
            {data.title}
          </h3>
          <p className="text-xs text-[#8B8FA3] mt-0.5 truncate">
            {data.metadata}
          </p>
        </div>

        {/* Desktop Status & Time */}
        <div className="hidden sm:flex flex-col items-end gap-1 min-w-[80px]">
          <span
            className={`text-xs font-medium ${
              isCompleted
                ? "text-[#2EE59D]"
                : isProcessing
                ? "text-[#E94BCB]"
                : "text-red-400"
            }`}
          >
            {isCompleted
              ? "Completed"
              : isProcessing
              ? "Processing"
              : "Failed"}
          </span>
          <span className="text-[11px] text-[#8B8FA3]">{data.time}</span>
        </div>

        {/* Desktop Action */}
        <div className="hidden sm:flex flex-shrink-0 items-center justify-end min-w-[80px]">
          {isCompleted ? (
            <button className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.1] hover:border-[#E94BCB]/30 transition-all duration-150 cursor-pointer">
              <Download className="w-4 h-4 text-[#8B8FA3]" strokeWidth={1.5} />
            </button>
          ) : isProcessing && data.progress !== undefined ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-[11px] font-medium text-[#8B5CF6]">
                  {data.progress}%
                </span>
                <div className="w-20 h-[5px] rounded-full bg-white/[0.08] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#E94BCB]"
                    style={{ width: `${data.progress}%` }}
                  />
                </div>
              </div>
              <Loader2 className="w-4 h-4 text-[#8B5CF6] animate-spin" strokeWidth={1.5} />
            </div>
          ) : null}
        </div>
      </div>

      {/* Mobile row: status + time + action */}
      <div className="flex sm:hidden items-center justify-between w-full pl-[54px]">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium ${
              isCompleted
                ? "text-[#2EE59D]"
                : isProcessing
                ? "text-[#E94BCB]"
                : "text-red-400"
            }`}
          >
            {isCompleted
              ? "Completed"
              : isProcessing
              ? "Processing"
              : "Failed"}
          </span>
          <span className="text-[11px] text-[#8B8FA3]">{data.time}</span>
        </div>

        <div className="flex-shrink-0">
          {isCompleted ? (
            <button className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.1] hover:border-[#E94BCB]/30 transition-all duration-150 cursor-pointer">
              <Download className="w-4 h-4 text-[#8B8FA3]" strokeWidth={1.5} />
            </button>
          ) : isProcessing && data.progress !== undefined ? (
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end gap-1">
                <span className="text-[11px] font-medium text-[#8B5CF6]">
                  {data.progress}%
                </span>
                <div className="w-16 h-[5px] rounded-full bg-white/[0.08] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#E94BCB]"
                    style={{ width: `${data.progress}%` }}
                  />
                </div>
              </div>
              <Loader2 className="w-4 h-4 text-[#8B5CF6] animate-spin" strokeWidth={1.5} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

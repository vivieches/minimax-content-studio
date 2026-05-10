"use client";

import { Play } from "lucide-react";

interface ProjectCardProps {
  imageUrl: string;
  title: string;
  category: string;
  time: string;
}

export function ProjectCard({ imageUrl, title, category, time }: ProjectCardProps) {
  return (
    <div className="group relative bg-card border border-line rounded-lg overflow-hidden hover:border-line-hi hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
      {/* Image */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute top-3 left-3 w-7 h-7 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center">
          <Play className="w-3 h-3 text-white fill-white" />
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5">
        <h3 className="text-sm font-semibold text-ink truncate mb-1.5 group-hover:text-accent transition-colors duration-150">
          {title}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-2">{category}</span>
          <span className="text-xs text-ink-3">{time}</span>
        </div>
      </div>
    </div>
  );
}

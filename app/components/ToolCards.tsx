"use client";

import { FileText, Image, Music, Box, Type } from "lucide-react";

const tools = [
  {
    href: "/scripts",
    icon: FileText,
    label: "Guion",
    description: "Genera guiones",
  },
  {
    href: "/thumbnails",
    icon: Image,
    label: "Miniatura",
    description: "Crea miniaturas",
  },
  {
    href: "/pipeline",
    icon: Type,
    label: "Leyenda",
    description: "Genera leyendas",
  },
  {
    href: "/music",
    icon: Music,
    label: "Música",
    description: "Crea música",
  },
  {
    href: "/assets",
    icon: Box,
    label: "Assets",
    description: "Biblioteca",
  },
];

export function ToolCards() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <a
            key={tool.href}
            href={tool.href}
            className="
              group flex flex-col items-center justify-center
              h-[76px] rounded-lg
              bg-[#11151b] border border-white/[0.07]
              hover:border-white/[0.14] hover:bg-[#151922]
              transition-all duration-200
              hover:-translate-y-0.5
              cursor-pointer
            "
          >
            <Icon 
              className="w-7 h-7 text-[#9CA3AF] group-hover:text-[#F4F6FA] transition-colors duration-200 mb-2" 
              strokeWidth={1.5} 
            />
            <span className="text-sm font-medium text-[#F4F6FA]">{tool.label}</span>
          </a>
        );
      })}
    </div>
  );
}

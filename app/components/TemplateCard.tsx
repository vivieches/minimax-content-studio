"use client";

import { FileText, Image, Video } from "lucide-react";
import Link from "next/link";
import { useT } from "@/lib/i18n";

interface TemplateCardProps {
  title: string;
  description: string;
  tag: "script" | "thumbnail" | "video";
  iconColor: string;
  href: string;
}

const tagIcons: Record<string, typeof FileText> = {
  script:    FileText,
  thumbnail: Image,
  video:     Video,
};

export function TemplateCard({ title, description, tag, iconColor, href }: TemplateCardProps) {
  const { t } = useT();
  const TagIcon = tagIcons[tag] ?? FileText;

  return (
    <Link href={href} className="group block bg-card border border-line rounded-2xl p-5 hover:border-line-hi hover:-translate-y-0.5 transition-all duration-200">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{ backgroundColor: `${iconColor}18` }}
      >
        <TagIcon className="w-5 h-5" style={{ color: iconColor }} strokeWidth={1.5} />
      </div>

      <h3 className="text-sm font-semibold text-ink mb-1.5 group-hover:text-accent transition-colors duration-150">
        {t(title)}
      </h3>

      <p className="text-xs text-ink-2 leading-relaxed mb-4 line-clamp-2">
        {t(description)}
      </p>

      <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-hover border border-line">
        <span className="text-[11px] text-ink-3">{t(`templates.tag.${tag}`)}</span>
      </div>
    </Link>
  );
}

"use client";

import Link from "next/link";
import { SearchBar } from "../../components/SearchBar";
import { TemplateFilters } from "../../components/TemplateFilters";
import { TemplateCard } from "../../components/TemplateCard";
import { Plus } from "lucide-react";
import { useT } from "@/lib/i18n";

const templates = [
  { title: "templates.youtubeScript.title", description: "templates.youtubeScript.description", tag: "script", iconColor: "#60A5FA", href: "/scripts" },
  { title: "templates.youtubeThumbnail.title", description: "templates.youtubeThumbnail.description", tag: "thumbnail", iconColor: "#FB923C", href: "/thumbnails" },
  { title: "templates.youtubeShort.title", description: "templates.youtubeShort.description", tag: "video", iconColor: "#F87171", href: "/pipeline" },
  { title: "templates.productReview.title", description: "templates.productReview.description", tag: "script", iconColor: "#FBBF24", href: "/scripts" },
  { title: "templates.listicle.title", description: "templates.listicle.description", tag: "script", iconColor: "#60A5FA", href: "/scripts" },
  { title: "templates.tutorial.title", description: "templates.tutorial.description", tag: "script", iconColor: "#34D399", href: "/scripts" },
] as const;

export default function TemplatesPage() {
  const { t } = useT();

  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="flex flex-col h-full px-6 py-6 lg:px-8 lg:py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-ink mb-1">{t("templates.title")}</h1>
            <p className="text-sm text-ink-2">{t("templates.subtitle")}</p>
          </div>
          <Link href="/scripts" className="flex items-center gap-2 px-4 py-2 rounded-xl btn-brand text-xs font-medium transition-all duration-150">
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
            {t("templates.create")}
          </Link>
        </div>

        <div className="mb-4">
          <SearchBar placeholder={t("templates.searchPlaceholder")} />
        </div>

        <div className="mb-6">
          <TemplateFilters />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((template) => (
            <TemplateCard key={template.title} {...template} />
          ))}
        </div>
      </div>
    </main>
  );
}

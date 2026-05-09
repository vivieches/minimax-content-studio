"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useT } from "@/lib/i18n";

const categories = [
  { value: "all", labelKey: "templates.filter.all" },
  { value: "youtube", labelKey: "templates.filter.youtube" },
  { value: "shorts", labelKey: "templates.filter.shorts" },
  { value: "tiktok", labelKey: "templates.filter.tiktok" },
  { value: "reels", labelKey: "templates.filter.reels" },
  { value: "marketing", labelKey: "templates.filter.marketing" },
  { value: "educational", labelKey: "templates.filter.educational" },
];

export function TemplateFilters() {
  const { t } = useT();
  const [activeCategory, setActiveCategory] = useState("all");

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-1.5 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer ${
              activeCategory === cat.value
                ? "bg-accent-soft text-accent border border-accent/25"
                : "bg-hover text-ink-2 border border-line hover:text-ink hover:bg-line"
            }`}
          >
            {t(cat.labelKey)}
          </button>
        ))}
      </div>

      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hover border border-line text-xs text-ink-2 hover:border-line-hi hover:text-ink transition-colors duration-150 cursor-pointer">
        <span>{t("templates.sort.popular")}</span>
        <ChevronDown className="w-3 h-3 text-ink-3" />
      </button>
    </div>
  );
}

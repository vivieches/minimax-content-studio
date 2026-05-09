"use client";

import { Video } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function VideoPage() {
  const { t } = useT();

  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-400/10 border border-red-400/20 flex items-center justify-center mx-auto mb-6">
            <Video className="w-7 h-7 text-red-400" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-ink mb-2">{t("video.title")}</h1>
          <p className="text-sm text-ink-2 mb-6 max-w-sm mx-auto leading-relaxed">
            {t("video.subtitle")}
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-hover border border-line text-xs text-ink-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            {t("video.comingSoon")}
          </div>
        </div>
      </div>
    </main>
  );
}

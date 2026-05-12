"use client";

import { AbstractHeroShapes } from "./AbstractHeroShapes";
import { useT } from "@/lib/i18n";

export function OpenStudioHero() {
  const { t } = useT();

  return (
    <section className="relative min-h-[280px]" aria-labelledby="dashboard-hero-title">
      <AbstractHeroShapes />

      <div className="relative z-10 max-w-[625px] pt-[44px]">
        <h1
          id="dashboard-hero-title"
          aria-label={`${t("home.heroLine1")} ${t("home.heroLine2")}`}
          className="font-sans text-[54px] font-medium leading-[0.99] tracking-tight text-[#F5F2F4] sm:text-[64px] xl:text-[70px]"
          style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
        >
          {t("home.heroLine1")}{" "}
          <em className="font-medium italic text-accent">{t("home.heroLine2")}</em>
        </h1>

        <p className="mt-[29px] max-w-[440px] text-[16px] leading-[1.55] text-[#A0A3AD]">
          {t("home.subtitle")}
        </p>

        <div className="mt-[30px] h-px w-[34px] bg-accent shadow-[0_0_16px_rgba(208,111,167,0.30)]" />
      </div>
    </section>
  );
}

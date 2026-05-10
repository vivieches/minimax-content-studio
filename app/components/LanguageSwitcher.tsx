"use client";

import { useState } from "react";
import { Globe, Check } from "lucide-react";
import { useT, type Locale } from "@/lib/i18n";

const locales: { value: Locale; label: string; flag: string }[] = [
  { value: "en",    label: "English",    flag: "🇺🇸" },
  { value: "pt-BR", label: "Português",  flag: "🇧🇷" },
  { value: "es",    label: "Español",    flag: "🇪🇸" },
];

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useT();
  const [open, setOpen] = useState(false);
  const current = locales.find((l) => l.value === locale) ?? locales[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title={`${t("nav.language")}: ${current.label}`}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-3 hover:bg-hover hover:text-ink transition-colors duration-100 cursor-pointer"
      >
        <Globe className="w-[15px] h-[15px]" strokeWidth={1.5} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-0 left-[calc(100%+12px)] z-20 w-44 overflow-hidden rounded-xl border border-line bg-card shadow-lg">
            {locales.map((l) => (
              <button
                key={l.value}
                onClick={() => { setLocale(l.value); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-hover transition-colors"
              >
                <span>{l.flag}</span>
                <span className={locale === l.value ? "text-ink font-medium" : "text-ink-2"}>
                  {l.label}
                </span>
                {locale === l.value && (
                  <Check className="w-3.5 h-3.5 text-accent ml-auto" strokeWidth={2} />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

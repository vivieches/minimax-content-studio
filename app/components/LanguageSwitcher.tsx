"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Globe, Check } from "lucide-react";
import { useT, type Locale } from "@/lib/i18n";

const locales: { value: Locale; label: string; flag: string }[] = [
  { value: "en",    label: "English",   flag: "🇺🇸" },
  { value: "pt-BR", label: "Português", flag: "🇧🇷" },
  { value: "es",    label: "Español",   flag: "🇪🇸" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useT();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const current = locales.find((l) => l.value === locale) ?? locales[0];

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top: rect.top,
        left: rect.right + 12,
      });
    }
    setOpen((v) => !v);
  }

  // fecha ao pressionar Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const dropdown = open ? (
    <>
      {/* backdrop */}
      <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
      {/* menu */}
      <div
        className="fixed z-[9999] w-44 overflow-hidden rounded-xl border border-white/[0.10] bg-[#1a1a1e] shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
        style={{ top: pos.top, left: pos.left }}
      >
        {locales.map((l) => (
          <button
            key={l.value}
            onClick={() => { setLocale(l.value); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.06]"
          >
            <span className="text-base">{l.flag}</span>
            <span className={locale === l.value ? "font-medium text-[#F5F2F4]" : "text-[#9CA3AF]"}>
              {l.label}
            </span>
            {locale === l.value && (
              <Check className="ml-auto h-3.5 w-3.5 text-accent" strokeWidth={2} />
            )}
          </button>
        ))}
      </div>
    </>
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        title={`Idioma: ${current.label}`}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8D91A0] transition-colors duration-100 hover:bg-white/[0.045] hover:text-[#F5F2F4]"
      >
        <Globe className="h-[18px] w-[18px]" strokeWidth={1.5} />
      </button>

      {typeof window !== "undefined" && createPortal(dropdown, document.body)}
    </>
  );
}

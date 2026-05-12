"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { appRoutes, uiCopy, type AppRoute } from "@/lib/ui/copy";

const RECENTS_KEY = "open-studio-recent-routes";
const MAX_RECENTS = 5;

export function QuickSwitcher({ showTrigger = true }: { showTrigger?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const commandHint =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform)
      ? "⌘ K"
      : "Ctrl K";

  useEffect(() => {
    if (!pathname) return;
    const route = appRoutes.find((item) => (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)));
    if (!route) return;
    const next = [route.href, ...readRecents().filter((href) => href !== route.href)].slice(0, MAX_RECENTS);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const shortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (shortcut) {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("open-studio:quick-switcher", onOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("open-studio:quick-switcher", onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const normalizedQuery = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!normalizedQuery) return appRoutes;
    return appRoutes.filter((item) => {
      const haystack = [item.label, item.description, item.href, ...item.keywords].join(" ").toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery]);

  const recentRoutes = readRecents()
    .map((href) => appRoutes.find((item) => item.href === href))
    .filter((item): item is AppRoute => Boolean(item));

  function navigate(route: AppRoute) {
    setOpen(false);
    setQuery("");
    router.push(route.href);
  }

  return (
    <>
      {showTrigger ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="hidden h-[42px] w-[310px] items-center gap-[10px] rounded-[9px] border border-white/[0.08] bg-[#0D0F16] px-[13px] text-left transition-all duration-200 ease-out hover:border-white/[0.13] md:flex"
          aria-label={uiCopy.searchPlaceholder}
        >
          <Search className="h-[17px] w-[17px] flex-shrink-0 text-[#7F8594]" strokeWidth={1.5} />
          <span className="min-w-0 flex-1 text-[13px] text-[#777C89]">{uiCopy.searchPlaceholder}</span>
          <kbd className="rounded-[6px] border border-white/[0.08] bg-white/[0.035] px-[7px] py-[3px] text-[11px] font-medium leading-none text-[#787E8B]">
            {commandHint}
          </kbd>
        </button>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-[120] bg-black/62 px-4 py-[11vh] backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={uiCopy.commandTitle}>
          <button type="button" className="absolute inset-0 cursor-default" onClick={() => setOpen(false)} aria-label="Fechar busca" />
          <div className="relative mx-auto w-full max-w-[640px] overflow-hidden rounded-[14px] border border-white/[0.10] bg-[#151516] shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
            <div className="flex h-14 items-center gap-3 border-b border-white/[0.07] px-4">
              <Search className="h-4 w-4 text-accent" strokeWidth={1.7} />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar rota, ação ou configuração"
                className="min-w-0 flex-1 bg-transparent text-[14px] text-[#F5F2F4] outline-none placeholder:text-[#686D7A]"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-[8px] text-[#8D91A0] transition hover:bg-white/[0.05] hover:text-[#F5F2F4]"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[58vh] overflow-y-auto p-2">
              {!normalizedQuery && recentRoutes.length ? (
                <CommandGroup title={uiCopy.recentRoutes} routes={recentRoutes} onSelect={navigate} />
              ) : null}
              <CommandGroup title={normalizedQuery ? "Resultados" : uiCopy.allRoutes} routes={results} onSelect={navigate} />
              {results.length === 0 ? (
                <p className="rounded-[10px] px-3 py-8 text-center text-[13px] text-[#8D91A0]">{uiCopy.commandEmpty}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function CommandGroup({ title, routes, onSelect }: { title: string; routes: AppRoute[]; onSelect: (route: AppRoute) => void }) {
  if (!routes.length) return null;
  return (
    <section className="py-1">
      <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#5F6472]">{title}</p>
      <div className="space-y-1">
        {routes.map((route) => {
          const Icon = route.icon;
          return (
            <button
              type="button"
              key={route.href}
              onClick={() => onSelect(route)}
              className="flex w-full items-center gap-3 rounded-[10px] px-3 py-3 text-left transition hover:bg-white/[0.045] focus-visible:bg-white/[0.055] focus-visible:outline-none"
            >
              <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-[8px] border border-white/[0.07] bg-white/[0.025] text-accent">
                <Icon className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-[#F5F2F4]">{route.label}</span>
                <span className="mt-0.5 line-clamp-1 text-[12px] text-[#8D91A0]">{route.description}</span>
              </span>
              <span className="text-[12px] text-[#5F6472]">{route.href}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function readRecents() {
  if (typeof localStorage === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENTS_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

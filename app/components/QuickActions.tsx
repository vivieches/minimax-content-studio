import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { quickActions } from "@/lib/ui/copy";

export function QuickActions() {
  return (
    <section aria-labelledby="quick-actions-title">
      <h2 id="quick-actions-title" className="mb-[14px] text-[16px] font-semibold text-[#F5F2F4]">
        Ações rápidas
      </h2>

      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className="group relative flex h-[148px] items-center overflow-hidden rounded-[13px] border border-white/[0.075] bg-[#151516] px-[30px] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[rgba(208,111,167,0.24)]"
            >
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(208,111,167,0.055),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.018),transparent)] opacity-80 transition-opacity duration-200 group-hover:opacity-100" />
              <span className="relative flex h-full min-w-0 flex-1 flex-col justify-center">
                <Icon className="mb-[22px] h-[38px] w-[38px] text-accent" strokeWidth={1.35} />
                <span className="truncate text-[16px] font-semibold leading-none text-[#F5F2F4]">
                  {action.label}
                </span>
                <span className="mt-2 line-clamp-2 text-[12px] leading-4 text-[#8D91A0]">
                  {action.description}
                </span>
              </span>
              <ArrowRight className="relative mt-[52px] h-[20px] w-[20px] flex-shrink-0 text-[#B6BAC5] transition-transform duration-200 ease-out group-hover:translate-x-1 group-hover:text-accent" strokeWidth={1.45} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

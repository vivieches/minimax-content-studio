"use client";

import { Bell } from "lucide-react";
import { uiCopy } from "@/lib/ui/copy";
import { QuickSwitcher } from "./QuickSwitcher";

export function Header() {
  return (
    <header className="h-[86px] flex-shrink-0 border-b border-white/[0.06] bg-[#0a0a0d]/95">
      <div className="flex h-full items-center justify-between pl-9 pr-[42px] md:pl-[38px]">
        <p className="text-[20px] font-semibold leading-none tracking-[-0.01em] text-[#F5F2F4]">
          Open Studio
        </p>

        <div className="flex items-center gap-[35px]">
          <QuickSwitcher />

          <button
            className="relative flex h-10 w-10 items-center justify-center rounded-[10px] text-[#9AA0AD] transition-colors duration-200 ease-out hover:bg-white/[0.04] hover:text-[#F5F2F4]"
            aria-label={uiCopy.notifications}
          >
            <Bell className="h-[21px] w-[21px]" strokeWidth={1.45} />
            <span className="absolute right-[9px] top-[7px] h-[8px] w-[8px] rounded-full bg-accent shadow-[0_0_14px_rgba(208,111,167,0.54)]" />
          </button>
        </div>
      </div>
    </header>
  );
}

export const Topbar = Header;

"use client";
import { Header } from "../components/Topbar";
import { OpenStudioHero } from "../components/OpenStudioHero";
import { QuickActions } from "../components/QuickActions";
import { RecentProjects } from "../components/RecentProjects";
import { ActivityPanel } from "../components/RecentActivity";

export default function HomePage() {
  return (
    <>
      <Header />
      <div className="relative flex flex-1 flex-col overflow-x-hidden overflow-y-auto bg-[#0a0a0d]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_18%,rgba(208,111,167,0.055),transparent_32%),radial-gradient(circle_at_24%_5%,rgba(155,108,255,0.035),transparent_28%),linear-gradient(180deg,#0a0a0d_0%,#0a0a0d_48%,#0a0a0d_100%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0.6px,transparent_0.7px)] [background-size:4px_4px]" />

        <div className="relative z-10 mx-auto box-border flex w-full max-w-[1526px] flex-1 flex-col px-[clamp(32px,7vw,136px)] pb-6 min-h-[calc(100%+32px)]">
          <OpenStudioHero />
          <QuickActions />

          <div className="mt-[28px] grid min-h-0 flex-1 grid-cols-1 items-start gap-[34px] xl:grid-cols-[minmax(0,1.06fr)_minmax(350px,418px)] xl:gap-[44px]">
            <RecentProjects />
            <div className="xl:mt-[43px]">
              <ActivityPanel />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

"use client";
import { Topbar } from "../components/Topbar";
import { OpenStudioHero } from "../components/OpenStudioHero";
import { RecentProjects } from "../components/RecentProjects";
import { RecentActivity } from "../components/RecentActivity";

export default function HomePage() {
  return (
    <>
      <Topbar />
      <main className="relative flex-1 overflow-y-auto overflow-x-hidden">
        <div className="relative z-10 mx-auto max-w-[1378px] px-5 py-6 md:px-0">
          <OpenStudioHero />

          <div className="mt-4 grid grid-cols-1 gap-9 lg:grid-cols-[minmax(0,870px)_472px]">
            <RecentProjects />
            <RecentActivity />
          </div>
        </div>
      </main>
    </>
  );
}

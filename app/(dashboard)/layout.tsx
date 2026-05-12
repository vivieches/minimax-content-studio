import { Sidebar } from "../components/Sidebar";
import { QuickSwitcher } from "../components/QuickSwitcher";
import type { CSSProperties } from "react";

const dashboardDarkVars = {
  colorScheme: "dark",
  "--mm-canvas": "#0a0a0d",
  "--mm-sidebar": "#101012",
  "--mm-card": "#151516",
  "--mm-card-hi": "#1E1E1F",
  "--mm-line": "rgba(255, 255, 255, 0.07)",
  "--mm-line-hi": "rgba(255, 255, 255, 0.12)",
  "--mm-ink": "#F5F2F4",
  "--mm-ink-2": "#A0A3AD",
  "--mm-ink-3": "#5F6472",
  "--mm-accent": "#D06FA7",
  "--mm-accent-hi": "#E18CBC",
  "--mm-accent-soft": "rgba(208, 111, 167, 0.13)",
  "--mm-accent-fg": "#F9F5F8",
  "--mm-accent-grad": "linear-gradient(135deg, #D06FA7 0%, #9B6CFF 100%)",
  "--mm-hover": "rgba(255, 255, 255, 0.05)",
} as CSSProperties;

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="dashboard-dark flex h-screen overflow-hidden bg-canvas" style={dashboardDarkVars}>
      <QuickSwitcher showTrigger={false} />
      <Sidebar />
      <main
        id="main-content"
        className="flex min-w-0 flex-1 flex-col overflow-hidden pt-[52px] md:pt-0"
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  );
}

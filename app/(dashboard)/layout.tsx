import { Sidebar } from "../components/Sidebar";
import type { CSSProperties } from "react";

const dashboardDarkVars = {
  colorScheme: "dark",
  "--mm-canvas": "#0C0D12",
  "--mm-sidebar": "#0E0F15",
  "--mm-card": "#11131A",
  "--mm-card-hi": "#161820",
  "--mm-line": "rgba(255, 255, 255, 0.07)",
  "--mm-line-hi": "rgba(255, 255, 255, 0.14)",
  "--mm-ink": "#F4F6FA",
  "--mm-ink-2": "#9CA3AF",
  "--mm-ink-3": "#6B7280",
  "--mm-accent": "#FF4FA3",
  "--mm-accent-hi": "#FF6AB7",
  "--mm-accent-soft": "rgba(255, 79, 163, 0.12)",
  "--mm-accent-fg": "#FFFFFF",
  "--mm-accent-grad": "linear-gradient(135deg, #FF4FA3 0%, #A855F7 100%)",
  "--mm-hover": "rgba(255, 255, 255, 0.05)",
} as CSSProperties;

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="dashboard-dark flex h-screen bg-canvas overflow-hidden" style={dashboardDarkVars}>
      <Sidebar />
      <main id="main-content" className="flex-1 flex flex-col min-w-0 overflow-hidden pt-[52px] md:pt-0" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

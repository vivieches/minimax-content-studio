import { Sidebar } from "../components/Sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen bg-canvas overflow-hidden">
      <Sidebar />
      <main id="main-content" className="flex-1 flex flex-col min-w-0 overflow-hidden pt-[52px] md:pt-0" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

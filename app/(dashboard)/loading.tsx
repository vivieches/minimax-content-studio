export default function DashboardLoading() {
  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <div className="h-16 border-b border-white/[0.08] bg-[#090A0F] animate-pulse" />
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="h-8 w-64 bg-white/[0.05] rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-white/[0.03] rounded-xl border border-white/[0.08] animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

export function HeroCard() {
  return (
    <div className="relative w-full rounded-[20px] bg-[#11131A] border border-[rgba(255,255,255,0.08)] overflow-hidden" style={{ height: "280px" }}>
      {/* Background gradient */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 85% 50%, rgba(255,79,163,0.15) 0%, transparent 50%),
            radial-gradient(circle at 75% 30%, rgba(168,85,247,0.08) 0%, transparent 40%)
          `
        }}
      />
      
      {/* Abstract cards illustration on right */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-2 pointer-events-none">
        {/* Back card */}
        <div 
          className="w-20 h-28 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] backdrop-blur-sm flex items-center justify-center"
          style={{ transform: "perspective(600px) rotateY(-20deg) rotateX(8deg) translateX(40px)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(168,85,247,0.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        {/* Middle card */}
        <div 
          className="w-20 h-28 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] backdrop-blur-sm flex items-center justify-center"
          style={{ transform: "perspective(600px) rotateY(-20deg) rotateX(8deg) translateZ(15px) translateX(20px)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(99,102,241,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          </svg>
        </div>
        {/* Front card */}
        <div 
          className="w-20 h-28 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] backdrop-blur-sm flex items-center justify-center"
          style={{ transform: "perspective(600px) rotateY(-20deg) rotateX(8deg) translateZ(30px)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,79,163,0.45)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center h-full px-12 max-w-xl">
        <span className="text-xs font-semibold text-accent tracking-wide mb-3">
          Open Studio
        </span>
        <h2 className="text-[32px] sm:text-4xl font-bold text-[#F4F6FA] leading-tight tracking-tight mb-1">
          De la idea al contenido
        </h2>
        <h2 className="text-[32px] sm:text-4xl font-bold leading-tight tracking-tight mb-4">
          <span 
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(135deg, #FF4FA3 0%, #A855F7 100%)" }}
          >
            listo para publicar
          </span>
        </h2>
        <p className="text-sm text-[#9CA3AF] leading-relaxed max-w-md">
          Todo lo que necesitas para guiones, miniaturas, música y assets creativos.
        </p>
      </div>
    </div>
  );
}

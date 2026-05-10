"use client";

import { PipelineNode } from "./PipelineNode";

export function PipelineCanvas() {
  return (
      <div className="relative w-full h-full min-h-[520px] bg-[#080A10] border border-white/[0.07] rounded-lg overflow-hidden">
      {/* Dotted grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* SVG Connections */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 800 520"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="rgba(255,255,255,0.25)" />
          </marker>
        </defs>

        {/* Briefing → Script */}
        <line x1="220" y1="110" x2="320" y2="110" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" markerEnd="url(#arrow)" />

        {/* Script → Thumbnail */}
        <path d="M400 150 L400 180 L180 180 L180 210" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" markerEnd="url(#arrow)" />

        {/* Script → Music */}
        <path d="M400 150 L400 210" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" markerEnd="url(#arrow)" />

        {/* Script → Video */}
        <path d="M400 150 L400 180 L620 180 L620 210" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" markerEnd="url(#arrow)" />

        {/* Thumbnail → Export */}
        <path d="M180 290 L180 320 L400 320 L400 350" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" markerEnd="url(#arrow)" />

        {/* Music → Export */}
        <path d="M400 290 L400 350" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" markerEnd="url(#arrow)" />

        {/* Video → Export */}
        <path d="M620 290 L620 320 L400 320 L400 350" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" markerEnd="url(#arrow)" />
      </svg>

      {/* Nodes positioned absolutely */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[640px] h-[440px]">
          {/* Row 1: Briefing → Script */}
          <div className="absolute left-[90px] top-[70px]">
            <PipelineNode
              title="Briefing"
              subtitle="Video idea / AI chat"
              icon="briefing"
              color="#22C55E"
              glowColor="#22C55E"
            />
          </div>

          <div className="absolute left-[320px] top-[70px]">
            <PipelineNode
              title="Script"
              subtitle="MiniMax M2.7"
              icon="script"
              color="#8B5CF6"
              glowColor="#8B5CF6"
            />
          </div>

          {/* Row 2: Thumbnail / Music / Video */}
          <div className="absolute left-[70px] top-[200px]">
            <PipelineNode
              title="Thumbnail"
              subtitle="MiniMax Image"
              icon="thumbnail"
              color="#FACC15"
              glowColor="#FACC15"
            />
          </div>

          <div className="absolute left-[320px] top-[200px]">
            <PipelineNode
              title="Music"
              subtitle="MiniMax Audio"
              icon="music"
              color="#F97316"
              glowColor="#F97316"
            />
          </div>

          <div className="absolute left-[570px] top-[200px]">
            <PipelineNode
              title="Video"
              subtitle="MiniMax Video"
              icon="video"
              color="#38BDF8"
              glowColor="#38BDF8"
            />
          </div>

          {/* Row 3: Export */}
          <div className="absolute left-[295px] top-[340px]">
            <PipelineNode
              title="Export"
              subtitle="Render & Download"
              icon="export"
              color="#E94BCB"
              glowColor="#E94BCB"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

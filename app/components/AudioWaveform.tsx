"use client";

import { useMemo } from "react";

interface AudioWaveformProps {
  bars?: number;
  colorFrom?: string;
  colorTo?: string;
}

export function AudioWaveform({
  bars = 72,
  colorFrom = "#FF4B8B",
  colorTo = "#FF8035",
}: AudioWaveformProps) {
  const heights = useMemo(() => {
    const h: number[] = [];
    for (let i = 0; i < bars; i++) {
      // Create a bell-curve shape with some noise
      const x = i / (bars - 1);
      const bell = Math.sin(x * Math.PI) * 0.7 + 0.3;
      const noise = Math.sin(i * 2.7) * 0.15 + Math.cos(i * 1.3) * 0.12;
      h.push(Math.max(0.1, Math.min(1, bell + noise)));
    }
    return h;
  }, [bars]);

  const width = 100;
  const barWidth = (width - (bars - 1) * 1.5) / bars;

  return (
    <div className="w-full h-16 flex items-center justify-center">
      <svg
        viewBox={`0 0 ${width} 40`}
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="waveformGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorFrom} stopOpacity="0.35" />
            <stop offset="50%" stopColor={colorTo} stopOpacity="0.85" />
            <stop offset="100%" stopColor={colorFrom} stopOpacity="0.35" />
          </linearGradient>
        </defs>
        {heights.map((h, i) => {
          const barH = h * 36;
          const x = i * (barWidth + 1.5);
          const y = (40 - barH) / 2;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={Math.max(0.5, barWidth)}
              height={barH}
              rx={barWidth / 2}
              fill="url(#waveformGradient)"
            />
          );
        })}
      </svg>
    </div>
  );
}

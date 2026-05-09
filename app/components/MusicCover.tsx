import { Music } from "lucide-react";

interface MusicCoverProps {
  gradient: string;
  iconSize?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { box: "w-9 h-9", icon: "w-4 h-4" },
  md: { box: "w-12 h-12", icon: "w-5 h-5" },
  lg: { box: "w-16 h-16", icon: "w-7 h-7" },
};

export function MusicCover({ gradient, iconSize = "md" }: MusicCoverProps) {
  const s = sizeMap[iconSize];
  return (
    <div
      className={`${s.box} rounded-xl flex items-center justify-center flex-shrink-0 ${gradient}`}
    >
      <Music className={`${s.icon} text-white/90`} strokeWidth={1.5} />
    </div>
  );
}

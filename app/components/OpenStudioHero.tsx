"use client";

import {
  AlignJustify,
  Box,
  FileText,
  Image as ImageIcon,
  Music,
} from "lucide-react";
import Link from "next/link";

const quickActions = [
  { href: "/scripts", icon: FileText, label: "Guion" },
  { href: "/thumbnails", icon: ImageIcon, label: "Miniatura" },
  { href: "/templates", icon: AlignJustify, label: "Leyenda" },
  { href: "/music", icon: Music, label: "Música" },
  { href: "/assets", icon: Box, label: "Assets" },
];

export function OpenStudioHero() {
  return (
    <section className="w-full" aria-label="Open Studio creative actions">
      <div
        className="relative h-[300px] overflow-hidden rounded-lg border border-white/[0.07] bg-[#11131A] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_24px_80px_rgba(0,0,0,0.28)]"
        style={{
          background:
            "radial-gradient(circle at 71% 14%, rgba(255,88,156,0.24) 0%, rgba(128,80,188,0.14) 27%, transparent 48%), radial-gradient(circle at 95% 31%, rgba(68,99,191,0.31) 0%, rgba(68,99,191,0.13) 24%, transparent 45%), linear-gradient(110deg, #15191f 0%, #11141a 45%, #151922 100%)",
        }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,10,14,0.18),rgba(8,10,14,0)_48%,rgba(8,10,14,0.15))]" aria-hidden />

        <div className="relative z-10 flex h-full items-center px-[55px]">
          <div className="max-w-[430px]">
            <p className="mb-[18px] text-[16px] font-semibold leading-none text-[#ff4f9a]">
              Open Studio
            </p>
            <h1 className="text-[36px] font-bold leading-[1.17] tracking-[-0.03em] text-[#f3f4f8]">
              De la idea al contenido
              <br />
              <span className="bg-[linear-gradient(90deg,#ff5aa7_0%,#ff67bb_52%,#a46cff_100%)] bg-clip-text text-transparent">
                listo para publicar
              </span>
            </h1>
            <p className="mt-[17px] max-w-[385px] text-[16px] leading-[1.65] text-[#8c919e]">
              Todo lo que necesitas para guiones, miniaturas,
              <br />
              música y assets creativos.
            </p>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-0 right-[50px] hidden h-full w-[32%] sm:block" aria-hidden>
          <div className="absolute bottom-[-46px] right-[196px] h-[168px] w-[164px] rounded-[11px] border border-white/[0.10] bg-[linear-gradient(135deg,rgba(154,105,209,0.27),rgba(89,99,151,0.16)_55%,rgba(47,55,79,0.10))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <ImageIcon className="absolute left-12 top-[80px] h-6 w-6 text-[#a8a0d8]/60" strokeWidth={1.35} />
          </div>
          <div className="absolute bottom-[-28px] right-[100px] h-[174px] w-[209px] rounded-[12px] border border-white/[0.10] bg-[linear-gradient(135deg,rgba(137,93,183,0.22),rgba(83,86,139,0.17)_58%,rgba(42,50,74,0.10))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <Music className="absolute bottom-[50px] right-7 h-6 w-6 text-[#a8a0d8]/45" strokeWidth={1.35} />
          </div>
          <div className="absolute bottom-[-10px] right-0 h-[178px] w-[209px] rounded-[13px] border border-white/[0.10] bg-[linear-gradient(135deg,rgba(117,86,166,0.20),rgba(70,79,129,0.19)_56%,rgba(38,48,75,0.11))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <Box className="absolute bottom-[51px] right-6 h-6 w-6 text-[#a8a0d8]/38" strokeWidth={1.35} />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-[96px] bg-[linear-gradient(to_top,rgba(17,20,26,0.50)_0%,rgba(17,20,26,0.22)_46%,rgba(17,20,26,0)_100%)]" />
        </div>
      </div>

      <div className="mt-[18px] grid grid-cols-2 gap-[14px] sm:grid-cols-5">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex h-[94px] flex-col items-center justify-center gap-[13px] rounded-lg border border-white/[0.07] bg-[#11131A] text-[#f4f4f7] transition-colors duration-150 hover:border-white/[0.14] hover:bg-[#161820]"
            >
              <Icon className="h-[28px] w-[28px] text-[#d8dae4] transition-colors duration-150 group-hover:text-white" strokeWidth={1.45} />
              <span className="text-[14px] font-medium leading-none">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

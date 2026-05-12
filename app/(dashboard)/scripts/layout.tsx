import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Roteiros — Open Studio",
  description: "Gere roteiros de YouTube com briefing, estrutura e revisão assistida por IA.",
  openGraph: {
    title: "Roteiros — Open Studio",
    description: "Gere roteiros de YouTube com briefing, estrutura e revisão assistida por IA.",
    type: "website",
    siteName: "Open Studio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Roteiros — Open Studio",
    description: "Gere roteiros de YouTube com briefing, estrutura e revisão assistida por IA.",
  },
};

export default function ScriptsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

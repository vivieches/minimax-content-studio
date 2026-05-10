import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Script Generator — MiniMax Studio",
  description: "Generate YouTube scripts with AI-powered briefing, structure, and review steps",
  openGraph: {
    title: "Script Generator — MiniMax Studio",
    description: "Generate YouTube scripts with AI-powered briefing, structure, and review steps",
    type: "website",
    siteName: "MiniMax Studio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Script Generator — MiniMax Studio",
    description: "Generate YouTube scripts with AI-powered briefing, structure, and review steps",
  },
};

export default function ScriptsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Content Pipeline — MiniMax Studio",
  description: "Run multi-step content pipelines — from briefing to script, thumbnail, music and export",
  openGraph: {
    title: "Content Pipeline — MiniMax Studio",
    description: "Run multi-step content pipelines — from briefing to script, thumbnail, music and export",
    type: "website",
    siteName: "MiniMax Studio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Content Pipeline — MiniMax Studio",
    description: "Run multi-step content pipelines — from briefing to script, thumbnail, music and export",
  },
};

export default function PipelineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Video Generator — MiniMax Studio",
  description: "Generate stunning videos with AI using MiniMax Video models",
  openGraph: {
    title: "Video Generator — MiniMax Studio",
    description: "Generate stunning videos with AI using MiniMax Video models",
    type: "website",
    siteName: "MiniMax Studio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Video Generator — MiniMax Studio",
    description: "Generate stunning videos with AI using MiniMax Video models",
  },
};

export default function VideoLayout({ children }: { children: React.ReactNode }) {
  return children;
}

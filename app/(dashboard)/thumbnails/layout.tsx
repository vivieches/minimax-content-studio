import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thumbnail Generator — MiniMax Studio",
  description: "Create AI-powered thumbnails for YouTube with custom prompts and styles",
  openGraph: {
    title: "Thumbnail Generator — MiniMax Studio",
    description: "Create AI-powered thumbnails for YouTube with custom prompts and styles",
    type: "website",
    siteName: "MiniMax Studio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Thumbnail Generator — MiniMax Studio",
    description: "Create AI-powered thumbnails for YouTube with custom prompts and styles",
  },
};

export default function ThumbnailsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
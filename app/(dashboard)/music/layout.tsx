import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Music Generator — Open Studio",
  description: "Generate original music tracks with AI — choose mood, genre, tempo and instruments",
  openGraph: {
    title: "Music Generator — Open Studio",
    description: "Generate original music tracks with AI — choose mood, genre, tempo and instruments",
    type: "website",
    siteName: "Open Studio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Music Generator — Open Studio",
    description: "Generate original music tracks with AI — choose mood, genre, tempo and instruments",
  },
};

export default function MusicLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assets Library — Open Studio",
  description: "Save and manage all your generated content — scripts, thumbnails, music and videos",
  openGraph: {
    title: "Assets Library — Open Studio",
    description: "Save and manage all your generated content — scripts, thumbnails, music and videos",
    type: "website",
    siteName: "Open Studio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Assets Library — Open Studio",
    description: "Save and manage all your generated content — scripts, thumbnails, music and videos",
  },
};

export default function AssetsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

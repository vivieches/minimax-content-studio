import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Exports Manager — Open Studio",
  description: "Package and download your projects — manage exports and downloads in one place",
  openGraph: {
    title: "Exports Manager — Open Studio",
    description: "Package and download your projects — manage exports and downloads in one place",
    type: "website",
    siteName: "Open Studio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Exports Manager — Open Studio",
    description: "Package and download your projects — manage exports and downloads in one place",
  },
};

export default function ExportsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

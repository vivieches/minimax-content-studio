import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings — Open Studio",
  description: "Configure API keys, models, provider mode and application preferences",
  openGraph: {
    title: "Settings — Open Studio",
    description: "Configure API keys, models, provider mode and application preferences",
    type: "website",
    siteName: "Open Studio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Settings — Open Studio",
    description: "Configure API keys, models, provider mode and application preferences",
  },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Open Studio — AI Creative Studio for Modern Creators",
    template: "%s — Open Studio",
  },
  description:
    "From idea to content. Generate scripts, thumbnails, music and videos with Open Studio.",
  openGraph: {
    type: "website",
    siteName: "Open Studio",
    title: "Open Studio — AI Creative Studio for Modern Creators",
    description:
      "From idea to content. Generate scripts, thumbnails, music and videos with Open Studio.",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@openstudio_ai",
    title: "Open Studio — AI Creative Studio for Modern Creators",
    description:
      "From idea to content. Generate scripts, thumbnails, music and videos with Open Studio.",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/minimax-logo.svg",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full overflow-hidden antialiased" suppressHydrationWarning>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ThemeProvider>
          <I18nProvider>{children}</I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

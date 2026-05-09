import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MiniMax Studio — AI Creative Studio for Modern Creators",
    template: "%s — MiniMax Studio",
  },
  description:
    "From idea to content. Generate scripts, thumbnails, music and videos with MiniMax.",
  openGraph: {
    type: "website",
    siteName: "MiniMax Studio",
    title: "MiniMax Studio — AI Creative Studio for Modern Creators",
    description:
      "From idea to content. Generate scripts, thumbnails, music and videos with MiniMax.",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@minimax_ai",
    title: "MiniMax Studio — AI Creative Studio for Modern Creators",
    description:
      "From idea to content. Generate scripts, thumbnails, music and videos with MiniMax.",
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
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

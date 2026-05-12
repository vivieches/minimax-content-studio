import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, DM_Sans } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Open Studio — Estúdio criativo para criadores modernos",
    template: "%s — Open Studio",
  },
  description:
    "Da ideia ao pacote final. Gere roteiros, miniaturas e conteúdo com seus próprios provedores de IA.",
  openGraph: {
    type: "website",
    siteName: "Open Studio",
    title: "Open Studio — Estúdio criativo para criadores modernos",
    description:
      "Da ideia ao pacote final. Gere roteiros, miniaturas e conteúdo com seus próprios provedores de IA.",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@openstudio_ai",
    title: "Open Studio — Estúdio criativo para criadores modernos",
    description:
      "Da ideia ao pacote final. Gere roteiros, miniaturas e conteúdo com seus próprios provedores de IA.",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/open-studio-logo.svg",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${cormorant.variable} ${dmSans.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full overflow-hidden antialiased" suppressHydrationWarning>
        <a href="#main-content" className="skip-link">
          Pular para o conteúdo principal
        </a>
        <ThemeProvider>
          <I18nProvider>{children}</I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

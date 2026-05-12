import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configurações — Open Studio",
  description: "Configure chaves de API, modelos, modo de execução e preferências do app.",
  openGraph: {
    title: "Configurações — Open Studio",
    description: "Configure chaves de API, modelos, modo de execução e preferências do app.",
    type: "website",
    siteName: "Open Studio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Configurações — Open Studio",
    description: "Configure chaves de API, modelos, modo de execução e preferências do app.",
  },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

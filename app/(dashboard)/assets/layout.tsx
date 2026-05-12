import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Arquivos — Open Studio",
  description: "Salve e gerencie roteiros, thumbnails, prompts e pacotes de conteúdo gerados.",
  openGraph: {
    title: "Arquivos — Open Studio",
    description: "Salve e gerencie roteiros, thumbnails, prompts e pacotes de conteúdo gerados.",
    type: "website",
    siteName: "Open Studio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arquivos — Open Studio",
    description: "Salve e gerencie roteiros, thumbnails, prompts e pacotes de conteúdo gerados.",
  },
};

export default function AssetsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

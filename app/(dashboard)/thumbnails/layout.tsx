import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Miniaturas — Open Studio",
  description: "Crie thumbnails de YouTube com prompts, estilos e imagens geradas por IA.",
  openGraph: {
    title: "Miniaturas — Open Studio",
    description: "Crie thumbnails de YouTube com prompts, estilos e imagens geradas por IA.",
    type: "website",
    siteName: "Open Studio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Miniaturas — Open Studio",
    description: "Crie thumbnails de YouTube com prompts, estilos e imagens geradas por IA.",
  },
};

export default function ThumbnailsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

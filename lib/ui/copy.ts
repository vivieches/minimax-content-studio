import {
  Box,
  FileText,
  Home,
  Image,
  Layers,
  Settings,
  TextCursorInput,
  type LucideIcon,
} from "lucide-react";

export type AppRoute = {
  href: string;
  label: string;
  description: string;
  keywords: string[];
  icon: LucideIcon;
};

export const appRoutes: AppRoute[] = [
  {
    href: "/",
    label: "Início",
    description: "Resumo do estúdio, projetos recentes e atividade.",
    keywords: ["home", "dashboard", "painel", "inicio"],
    icon: Home,
  },
  {
    href: "/pipeline",
    label: "Pipeline",
    description: "Gere o pacote completo: briefing, roteiro, títulos, thumbnail e export.",
    keywords: ["pipeline", "pacote", "gerar", "conteudo"],
    icon: Layers,
  },
  {
    href: "/scripts",
    label: "Roteiros",
    description: "Crie e refine roteiros com voz de marca e referências.",
    keywords: ["roteiro", "script", "texto", "voz"],
    icon: FileText,
  },
  {
    href: "/thumbnails",
    label: "Miniaturas",
    description: "Gere imagens e prompts visuais para thumbnails.",
    keywords: ["thumbnail", "miniatura", "imagem", "prompt"],
    icon: Image,
  },
  {
    href: "/content",
    label: "Títulos e legendas",
    description: "Crie títulos com foco em CTR/SEO e descrições otimizadas.",
    keywords: ["titulo", "legenda", "seo", "ctr", "caption"],
    icon: TextCursorInput,
  },
  {
    href: "/assets",
    label: "Arquivos",
    description: "Abra projetos, assets, exports e o workspace local.",
    keywords: ["arquivos", "assets", "export", "workspace"],
    icon: Box,
  },
  {
    href: "/settings",
    label: "Configurações",
    description: "Configure CLI local, BYOK, provedores, modelos e preferências.",
    keywords: ["settings", "config", "api", "provider", "modelo", "cli"],
    icon: Settings,
  },
];

export const quickActions = [
  { href: "/scripts", label: "Novo roteiro", description: "Criar texto para vídeo", icon: FileText },
  { href: "/thumbnails", label: "Nova miniatura", description: "Gerar imagem ou prompt visual", icon: Image },
  { href: "/content", label: "Títulos e legendas", description: "Otimizar CTR, SEO e descrição", icon: TextCursorInput },
  { href: "/pipeline", label: "Novo pacote", description: "Rodar fluxo completo", icon: Layers },
] satisfies Array<Pick<AppRoute, "href" | "label" | "description" | "icon">>;

export const uiCopy = {
  searchPlaceholder: "Buscar no Open Studio",
  commandHint: "⌘ K",
  commandTitle: "Ir para...",
  commandEmpty: "Nenhuma rota encontrada.",
  recentRoutes: "Recentes",
  allRoutes: "Rotas",
  notifications: "Notificações",
  openNavigation: "Abrir navegação",
  closeNavigation: "Fechar navegação",
  skipToContent: "Pular para o conteúdo principal",
};

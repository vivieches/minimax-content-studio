"use client";

import Image from "next/image";
import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Captions,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  Package,
  Sparkles,
  TextCursorInput,
  Trophy,
  WandSparkles,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import type { Locale } from "@/lib/locales";

type TitleCandidate = {
  title: string;
  score?: number;
  reason?: string;
};

type ContentPackage = {
  title?: string;
  selectedTitle?: string;
  script?: string;
  description?: string;
  tags?: string[];
  titleCandidates?: TitleCandidate[];
  topTitleCandidates?: TitleCandidate[];
  thumbnailPrompt?: string;
  thumbnailText?: string;
};

type Diagnostic = {
  severity?: "info" | "warning" | "error";
  message: string;
  action?: string;
};

type PipelineResponse = {
  ok: boolean;
  package?: ContentPackage;
  outputs?: {
    image?: { urls?: string[]; finalPrompt?: string };
    text?: ContentPackage;
    titles?: TitleResponse;
  };
  projectId?: string;
  exportId?: string;
  error?: string;
  details?: string;
  diagnostics?: Diagnostic[];
};

type TitleResponse = {
  ok: boolean;
  candidates?: TitleCandidate[];
  top3?: TitleCandidate[];
  error?: string;
  details?: string;
  diagnostics?: Diagnostic[];
};

type CaptionResponse = {
  ok: boolean;
  captions?: string[];
  notes?: string[];
  keywords?: string[];
  error?: string;
  details?: string;
  diagnostics?: Diagnostic[];
};

type CritiqueIssue = {
  severity: "info" | "warning" | "critical";
  area: "title" | "thumbnail" | "script" | "package";
  message: string;
  recommendation?: string;
};

type CritiqueScore = {
  key: "title" | "thumbnail" | "script" | "package";
  label: string;
  score: number;
  reason: string;
};

type PackageCritique = {
  ok: true;
  cohesionScore: number;
  scores: CritiqueScore[];
  issues: CritiqueIssue[];
  recommendedTitle?: string;
  recommendedTitleReason?: string;
  transcript: string[];
  createdAt: string;
};

type CritiqueResponse = {
  ok: boolean;
  critique?: PackageCritique;
  error?: string;
  details?: string;
};

type CreatorProfile = {
  tiktok: string;
  instagram: string;
  x: string;
  businessEmail: string;
  primaryLinkLabel: string;
  primaryLinkUrl: string;
  language: "auto" | Locale;
};

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[14px] border border-[rgba(255,255,255,0.07)] bg-[#151516] ${className}`}>
      {children}
    </section>
  );
}

function StepBadge({ done, active, index, label }: { done?: boolean; active?: boolean; index: number; label: string }) {
  return (
    <li className="relative flex items-center gap-4">
      <span
        className={[
          "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border text-[14px] font-medium",
          done || active
            ? "border-[#D06FA7] bg-[rgba(208,111,167,0.1)] text-[#D06FA7]"
            : "border-[rgba(255,255,255,0.07)] bg-[#151516] text-[#5F6472]",
        ].join(" ")}
      >
        {done ? <CheckCircle2 className="h-4 w-4" /> : index}
      </span>
      <span className={active ? "text-[15px] font-medium text-[#D06FA7]" : "text-[15px] font-medium text-[#A0A3AD]"}>
        {label}
      </span>
    </li>
  );
}

function normalizeTitleCandidates(value: unknown): TitleCandidate[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return { title: item };
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      if (typeof record.title !== "string" || !record.title.trim()) return null;
      return {
        title: record.title,
        score: typeof record.score === "number" ? record.score : undefined,
        reason: typeof record.reason === "string" ? record.reason : undefined,
      };
    })
    .filter((candidate): candidate is TitleCandidate => Boolean(candidate));
}

export default function PipelinePage() {
  const { locale } = useT();
  const [briefing, setBriefing] = useState(
    "Quero um vídeo de YouTube sobre como usar IA local para criar conteúdo sem depender de uma única API."
  );
  const [generateThumbnail, setGenerateThumbnail] = useState(true);
  const [generateTitles, setGenerateTitles] = useState(true);
  const [generateCaptions, setGenerateCaptions] = useState(false);
  const [useResearch, setUseResearch] = useState(false);
  const [captionPattern, setCaptionPattern] = useState("");
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile>({
    tiktok: "",
    instagram: "",
    x: "",
    businessEmail: "",
    primaryLinkLabel: "",
    primaryLinkUrl: "",
    language: "auto",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [moduleErrors, setModuleErrors] = useState<string[]>([]);
  const [result, setResult] = useState<PipelineResponse | null>(null);
  const [titleResult, setTitleResult] = useState<TitleResponse | null>(null);
  const [captionResult, setCaptionResult] = useState<CaptionResponse | null>(null);
  const [critiqueResult, setCritiqueResult] = useState<CritiqueResponse | null>(null);
  const [selectedTitleOverride, setSelectedTitleOverride] = useState("");

  const packageData = result?.package || result?.outputs?.text;
  const thumbnailUrl = result?.outputs?.image?.urls?.[0] || "";
  const selectedTitle = selectedTitleOverride || packageData?.selectedTitle || packageData?.title || "Pacote gerado";
  const tags = useMemo(() => packageData?.tags?.slice(0, 8) ?? [], [packageData]);
  const topTitles = titleResult?.top3 ?? [];
  const captions = captionResult?.captions ?? [];
  const critique = critiqueResult?.critique;

  async function runPipeline() {
    if (!briefing.trim()) {
      setError("Descreva o tema antes de gerar o pacote.");
      return;
    }

    setLoading(true);
    setError("");
    setModuleErrors([]);
    setTitleResult(null);
    setCaptionResult(null);
    setCritiqueResult(null);
    setSelectedTitleOverride("");
    try {
      let latestTitleResult: TitleResponse | null = null;
      let latestCaptionResult: CaptionResponse | null = null;
      const response = await fetch("/api/generate/package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          briefing,
          steps: generateThumbnail ? ["text", "image"] : ["text"],
          research: useResearch,
          locale,
          saveToAssets: true,
        }),
      });
      const data = (await response.json()) as PipelineResponse;
      if (!response.ok || data.error) {
        throw new Error(data.details || data.error || "Pipeline failed");
      }
      setResult(data);
      const diagnostics = (data.diagnostics ?? [])
        .filter((diagnostic) => diagnostic.severity !== "info")
        .map((diagnostic) => [diagnostic.message, diagnostic.action].filter(Boolean).join(" "));
      if (diagnostics.length) {
        setModuleErrors((current) => [...current, ...diagnostics]);
      }
      const generatedPackage = data.package || data.outputs?.text;
      if (generateTitles && data.outputs?.titles) {
        latestTitleResult = data.outputs.titles;
        setTitleResult(latestTitleResult);
      }

      if (generateTitles && !data.outputs?.titles) {
        try {
          const titleResponse = await fetch("/api/generate/titles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              topic: generatedPackage?.selectedTitle || generatedPackage?.title || briefing,
              briefing,
              thumbnailConcept: generatedPackage?.thumbnailPrompt || data.outputs?.image?.finalPrompt || "",
              outlierNotes: "Use padrões de outliers: curiosidade clara, promessa específica, contraste e busca orgânica.",
              research: useResearch,
              count: 10,
              projectId: data.projectId,
              locale,
              saveToAssets: true,
            }),
          });
          const titles = (await titleResponse.json()) as TitleResponse;
          if (!titleResponse.ok || titles.error) throw new Error(titles.details || titles.error || "Falha ao gerar títulos.");
          latestTitleResult = titles;
          setTitleResult(latestTitleResult);
        } catch (titleError) {
          setModuleErrors((current) => [
            ...current,
            titleError instanceof Error ? titleError.message : "Falha ao gerar títulos.",
          ]);
        }
      }

      if (generateCaptions) {
        if (!generatedPackage?.script) {
          setModuleErrors((current) => [...current, "Legendas não foram geradas: o pacote não retornou roteiro."]);
        } else {
          try {
            const captionResponse = await fetch("/api/generate/captions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                script: generatedPackage.script,
                topic: briefing,
                title: generatedPackage.selectedTitle || generatedPackage.title,
                pattern: captionPattern,
                creatorProfile: { ...creatorProfile, language: creatorProfile.language === "auto" ? locale : creatorProfile.language },
                projectId: data.projectId,
                locale,
                saveToAssets: true,
              }),
            });
            const captionData = (await captionResponse.json()) as CaptionResponse;
            if (!captionResponse.ok || captionData.error) {
              throw new Error(captionData.details || captionData.error || "Falha ao gerar legendas.");
            }
            latestCaptionResult = captionData;
            setCaptionResult(latestCaptionResult);
          } catch (captionError) {
            setModuleErrors((current) => [
              ...current,
              captionError instanceof Error ? captionError.message : "Falha ao gerar legendas.",
            ]);
          }
        }
      }

      try {
        const packageTitleCandidates = normalizeTitleCandidates(generatedPackage?.titleCandidates);
        const packageTopCandidates = normalizeTitleCandidates(generatedPackage?.topTitleCandidates);
        const critiqueResponse = await fetch("/api/critique/package", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: generatedPackage?.title,
            selectedTitle: latestTitleResult?.top3?.[0]?.title || generatedPackage?.selectedTitle || generatedPackage?.title,
            script: generatedPackage?.script,
            description: generatedPackage?.description,
            thumbnailPrompt: generatedPackage?.thumbnailPrompt || data.outputs?.image?.finalPrompt || "",
            thumbnailText: generatedPackage?.thumbnailText || "",
            titleCandidates: latestTitleResult?.candidates || packageTitleCandidates,
            topTitleCandidates: latestTitleResult?.top3 || packageTopCandidates,
            captions: latestCaptionResult?.captions ?? [],
            projectId: data.projectId,
            saveToAssets: true,
          }),
        });
        const critiqueData = (await critiqueResponse.json()) as CritiqueResponse;
        if (!critiqueResponse.ok || critiqueData.error) {
          throw new Error(critiqueData.details || critiqueData.error || "Falha ao criticar pacote.");
        }
        setCritiqueResult(critiqueData);
      } catch (critiqueError) {
        setModuleErrors((current) => [
          ...current,
          critiqueError instanceof Error ? critiqueError.message : "Falha ao criticar pacote.",
        ]);
      }

      if (data.projectId) {
        try {
          const exportResponse = await fetch("/api/exports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId: data.projectId }),
          });
          const exportData = (await exportResponse.json()) as { ok?: boolean; export?: { id: string }; error?: string };
          if (!exportResponse.ok || !exportData.ok || !exportData.export?.id) {
            throw new Error(exportData.error || "Falha ao exportar pacote.");
          }
          setResult((current) => current ? { ...current, exportId: exportData.export!.id } : current);
        } catch (exportError) {
          setModuleErrors((current) => [
            ...current,
            exportError instanceof Error ? exportError.message : "Falha ao exportar pacote.",
          ]);
        }
      }
    } catch (pipelineError) {
      setError(pipelineError instanceof Error ? pipelineError.message : "Não foi possível gerar o pacote.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex h-full min-h-0 flex-1 overflow-hidden bg-transparent text-[#F5F2F4]">
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-[64px] shrink-0 flex-col items-stretch gap-3 border-b border-[rgba(255,255,255,0.07)] px-4 py-3 md:flex-row md:items-center md:justify-between md:px-9 xl:px-10">
          <div className="flex min-w-0 items-center gap-3 pl-12 md:pl-0">
            <h1 className="text-[23px] font-bold tracking-[-0.02em] text-[#F5F2F4]">Pipeline</h1>
            <ChevronRight className="hidden h-4 w-4 text-[#5F6472] sm:block" strokeWidth={1.7} />
            <span className="truncate text-[15px] text-[#A0A3AD]">Content Package</span>
          </div>
          <div className="flex items-center justify-end gap-2 md:gap-4">
            {result?.exportId ? (
              <a
                href={`/api/exports/${result.exportId}/download`}
                className="hidden h-10 items-center gap-2 rounded-[8px] border border-[rgba(255,255,255,0.07)] bg-white/[0.025] px-5 text-[14px] font-semibold text-[#F5F2F4] transition hover:bg-white/[0.05] sm:flex"
              >
                <Download className="h-4 w-4 text-[#A0A3AD]" strokeWidth={1.7} />
                Export
              </a>
            ) : null}
            <button
              type="button"
              onClick={runPipeline}
              disabled={loading}
              className="flex h-10 items-center gap-2 rounded-[8px] bg-[#D06FA7] px-5 text-[14px] font-semibold text-[#F9F5F8] transition hover:brightness-110 disabled:opacity-55 md:px-7"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" strokeWidth={1.8} />}
              {loading ? "Gerando" : "Gerar pacote"}
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto xl:grid-cols-[300px_minmax(580px,1fr)_454px] xl:overflow-hidden">
          <aside className="relative h-full border-r border-[rgba(255,255,255,0.07)] px-11 py-12">
            <ol className="space-y-8">
              <StepBadge index={1} label="Briefing" done={Boolean(result)} active={!result} />
              <StepBadge index={2} label="Roteiro" done={Boolean(packageData?.script)} active={loading} />
              <StepBadge index={3} label="Títulos" done={Boolean(topTitles.length)} active={loading && generateTitles} />
              <StepBadge index={4} label="Thumbnail" done={Boolean(thumbnailUrl)} active={loading && generateThumbnail} />
              <StepBadge index={5} label="Legendas" done={Boolean(captions.length)} active={loading && generateCaptions} />
              <StepBadge index={6} label="Crítica" done={Boolean(critique)} active={loading} />
              <StepBadge index={7} label="Exportação" done={Boolean(result?.exportId)} />
            </ol>
          </aside>

          <main className="min-h-0 min-w-0 overflow-y-auto px-8 py-8 xl:px-14">
            <div className="mx-auto max-w-[980px]">
              <h2 className="text-[28px] font-bold tracking-[-0.025em] text-[#F5F2F4]">Pacote de conteúdo</h2>
              <p className="mt-3 text-[15px] leading-6 text-[#A0A3AD]">
                Um briefing gera roteiro, títulos, thumbnail e export. Legendas entram quando o padrão estiver preenchido.
              </p>

              <Panel className="mt-6 px-6 py-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <label htmlFor="package-briefing" className="text-[14px] font-medium text-[#F5F2F4]">
                    Briefing
                  </label>
                  <Sparkles className="mt-1 h-5 w-5 text-[#D06FA7]" strokeWidth={1.7} />
                </div>
                <textarea
                  id="package-briefing"
                  value={briefing}
                  onChange={(event) => setBriefing(event.target.value.slice(0, 4000))}
                  maxLength={4000}
                  className="h-[150px] w-full resize-y bg-transparent text-[14px] leading-6 text-[#F5F2F4] placeholder:text-[#5F6472] focus-visible:outline-none"
                  placeholder="Tema, audiência, tom, promessa do vídeo e restrições..."
                />
                <div className="mt-5 flex flex-col gap-4 border-t border-[rgba(255,255,255,0.07)] pt-5">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <label className="flex items-center gap-3 text-[13px] text-[#A0A3AD]">
                      <input
                        type="checkbox"
                        checked={generateTitles}
                        onChange={(event) => setGenerateTitles(event.target.checked)}
                        className="h-4 w-4 accent-[#D06FA7]"
                      />
                      Gerar 10 títulos e top 3
                    </label>
                    <label className="flex items-center gap-3 text-[13px] text-[#A0A3AD]">
                      <input
                        type="checkbox"
                        checked={generateThumbnail}
                        onChange={(event) => setGenerateThumbnail(event.target.checked)}
                        className="h-4 w-4 accent-[#D06FA7]"
                      />
                      Gerar thumbnail
                    </label>
                    <label className="flex items-center gap-3 text-[13px] text-[#A0A3AD]">
                      <input
                        type="checkbox"
                        checked={generateCaptions}
                        onChange={(event) => setGenerateCaptions(event.target.checked)}
                        className="h-4 w-4 accent-[#D06FA7]"
                      />
                      Gerar legendas
                    </label>
                    <label className="flex items-center gap-3 text-[13px] text-[#A0A3AD]">
                      <input
                        type="checkbox"
                        checked={useResearch}
                        onChange={(event) => setUseResearch(event.target.checked)}
                        className="h-4 w-4 accent-[#D06FA7]"
                      />
                      Pesquisar outliers
                    </label>
                  </div>

                  {generateCaptions ? (
                    <label className="block">
                      <span className="mb-2 block text-[12px] font-semibold text-[#F5F2F4]">Padrão de legenda</span>
                      <textarea
                        value={captionPattern}
                        onChange={(event) => setCaptionPattern(event.target.value.slice(0, 4000))}
                        rows={4}
                        className="w-full resize-y rounded-[9px] border border-[rgba(255,255,255,0.07)] bg-white/[0.025] px-4 py-3 text-[13px] leading-5 text-[#F5F2F4] placeholder:text-[#5F6472] focus-visible:border-[#D06FA7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D06FA7]/15"
                        placeholder="Opcional: ajuste o padrão SEO. Se ficar vazio, o padrão Lucas enviado será usado."
                      />
                    </label>
                  ) : null}

                  {generateCaptions ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      {[
                        ["tiktok", "TikTok", "/ perfil"],
                        ["instagram", "Instagram", "/ perfil"],
                        ["x", "Twitter / X", "https://x.com/..."],
                        ["primaryLinkUrl", "Link principal", "https://..."],
                        ["primaryLinkLabel", "Nome do link", "Link da ferramenta"],
                        ["businessEmail", "Contato comercial", "email@dominio.com"],
                      ].map(([key, label, placeholder]) => (
                        <label key={key} className="block">
                          <span className="mb-2 block text-[12px] font-semibold text-[#F5F2F4]">{label}</span>
                          <input
                            value={creatorProfile[key as keyof CreatorProfile]}
                            onChange={(event) => setCreatorProfile((current) => ({ ...current, [key]: event.target.value }))}
                            className="h-10 w-full rounded-[9px] border border-[rgba(255,255,255,0.07)] bg-white/[0.025] px-3 text-[13px] text-[#F5F2F4] placeholder:text-[#5F6472] focus-visible:border-[#D06FA7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D06FA7]/15"
                            placeholder={placeholder}
                          />
                        </label>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={runPipeline}
                    disabled={loading || !briefing.trim()}
                    className="flex h-10 min-w-[196px] items-center justify-center gap-2 rounded-[8px] bg-[#D06FA7] px-8 text-[14px] font-semibold text-[#F9F5F8] transition hover:brightness-110 disabled:opacity-55"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" strokeWidth={1.7} />}
                    {loading ? "Executando" : "Executar"}
                  </button>
                  </div>
                </div>
              </Panel>

              {error ? (
                <div className="mt-5 rounded-[12px] border border-red-400/20 bg-red-400/10 px-4 py-3 text-[13px] text-red-200">
                  {error}
                </div>
              ) : null}
              {moduleErrors.length ? (
                <div className="mt-5 rounded-[12px] border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-[13px] leading-5 text-amber-100">
                  {moduleErrors.map((message) => (
                    <p key={message}>{message}</p>
                  ))}
                </div>
              ) : null}

              <section className="mt-7">
                <div className="mb-3 flex items-center gap-3">
                  <Package className="h-5 w-5 text-[#D06FA7]" strokeWidth={1.7} />
                  <h2 className="text-[16px] font-semibold text-[#F5F2F4]">Resultado</h2>
                </div>

                <Panel className="overflow-hidden">
                  {!result ? (
                    <div className="grid min-h-[260px] place-items-center px-6 text-center">
                      <div>
                        <FileText className="mx-auto h-14 w-14 text-[#5F6472]" strokeWidth={1.35} />
                        <p className="mt-5 text-[14px] font-medium text-[#F5F2F4]">O pacote gerado aparecerá aqui.</p>
                        <p className="mt-2 text-[13px] text-[#A0A3AD]">Nada de mock: só aparece depois da chamada real.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
                      <div className="p-6">
                        <div className="mb-4 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#D06FA7]">
                          <Trophy className="h-4 w-4" />
                          Título selecionado
                        </div>
                        <h3 className="text-[22px] font-semibold leading-tight text-[#F5F2F4]">{selectedTitle}</h3>
                        {critique?.recommendedTitle && critique.recommendedTitle !== selectedTitle ? (
                          <div className="mt-4 rounded-[10px] border border-[#D06FA7]/25 bg-[#D06FA7]/10 p-4">
                            <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#D06FA7]">
                              Sugestão da crítica
                            </p>
                            <p className="mt-2 text-[14px] font-semibold leading-5 text-[#F5F2F4]">
                              {critique.recommendedTitle}
                            </p>
                            {critique.recommendedTitleReason ? (
                              <p className="mt-2 text-[12px] leading-5 text-[#A0A3AD]">
                                {critique.recommendedTitleReason}
                              </p>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => setSelectedTitleOverride(critique.recommendedTitle || "")}
                              className="mt-3 h-9 rounded-[8px] border border-[#D06FA7]/30 px-3 text-[12px] font-semibold text-[#F5F2F4] transition hover:bg-[#D06FA7]/15"
                            >
                              Usar título sugerido
                            </button>
                          </div>
                        ) : null}
                        {packageData?.description ? (
                          <p className="mt-4 text-[13px] leading-6 text-[#A0A3AD]">{packageData.description}</p>
                        ) : null}
                        {topTitles.length ? (
                          <div className="mt-5 rounded-[10px] border border-[rgba(255,255,255,0.07)] bg-white/[0.025] p-4">
                            <p className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-[#F5F2F4]">
                              <Trophy className="h-4 w-4 text-[#D06FA7]" />
                              Top 3 títulos CTR/SEO
                            </p>
                            <ol className="space-y-3 text-[13px] leading-5 text-[#A0A3AD]">
                              {topTitles.map((candidate, index) => (
                                <li key={`${candidate.title}-${index}`} className="flex gap-3">
                                  <span className="text-[#D06FA7]">{index + 1}</span>
                                  <span>
                                    <strong className="font-semibold text-[#F5F2F4]">{candidate.title}</strong>
                                    {candidate.reason ? <span className="block text-[12px] text-[#A0A3AD]">{candidate.reason}</span> : null}
                                  </span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        ) : null}
                        <div className="mt-6 rounded-[10px] border border-[rgba(255,255,255,0.07)] bg-white/[0.025] p-4">
                          <p className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-[#F5F2F4]">
                            <FileText className="h-4 w-4 text-[#D06FA7]" />
                            Roteiro
                          </p>
                          <p className="max-h-[320px] overflow-y-auto whitespace-pre-wrap text-[13px] leading-6 text-[#A0A3AD]">
                            {packageData?.script || "Sem script retornado."}
                          </p>
                        </div>
                        {captions.length ? (
                          <div className="mt-6 rounded-[10px] border border-[rgba(255,255,255,0.07)] bg-white/[0.025] p-4">
                            <p className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-[#F5F2F4]">
                              <Captions className="h-4 w-4 text-[#D06FA7]" />
                              Legendas
                            </p>
                            <div className="max-h-[240px] space-y-3 overflow-y-auto text-[13px] leading-6 text-[#A0A3AD]">
                              {captions.map((caption, index) => (
                                <p key={`${caption}-${index}`} className="whitespace-pre-wrap">
                                  {caption}
                                </p>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <aside className="border-t border-[rgba(255,255,255,0.07)] p-6 lg:border-l lg:border-t-0">
                        <div className="mb-4 flex items-center gap-2 text-[13px] font-semibold text-[#F5F2F4]">
                          <ImageIcon className="h-4 w-4 text-[#D06FA7]" />
                          Thumbnail
                        </div>
                        <div className="relative aspect-video overflow-hidden rounded-[12px] border border-[rgba(255,255,255,0.07)] bg-[#10121a]">
                          {thumbnailUrl ? (
                            <Image src={thumbnailUrl} alt="Thumbnail gerada" fill className="object-cover" unoptimized />
                          ) : (
                            <div className="grid h-full place-items-center text-[12px] text-[#5F6472]">Sem imagem gerada</div>
                          )}
                        </div>
                        <p className="mt-4 max-h-[120px] overflow-y-auto text-[12px] leading-5 text-[#A0A3AD]">
                          {packageData?.thumbnailPrompt || result.outputs?.image?.finalPrompt || "Sem prompt de thumbnail."}
                        </p>
                        {tags.length ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {tags.map((tag) => (
                              <span key={tag} className="rounded-[7px] border border-[rgba(255,255,255,0.07)] bg-white/[0.025] px-2 py-1 text-[11px] text-[#A0A3AD]">
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </aside>
                    </div>
                  )}
                </Panel>
              </section>
            </div>
          </main>

          <aside className="min-w-0 space-y-3.5 px-5 pb-8 xl:overflow-y-auto xl:px-6 xl:py-7">
            <Panel className="p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[15px] font-semibold leading-none text-[#F5F2F4]">Crítica do pacote</h2>
                  <p className="mt-2 text-[12px] leading-5 text-[#A0A3AD]">
                    Checa se título, thumbnail e roteiro vendem a mesma promessa.
                  </p>
                </div>
                <span className="rounded-full border border-[#D06FA7]/25 px-2 py-1 text-[12px] font-semibold text-[#D06FA7]">
                  {critique ? `${critique.cohesionScore}/100` : "--"}
                </span>
              </div>
              {critique ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {critique.scores.map((score) => (
                      <div key={score.key} className="rounded-[9px] border border-[rgba(255,255,255,0.07)] bg-white/[0.025] p-3">
                        <p className="text-[11px] text-[#A0A3AD]">{score.label}</p>
                        <p className="mt-1 text-[16px] font-semibold text-[#F5F2F4]">{score.score}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {critique.issues.slice(0, 4).map((issue, index) => (
                      <div
                        key={`${issue.area}-${index}`}
                        className={[
                          "rounded-[9px] border px-3 py-2 text-[12px] leading-5",
                          issue.severity === "critical"
                            ? "border-red-400/20 bg-red-400/10 text-red-100"
                            : issue.severity === "warning"
                              ? "border-amber-300/20 bg-amber-300/10 text-amber-100"
                              : "border-[rgba(255,255,255,0.07)] bg-white/[0.025] text-[#A0A3AD]",
                        ].join(" ")}
                      >
                        <p>{issue.message}</p>
                        {issue.recommendation ? <p className="mt-1 opacity-80">{issue.recommendation}</p> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[13px] leading-6 text-[#A0A3AD]">
                  A crítica aparece depois da geração do pacote.
                </p>
              )}
            </Panel>
            <Panel className="p-5">
              <h2 className="mb-4 text-[15px] font-semibold leading-none text-[#F5F2F4]">Módulos do pacote</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-[13px] leading-5 text-[#A0A3AD]">
                  <TextCursorInput className="mt-0.5 h-4 w-4 shrink-0 text-[#D06FA7]" />
                  10 títulos CTR/SEO com ranking top 3
                </div>
                <div className="flex items-start gap-3 text-[13px] leading-5 text-[#A0A3AD]">
                  <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#D06FA7]" />
                  Thumbnail gerada junto do título escolhido
                </div>
                <div className="flex items-start gap-3 text-[13px] leading-5 text-[#A0A3AD]">
                  <Captions className="mt-0.5 h-4 w-4 shrink-0 text-[#D06FA7]" />
                  Legendas quando o padrão Lucas estiver preenchido
                </div>
              </div>
            </Panel>
            <Panel className="p-5">
              <h2 className="mb-4 text-[15px] font-semibold leading-none text-[#F5F2F4]">Storage</h2>
              <p className="text-[13px] leading-6 text-[#A0A3AD]">
                Cada execução salva assets e export em `.open-studio/`, com imagem e JSON/MD do pacote.
              </p>
            </Panel>
          </aside>
        </div>
      </div>
    </div>
  );
}

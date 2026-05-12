"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  Captions,
  Copy,
  FileText,
  Loader2,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import type { Locale } from "@/lib/locales";

type TitleCandidate = {
  title: string;
  score?: number;
  reason?: string;
  ctrAngle?: string;
  seoKeywords?: string[];
};

type TitleResponse = {
  ok: boolean;
  candidates?: TitleCandidate[];
  top3?: TitleCandidate[];
  error?: string;
  details?: string;
};

type CaptionResponse = {
  ok: boolean;
  captions?: string[];
  notes?: string[];
  hashtags?: string[];
  keywords?: string[];
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

type TitleAsset = {
  title: string;
  description: string;
  content?: string;
  sourceModule?: string;
  metadata?: Record<string, unknown>;
};

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[14px] border border-line bg-card shadow-[0_18px_60px_rgba(0,0,0,0.18)] ${className}`}>
      {children}
    </section>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-2 block text-[12px] font-semibold text-ink">{children}</span>;
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={rows}
      className="w-full resize-y rounded-[9px] border border-line bg-card-hi px-4 py-3 text-[14px] leading-6 text-ink placeholder:text-ink-3 transition hover:border-line-hi focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/15"
      placeholder={placeholder}
    />
  );
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

function stringMetadata(metadata: Record<string, unknown> | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : "";
}

function parseStoredTitlePack(asset: TitleAsset): TitleResponse | null {
  if (!asset.content) return null;
  try {
    const parsed = JSON.parse(asset.content) as TitleResponse;
    return {
      ok: true,
      candidates: Array.isArray(parsed.candidates) ? parsed.candidates : [],
      top3: Array.isArray(parsed.top3) ? parsed.top3 : [],
    };
  } catch {
    return null;
  }
}

export default function ContentToolsPage() {
  const { locale } = useT();
  const [topic, setTopic] = useState("Como usar IA local para criar conteúdo sem depender de uma única API");
  const [briefing, setBriefing] = useState("");
  const [thumbnailConcept, setThumbnailConcept] = useState("");
  const [outlierNotes, setOutlierNotes] = useState("");
  const [useResearch, setUseResearch] = useState(false);
  const [script, setScript] = useState("");
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
  const [loadingTitles, setLoadingTitles] = useState(false);
  const [loadingCaptions, setLoadingCaptions] = useState(false);
  const [titleResult, setTitleResult] = useState<TitleResponse | null>(null);
  const [captionResult, setCaptionResult] = useState<CaptionResponse | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadLatestTitlePack() {
      try {
        const response = await fetch("/api/assets?type=prompt&limit=25");
        const data = (await response.json()) as { ok?: boolean; assets?: TitleAsset[] };
        const asset = data.assets?.find((item) => item.sourceModule === "title-generator");
        if (!asset) return;
        const parsed = parseStoredTitlePack(asset);
        if (!parsed) return;
        setTitleResult(parsed);
        setTopic(stringMetadata(asset.metadata, "topic") || asset.title.replace(/^Title Pack - /, ""));
        setBriefing(stringMetadata(asset.metadata, "briefing") || asset.description || "");
        setThumbnailConcept(stringMetadata(asset.metadata, "thumbnailConcept"));
        setOutlierNotes(stringMetadata(asset.metadata, "outlierNotes"));
      } catch {
        // Loading the latest saved package is a convenience; generation still works without it.
      }
    }

    void loadLatestTitlePack();
  }, []);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1800);
  }

  async function generateTitles() {
    if (!topic.trim()) {
      setError("Informe o tema do vídeo antes de gerar títulos.");
      return;
    }

    setError("");
    setLoadingTitles(true);
    try {
      const response = await fetch("/api/generate/titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          briefing,
          thumbnailConcept,
          outlierNotes,
          research: useResearch,
          count: 10,
          locale,
          saveToAssets: true,
        }),
      });
      const data = (await response.json()) as TitleResponse;
      if (!response.ok || data.error) throw new Error(data.details || data.error || "Não foi possível gerar títulos.");
      setTitleResult(data);
      flash("Títulos gerados");
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Não foi possível gerar títulos.");
    } finally {
      setLoadingTitles(false);
    }
  }

  async function generateCaptions() {
    if (!script.trim()) {
      setError("Cole um roteiro antes de gerar legendas.");
      return;
    }

    setError("");
    setLoadingCaptions(true);
    try {
      const response = await fetch("/api/generate/captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script,
          topic,
          title: titleResult?.top3?.[0]?.title || topic,
          pattern: captionPattern,
          creatorProfile: { ...creatorProfile, language: creatorProfile.language === "auto" ? locale : creatorProfile.language },
          locale,
          saveToAssets: true,
        }),
      });
      const data = (await response.json()) as CaptionResponse;
      if (!response.ok || data.error) throw new Error(data.details || data.error || "Não foi possível gerar legendas.");
      setCaptionResult(data);
      flash("Legendas geradas");
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Não foi possível gerar legendas.");
    } finally {
      setLoadingCaptions(false);
    }
  }

  const top3 = titleResult?.top3 ?? [];
  const allTitles = titleResult?.candidates ?? [];
  const captions = captionResult?.captions ?? [];
  const captionKeywords = captionResult?.keywords ?? [];

  return (
    <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-canvas text-ink">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-7 2xl:px-10">
        <header className="pl-12 md:pl-0">
          <h1 className="text-[27px] font-bold leading-tight tracking-[-0.03em] text-ink">Títulos e legendas</h1>
          <p className="mt-2 max-w-[70ch] text-[14px] leading-6 text-ink-2">
            Gere o pacote textual que acompanha o vídeo: títulos com foco em CTR/SEO e legendas quando o padrão estiver definido.
          </p>
        </header>

        {(notice || error) ? (
          <div className={`rounded-[10px] border px-4 py-3 text-[13px] ${error ? "border-danger/25 bg-danger-soft text-danger" : "border-accent/20 bg-accent-soft text-accent-hi"}`}>
            {error || notice}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-5">
            <Panel className="p-5 sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[17px] font-semibold text-ink">Gerar 10 títulos</h2>
                  <p className="mt-2 max-w-[70ch] text-[13px] leading-5 text-ink-2">
                    Use tema, briefing, conceito visual e sinais de outlier. O resultado destaca as 3 melhores opções.
                  </p>
                </div>
                <Trophy className="mt-1 h-5 w-5 shrink-0 text-accent" />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block md:col-span-2">
                  <FieldLabel>Tema do vídeo</FieldLabel>
                  <input
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    className="h-11 w-full rounded-[9px] border border-line bg-card-hi px-4 text-[14px] text-ink placeholder:text-ink-3 transition hover:border-line-hi focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/15"
                    placeholder="Tema principal do vídeo"
                  />
                </label>

                <label className="block">
                  <FieldLabel>Briefing</FieldLabel>
                  <Textarea
                    value={briefing}
                    onChange={setBriefing}
                    rows={5}
                    placeholder="Promessa, audiência, ângulo do vídeo e restrições."
                  />
                </label>

                <label className="block">
                  <FieldLabel>Thumbnail imaginada</FieldLabel>
                  <Textarea
                    value={thumbnailConcept}
                    onChange={setThumbnailConcept}
                    rows={5}
                    placeholder="Pessoa, emoção, texto na tela, objeto principal, contraste visual."
                  />
                </label>

                <label className="block md:col-span-2">
                  <FieldLabel>Outliers ou referências</FieldLabel>
                  <Textarea
                    value={outlierNotes}
                    onChange={setOutlierNotes}
                    rows={4}
                    placeholder="Cole padrões de vídeos fora da curva, títulos de referência ou observações de CTR."
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-3 text-[13px] text-ink-2">
                  <input
                    type="checkbox"
                    checked={useResearch}
                    onChange={(event) => setUseResearch(event.target.checked)}
                    className="h-4 w-4 accent-accent"
                  />
                  Pesquisar outliers com Tavily
                </label>
                <button
                  type="button"
                  onClick={generateTitles}
                  disabled={loadingTitles || !topic.trim()}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-accent px-6 text-[13px] font-semibold text-accent-fg transition hover:bg-accent-hi disabled:opacity-45"
                >
                  {loadingTitles ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {loadingTitles ? "Gerando" : "Gerar títulos"}
                </button>
              </div>
            </Panel>

            <Panel className="p-5 sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[17px] font-semibold text-ink">Gerar legendas</h2>
                  <p className="mt-2 max-w-[70ch] text-[13px] leading-5 text-ink-2">
                    Gera a descrição/legenda SEO no padrão Lucas, adaptando hashtags, palavras-chave, CTA e redes sociais ao roteiro.
                  </p>
                </div>
                <Captions className="mt-1 h-5 w-5 shrink-0 text-accent" />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block">
                  <FieldLabel>Roteiro</FieldLabel>
                  <Textarea value={script} onChange={setScript} rows={8} placeholder="Cole o roteiro que será transformado em legendas." />
                </label>

                <label className="block">
                  <FieldLabel>Padrão de legenda</FieldLabel>
                  <Textarea value={captionPattern} onChange={setCaptionPattern} rows={8} placeholder="Opcional: ajuste o padrão SEO. Se ficar vazio, o padrão Lucas enviado será usado." />
                </label>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="block">
                  <FieldLabel>TikTok</FieldLabel>
                  <input
                    value={creatorProfile.tiktok}
                    onChange={(event) => setCreatorProfile((current) => ({ ...current, tiktok: event.target.value }))}
                    className="h-11 w-full rounded-[9px] border border-line bg-card-hi px-4 text-[14px] text-ink placeholder:text-ink-3 transition hover:border-line-hi focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/15"
                    placeholder="/ seu.perfil"
                  />
                </label>
                <label className="block">
                  <FieldLabel>Instagram</FieldLabel>
                  <input
                    value={creatorProfile.instagram}
                    onChange={(event) => setCreatorProfile((current) => ({ ...current, instagram: event.target.value }))}
                    className="h-11 w-full rounded-[9px] border border-line bg-card-hi px-4 text-[14px] text-ink placeholder:text-ink-3 transition hover:border-line-hi focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/15"
                    placeholder="/ seu.perfil"
                  />
                </label>
                <label className="block">
                  <FieldLabel>Twitter / X</FieldLabel>
                  <input
                    value={creatorProfile.x}
                    onChange={(event) => setCreatorProfile((current) => ({ ...current, x: event.target.value }))}
                    className="h-11 w-full rounded-[9px] border border-line bg-card-hi px-4 text-[14px] text-ink placeholder:text-ink-3 transition hover:border-line-hi focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/15"
                    placeholder="https://x.com/..."
                  />
                </label>
                <label className="block">
                  <FieldLabel>Link principal</FieldLabel>
                  <input
                    value={creatorProfile.primaryLinkUrl}
                    onChange={(event) => setCreatorProfile((current) => ({ ...current, primaryLinkUrl: event.target.value }))}
                    className="h-11 w-full rounded-[9px] border border-line bg-card-hi px-4 text-[14px] text-ink placeholder:text-ink-3 transition hover:border-line-hi focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/15"
                    placeholder="https://..."
                  />
                </label>
                <label className="block">
                  <FieldLabel>Nome do link</FieldLabel>
                  <input
                    value={creatorProfile.primaryLinkLabel}
                    onChange={(event) => setCreatorProfile((current) => ({ ...current, primaryLinkLabel: event.target.value }))}
                    className="h-11 w-full rounded-[9px] border border-line bg-card-hi px-4 text-[14px] text-ink placeholder:text-ink-3 transition hover:border-line-hi focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/15"
                    placeholder="Link da ferramenta"
                  />
                </label>
                <label className="block">
                  <FieldLabel>Contato comercial</FieldLabel>
                  <input
                    value={creatorProfile.businessEmail}
                    onChange={(event) => setCreatorProfile((current) => ({ ...current, businessEmail: event.target.value }))}
                    className="h-11 w-full rounded-[9px] border border-line bg-card-hi px-4 text-[14px] text-ink placeholder:text-ink-3 transition hover:border-line-hi focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/15"
                    placeholder="email@dominio.com"
                  />
                </label>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={generateCaptions}
                  disabled={loadingCaptions || !script.trim()}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-accent px-6 text-[13px] font-semibold text-accent-fg transition hover:bg-accent-hi disabled:opacity-45"
                >
                  {loadingCaptions ? <Loader2 className="h-4 w-4 animate-spin" /> : <Captions className="h-4 w-4" />}
                  {loadingCaptions ? "Gerando" : "Gerar legendas"}
                </button>
              </div>
            </Panel>
          </div>

          <aside className="space-y-5">
            <Panel className="p-5">
              <h2 className="mb-4 flex items-center gap-2 text-[16px] font-semibold text-ink">
                <BadgeCheck className="h-4 w-4 text-accent" />
                Top 3 títulos
              </h2>
              {top3.length ? (
                <div className="space-y-3">
                  {top3.map((candidate, index) => (
                    <article key={`${candidate.title}-${index}`} className="rounded-[10px] border border-line bg-card-hi p-3">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <p className="text-[13px] font-semibold leading-5 text-ink">{candidate.title}</p>
                        <span className="shrink-0 rounded-[7px] bg-accent/10 px-2 py-1 text-[11px] font-semibold text-accent">
                          {candidate.score ?? 0}
                        </span>
                      </div>
                      {candidate.reason ? <p className="text-[12px] leading-5 text-ink-2">{candidate.reason}</p> : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] leading-5 text-ink-2">Os 3 melhores títulos aparecem aqui depois da geração.</p>
              )}
            </Panel>

            <Panel className="p-5">
              <h2 className="mb-4 flex items-center gap-2 text-[16px] font-semibold text-ink">
                <FileText className="h-4 w-4 text-accent" />
                Lista completa
              </h2>
              {allTitles.length ? (
                <ol className="space-y-2">
                  {allTitles.map((candidate, index) => (
                    <li key={`${candidate.title}-${index}`} className="flex gap-3 rounded-[8px] px-2 py-2 text-[12px] leading-5 text-ink-2 hover:bg-hover">
                      <span className="w-5 shrink-0 text-right text-ink-3">{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => void copyText(candidate.title).then(() => flash("Título copiado"))}
                        className="min-w-0 text-left transition hover:text-ink"
                        title="Copiar título"
                      >
                        {candidate.title}
                      </button>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-[13px] leading-5 text-ink-2">Nenhum título gerado ainda.</p>
              )}
            </Panel>

            <Panel className="p-5">
              <h2 className="mb-4 flex items-center gap-2 text-[16px] font-semibold text-ink">
                <Captions className="h-4 w-4 text-accent" />
                Legendas
              </h2>
              {captions.length ? (
                <div className="space-y-3">
                  {captionKeywords.length ? (
                    <p className="rounded-[8px] border border-line bg-card-hi px-3 py-2 text-[12px] leading-5 text-ink-2">
                      Keywords: {captionKeywords.slice(0, 10).join(", ")}
                    </p>
                  ) : null}
                  {captions.map((caption, index) => (
                    <article key={`${caption}-${index}`} className="rounded-[10px] border border-line bg-card-hi p-3">
                      <p className="whitespace-pre-wrap text-[12px] leading-5 text-ink-2">{caption}</p>
                      <button
                        type="button"
                        onClick={() => void copyText(caption).then(() => flash("Legenda copiada"))}
                        className="mt-3 inline-flex items-center gap-2 text-[12px] font-semibold text-accent transition hover:text-accent-hi"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copiar
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] leading-5 text-ink-2">As legendas aparecem aqui quando o padrão estiver preenchido.</p>
              )}
            </Panel>
          </aside>
        </div>
      </div>
    </main>
  );
}

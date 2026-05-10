"use client";

import { useState } from "react";

interface PipelineData {
  detected_requirements: string[];
  script: string;
  thumbnail_prompt: string;
  thumbnail_text: string;
  thumbnail_final_prompt: string;
  thumbnail_image_url: string;
  thumbnail_image_base64: string;
  thumbnail_error: string;
  music_prompt: string;
  music_audio_url: string;
  music_audio_raw: string;
  music_error: string;
  compliance_check: Array<{ item: string; status: string; notes: string }>;
  missing_requirements: string[];
  assumptions: string[];
}

type LoadingStep = "briefing" | "script" | "thumbnail" | "music" | "checklist";

const LOADING_STEPS: { key: LoadingStep; label: string }[] = [
  { key: "briefing", label: "Analizando briefing con el proveedor de texto configurado..." },
  { key: "script", label: "Generando guion..." },
  { key: "thumbnail", label: "Generando imagen con configured image provider..." },
  { key: "music", label: "Generando música con configured music provider..." },
  { key: "checklist", label: "Verificando checklist..." },
];

export function Dashboard() {
  const [briefing, setBriefing] = useState("");
  const [result, setResult] = useState("");
  const [parsedData, setParsedData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<LoadingStep>("briefing");

  async function handleGenerate() {
    try {
      setLoading(true);
      setResult("");
      setParsedData(null);
      setLoadingStep("briefing");

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ briefing }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult(data.error || "Error generating pipeline.");
        return;
      }

      setParsedData(data as PipelineData);
    } catch {
      setResult("Something went wrong.");
    } finally {
      setLoading(false);
      setLoadingStep("briefing");
    }
  }

  const currentStepIndex = LOADING_STEPS.findIndex((s) => s.key === loadingStep);

  const hasValidAudioUrl = (url: string) =>
    typeof url === "string" && url.trim().startsWith("http");

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-neutral-950 to-slate-950 text-neutral-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Principal */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Content Pipeline Dashboard
            </span>
          </h1>
          <p className="mt-2 text-sm text-neutral-400 max-w-lg mx-auto">
            Convierte un briefing en guion, thumbnail y vinheta usando tus proveedores configurados
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          {/* COLUNA ESQUERDA - INPUT */}
          <div className="space-y-6">
            {/* Card de Input */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-6 shadow-2xl shadow-black/20">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <label
                  htmlFor="briefing"
                  className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500"
                >
                  Briefing
                </label>
              </div>

              <textarea
                id="briefing"
                value={briefing}
                onChange={(e) => setBriefing(e.target.value)}
                placeholder="Pega aquí el briefing completo del vídeo..."
                className="w-full min-h-[14rem] rounded-xl border border-white/[0.08] bg-neutral-900/40 px-5 py-4 text-sm text-neutral-100 placeholder:text-neutral-600 outline-none transition-all duration-200 focus:border-indigo-500/50 focus:bg-neutral-900/60 focus:shadow-lg focus:shadow-indigo-500/5 resize-y leading-relaxed"
              />

              <button
                onClick={handleGenerate}
                disabled={loading || !briefing.trim()}
                className="mt-5 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-900/30 transition-all duration-200 hover:from-indigo-500 hover:via-violet-500 hover:to-purple-500 hover:shadow-2xl hover:shadow-indigo-800/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:shadow-none disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-[2.5px] border-white/20 border-t-white" />
                    <span>Generando pipeline...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                    <span>Generar pipeline</span>
                  </>
                )}
              </button>
            </div>

            {/* Pipeline Visual */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-6 shadow-2xl shadow-black/20">
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-neutral-600">
                Pipeline de Producción
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <PipelineStep label="Briefing" />
                <PipelineArrow />
                <PipelineStep label="M2.7" highlight />
                <PipelineArrow />
                <PipelineStep label="Guion" />
                <PipelineArrow />
                <PipelineStep label="Image" />
                <PipelineArrow />
                <PipelineStep label="Music" />
                <PipelineArrow />
                <PipelineStep label="Checklist" />
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA - RESULTADOS */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-6 shadow-2xl shadow-black/20 min-h-[20rem]">
              {/* Header dos Resultados */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">
                    Resultados
                  </h2>
                </div>

                {loading && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-300">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-300/20 border-t-indigo-300" />
                    Generando pipeline...
                  </span>
                )}
              </div>

              {/* Loading Timeline */}
              {loading && (
                <div className="mb-6 space-y-3">
                  {LOADING_STEPS.map((step, idx) => {
                    const isActive = idx === currentStepIndex;
                    const isDone = idx < currentStepIndex;
                    return (
                      <div
                        key={step.key}
                        className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-300 ${
                          isActive
                            ? "border-indigo-500/30 bg-indigo-500/10"
                            : isDone
                            ? "border-emerald-500/20 bg-emerald-500/5"
                            : "border-white/[0.04] bg-white/[0.02] opacity-50"
                        }`}
                      >
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            isActive
                              ? "bg-indigo-500/20 text-indigo-400"
                              : isDone
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-white/5 text-neutral-600"
                          }`}
                        >
                          {isDone ? "✓" : idx + 1}
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            isActive
                              ? "text-indigo-300"
                              : isDone
                              ? "text-emerald-300"
                              : "text-neutral-600"
                          }`}
                        >
                          {step.label}
                        </span>
                        {isActive && (
                          <span className="ml-auto inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-400/20 border-t-indigo-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Estado Vazio */}
              {!result && !parsedData && !loading && (
                <div className="flex h-64 flex-col items-center justify-center text-center">
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] shadow-lg">
                    <svg className="h-7 w-7 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                  </div>
                  <p className="text-sm text-neutral-500 font-medium">
                    Los resultados aparecerán aquí
                  </p>
                  <p className="text-xs text-neutral-600 mt-1">
                    Genera una pipeline para ver los assets
                  </p>
                </div>
              )}

              {/* Cards de Resultados */}
              {parsedData && (
                <div className="space-y-4">
                  {/* Requisitos Detectados */}
                  {parsedData.detected_requirements && parsedData.detected_requirements.length > 0 && (
                    <ResultCard title="Requisitos Detectados" icon="requisitos" color="amber">
                      <ul className="space-y-2">
                        {parsedData.detected_requirements.map((req, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0"></span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </ResultCard>
                  )}

                  {/* Guion */}
                  {parsedData.script && (
                    <ResultCard title="Guion" icon="guion" color="blue">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-300">
                        {parsedData.script}
                      </div>
                    </ResultCard>
                  )}

                  {/* Thumbnail Prompt */}
                  {parsedData.thumbnail_prompt && (
                    <ResultCard title="Thumbnail Prompt" icon="thumbnail" color="purple">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-300 mb-4">
                        {parsedData.thumbnail_prompt}
                      </div>

                      {/* Thumbnail Text */}
                      {parsedData.thumbnail_text && (
                        <div className="mb-4 rounded-lg border border-purple-500/20 bg-purple-500/5 px-4 py-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">Texto de la Thumbnail</p>
                          <p className="text-lg font-bold text-white">{parsedData.thumbnail_text}</p>
                        </div>
                      )}

                      {/* Thumbnail Image */}
                      {parsedData.thumbnail_image_url ? (
                        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                          <img
                            src={parsedData.thumbnail_image_url}
                            alt="Thumbnail generado"
                            className="w-full h-auto object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : parsedData.thumbnail_image_base64 ? (
                        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                          <img
                            src={`data:image/png;base64,${parsedData.thumbnail_image_base64}`}
                            alt="Thumbnail generado"
                            className="w-full h-auto object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : parsedData.thumbnail_error ? (
                        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-center">
                          <p className="text-xs text-rose-400 font-medium">Error al generar imagen</p>
                          <p className="text-xs text-rose-300/60 mt-1">{parsedData.thumbnail_error}</p>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
                          <svg className="mx-auto h-10 w-10 text-neutral-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                          <p className="text-xs text-neutral-500">configured image provider preview</p>
                        </div>
                      )}

                      {/* Final prompt */}
                      {parsedData.thumbnail_final_prompt && (
                        <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Prompt final enviado a configured image provider</p>
                          <p className="text-xs text-neutral-400 line-clamp-3">{parsedData.thumbnail_final_prompt}</p>
                        </div>
                      )}
                    </ResultCard>
                  )}

                  {/* Music Prompt */}
                  {parsedData.music_prompt && (
                    <ResultCard title="Música Prompt" icon="musica" color="emerald">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-300 mb-4">
                        {parsedData.music_prompt}
                      </div>

                      {/* Music Audio - only show player if valid URL */}
                      {hasValidAudioUrl(parsedData.music_audio_url) ? (
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                          <audio controls className="w-full" src={parsedData.music_audio_url}>
                            Tu navegador no soporta audio.
                          </audio>
                        </div>
                      ) : parsedData.music_error ? (
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
                          <p className="text-xs text-amber-400 font-medium">La música fue solicitada, pero la API no devolvió una URL de audio válida.</p>
                          <p className="text-xs text-amber-300/60 mt-1">{parsedData.music_error}</p>
                        </div>
                      ) : parsedData.music_audio_raw ? (
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
                          <p className="text-xs text-amber-400 font-medium">La música fue generada en formato raw, pero no es reproducible directamente.</p>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
                          <svg className="mx-auto h-10 w-10 text-neutral-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                          </svg>
                          <p className="text-xs text-neutral-500">configured music provider preview</p>
                        </div>
                      )}
                    </ResultCard>
                  )}

                  {/* Checklist */}
                  {parsedData.compliance_check && parsedData.compliance_check.length > 0 && (
                    <ResultCard title="Checklist" icon="checklist" color="rose">
                      <div className="space-y-3">
                        {parsedData.compliance_check.map((check, i) => (
                          <div key={i} className="flex items-start gap-3 rounded-lg bg-white/[0.03] p-3">
                            <span className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              check.status === "ok"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-amber-500/20 text-amber-400"
                            }`}>
                              {check.status === "ok" ? "✓" : "!"}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-neutral-200">{check.item}</p>
                              {check.notes && (
                                <p className="mt-0.5 text-xs text-neutral-500">{check.notes}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ResultCard>
                  )}

                  {/* Missing Requirements */}
                  {parsedData.missing_requirements && parsedData.missing_requirements.length > 0 && (
                    <ResultCard title="Requisitos Faltantes" icon="warning" color="orange">
                      <ul className="space-y-2">
                        {parsedData.missing_requirements.map((req, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0"></span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </ResultCard>
                  )}

                  {/* Assumptions */}
                  {parsedData.assumptions && parsedData.assumptions.length > 0 && (
                    <ResultCard title="Suposiciones" icon="idea" color="cyan">
                      <ul className="space-y-2">
                        {parsedData.assumptions.map((ass, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                            <span>{ass}</span>
                          </li>
                        ))}
                      </ul>
                    </ResultCard>
                  )}
                </div>
              )}

              {/* Fallback - Raw Response / Error */}
              {result && !parsedData && (
                <div className="space-y-4">
                  <ResultCard title="Error" icon="raw" color="slate">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-300 font-mono">
                      {result}
                    </div>
                  </ResultCard>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ─── Subcomponentes ─── */

function ResultCard({
  title,
  icon,
  color,
  children,
}: {
  title: string;
  icon: string;
  color: string;
  children: React.ReactNode;
}) {
  const colors: Record<string, { gradient: string; border: string; text: string }> = {
    amber: { gradient: "from-amber-500/10 to-orange-500/10", border: "border-amber-500/15", text: "text-amber-400" },
    blue: { gradient: "from-blue-500/10 to-cyan-500/10", border: "border-blue-500/15", text: "text-blue-400" },
    purple: { gradient: "from-purple-500/10 to-pink-500/10", border: "border-purple-500/15", text: "text-purple-400" },
    emerald: { gradient: "from-emerald-500/10 to-teal-500/10", border: "border-emerald-500/15", text: "text-emerald-400" },
    rose: { gradient: "from-rose-500/10 to-red-500/10", border: "border-rose-500/15", text: "text-rose-400" },
    orange: { gradient: "from-orange-500/10 to-amber-500/10", border: "border-orange-500/15", text: "text-orange-400" },
    cyan: { gradient: "from-cyan-500/10 to-sky-500/10", border: "border-cyan-500/15", text: "text-cyan-400" },
    slate: { gradient: "from-slate-500/10 to-gray-500/10", border: "border-slate-500/15", text: "text-slate-400" },
  };

  const c = colors[color] || colors.slate;

  return (
    <section className={`rounded-xl border bg-gradient-to-br ${c.gradient} ${c.border} p-5 transition-all duration-200 hover:shadow-lg hover:shadow-black/20`}>
      <div className={`flex items-center gap-3 mb-4 pb-3 border-b border-white/[0.06]`}>
        <div className={c.text}>{getIcon(icon)}</div>
        <h3 className={`text-sm font-bold uppercase tracking-wider ${c.text}`}>{title}</h3>
      </div>
      <div>{children}</div>
    </section>
  );
}

function getIcon(name: string) {
  const icons: Record<string, React.ReactNode> = {
    requisitos: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
    guion: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    thumbnail: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
    musica: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
      </svg>
    ),
    checklist: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    idea: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
    raw: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
  };

  return icons[name] || icons.raw;
}

function PipelineStep({ label, highlight }: { label: string; highlight?: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-4 py-2 text-xs font-bold tracking-wide",
        "border backdrop-blur-md transition-all duration-200",
        "shadow-lg",
        highlight
          ? "border-indigo-400/30 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 text-indigo-200 shadow-indigo-900/20"
          : "border-white/[0.08] bg-white/[0.03] text-neutral-400 hover:bg-white/[0.06] hover:text-neutral-300 shadow-black/10",
      ].join(" ")}
    >
      {highlight && (
        <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
      )}
      {label}
    </span>
  );
}

function PipelineArrow() {
  return (
    <span className="text-neutral-700">
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </svg>
    </span>
  );
}

"use client";

import { useState, useId, useEffect, useCallback, ReactNode } from "react";
import {
  ChevronDown,
  Loader2,
  Copy,
  Download,
  Check,
  Circle,
  Sparkles,
  FileText,
  Wand2,
  Pencil,
  RotateCcw,
  Save,
  X,
  ChevronRight,
  ArrowRight,
  Bell,
  CheckCircle2,
  ShieldCheck,
  Info,
} from "lucide-react";
import { useT } from "@/lib/i18n";

const DRAFT_KEY = "mm-script-draft";

const toneOptions = [
  { value: "Casual", labelKey: "scripts.tone.casual" },
  { value: "Professional", labelKey: "scripts.tone.professional" },
  { value: "Educational", labelKey: "scripts.tone.educational" },
  { value: "Entertaining", labelKey: "scripts.tone.entertaining" },
  { value: "Dramatic", labelKey: "scripts.tone.dramatic" },
  { value: "Inspirational", labelKey: "scripts.tone.inspirational" },
];
const audienceOptions = [
  { value: "General", labelKey: "scripts.audience.general" },
  { value: "Tech Enthusiasts", labelKey: "scripts.audience.tech" },
  { value: "Beginners", labelKey: "scripts.audience.beginners" },
  { value: "Professionals", labelKey: "scripts.audience.professionals" },
  { value: "Students", labelKey: "scripts.audience.students" },
  { value: "Creators", labelKey: "scripts.audience.creators" },
];
const languageOptions = [
  { value: "English", labelKey: "scripts.language.english" },
  { value: "Spanish (Spain)", labelKey: "scripts.language.spanishSpain" },
  { value: "Spanish (Latin America)", labelKey: "scripts.language.spanishLatam" },
  { value: "Portuguese", labelKey: "scripts.language.portuguese" },
  { value: "French", labelKey: "scripts.language.french" },
  { value: "German", labelKey: "scripts.language.german" },
];
const videoTypeOptions = [
  { value: "YouTube Video", labelKey: "scripts.videoType.youtube" },
  { value: "YouTube Short", labelKey: "scripts.videoType.short" },
  { value: "Tutorial", labelKey: "scripts.videoType.tutorial" },
  { value: "Product Review", labelKey: "scripts.videoType.review" },
  { value: "Listicle", labelKey: "scripts.videoType.listicle" },
  { value: "Vlog", labelKey: "scripts.videoType.vlog" },
];
const durationOptions = ["1-3 min", "3-5 min", "5-8 min", "8-10 min", "10-15 min", "15-20 min"];

interface DraftData {
  idea: string;
  tone: string;
  audience: string;
  language: string;
  videoType: string;
  duration: string;
  generated: Record<string, unknown> | null;
  activeStep: number;
}

function readDraft(): DraftData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as DraftData) : null;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------
// REUSABLE UI COMPONENTS (Dashboard Style)
// ------------------------------------------------------------------

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[14px] border border-[rgba(255,255,255,0.07)] bg-[#151516] ${className}`}>
      {children}
    </section>
  );
}

function PanelHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-[15px] font-semibold leading-none text-[#F5F2F4]">{title}</h2>
      {action ? (
        <button onClick={onAction} className="text-[12px] font-medium text-[#A0A3AD] transition hover:text-white">
          {action}
        </button>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------------
// MAIN PAGE COMPONENT
// ------------------------------------------------------------------

export default function ScriptGeneratorPage() {
  const { t } = useT();
  const gaugeId = useId();

  const [idea, setIdea] = useState(() => readDraft()?.idea ?? "");
  const [tone, setTone] = useState(() => readDraft()?.tone ?? "Casual");
  const [audience, setAudience] = useState(() => readDraft()?.audience ?? "Tech Enthusiasts");
  const [language, setLanguage] = useState(() => readDraft()?.language ?? "English");
  const [videoType, setVideoType] = useState(() => readDraft()?.videoType ?? "YouTube Video");
  const [duration, setDuration] = useState(() => readDraft()?.duration ?? "8-10 min");
  const [structure, setStructure] = useState("Hook → Intro → Main Content → Recap → CTA");
  const [cta, setCta] = useState("Subscribe and like");
  const [references, setReferences] = useState("");
  void setStructure;
  void setCta;
  void setReferences;

  const [loading, setLoading] = useState(false);
  const [improving, setImproving] = useState(false);
  const [activeStep, setActiveStep] = useState(() => readDraft()?.activeStep ?? 0);
  const [generated, setGenerated] = useState<Record<string, unknown> | null>(() => readDraft()?.generated ?? null);

  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    const draft: DraftData = { idea, tone, audience, language, videoType, duration, generated, activeStep };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [idea, tone, audience, language, videoType, duration, generated, activeStep]);

  const genScript = generated?.script ? String(generated.script) : "";
  const genTitle = generated?.title ? String(generated.title) : "";
  const genTags = (generated?.tags as string[]) ?? [];
  const genEstDuration = generated?.estimatedDuration ? String(generated.estimatedDuration) : duration;
  const genCta = generated?.cta ? String(generated.cta) : "";

  const stepsList = [
    t("scripts.stepBriefing"),
    t("scripts.stepStructure"),
    t("scripts.stepScript"),
    t("scripts.stepReview"),
  ];

  const buildBriefing = useCallback(() => {
    return `IDEA: ${idea}\nTARGET AUDIENCE: ${audience}\nLANGUAGE: ${language}\nTONE: ${tone}\nESTIMATED DURATION: ${duration}\nVIDEO TYPE: ${videoType}\nDESIRED STRUCTURE: ${structure}\nDESIRED CTA: ${cta}\nREFERENCES: ${references || "None"}`;
  }, [idea, audience, language, tone, duration, videoType, structure, cta, references]);

  async function handleGenerate() {
    if (!idea.trim()) return;
    setLoading(true);
    setError("");
    setActiveStep(1);
    try {
      const res = await fetch("/api/minimax/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefing: buildBriefing(), saveToAssets: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || "Generation failed");
      setGenerated(data);
      setActiveStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unexpected error occurred");
      setActiveStep(0);
    } finally {
      setLoading(false);
    }
  }

  async function handleImprove() {
    if (!genScript) return;
    setImproving(true);
    setError("");
    try {
      const res = await fetch("/api/minimax/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          briefing: `Improve this script. Tone: ${tone}. Audience: ${audience}. Language: ${language}. Duration: ${duration}.\n\n${genScript}\n\nMake it more engaging, natural, and compelling. Keep the same structure but improve wording, transitions, hook, and CTA. Return in the same JSON format.`,
          saveToAssets: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || "Improvement failed");
      setGenerated(data);
      setSaveStatus(t("scripts.improved"));
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unexpected error occurred");
    } finally {
      setImproving(false);
    }
  }

  function handleNewScript() {
    setIdea("");
    setGenerated(null);
    setActiveStep(0);
    setError("");
    setIsEditing(false);
    setEditText("");
    localStorage.removeItem(DRAFT_KEY);
  }

  function handleStartEdit() {
    setEditText(genScript);
    setIsEditing(true);
  }

  function handleSaveEdit() {
    setGenerated((prev) => (prev ? { ...prev, script: editText } : prev));
    setIsEditing(false);
    setSaveStatus(t("scripts.saved"));
    setTimeout(() => setSaveStatus(""), 2000);
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setEditText("");
  }

  function handleCopy() {
    if (genScript) {
      navigator.clipboard.writeText(genScript);
      setSaveStatus(t("scripts.copied"));
      setTimeout(() => setSaveStatus(""), 2000);
    }
  }

  function handleExport(format: "txt" | "md" | "json") {
    if (!genScript) return;
    let content = "";
    let filename = "";
    const ext = format === "json" ? "json" : "md";
    if (format === "json") {
      content = JSON.stringify(generated, null, 2);
    } else {
      content = `# ${genTitle || "Script"}\n\n${genScript}\n\n## CTA\n${genCta}\n\n## Tags\n${genTags.join(", ")}`;
    }
    filename = `script-${Date.now()}.${ext}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setSaveStatus(t("scripts.exportedAs").replace("{filename}", filename));
    setTimeout(() => setSaveStatus(""), 2000);
  }

  const sectionMatch = (line: string) => line.match(/^[A-Z][A-Z\s#\-0-9:]+\(.*\)$/);

  const settingsItems = [
    { labelKey: "scripts.tone", value: tone, options: toneOptions, set: setTone },
    { labelKey: "scripts.audience", value: audience, options: audienceOptions, set: setAudience },
    { labelKey: "scripts.language", value: language, options: languageOptions, set: setLanguage },
    { labelKey: "scripts.videoType", value: videoType, options: videoTypeOptions, set: setVideoType },
    { labelKey: "scripts.duration", value: duration, options: durationOptions, set: setDuration },
  ];

  const scriptText = genScript.toLowerCase();
  const insightChecks = [
    { id: "hook", labelKey: "scripts.check.hook", passed: /hook|intro|opening/.test(scriptText) },
    { id: "structure", labelKey: "scripts.check.structure", passed: /intro|main|recap|conclusion|cta/.test(scriptText) },
    { id: "cta", labelKey: "scripts.check.cta", passed: Boolean(genCta) || /subscribe|like|comment|follow|call to action|cta/.test(scriptText) },
    { id: "detail", labelKey: "scripts.check.detail", passed: genScript.split(/\s+/).filter(Boolean).length >= 120 },
  ];
  const passedChecks = generated ? insightChecks.filter((check) => check.passed).length : 0;
  const structureScore = generated ? Math.round((passedChecks / insightChecks.length) * 100) : 0;
  const insightSuggestions = generated
    ? insightChecks
        .filter((check) => !check.passed)
        .map((check) => {
          if (check.id === "hook") return t("scripts.suggestion.hook");
          if (check.id === "cta") return t("scripts.suggestion.cta");
          if (check.id === "detail") return t("scripts.suggestion.detail");
          return t("scripts.suggestion.structure");
        })
    : [t("scripts.emptyMsg")];

  return (
    <div className="relative flex h-full min-h-0 flex-1 overflow-hidden bg-transparent text-[#F5F2F4]">
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-auto min-h-[64px] shrink-0 flex-col items-stretch gap-3 border-b border-[rgba(255,255,255,0.07)] px-4 py-3 md:h-[64px] md:flex-row md:items-center md:justify-between md:gap-0 md:px-9 md:py-0 xl:px-10">
          <div className="flex min-w-0 items-center gap-3 pl-12 md:gap-5 md:pl-0">
            <h1 className="text-[23px] font-bold tracking-[-0.02em] text-[#F5F2F4]">{t("scripts.title")}</h1>
            <ChevronRight className="hidden h-4 w-4 text-[#5F6472] sm:block" strokeWidth={1.7} />
            <button className="hidden min-w-0 items-center gap-1.5 text-[15px] text-[#A0A3AD] transition-colors duration-150 hover:text-white sm:flex">
              <span className="truncate">{genTitle || t("scripts.subtitle")}</span>
              <ChevronDown className="h-3.5 w-3.5 text-[#5F6472]" />
            </button>
            {generated && <span className="hidden h-2.5 w-2.5 rounded-full bg-[#D06FA7] sm:block" />}
          </div>

          <div className="flex items-center justify-end gap-2 md:gap-5">
            {generated && (
              <div className="hidden items-center gap-2 text-[13px] text-[#A0A3AD] lg:flex">
                <CheckCircle2 className="h-4 w-4" strokeWidth={1.8} />
                <span>{saveStatus || t("scripts.saved")}</span>
              </div>
            )}
            <button
              onClick={handleNewScript}
              className="hidden h-10 items-center gap-2 rounded-[8px] border border-[rgba(255,255,255,0.07)] bg-white/[0.025] px-5 text-[14px] font-semibold text-[#F5F2F4] transition hover:border-[rgba(255,255,255,0.12)] hover:bg-white/[0.05] sm:flex"
            >
              <RotateCcw className="h-4 w-4 text-[#A0A3AD]" strokeWidth={1.7} />
              {t("scripts.newScript")}
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || !idea.trim()}
              className="flex h-10 items-center gap-2 rounded-[8px] bg-[#D06FA7] px-5 text-[14px] font-semibold text-[#F9F5F8] transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed md:px-7"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" strokeWidth={1.8} />}
              {loading ? t("scripts.generating") : generated ? t("scripts.regenerate") : t("scripts.generate")}
            </button>
          </div>
        </header>

        {/* 3-Column Layout */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto xl:grid-cols-[300px_minmax(580px,1fr)_454px] xl:overflow-hidden">
          {/* Left: Steps Sidebar */}
          <aside className="relative h-full border-r border-[rgba(255,255,255,0.07)] px-11 py-12">
            <ol className="space-y-8">
              {stepsList.map((step, index) => {
                const isDone = index < activeStep;
                const isActive = index === activeStep;

                return (
                  <li key={step} className="relative flex items-center gap-4">
                    {index < stepsList.length - 1 ? (
                      <span className="absolute left-[16px] top-[36px] h-[30px] border-l border-dashed border-[rgba(255,255,255,0.07)]" />
                    ) : null}
                    <span
                      className={[
                        "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border text-[14px] font-medium transition-colors duration-200",
                        isDone || isActive
                          ? "border-[rgba(208,111,167,0.3)] bg-[rgba(208,111,167,0.1)] text-[#D06FA7]"
                          : "border-[rgba(255,255,255,0.07)] bg-[#151516] text-[#5F6472]",
                      ].join(" ")}
                    >
                      {isDone ? <Check className="w-4 h-4 text-[#D06FA7]" strokeWidth={2.5} /> : index + 1}
                    </span>
                    <span
                      className={[
                        "text-[15px] font-medium transition-colors duration-200",
                        isActive || isDone ? "text-[#D06FA7]" : "text-[#5F6472]",
                      ].join(" ")}
                    >
                      {step}
                    </span>
                  </li>
                );
              })}
            </ol>
          </aside>

          {/* Center: Main Content */}
          <main className="min-h-0 min-w-0 overflow-y-auto px-8 py-8 xl:px-14">
            <div className="mx-auto max-w-[980px]">
              <h2 className="text-[28px] font-bold tracking-[-0.025em] text-[#F5F2F4]">Ideia Base</h2>
              <p className="mt-3 text-[15px] leading-6 text-[#A0A3AD]">
                Escribe tu idea principal y nosotros generaremos un guion completo.
              </p>

              <Panel className="mt-6 px-6 py-5">
                <div className="relative min-h-[185px]">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <label htmlFor="script-idea" className="text-[14px] font-medium text-[#F5F2F4]">
                      {t("scripts.ideaLabel")}
                    </label>
                    <Sparkles className="mt-1 h-5 w-5 text-[#D06FA7]" strokeWidth={1.7} />
                  </div>
                  <textarea
                    id="script-idea"
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    maxLength={2000}
                    placeholder={t("scripts.ideaPlaceholder")}
                    className="h-[118px] w-full resize-none bg-transparent text-[14px] leading-6 text-[#F5F2F4] placeholder:text-[#5F6472] focus-visible:outline-none"
                  />
                  <div className="flex justify-between items-center text-[14px] text-[#A0A3AD]">
                    <span>{idea.length} / 2000</span>
                    {error && <span className="text-red-400">{error}</span>}
                  </div>
                </div>
              </Panel>

              {generated && (
                <section className="mt-7">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-[#D06FA7]" strokeWidth={1.7} />
                      <h2 className="text-[16px] font-semibold text-[#F5F2F4]">{genTitle || t("scripts.generatedTitle")}</h2>
                    </div>
                    {!isEditing && (
                      <button onClick={handleStartEdit} className="text-[13px] font-medium text-[#A0A3AD] transition hover:text-white flex items-center gap-1.5">
                        <Pencil className="w-3.5 h-3.5" /> Editar
                      </button>
                    )}
                  </div>

                  <Panel className="relative overflow-hidden">
                    {isEditing ? (
                      <div className="flex flex-col p-6">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full min-h-[300px] bg-transparent text-[14px] leading-relaxed text-[#F5F2F4] placeholder:text-[#5F6472] focus-visible:outline-none resize-y"
                        />
                        <div className="flex items-center justify-end gap-3 mt-4 border-t border-[rgba(255,255,255,0.07)] pt-4">
                          <button onClick={handleCancelEdit} className="px-4 py-2 text-[13px] font-medium text-[#A0A3AD] hover:text-white transition">Cancelar</button>
                          <button onClick={handleSaveEdit} className="px-4 py-2 rounded-[8px] bg-[#D06FA7] text-[13px] font-medium text-white transition hover:brightness-110">Salvar Modificações</button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6">
                        <div className="text-[14px] text-[#F5F2F4] leading-[1.8] whitespace-pre-wrap font-normal">
                          {String(genScript).split("\n").map((line, i) => {
                            const isSection = sectionMatch(line);
                            return (
                              <p key={i} className={isSection ? "text-[#D06FA7] font-semibold text-[13px] uppercase tracking-wide mt-6 mb-2" : "text-[#A0A3AD]"}>
                                {line}
                              </p>
                            );
                          })}
                        </div>
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[rgba(255,255,255,0.07)]">
                          <div className="flex items-center gap-4 text-[12px] text-[#5F6472]">
                            <span>{genScript.split(/\s+/).length.toLocaleString()} {t("scripts.words")}</span>
                            <span className="w-1 h-1 rounded-full bg-[rgba(255,255,255,0.14)]" />
                            <span>{genEstDuration}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={handleCopy} className="p-2 rounded-[6px] text-[#A0A3AD] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors" title={t("scripts.copy")}><Copy className="w-4 h-4" /></button>
                            <button onClick={() => handleExport("md")} className="p-2 rounded-[6px] text-[#A0A3AD] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors" title={t("scripts.downloadMd")}><Download className="w-4 h-4" /></button>
                            <button onClick={handleImprove} disabled={improving} className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[rgba(255,255,255,0.07)] text-[12px] font-medium text-[#F5F2F4] hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.05)] transition disabled:opacity-50">
                              {improving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                              Melhorar Texto
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Panel>
                </section>
              )}
            </div>
          </main>

          {/* Right: Settings & Insights */}
          <aside className="min-w-0 space-y-4 px-5 pb-8 xl:overflow-y-auto xl:px-6 xl:py-7">
            {/* Settings Card */}
            <Panel className="p-5">
              <PanelHeader title={t("scripts.settings")} />
              <div className="space-y-4">
                {settingsItems.map((item) => (
                  <div key={item.labelKey} className="flex items-center justify-between gap-4">
                    <p className="text-[13px] font-medium text-[#A0A3AD] shrink-0">{t(item.labelKey)}</p>
                    <div className="relative w-full max-w-[160px]">
                      <select
                        value={item.value}
                        onChange={(e) => item.set(e.target.value)}
                        className="w-full bg-transparent text-right text-[13px] font-medium text-[#F5F2F4] appearance-none cursor-pointer pr-5 focus:outline-none truncate"
                      >
                        {item.options.map((o) => {
                          const val = typeof o === "string" ? o : o.value;
                          const label = typeof o === "string" ? o : t(o.labelKey);
                          return <option key={val} value={val} className="bg-[#151516] text-[#F5F2F4]">{label}</option>;
                        })}
                      </select>
                      <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5F6472] pointer-events-none" />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Insights Card */}
            <Panel className="p-5">
              <PanelHeader title={t("scripts.insights")} />
              <div className="mb-6">
                <div className="relative w-[100px] h-[100px] mx-auto mt-2">
                  <svg width={100} height={100} viewBox="0 0 100 100" className="rotate-[-90deg] block">
                    <defs>
                      <linearGradient id={gaugeId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#D06FA7" />
                        <stop offset="100%" stopColor="#9B6CFF" />
                      </linearGradient>
                    </defs>
                    <circle stroke="rgba(255,255,255,0.07)" strokeWidth={6} fill="transparent" r={42} cx={50} cy={50} />
                    {generated && (
                      <circle
                        stroke={`url(#${gaugeId})`}
                        strokeWidth={6}
                        strokeDasharray={`${42 * 2 * Math.PI}`}
                        strokeDashoffset={42 * 2 * Math.PI * (1 - structureScore / 100)}
                        strokeLinecap="round"
                        fill="transparent"
                        r={42}
                        cx={50}
                        cy={50}
                        className="transition-all duration-1000 ease-out"
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-[26px] font-bold text-[#F5F2F4] leading-none">{generated ? structureScore : "--"}</span>
                    <span className="text-[10px] uppercase tracking-wide text-[#5F6472] mt-1">Score</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-[rgba(255,255,255,0.07)]">
                {insightChecks.map((check) => (
                  <div key={check.id} className="flex items-center justify-between">
                    <span className="text-[13px] text-[#A0A3AD]">{t(check.labelKey)}</span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${generated && check.passed ? "bg-[rgba(208,111,167,0.1)] text-[#D06FA7]" : "bg-[rgba(255,255,255,0.05)] text-[#5F6472]"}`}>
                      <Check className="w-3 h-3" strokeWidth={2.5} />
                    </div>
                  </div>
                ))}
              </div>

              {generated && insightSuggestions.length > 0 && insightSuggestions[0] !== t("scripts.emptyMsg") && (
                <div className="mt-5 pt-4 border-t border-[rgba(255,255,255,0.07)]">
                  <div className="flex items-center gap-1.5 mb-3 text-[13px] font-medium text-[#F5F2F4]">
                    <Info className="w-4 h-4 text-[#D06FA7]" />
                    Sugestões
                  </div>
                  <div className="space-y-2">
                    {insightSuggestions.map((s, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Circle className="w-1.5 h-1.5 text-[#5F6472] mt-1.5 shrink-0" fill="currentColor" />
                        <span className="text-[12px] text-[#A0A3AD] leading-relaxed">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Panel>
          </aside>
        </div>
      </div>
    </div>
  );
}

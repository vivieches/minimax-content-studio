"use client";

import { useState, useId, useEffect, useCallback } from "react";
import { Stepper } from "../../components/Stepper";
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

  // Persist draft whenever key fields change
  useEffect(() => {
    const draft: DraftData = {
      idea,
      tone,
      audience,
      language,
      videoType,
      duration,
      generated,
      activeStep,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [idea, tone, audience, language, videoType, duration, generated, activeStep]);

  const genScript = generated?.script ? String(generated.script) : "";
  const genTitle = generated?.title ? String(generated.title) : "";
  const genTags = (generated?.tags as string[]) ?? [];
  const genEstDuration = generated?.estimatedDuration ? String(generated.estimatedDuration) : duration;
  const genCta = generated?.cta ? String(generated.cta) : "";

  const steps = [
    { label: t("scripts.stepBriefing") },
    { label: t("scripts.stepStructure") },
    { label: t("scripts.stepScript") },
    { label: t("scripts.stepReview") },
    { label: t("scripts.stepAddons") },
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
        body: JSON.stringify({
          briefing: buildBriefing(),
          saveToAssets: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || "Generation failed");
      setGenerated(data);
      setActiveStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unexpected error occurred");
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
    setGenerated((prev) =>
      prev ? { ...prev, script: editText } : prev
    );
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
    <main className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="flex flex-col h-full px-6 py-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-ink mb-1">{t("scripts.title")}</h1>
            <p className="text-sm text-ink-2">{t("scripts.subtitle")}</p>
          </div>
          {generated && (
            <button
              onClick={handleNewScript}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-line text-sm text-ink hover:bg-hover transition-all"
              title={t("scripts.newScript")}
            >
              <RotateCcw className="w-4 h-4" />
              {t("scripts.newScript")}
            </button>
          )}
        </div>

        {!generated && (
          <div className="mb-4 bg-card border border-line rounded-2xl p-5">
            <label className="block text-sm font-medium text-ink mb-2">{t("scripts.ideaLabel")}</label>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder={t("scripts.ideaPlaceholder")}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-card-hi border border-line text-ink text-sm placeholder:text-ink-3 focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all resize-none"
            />
          </div>
        )}

        <div className="mb-6">
          <Stepper steps={steps} activeIndex={activeStep} />
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[260px_1fr_250px] gap-4 min-h-0">
          {/* Settings */}
          <div className="min-h-0">
            <div className="flex flex-col h-full bg-card border border-line rounded-2xl overflow-hidden">
              <div className="px-5 pt-5 pb-3">
                <h3 className="text-sm font-semibold text-ink">{t("scripts.settings")}</h3>
              </div>
              <div className="flex-1 px-5 space-y-1 overflow-y-auto">
                {settingsItems.map((item) => (
                  <div key={item.labelKey} className="py-2.5">
                    <p className="text-[11px] text-ink-3 mb-1 uppercase tracking-wider">{t(item.labelKey)}</p>
                    <div className="relative">
                      <select
                        value={item.value}
                        onChange={(e) => item.set(e.target.value)}
                        className="w-full bg-transparent text-sm text-ink font-medium appearance-none cursor-pointer pr-6 focus:outline-none"
                      >
                        {item.options.map((o) => {
                          const value = typeof o === "string" ? o : o.value;
                          const label = typeof o === "string" ? o : t(o.labelKey);
                          return <option key={value} value={value}>{label}</option>;
                        })}
                      </select>
                      <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-3 pointer-events-none" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-5 pt-3 space-y-2">
                <button
                  onClick={handleGenerate}
                  disabled={loading || !idea.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl btn-brand text-sm font-medium active:scale-[0.99] transition-all duration-150 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loading ? t("scripts.generating") : generated ? t("scripts.regenerate") : t("scripts.generate")}
                </button>
                {generated && (
                  <button
                    onClick={handleImprove}
                    disabled={improving || !genScript}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-line text-sm font-medium text-ink hover:bg-hover active:scale-[0.99] transition-all duration-150 disabled:opacity-50"
                  >
                    {improving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    {improving ? t("scripts.improving") : t("scripts.improve")}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Script Content */}
          <div className="min-h-0">
            <div className="flex flex-col h-full bg-card border border-line rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h3 className="text-sm font-semibold text-ink">
                  {genTitle || t("scripts.generatedTitle")}
                </h3>
                {Boolean(generated?.script) && !isEditing && (
                  <button
                    onClick={handleStartEdit}
                    className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {t("scripts.edit")}
                  </button>
                )}
              </div>

              <div className="flex-1 px-5 overflow-y-auto">
                {error ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <p className="text-danger text-sm mb-2">{error}</p>
                      <button onClick={handleGenerate} className="text-sm text-accent hover:underline">
                        {t("scripts.tryAgain")}
                      </button>
                    </div>
                  </div>
                ) : isEditing ? (
                  <div className="h-full flex flex-col">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-1 w-full px-3 py-2 rounded-xl bg-card-hi border border-line text-sm text-ink leading-[1.8] resize-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                    />
                    <div className="flex items-center justify-end gap-2 mt-3 mb-4">
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-ink-2 hover:bg-hover transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        {t("scripts.cancel")}
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-accent text-accent-fg hover:bg-accent/90 transition-colors"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {t("scripts.save")}
                      </button>
                    </div>
                  </div>
                ) : generated?.script ? (
                  <div className="text-sm text-ink leading-[1.8] whitespace-pre-wrap font-normal pb-4">
                    {String(genScript).split("\n").map((line, i) => {
                      const isSection = sectionMatch(line);
                      return (
                        <p
                          key={i}
                          className={
                            isSection
                              ? "text-ink font-semibold text-xs uppercase tracking-wide mt-5 mb-1"
                              : "text-ink-2"
                          }
                        >
                          {line}
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-ink-2 text-sm">
                    {loading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-accent" />
                        <span>{t("scripts.generatingMsg")}</span>
                      </div>
                    ) : (
                      <span>{t("scripts.emptyMsg")}</span>
                    )}
                  </div>
                )}
              </div>

              {genScript && !isEditing && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-line bg-hover/50">
                  <div className="flex items-center gap-4 text-[11px] text-ink-3">
                    <span>{genScript.split(/\s+/).length.toLocaleString()} {t("scripts.words")}</span>
                    <span className="w-1 h-1 rounded-full bg-line-hi" />
                    <span>{genEstDuration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={handleCopy} className="w-7 h-7 rounded-md flex items-center justify-center text-ink-3 hover:text-ink hover:bg-hover transition-all cursor-pointer" title={t("scripts.copy")}>
                      <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                    <button onClick={() => handleExport("md")} className="w-7 h-7 rounded-md flex items-center justify-center text-ink-3 hover:text-ink hover:bg-hover transition-all cursor-pointer" title={t("scripts.downloadMd")}>
                      <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                    <button onClick={() => handleExport("json")} className="w-7 h-7 rounded-md flex items-center justify-center text-ink-3 hover:text-ink hover:bg-hover transition-all cursor-pointer" title={t("scripts.exportJson")}>
                      <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              )}

              {saveStatus && (
                <div className="px-5 py-2 text-xs text-ok">{saveStatus}</div>
              )}
            </div>
          </div>

          {/* Insights */}
          <div className="min-h-0">
            <div className="flex flex-col h-full bg-card border border-line rounded-2xl overflow-hidden">
              <div className="px-5 pt-5 pb-3">
                <h3 className="text-sm font-semibold text-ink">{t("scripts.insights")}</h3>
              </div>
              <div className="flex-1 px-5 overflow-y-auto space-y-6">
                <div>
                  <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-4">{t("scripts.structureScore")}</p>
                  <div className="relative w-20 h-20 mx-auto">
                    <svg width={80} height={80} viewBox="0 0 80 80" className="rotate-[-90deg] block">
                      <defs>
                        <linearGradient id={gaugeId} x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#FF4B8B" />
                          <stop offset="100%" stopColor="#FF8035" />
                        </linearGradient>
                      </defs>
                      <circle stroke="rgba(255,255,255,0.07)" strokeWidth={6} fill="transparent" r={34} cx={40} cy={40} />
                      {generated && (
                        <circle
                          stroke={`url(#${gaugeId})`}
                          strokeWidth={6}
                          strokeDasharray={`${34 * 2 * Math.PI}`}
                          strokeDashoffset={34 * 2 * Math.PI * (1 - structureScore / 100)}
                          strokeLinecap="round"
                          fill="transparent"
                          r={34}
                          cx={40}
                          cy={40}
                        />
                      )}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-ink">{generated ? structureScore : "--"}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {insightChecks.map((check) => (
                    <div key={check.id} className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${generated && check.passed ? "bg-ok-soft" : "bg-hover"}`}>
                        <Check className={`w-2.5 h-2.5 ${generated && check.passed ? "text-ok" : "text-ink-3"}`} strokeWidth={3} />
                      </div>
                      <span className={`text-xs ${generated && check.passed ? "text-ink" : "text-ink-2"}`}>{t(check.labelKey)}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-3">{t("scripts.suggestions")}</p>
                  <div className="space-y-2.5">
                    {(insightSuggestions.length ? insightSuggestions : [t("scripts.noIssues")]).map((s, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <Circle className="w-3 h-3 text-ink-3 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                        <span className="text-xs text-ink-2 leading-relaxed">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {genTags.length > 0 && (
                  <div>
                    <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-2">{t("scripts.tags")}</p>
                    <div className="flex flex-wrap gap-1">
                      {genTags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-hover text-[10px] text-ink-2">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

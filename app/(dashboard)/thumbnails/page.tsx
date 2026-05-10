"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Sparkles,
  Loader2,
  Download,
  ImagePlus,
  X,
  Copy,
  RefreshCw,
  Star,
  ChevronDown,
  Info,
  Check,
  AlertTriangle,
  Wand2,
  Type,
  Link,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import {
  validateHookText,
  getQualityTips,
  THUMBNAIL_STYLES,
  AUDIENCE_OPTIONS,
  MOOD_OPTIONS,
  BACKGROUND_OPTIONS,
  COLOR_PRESETS,
  BRAND_OPTIONS,
} from "@/lib/prompts/thumbnailPrompt";
import TextOverlayEditor from "@/components/text-overlay-editor";

interface ThumbnailResult {
  urls: string[];
  base64s: string[];
  finalPrompt: string;
}

export default function ThumbnailGeneratorPage() {
  const { t } = useT();

  // ── Form State ─────────────────────────────────────────────────────
  const [topic, setTopic] = useState("");
  const [title, setTitle] = useState("");
  const [hookText, setHookText] = useState("");
  const [audience, setAudience] = useState("creators");
  const [style, setStyle] = useState("high-ctr");
  const [mood, setMood] = useState("surprised");
  const [background, setBackground] = useState("simple");
  const [colorPreference, setColorPreference] = useState("minimax-coral");
  const [brand, setBrand] = useState("none");
  const [customBrand, setCustomBrand] = useState("");
  const [includeFace, setIncludeFace] = useState(true);
  const [includeText, setIncludeText] = useState(true);
  const [includeLogo, setIncludeLogo] = useState(false);
  const [safeTextMode, setSafeTextMode] = useState(false);
  const [variations, setVariations] = useState(1);

  const [referenceImageUrl, setReferenceImageUrl] = useState("");

  const [prompt, setPrompt] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  // ── UI State ───────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [results, setResults] = useState<ThumbnailResult | null>(null);
  const [error, setError] = useState("");
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [favoriteUrls, setFavoriteUrls] = useState<Set<string>>(new Set());
  const [editingOverlayUrl, setEditingOverlayUrl] = useState<string | null>(null);
  const [editingOverlayIndex, setEditingOverlayIndex] = useState<number>(0);

  // ── Derived State ──────────────────────────────────────────────────
  const hasUsableReferenceImage = referenceImageUrl.trim().startsWith("https://");
  const hookValidation = validateHookText(hookText);
  const qualityTips = getQualityTips({
    topic,
    hookText,
    style,
    mood,
    includeFace,
    hasReferenceFace: hasUsableReferenceImage,
    safeTextMode,
    background,
  });

  const canGenerate = topic.trim().length > 0 && title.trim().length > 0;

  // ── Handlers ───────────────────────────────────────────────────────

  function buildImagePrompt(basePrompt: string) {
    const parts: string[] = [basePrompt.trim()];

    if (safeTextMode) {
      parts.push("DO NOT include any text, letters, or typography in the image.");
    }
    if (hasUsableReferenceImage) {
      parts.push(
        "COMPOSITION: person positioned on the RIGHT side of the frame, occupying at most 40% of frame width, showing upper body not just face. " +
        "The LEFT half of the frame must contain large bold readable text. Wide shot, NOT a portrait or close-up."
      );
    }

    const fullPrompt = parts.join(" ");
    console.log("[Thumbnail] Prompt length:", fullPrompt.length);
    return fullPrompt;
  }

  async function handleGeneratePrompt() {
    if (!canGenerate) return;
    setGeneratingPrompt(true);
    setError("");
    try {
      const res = await fetch("/api/minimax/thumbnail-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          title,
          hookText,
          audience,
          style,
          mood,
          includeFace,
          includeText,
          includeLogo,
          background,
          brand: brand === "custom" ? customBrand : brand,
          colorPreference,
          hasReferenceFace: hasUsableReferenceImage,
          hasReferenceStyle: hasUsableReferenceImage,
          safeTextMode,
          variations,
          // NOTE: Do NOT include reference images here — they exceed 1MB payload limit
          // Images are only sent to /api/minimax/image which has 10MB limit
        }),
      });
      const data = await res.json();
      if (data.prompt) {
        setGeneratedPrompt(data.prompt);
        setPrompt(data.prompt);
      }
      if (data.error) throw new Error(data.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate prompt");
    } finally {
      setGeneratingPrompt(false);
    }
  }

  async function handleGenerateImage(regenPrompt?: string) {
    const usePrompt = regenPrompt || prompt;
    if (!usePrompt) return;
    setLoading(true);
    setError("");
    if (!regenPrompt) setResults(null);
    try {
      const imagePrompt = buildImagePrompt(usePrompt);
      const payload: Record<string, unknown> = {
        prompt: imagePrompt,
        aspectRatio: "16:9",
        n: variations,
        saveToAssets: true,
      };

      if (hasUsableReferenceImage) {
        payload.referenceImage = referenceImageUrl.trim();
        payload.referenceType = "face";
      }

      console.log("[Thumbnail] Final prompt:", imagePrompt);

      const res = await fetch("/api/minimax/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.details || data.error);
      setResults(data);
      setShowPrompt(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate thumbnail");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(url: string, index: number) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `thumbnail-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab
      window.open(url, "_blank");
    }
  }

  function handleCopyPrompt() {
    if (!results?.finalPrompt) return;
    navigator.clipboard.writeText(results.finalPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  }

  function toggleFavorite(url: string) {
    setFavoriteUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }

  // ── Classes ────────────────────────────────────────────────────────
  const inputClass =
    "w-full px-3 py-2.5 rounded-xl bg-card-hi border border-line text-ink text-sm placeholder:text-ink-3 focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all outline-none";
  const selectClass =
    "w-full px-3 py-2.5 rounded-xl bg-card-hi border border-line text-ink text-sm appearance-none cursor-pointer focus:border-accent/50 transition-all outline-none pr-8";
  const labelClass = "block text-[11px] text-ink-3 uppercase tracking-wider mb-1.5 font-medium";
  const sectionClass = "space-y-4";
  const optionText = (scope: string, id: string, fallback: string) => {
    const key = `thumbnails.${scope}.${id}`;
    const value = t(key);
    return value === key ? fallback : value;
  };
  const moodText = (id: string, fallback: string) => {
    const emoji = fallback.match(/\s+\S+$/)?.[0] ?? "";
    return `${optionText("moodOption", id, fallback.replace(emoji, ""))}${emoji}`;
  };
  const selectedStyle = THUMBNAIL_STYLES.find((s) => s.id === style);

  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="flex flex-col h-full px-4 py-5 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-ink mb-1">{t("thumbnails.title")}</h1>
            <p className="text-sm text-ink-2">{t("thumbnails.subtitle")}</p>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-danger-soft border border-danger/20 text-danger text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Main Grid */}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-5 min-h-0">
          {/* ── Left Panel: Settings ───────────────────────────────── */}
          <div className="min-h-0 bg-card border border-line rounded-lg p-5 overflow-y-auto">
            <h3 className="text-sm font-semibold text-ink mb-5 flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-accent" />
              {t("thumbnails.settings")}
            </h3>

            <div className={sectionClass}>
              {/* Video Topic */}
              <div>
                <label className={labelClass}>{t("thumbnails.topic")}</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={t("thumbnails.topicPlaceholder")}
                  className={inputClass}
                />
              </div>

              {/* Video Title */}
              <div>
                <label className={labelClass}>{t("thumbnails.titleLabel")}</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="5 AI Tools in 2024"
                  className={inputClass}
                />
              </div>

              {/* Hook Text */}
              <div>
                <label className={labelClass}>{t("thumbnails.hookText")}</label>
                <input
                  type="text"
                  value={hookText}
                  onChange={(e) => setHookText(e.target.value)}
                  placeholder={t("thumbnails.hookTextPlaceholder")}
                  className={inputClass}
                />
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[11px] text-ink-3">{t("thumbnails.hookTextHelp")}</span>
                  {hookText && (
                    <span
                      className={`text-[11px] font-medium ${
                        hookValidation.wordCount > 7
                          ? "text-warn"
                          : hookValidation.wordCount > 5
                            ? "text-ink-3"
                            : "text-ok"
                      }`}
                    >
                      {hookValidation.wordCount} {t("thumbnails.wordCount")}
                      {hookValidation.wordCount > 7 && ` — ${t("thumbnails.wordWarning")}`}
                    </span>
                  )}
                </div>
              </div>

              {/* Audience */}
              <div>
                <label className={labelClass}>{t("thumbnails.audience")}</label>
                <div className="relative">
                  <select value={audience} onChange={(e) => setAudience(e.target.value)} className={selectClass}>
                    {AUDIENCE_OPTIONS.map((a) => (
                      <option key={a.id} value={a.id}>
                        {optionText("audienceOption", a.id, a.label)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-ink-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Style */}
              <div>
                <label className={labelClass}>{t("thumbnails.style")}</label>
                <div className="relative">
                  <select value={style} onChange={(e) => setStyle(e.target.value)} className={selectClass}>
                    {THUMBNAIL_STYLES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {optionText("styleOption", s.id, s.label)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-ink-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-ink-3 mt-1">
                  {selectedStyle ? optionText("styleDescription", selectedStyle.id, selectedStyle.description) : ""}
                </p>
              </div>

              {/* Mood */}
              <div>
                <label className={labelClass}>{t("thumbnails.mood")}</label>
                <div className="relative">
                  <select value={mood} onChange={(e) => setMood(e.target.value)} className={selectClass}>
                    {MOOD_OPTIONS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {moodText(m.id, m.label)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-ink-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Background */}
              <div>
                <label className={labelClass}>{t("thumbnails.background")}</label>
                <div className="relative">
                  <select value={background} onChange={(e) => setBackground(e.target.value)} className={selectClass}>
                    {BACKGROUND_OPTIONS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {optionText("backgroundOption", b.id, b.label)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-ink-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Color Preference */}
              <div>
                <label className={labelClass}>{t("thumbnails.colorPreference")}</label>
                <div className="relative">
                  <select value={colorPreference} onChange={(e) => setColorPreference(e.target.value)} className={selectClass}>
                    {COLOR_PRESETS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {optionText("colorOption", c.id, c.label)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-ink-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Brand */}
              <div>
                <label className={labelClass}>{t("thumbnails.brand")}</label>
                <div className="relative">
                  <select value={brand} onChange={(e) => setBrand(e.target.value)} className={selectClass}>
                    {BRAND_OPTIONS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {optionText("brandOption", b.id, b.label)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-ink-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {brand === "custom" && (
                  <input
                    type="text"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    placeholder={t("thumbnails.customBrandPlaceholder")}
                    className={`${inputClass} mt-2`}
                  />
                )}
              </div>

              {/* Reference Image URL */}
              <div>
                <label className={labelClass}>Imagem de referência</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Link className="w-3.5 h-3.5 text-ink-3" />
                  </div>
                  <input
                    type="url"
                    value={referenceImageUrl}
                    onChange={(e) => setReferenceImageUrl(e.target.value)}
                    placeholder="https://i.imgur.com/suafoto.jpg"
                    className={`${inputClass} pl-8`}
                  />
                  {referenceImageUrl && (
                    <button
                      onClick={() => setReferenceImageUrl("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {referenceImageUrl && hasUsableReferenceImage && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-line aspect-video bg-card-hi relative">
                    <Image src={referenceImageUrl} alt="Reference preview" fill className="object-cover" sizes="360px" unoptimized />
                  </div>
                )}
                {referenceImageUrl && !hasUsableReferenceImage && (
                  <p className="text-[11px] text-warn mt-1">URL deve começar com https://</p>
                )}
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink">{t("thumbnails.includeFace")}</span>
                  <button
                    onClick={() => setIncludeFace(!includeFace)}
                    className={`w-10 h-5 rounded-full transition-all ${includeFace ? "bg-accent" : "bg-line"} relative`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${includeFace ? "left-5" : "left-0.5"}`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink">{t("thumbnails.includeText")}</span>
                  <button
                    onClick={() => {
                      const next = !includeText;
                      setIncludeText(next);
                      if (!next) setSafeTextMode(false);
                    }}
                    className={`w-10 h-5 rounded-full transition-all ${includeText ? "bg-accent" : "bg-line"} relative`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${includeText ? "left-5" : "left-0.5"}`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink">{t("thumbnails.includeLogo")}</span>
                  <button
                    onClick={() => setIncludeLogo(!includeLogo)}
                    className={`w-10 h-5 rounded-full transition-all ${includeLogo ? "bg-accent" : "bg-line"} relative`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${includeLogo ? "left-5" : "left-0.5"}`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-ink">{t("thumbnails.safeTextMode")}</span>
                    <div className="group relative">
                      <Info className="w-3.5 h-3.5 text-ink-3 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded-lg bg-card-hi border border-line text-[11px] text-ink-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        {t("thumbnails.safeTextModeHelp")}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const next = !safeTextMode;
                      setSafeTextMode(next);
                      if (next) setIncludeText(false);
                    }}
                    className={`w-10 h-5 rounded-full transition-all ${safeTextMode ? "bg-accent" : "bg-line"} relative`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${safeTextMode ? "left-5" : "left-0.5"}`}
                    />
                  </button>
                </div>
              </div>

              {/* Variations */}
              <div>
                <label className={labelClass}>{t("thumbnails.variations")}</label>
                <div className="relative">
                  <select
                    value={variations}
                    onChange={(e) => setVariations(Number(e.target.value))}
                    className={selectClass}
                  >
                    {[1, 2, 4].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "thumbnail" : "thumbnails"}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-ink-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Quality Tips */}
              {qualityTips.length > 0 && (
                <div className="p-3 rounded-xl bg-accent-soft/30 border border-accent/10">
                  <h4 className="text-[11px] font-semibold text-accent mb-2 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    {t("thumbnails.qualityTips")}
                  </h4>
                  <ul className="space-y-1">
                    {qualityTips.map((tip, i) => (
                      <li key={i} className="text-[11px] text-ink-2 leading-relaxed">
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Editable Prompt */}
            {prompt && (
              <div className="mt-5 pt-5 border-t border-line">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-ink-2 uppercase tracking-wide">Prompt de imagem</label>
                  <button
                    onClick={() => setPrompt(generatedPrompt)}
                    className="text-[10px] text-ink-3 hover:text-accent transition-colors flex items-center gap-1"
                    title="Resetar para o prompt gerado"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Resetar
                  </button>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  className="w-full rounded-xl bg-hover border border-line text-ink text-[11px] leading-relaxed p-3 resize-y focus:outline-none focus:border-accent/50 placeholder:text-ink-3"
                  placeholder="Edite o prompt antes de gerar..."
                />
                <p className="text-[10px] text-ink-3 mt-1">{prompt.length} / 1490 chars</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 mt-5 pt-5 border-t border-line">
              <button
                onClick={handleGeneratePrompt}
                disabled={generatingPrompt || !canGenerate}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-hover border border-line text-ink text-sm font-medium hover:bg-line transition-all disabled:opacity-50"
              >
                {generatingPrompt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-accent" />}
                {t("thumbnails.generatePrompt")}
              </button>
              <button
                onClick={() => handleGenerateImage()}
                disabled={loading || !prompt}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl btn-brand text-sm font-medium transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                {loading ? t("thumbnails.generating") : t("thumbnails.generate")}
              </button>
            </div>
          </div>

          {/* ── Right Panel: Output ────────────────────────────────── */}
          <div className="min-h-0 bg-card border border-line rounded-lg p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-ink">
                {results ? t("thumbnails.generated") : t("thumbnails.preview")}
              </h3>
              {results && (
                <button
                  onClick={() => setShowPrompt(!showPrompt)}
                  className="text-[11px] text-ink-3 hover:text-ink transition-colors"
                >
                  {showPrompt ? "Hide" : "Show"} {t("thumbnails.promptUsed")}
                </button>
              )}
            </div>

            {/* Prompt Display */}
            {showPrompt && results?.finalPrompt && (
              <div className="mb-4 p-3 rounded-xl bg-card-hi border border-line">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-ink-2">{t("thumbnails.promptUsed")}</span>
                  <button
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-1 text-[11px] text-accent hover:text-accent-hi transition-colors"
                  >
                    {copiedPrompt ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedPrompt ? "Copied!" : t("thumbnails.copyPrompt")}
                  </button>
                </div>
                <p className="text-[11px] text-ink-3 leading-relaxed line-clamp-4">{results.finalPrompt}</p>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-accent animate-spin" />
                <span className="text-sm text-ink-2">{t("thumbnails.generatingMsg")}</span>
              </div>
            )}

            {/* Results */}
            {!loading && results?.urls?.length ? (
              <>
                <div className={`grid gap-4 ${results.urls.length >= 3 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}>
                  {results.urls.map((url, i) => (
                    <div
                      key={i}
                      className="group relative aspect-video rounded-xl overflow-hidden bg-card-hi border border-line hover:border-line-hi transition-all"
                    >
                      <Image
                        src={url}
                        alt={`Thumbnail ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        unoptimized
                      />
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownload(url, i)}
                            className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-all"
                            title="Download"
                          >
                            <Download className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={handleCopyPrompt}
                            className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-all"
                            title="Copy Prompt"
                          >
                            <Copy className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={() => toggleFavorite(url)}
                            className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-all"
                            title="Favorite"
                          >
                            <Star
                              className={`w-4 h-4 ${favoriteUrls.has(url) ? "text-amber-400 fill-amber-400" : "text-white"}`}
                            />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleGenerateImage(results?.finalPrompt)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-all"
                          >
                            <RefreshCw className="w-3 h-3 text-white" />
                            <span className="text-xs text-white">{t("thumbnails.regenerate")}</span>
                          </button>
                          {safeTextMode && (
                            <button
                              onClick={() => {
                                setEditingOverlayUrl(url);
                                setEditingOverlayIndex(i);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/80 backdrop-blur-sm hover:bg-accent transition-all"
                            >
                              <Type className="w-3 h-3 text-white" />
                              <span className="text-xs text-white">Edit Text</span>
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Badge */}
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[11px] text-white font-medium">
                        Variation {i + 1}
                      </span>
                      {/* Favorite indicator */}
                      {favoriteUrls.has(url) && (
                        <span className="absolute top-2 right-2">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Text Overlay Editor */}
                {safeTextMode && editingOverlayUrl && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-ink">Edit Text Overlay — Variation {editingOverlayIndex + 1}</h4>
                      <button
                        onClick={() => {
                          setEditingOverlayUrl(null);
                          setEditingOverlayIndex(0);
                        }}
                        className="text-xs text-ink-3 hover:text-ink transition-colors"
                      >
                        Close Editor
                      </button>
                    </div>
                    <TextOverlayEditor
                      baseImageUrl={editingOverlayUrl}
                      defaultText={hookText}
                    />
                  </div>
                )}
              </>
            ) : !loading && generatedPrompt ? (
              /* Generated Prompt State */
              <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                <Sparkles className="w-8 h-8 text-accent mb-2" />
                <p className="text-sm text-ink-2">{t("thumbnails.promptGenerated")}</p>
                <div className="max-w-md p-4 rounded-xl bg-card-hi border border-line">
                  <p className="text-xs text-ink-3 leading-relaxed line-clamp-6">{generatedPrompt}</p>
                </div>
                <button
                  onClick={() => handleGenerateImage()}
                  className="mt-2 px-5 py-2.5 rounded-xl btn-brand text-sm font-medium transition-all"
                >
                  {t("thumbnails.generateFromPrompt")}
                </button>
              </div>
            ) : !loading ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-card-hi border border-line flex items-center justify-center">
                  <ImagePlus className="w-8 h-8 text-ink-3" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink mb-1">{t("thumbnails.emptyTitle")}</p>
                  <p className="text-xs text-ink-3">{t("thumbnails.emptySubtitle")}</p>
                </div>
                {qualityTips.length > 0 && (
                  <div className="max-w-sm p-3 rounded-xl bg-accent-soft/20 border border-accent/10 mt-2">
                    <p className="text-[11px] font-medium text-accent mb-1.5">{t("thumbnails.qualityTips")}</p>
                    <ul className="space-y-1">
                      {qualityTips.slice(0, 2).map((tip, i) => (
                        <li key={i} className="text-[11px] text-ink-2">{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import { Loader2, Play, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { useT } from "@/lib/i18n";

const nodeConfig: Record<string, { label: string; color: string }> = {
  briefing:  { label: "Briefing",   color: "#60A5FA" },
  script:    { label: "Script",     color: "#A78BFA" },
  thumbnail: { label: "Thumbnail",  color: "#FB923C" },
  music:     { label: "Music",      color: "#34D399" },
  video:     { label: "Video",      color: "#F87171" },
  export:    { label: "Export",     color: "#FBBF24" },
};

type NodeStatus = "pending" | "running" | "completed" | "failed";

export default function PipelineBuilderPage() {
  const { t } = useT();
  const [briefing, setBriefing] = useState("");
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, NodeStatus>>({
    briefing: "pending", script: "pending", thumbnail: "pending",
    music: "pending", video: "pending", export: "pending",
  });
  const [enabledSteps, setEnabledSteps] = useState<string[]>(["script", "thumbnail", "music", "export"]);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [outputFormat, setOutputFormat] = useState<"package" | "individual">("package");

  function toggleStep(step: string) {
    setEnabledSteps((prev) =>
      prev.includes(step) ? prev.filter((s) => s !== step) : [...prev, step]
    );
  }

  function resetPipeline() {
    setNodeStatuses({ briefing: "pending", script: "pending", thumbnail: "pending", music: "pending", video: "pending", export: "pending" });
    setResult(null);
    setError("");
    setCurrentStep("");
  }

  async function runPipeline() {
    if (!briefing.trim()) return;
    setRunning(true);
    setError("");
    setCurrentStep("briefing");
    setNodeStatuses((prev) => ({ ...prev, briefing: "running" }));

    try {
      setNodeStatuses((prev) => ({ ...prev, briefing: "completed" }));

      for (const step of enabledSteps) {
        setCurrentStep(step);
        setNodeStatuses((prev) => ({ ...prev, [step]: "running" }));

        if (step === "script") {
          const res = await fetch("/api/minimax/script", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ briefing: `PIPELINE BRIEFING: ${briefing}\nCreate a complete video script.`, saveToAssets: false }),
          });
          if (!res.ok) throw new Error("Script generation failed");
          const scriptData = await res.json();
          setResult((prev) => ({ ...prev, [step]: scriptData }));
        } else if (step === "thumbnail") {
          const res = await fetch("/api/minimax/thumbnail-prompt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ theme: briefing, title: "Pipeline Thumbnail", style: "Modern Tech", text: "New Video" }),
          });
          if (!res.ok) throw new Error("Thumbnail prompt generation failed");
          const tpData = await res.json();
          setResult((prev) => ({ ...prev, [step]: tpData }));
        } else if (step === "music") {
          const res = await fetch("/api/minimax/music", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: `Short instrumental intro music, 10 seconds, modern tech style, energetic, no vocals`, saveToAssets: false }),
          });
          if (!res.ok) throw new Error("Music generation failed");
          const musicData = await res.json();
          setResult((prev) => ({ ...prev, [step]: musicData }));
        } else if (step === "video") {
          const res = await fetch("/api/minimax/video", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: briefing, saveToAssets: false }),
          });
          const videoData = await res.json();
          setResult((prev) => ({ ...prev, [step]: videoData }));
          if (!res.ok) { setNodeStatuses((prev) => ({ ...prev, [step]: "completed" })); continue; }
        } else if (step === "export") {
          const res = await fetch("/api/exports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: `Pipeline - ${briefing.slice(0, 60)}`,
              type: "package",
              status: "completed",
              files: [],
              progress: 100,
              format: outputFormat,
              metadata: { briefing, outputFormat, pipelineResult: result },
            }),
          });
          const exportData = await res.json();
          setResult((prev) => ({ ...prev, [step]: exportData }));
        }

        setNodeStatuses((prev) => ({ ...prev, [step]: "completed" }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pipeline failed");
      if (currentStep) setNodeStatuses((prev) => ({ ...prev, [currentStep]: "failed" }));
    } finally {
      setRunning(false);
    }
  }

  function NodeIcon({ status }: { status: NodeStatus }) {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-5 h-5 text-ok" />;
      case "running":   return <Loader2 className="w-5 h-5 text-warn animate-spin" />;
      case "failed":    return <AlertCircle className="w-5 h-5 text-danger" />;
      default:          return <Circle className="w-5 h-5 text-ink-3" />;
    }
  }

  function statusLabel(status: NodeStatus, isEnabled: boolean) {
    if (status === "completed") return t("pipeline.done");
    if (status === "running")   return t("pipeline.processing");
    if (status === "failed")    return t("pipeline.failed");
    if (!isEnabled)             return t("pipeline.disabled");
    return t("pipeline.waiting");
  }

  const nodeOrder = ["briefing", "script", "thumbnail", "music", "video", "export"];
  const pipelineSteps = ["script", "thumbnail", "music", "export"];

  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="flex flex-col h-full px-6 py-6 lg:px-8 lg:py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-ink mb-1">{t("pipeline.title")}</h1>
            <p className="text-sm text-ink-2">{t("pipeline.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetPipeline}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-hover border border-line text-ink text-sm font-medium hover:border-line-hi transition-all cursor-pointer"
            >
              {t("pipeline.reset")}
            </button>
            <button
              onClick={runPipeline}
              disabled={running || !briefing.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl btn-brand text-sm font-medium transition-all cursor-pointer disabled:opacity-50"
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {running ? t("pipeline.running") : t("pipeline.run")}
            </button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5 min-h-0">
          {/* Canvas */}
          <div className="min-h-0 bg-card border border-line rounded-lg p-6 overflow-y-auto">
            <div className="mb-6">
              <textarea
                value={briefing}
                onChange={(e) => setBriefing(e.target.value)}
                placeholder={t("pipeline.placeholder")}
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-card-hi border border-line text-ink text-sm placeholder:text-ink-3 focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all resize-none"
                disabled={running}
              />
            </div>

            <div className="flex flex-col items-center gap-2">
              {nodeOrder.map((step, i) => {
                const config = nodeConfig[step];
                const status = nodeStatuses[step];
                const isEnabled = step === "briefing" || enabledSteps.includes(step);

                return (
                  <div key={step} className="flex flex-col items-center">
                    <div
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                        status === "running"
                          ? "border-warn/30 bg-warn/5"
                          : status === "completed"
                          ? "border-ok/20 bg-ok/5"
                          : status === "failed"
                          ? "border-danger/20 bg-danger/5"
                          : "border-line bg-card-hi"
                      } ${!isEnabled ? "opacity-40" : ""}`}
                      style={{ width: "260px" }}
                    >
                      <NodeIcon status={status} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink">{config.label}</p>
                        <p className="text-[10px] font-medium" style={{ color: config.color }}>
                          {statusLabel(status, isEnabled)}
                        </p>
                      </div>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: config.color }} />
                    </div>
                    {i < nodeOrder.length - 1 && (
                      <div className="w-px h-4 bg-line" />
                    )}
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-danger-soft border border-danger/20 text-danger text-xs">{error}</div>
            )}
          </div>

          {/* Settings */}
          <div className="min-h-0 bg-card border border-line rounded-lg p-5 overflow-y-auto">
            <h3 className="text-sm font-semibold text-ink mb-3">{t("pipeline.steps")}</h3>
            <div className="space-y-2">
              {pipelineSteps.map((step) => {
                const config = nodeConfig[step];
                return (
                  <label key={step} className="flex items-center gap-3 py-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabledSteps.includes(step)}
                      onChange={() => toggleStep(step)}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: "var(--mm-accent)" }}
                      disabled={running}
                    />
                    <span className="text-sm text-ink">{config.label}</span>
                    <span className="w-2 h-2 rounded-full ml-auto" style={{ backgroundColor: config.color }} />
                  </label>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-line">
              <h3 className="text-sm font-semibold text-ink mb-2">{t("pipeline.outputFormat")}</h3>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as "package" | "individual")}
                className="w-full px-3 py-2 rounded-xl bg-card-hi border border-line text-ink text-sm appearance-none cursor-pointer focus:border-accent/50 transition-all"
              >
                <option value="package">{t("pipeline.packageZip")}</option>
                <option value="individual">{t("pipeline.individualFiles")}</option>
              </select>
              <p className="mt-2 text-[11px] text-ink-3">
                {outputFormat === "package"
                  ? "Export will be saved as a packaged project record."
                  : "Export will keep generated items as separate files in the project record."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

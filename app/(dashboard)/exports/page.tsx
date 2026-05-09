"use client";

import { useState, useEffect } from "react";
import { SortDropdown } from "../../components/SortDropdown";
import { SearchBar } from "../../components/SearchBar";
import {
  Upload, Loader2, Download, Trash2,
  Package, Video, Music, FileText,
  CheckCircle2, AlertCircle, Clock,
} from "lucide-react";
import type { ExportRecord } from "@/lib/minimax/types";
import { useT } from "@/lib/i18n";

function statusIcon(status: string) {
  switch (status) {
    case "completed":  return <CheckCircle2 className="w-4 h-4 text-ok" />;
    case "processing": return <Loader2 className="w-4 h-4 text-warn animate-spin" />;
    case "failed":     return <AlertCircle className="w-4 h-4 text-danger" />;
    default:           return <Clock className="w-4 h-4 text-ink-3" />;
  }
}

function typeIcon(type: string) {
  const cls = "w-5 h-5 text-ink-2";
  switch (type) {
    case "package": return <Package className={cls} />;
    case "video":   return <Video className={cls} />;
    case "music":   return <Music className={cls} />;
    default:        return <FileText className={cls} />;
  }
}

export default function ExportsPage() {
  const { t } = useT();
  const [exports_, setExports] = useState<ExportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [message, setMessage] = useState("");

  const tabs = [
    { key: "all",        label: t("exports.all") },
    { key: "completed",  label: t("exports.completed") },
    { key: "processing", label: t("exports.processing") },
    { key: "failed",     label: t("exports.failed") },
  ];

  async function loadExports() {
    setLoading(true);
    try {
      const res = await fetch("/api/exports");
      const data = await res.json();
      if (data.ok) setExports(data.exports);
    } catch { } finally { setLoading(false); }
  }

  useEffect(() => {
    void Promise.resolve().then(loadExports);
  }, []);

  async function handleDelete(id: string) {
    if (!confirm(t("exports.deleteConfirm"))) return;
    try {
      await fetch(`/api/exports/${id}`, { method: "DELETE" });
      setExports((prev) => prev.filter((e) => e.id !== id));
      setMessage(t("exports.deleted"));
      setTimeout(() => setMessage(""), 2000);
    } catch {
      setMessage(t("exports.deleteFailed"));
    }
  }

  async function handleDownload(exp: ExportRecord) {
    try {
      const res = await fetch(`/api/exports/${exp.id}/download`);
      const data = await res.json();
      if (data.ok) {
        const blob = new Blob([JSON.stringify(data.metadata, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${exp.title}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setMessage(t("exports.downloadStarted"));
      } else {
        setMessage(t("exports.downloadFailed"));
      }
    } catch {
      setMessage(t("exports.downloadFailed"));
    }
    setTimeout(() => setMessage(""), 2000);
  }

  const filtered = exports_.filter((e) => {
    if (activeTab === "all") return true;
    return e.status === activeTab;
  });

  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="flex flex-col h-full px-6 py-6 lg:px-8 lg:py-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-ink mb-1">{t("exports.title")}</h1>
            <p className="text-sm text-ink-2">{t("exports.subtitle")}</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl btn-brand text-sm font-medium transition-all cursor-pointer whitespace-nowrap">
            <Upload className="w-4 h-4" strokeWidth={1.5} />
            {t("exports.new")}
          </button>
        </div>

        {message && (
          <div className="mb-3 p-2 px-3 rounded-xl bg-ok-soft border border-ok/20 text-ok text-xs">{message}</div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-hover text-ink"
                  : "text-ink-2 hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full h-px bg-line mb-4" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="w-full sm:max-w-[400px]">
            <SearchBar placeholder={t("exports.searchPlaceholder")} />
          </div>
          <div className="flex items-center gap-2">
            <SortDropdown label="Date" options={["Date", "Name", "Size"]} />
            <SortDropdown label="Newest" options={["Newest", "Oldest"]} />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-ink-2 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-ink-2">
            <p className="text-sm">{t("exports.noExports")}</p>
            <p className="text-xs mt-1 text-ink-3">{t("exports.noExportsHint")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-line hover:border-line-hi transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-hover flex items-center justify-center flex-shrink-0">
                  {typeIcon(exp.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{exp.title}</p>
                  <p className="text-xs text-ink-2 mt-0.5">{exp.type} · {exp.format} · {exp.files.length} files</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {statusIcon(exp.status)}
                  <span className={`text-xs ${
                    exp.status === "completed" ? "text-ok" :
                    exp.status === "failed" ? "text-danger" : "text-warn"
                  }`}>
                    {exp.status}
                  </span>
                </div>
                {exp.progress < 100 && exp.status === "processing" && (
                  <div className="w-20 bg-hover rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${exp.progress}%` }}
                    />
                  </div>
                )}
                <span className="text-xs text-ink-3 whitespace-nowrap">
                  {new Date(exp.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDownload(exp)}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-ink-3 hover:text-ink hover:bg-hover transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => handleDelete(exp.id)}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-ink-3 hover:text-danger hover:bg-danger-soft transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

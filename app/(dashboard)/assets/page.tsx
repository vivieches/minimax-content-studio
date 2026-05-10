"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Loader2, Trash2, Download, Star } from "lucide-react";
import type { AssetRecord } from "@/lib/minimax/types";
import { useT } from "@/lib/i18n";

const typeConfig: Record<string, { color: string; bg: string; labelKey: string }> = {
  script:    { color: "#60A5FA", bg: "bg-blue-400/10",   labelKey: "assets.type.script" },
  thumbnail: { color: "#FB923C", bg: "bg-orange-400/10", labelKey: "assets.type.thumbnail" },
  music:     { color: "#A78BFA", bg: "bg-violet-400/10", labelKey: "assets.type.music" },
  video:     { color: "#F87171", bg: "bg-red-400/10",    labelKey: "assets.type.video" },
  export:    { color: "#34D399", bg: "bg-green-400/10",  labelKey: "assets.type.export" },
  prompt:    { color: "#FBBF24", bg: "bg-amber-400/10",  labelKey: "assets.type.prompt" },
};

function AssetCardComponent({ asset, onDelete, onToggleFavorite, onDownload }: {
  asset: AssetRecord;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDownload: (asset: AssetRecord) => void;
}) {
  const { t } = useT();
  const config = typeConfig[asset.type] ?? { color: "var(--mm-ink-2)", bg: "bg-hover", labelKey: "" };
  const label = config.labelKey ? t(config.labelKey) : asset.type;

  return (
    <div className="group relative bg-card border border-line rounded-lg overflow-hidden hover:border-line-hi transition-all duration-150">
      <div className={`aspect-video ${config.bg} flex items-center justify-center relative`}>
        {asset.thumbnailPath ? (
          <Image
            src={asset.thumbnailPath}
            alt={asset.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized={asset.thumbnailPath.startsWith("http://")}
          />
        ) : (
          <div className="text-center p-4">
            <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: config.color + "20" }}>
              <span className="text-xs font-bold" style={{ color: config.color }}>{label[0]}</span>
            </div>
            <p className="text-xs text-ink-2 line-clamp-2">{asset.description.slice(0, 80)}</p>
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button onClick={() => onToggleFavorite(asset.id)} className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all">
            <Star className={`w-4 h-4 ${asset.favorite ? "text-amber-400 fill-amber-400" : "text-white"}`} strokeWidth={1.5} />
          </button>
          <button onClick={() => onDownload(asset)} className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all">
            <Download className="w-4 h-4 text-white" strokeWidth={1.5} />
          </button>
          <button onClick={() => onDelete(asset.id)} className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-red-500/30 transition-all">
            <Trash2 className="w-4 h-4 text-white" strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-ink truncate">{asset.title}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] text-ink-3">{new Date(asset.createdAt).toLocaleDateString()}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ color: config.color, backgroundColor: config.color + "18" }}>
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AssetsPage() {
  const { t } = useT();
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [message, setMessage] = useState("");

  useEffect(() => { loadAssets(); }, []);

  async function loadAssets() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== "all") params.set("type", filterType);
      if (search) params.set("search", search);
      const res = await fetch(`/api/assets?${params}`);
      const data = await res.json();
      if (data.ok) setAssets(data.assets);
    } catch { } finally { setLoading(false); }
  }

  useEffect(() => { loadAssets(); }, [filterType]);

  async function handleDelete(id: string) {
    if (!confirm(t("assets.deleteConfirm"))) return;
    try {
      await fetch(`/api/assets/${id}`, { method: "DELETE" });
      setAssets((prev) => prev.filter((a) => a.id !== id));
      setMessage(t("assets.deleted"));
      setTimeout(() => setMessage(""), 2000);
    } catch {
      setMessage(t("assets.deleteFailed"));
    }
  }

  async function handleToggleFavorite(id: string) {
    const asset = assets.find((a) => a.id === id);
    if (!asset) return;
    try {
      await fetch(`/api/assets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: !asset.favorite }),
      });
      setAssets((prev) => prev.map((a) => a.id === id ? { ...a, favorite: !a.favorite } : a));
    } catch { }
  }

  function handleDownload(asset: AssetRecord) {
    if (asset.filePath && asset.filePath.startsWith("http")) { window.open(asset.filePath, "_blank"); return; }
    if (asset.content) {
      const blob = new Blob([asset.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${asset.title}.${asset.type === "script" ? "md" : "txt"}`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      setMessage(t("assets.noDownload"));
      setTimeout(() => setMessage(""), 2000);
    }
  }

  const typeLabels = ["all", "script", "thumbnail", "music", "video", "export", "prompt"];

  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="flex flex-col h-full px-6 py-6 lg:px-8 lg:py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-ink mb-1">{t("assets.title")}</h1>
            <p className="text-sm text-ink-2">{t("assets.subtitle")}</p>
          </div>
        </div>

        {message && (
          <div className="mb-3 p-2 px-3 rounded-xl bg-ok-soft border border-ok/20 text-ok text-xs">{message}</div>
        )}

        <div className="mb-4">
          <form onSubmit={(e) => { e.preventDefault(); loadAssets(); }} className="w-full">
            <div className="relative w-full">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadAssets()}
                placeholder={t("assets.searchPlaceholder")}
                className="w-full px-4 py-2.5 pr-10 rounded-xl bg-card border border-line text-ink text-sm placeholder:text-ink-3 focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
              </button>
            </div>
          </form>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 mb-6 flex-wrap">
          {typeLabels.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterType === type
                  ? "bg-accent-soft text-accent border border-accent/20"
                  : "bg-hover text-ink-2 border border-line hover:bg-line hover:text-ink"
              }`}
            >
              {type === "all" ? t("assets.filterAll") : t(`assets.type.${type}`)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-ink-2 animate-spin" />
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-ink-2">
            <p className="text-sm">{t("assets.noAssets")}</p>
            <p className="text-xs mt-1 text-ink-3">{t("assets.noAssetsHint")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {assets.map((asset) => (
              <AssetCardComponent
                key={asset.id}
                asset={asset}
                onDelete={handleDelete}
                onToggleFavorite={handleToggleFavorite}
                onDownload={handleDownload}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

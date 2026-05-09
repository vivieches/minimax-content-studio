"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Download, RefreshCw, Type, AlignLeft, AlignCenter, AlignRight, ArrowUp, ArrowDown, Minus, Plus } from "lucide-react";
import {
  applyTextOverlay,
  downloadDataUrl,
  type TextOverlayOptions,
  DEFAULT_OVERLAY_OPTIONS,
} from "@/lib/text-overlay";

interface TextOverlayEditorProps {
  baseImageUrl: string;
  defaultText: string;
  onDownload?: (dataUrl: string) => void;
}

export default function TextOverlayEditor({ baseImageUrl, defaultText, onDownload }: TextOverlayEditorProps) {
  const [options, setOptions] = useState<TextOverlayOptions>({
    ...DEFAULT_OVERLAY_OPTIONS,
    text: defaultText,
  });
  const [previewUrl, setPreviewUrl] = useState<string>(baseImageUrl);
  const [isProcessing, setIsProcessing] = useState(false);

  const updatePreview = useCallback(async () => {
    if (!options.text.trim()) {
      setPreviewUrl(baseImageUrl);
      return;
    }
    setIsProcessing(true);
    try {
      const result = await applyTextOverlay(baseImageUrl, options);
      setPreviewUrl(result);
    } catch {
      setPreviewUrl(baseImageUrl);
    } finally {
      setIsProcessing(false);
    }
  }, [baseImageUrl, options]);

  useEffect(() => {
    const timer = setTimeout(updatePreview, 300);
    return () => clearTimeout(timer);
  }, [updatePreview]);

  const handleDownload = () => {
    const filename = `thumbnail-with-text-${Date.now()}.png`;
    if (previewUrl.startsWith("data:")) {
      downloadDataUrl(previewUrl, filename);
    } else {
      onDownload?.(previewUrl);
    }
  };

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-card-hi border border-line">
        <Image
          src={previewUrl}
          alt="Thumbnail with text overlay"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized
        />
        {isProcessing && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-3 p-4 rounded-xl bg-card-hi border border-line">
        <h4 className="text-xs font-semibold text-ink flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5 text-accent" />
          Text Overlay Editor
        </h4>

        {/* Text Input */}
        <div>
          <label className="block text-[11px] text-ink-3 mb-1">Text</label>
          <input
            type="text"
            value={options.text}
            onChange={(e) => setOptions((prev) => ({ ...prev, text: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-card border border-line text-ink text-sm focus:border-accent/50 outline-none"
            placeholder="Enter thumbnail text"
          />
        </div>

        {/* Position */}
        <div>
          <label className="block text-[11px] text-ink-3 mb-1">Position</label>
          <div className="flex gap-2">
            {[
              { id: "top", icon: ArrowUp, label: "Top" },
              { id: "center", icon: AlignCenter, label: "Center" },
              { id: "bottom", icon: ArrowDown, label: "Bottom" },
            ].map((pos) => (
              <button
                key={pos.id}
                onClick={() => setOptions((prev) => ({ ...prev, position: pos.id as TextOverlayOptions["position"] }))}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  options.position === pos.id
                    ? "bg-accent text-white"
                    : "bg-card border border-line text-ink-2 hover:bg-hover"
                }`}
              >
                <pos.icon className="w-3.5 h-3.5" />
                {pos.label}
              </button>
            ))}
          </div>
        </div>

        {/* Alignment */}
        <div>
          <label className="block text-[11px] text-ink-3 mb-1">Alignment</label>
          <div className="flex gap-2">
            {[
              { id: "left", icon: AlignLeft },
              { id: "center", icon: AlignCenter },
              { id: "right", icon: AlignRight },
            ].map((align) => (
              <button
                key={align.id}
                onClick={() => setOptions((prev) => ({ ...prev, alignment: align.id as TextOverlayOptions["alignment"] }))}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  options.alignment === align.id
                    ? "bg-accent text-white"
                    : "bg-card border border-line text-ink-2 hover:bg-hover"
                }`}
              >
                <align.icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div>
          <label className="block text-[11px] text-ink-3 mb-1">Font Size: {options.fontSize}px</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOptions((prev) => ({ ...prev, fontSize: Math.max(24, prev.fontSize - 8) }))}
              className="w-8 h-8 rounded-lg bg-card border border-line flex items-center justify-center hover:bg-hover transition-all"
            >
              <Minus className="w-3.5 h-3.5 text-ink-2" />
            </button>
            <input
              type="range"
              min="24"
              max="200"
              step="4"
              value={options.fontSize}
              onChange={(e) => setOptions((prev) => ({ ...prev, fontSize: Number(e.target.value) }))}
              className="flex-1 accent-accent"
            />
            <button
              onClick={() => setOptions((prev) => ({ ...prev, fontSize: Math.min(200, prev.fontSize + 8) }))}
              className="w-8 h-8 rounded-lg bg-card border border-line flex items-center justify-center hover:bg-hover transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-ink-2" />
            </button>
          </div>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-ink-3 mb-1">Text Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={options.color}
                onChange={(e) => setOptions((prev) => ({ ...prev, color: e.target.value }))}
                className="w-8 h-8 rounded-lg border border-line cursor-pointer"
              />
              <span className="text-xs text-ink-2">{options.color}</span>
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-ink-3 mb-1">Stroke Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={options.strokeColor}
                onChange={(e) => setOptions((prev) => ({ ...prev, strokeColor: e.target.value }))}
                className="w-8 h-8 rounded-lg border border-line cursor-pointer"
              />
              <span className="text-xs text-ink-2">{options.strokeWidth}px</span>
            </div>
          </div>
        </div>

        {/* Stroke Width */}
        <div>
          <label className="block text-[11px] text-ink-3 mb-1">Stroke Width: {options.strokeWidth}px</label>
          <input
            type="range"
            min="0"
            max="12"
            step="1"
            value={options.strokeWidth}
            onChange={(e) => setOptions((prev) => ({ ...prev, strokeWidth: Number(e.target.value) }))}
            className="w-full accent-accent"
          />
        </div>

        {/* Shadow */}
        <div>
          <label className="block text-[11px] text-ink-3 mb-1">Shadow Blur: {options.shadowBlur}px</label>
          <input
            type="range"
            min="0"
            max="30"
            step="2"
            value={options.shadowBlur}
            onChange={(e) => setOptions((prev) => ({ ...prev, shadowBlur: Number(e.target.value) }))}
            className="w-full accent-accent"
          />
        </div>

        {/* Download */}
        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl btn-brand text-sm font-medium transition-all"
        >
          <Download className="w-4 h-4" />
          Download Final Thumbnail
        </button>
      </div>
    </div>
  );
}

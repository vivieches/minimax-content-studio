"use client";

import { useEffect, useState } from "react";
import { Sparkles, Loader2, Play, Pause, Download, Music4 } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { AssetRecord } from "@/lib/minimax/types";

export default function MusicGeneratorPage() {
  const { t } = useT();
  const [mood, setMood] = useState("Energetic");
  const [genre, setGenre] = useState("Electronic");
  const [tempo, setTempo] = useState("Medium (120 BPM)");
  const [duration, setDuration] = useState("10 sec");
  const [instruments, setInstruments] = useState("Synth, Bass, Drums");
  const [isInstrumental, setIsInstrumental] = useState(true);
  const [customPrompt, setCustomPrompt] = useState("");

  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState<{ audioUrl?: string; error?: string; jobId?: string } | null>(null);
  const [error, setError] = useState("");
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [recentTracks, setRecentTracks] = useState<AssetRecord[]>([]);

  useEffect(() => {
    loadRecentTracks();
  }, []);

  async function loadRecentTracks() {
    try {
      const res = await fetch("/api/assets?type=music&limit=5");
      const data = await res.json();
      if (data.ok) setRecentTracks(data.assets);
    } catch {
      setRecentTracks([]);
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setError("");
    const prompt = customPrompt || `Create a ${mood} ${genre} track. Tempo: ${tempo}. Duration: ${duration}. Instruments: ${instruments}. ${isInstrumental ? "Instrumental only, no vocals." : ""}`;
    try {
      const res = await fetch("/api/minimax/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, isInstrumental }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error || "Generation failed");
      setResult(data);
      await loadRecentTracks();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate music");
    } finally {
      setLoading(false);
    }
  }

  function togglePlay() {
    if (!result?.audioUrl) return;
    if (audioEl) {
      audioEl.pause();
      setAudioEl(null);
      setPlaying(false);
      return;
    }
    const audio = new Audio(result.audioUrl);
    audio.play();
    audio.onended = () => { setPlaying(false); setAudioEl(null); };
    setAudioEl(audio);
    setPlaying(true);
  }

  const moods = [
    { value: "Energetic", labelKey: "music.mood.energetic" },
    { value: "Calm", labelKey: "music.mood.calm" },
    { value: "Dramatic", labelKey: "music.mood.dramatic" },
    { value: "Happy", labelKey: "music.mood.happy" },
    { value: "Dark", labelKey: "music.mood.dark" },
    { value: "Inspirational", labelKey: "music.mood.inspirational" },
  ];
  const genres = [
    { value: "Electronic", labelKey: "music.genre.electronic" },
    { value: "Hip-Hop", labelKey: "music.genre.hiphop" },
    { value: "Rock", labelKey: "music.genre.rock" },
    { value: "Cinematic", labelKey: "music.genre.cinematic" },
    { value: "Lo-Fi", labelKey: "music.genre.lofi" },
    { value: "Ambient", labelKey: "music.genre.ambient" },
    { value: "Pop", labelKey: "music.genre.pop" },
    { value: "Jazz", labelKey: "music.genre.jazz" },
  ];
  const tempos = ["Slow (60 BPM)", "Medium (120 BPM)", "Fast (160 BPM)"];
  const durations = ["5 sec", "10 sec", "15 sec", "30 sec", "1 min"];

  const trackDetailRows = [
    [t("music.format"), "MP3"],
    [t("music.sampleRate"), "44.1 kHz"],
    [t("music.bitrate"), "256 kbps"],
    [t("music.duration"), duration],
    [t("music.bpm"), tempo],
    [t("music.channels"), "Stereo"],
  ];

  const selectClass = "w-full px-3 py-2 rounded-xl bg-card-hi border border-line text-ink text-sm appearance-none cursor-pointer focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all";
  const labelClass = "block text-[11px] text-ink-3 uppercase tracking-wider mb-1";

  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="flex flex-col h-full px-6 py-6 lg:px-8 lg:py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-ink mb-1">{t("music.title")}</h1>
            <p className="text-sm text-ink-2">{t("music.subtitle")}</p>
          </div>
        </div>

        <div className="mb-4 p-3 rounded-xl bg-accent/5 border border-accent/10 text-ink-2 text-xs flex items-center gap-2">
          <span className="text-accent">&#9432;</span>
          <span>{t("music.waitNoticePrefix")} <strong className="text-ink">60-120 seconds</strong>. {t("music.waitNoticeSuffix")}</span>
        </div>

        {error && (
          <div className="mb-3 p-3 rounded-xl bg-danger-soft border border-danger/20 text-danger text-xs">{error}</div>
        )}

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[250px_1fr_210px] grid-rows-[auto_auto] gap-5 min-h-0">
          {/* Settings */}
          <div className="row-span-2 min-h-0 bg-card border border-line rounded-2xl p-5 overflow-y-auto">
            <h3 className="text-sm font-semibold text-ink mb-4">{t("music.settings")}</h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>{t("music.mood")}</label>
                <select value={mood} onChange={(e) => setMood(e.target.value)} className={selectClass}>
                  {moods.map((m) => <option key={m.value} value={m.value}>{t(m.labelKey)}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t("music.genre")}</label>
                <select value={genre} onChange={(e) => setGenre(e.target.value)} className={selectClass}>
                  {genres.map((g) => <option key={g.value} value={g.value}>{t(g.labelKey)}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t("music.tempo")}</label>
                <select value={tempo} onChange={(e) => setTempo(e.target.value)} className={selectClass}>
                  {tempos.map((t_) => <option key={t_} value={t_}>{t_}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t("music.duration")}</label>
                <select value={duration} onChange={(e) => setDuration(e.target.value)} className={selectClass}>
                  {durations.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t("music.instruments")}</label>
                <input
                  type="text"
                  value={instruments}
                  onChange={(e) => setInstruments(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-card-hi border border-line text-ink text-sm focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                />
              </div>
              <div>
                <label className={labelClass}>{t("music.customPrompt")}</label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder={t("music.customPromptPlaceholder")}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-card-hi border border-line text-ink text-sm placeholder:text-ink-3 focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all resize-none"
                />
              </div>
              <label className="flex items-center justify-between py-1 cursor-pointer">
                <span className="text-sm text-ink">{t("music.instrumentalOnly")}</span>
                <button
                  onClick={() => setIsInstrumental(!isInstrumental)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${isInstrumental ? "bg-accent" : "bg-line-hi"}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${isInstrumental ? "left-6" : "left-1"}`} />
                </button>
              </label>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl btn-brand text-sm font-medium transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? t("music.generating") : t("music.generate")}
            </button>
          </div>

          {/* Player */}
          <div className="min-h-0 bg-card border border-line rounded-2xl p-6 flex flex-col items-center justify-center">
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-accent animate-spin" />
                <span className="text-sm text-ink-2">{t("music.generatingMsg")}</span>
              </div>
            ) : result?.audioUrl ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-accent-soft border border-accent/20 flex items-center justify-center">
                  <Music4 className="w-8 h-8 text-accent" />
                </div>
                <p className="text-sm font-medium text-ink">{mood} {genre}</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full btn-brand flex items-center justify-center transition-all"
                  >
                    {playing
                      ? <Pause className="w-5 h-5 text-accent-fg" />
                      : <Play className="w-5 h-5 text-accent-fg ml-0.5" />}
                  </button>
                  <a
                    href={result.audioUrl}
                    download={`music-${Date.now()}.mp3`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-hover border border-line flex items-center justify-center hover:bg-line transition-all"
                  >
                    <Download className="w-5 h-5 text-ink" />
                  </a>
                </div>
                {/* Waveform */}
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full"
                      style={{
                        height: `${10 + Math.sin(i * 0.5) * 16 + 12}px`,
                        backgroundColor: i % 2 === 0 ? "var(--mm-accent)" : "var(--mm-line-hi)",
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-ink-2">
                <Music4 className="w-8 h-8 opacity-30" />
                <p className="text-sm">{t("music.configureAndGenerate")}</p>
              </div>
            )}
          </div>

          {/* Track Details */}
          <div className="min-h-0 bg-card border border-line rounded-2xl p-5 overflow-y-auto">
            <h3 className="text-sm font-semibold text-ink mb-3">{t("music.trackDetails")}</h3>
            {result?.audioUrl ? (
              <div className="space-y-3">
                {trackDetailRows.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between py-1.5 border-b border-line">
                    <span className="text-[11px] text-ink-3 uppercase tracking-wider">{label}</span>
                    <span className="text-xs text-ink font-medium">{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ink-2">{t("music.detailsEmpty")}</p>
            )}
          </div>

          {/* Recent */}
          <div className="lg:col-span-2 min-h-0 bg-card border border-line rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-ink mb-3">{t("music.recentGenerations")}</h3>
            {recentTracks.length > 0 ? (
              <div className="space-y-1">
                {recentTracks.map((track) => (
                  <div key={track.id} className="flex items-center gap-3 py-2">
                    <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center">
                      <Music4 className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ink truncate">{track.title}</p>
                      <p className="text-[10px] text-ink-2">{new Date(track.createdAt).toLocaleString()}</p>
                    </div>
                    {track.filePath && (
                      <a
                        href={track.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-md bg-hover flex items-center justify-center hover:bg-line transition-all"
                      >
                        <Play className="w-3 h-3 text-ink ml-0.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ink-2 py-4 text-center">{t("music.noGenerations")}</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

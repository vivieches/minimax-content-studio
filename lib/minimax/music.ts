import { getResolvedConfig, createMiniMaxHeaders } from "./config";
import { classifyMiniMaxError } from "./errors";
import type { JobStatusResponse } from "./types";

const pendingJobs = new Map<string, { status: string; outputUrl?: string; error?: string }>();

export async function generateMusic(params: {
  prompt: string;
  isInstrumental?: boolean;
  sampleRate?: number;
  bitrate?: number;
  format?: string;
}): Promise<{ jobId?: string; audioUrl: string; rawData: string; error: string }> {
  const config = await getResolvedConfig();

  if (!config.apiKey) {
    const { isEffectiveDemoMode } = await import("./client");
    if (await isEffectiveDemoMode()) {
      return { audioUrl: "", rawData: "", error: "", jobId: "demo-job-1" };
    }
    throw new Error("MINIMAX_API_KEY is not configured. Please go to Settings and enter your MiniMax API key.");
  }

  const { prompt, isInstrumental = true, sampleRate = 44100, bitrate = 256000, format = "mp3" } = params;

  // Music generation can take a long time, so we use a longer timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout - music generation can take a while

  const response = await fetch(`${config.baseUrl}/v1/music_generation`, {
    method: "POST",
    headers: createMiniMaxHeaders(config),
    body: JSON.stringify({
      model: config.musicModel || "music-2.6",
      prompt,
      is_instrumental: isInstrumental,
      output_format: "url",
      audio_setting: {
        sample_rate: sampleRate,
        bitrate,
        format,
      },
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    const body = await response.text();
    throw classifyMiniMaxError(response.status, body);
  }

  const data = await response.json();

  if (data?.base_resp?.status_code !== undefined && data.base_resp.status_code !== 0) {
    throw new Error(`MiniMax Music API error: ${data.base_resp.status_msg || "Unknown error"}`);
  }

  const rawCandidates = [
    data?.data?.audio,
    data?.data?.audio_url,
    data?.data?.url,
    data?.audio_url,
    data?.url,
    data?.result?.audio_url,
    data?.result?.url,
  ];

  let validUrl = "";
  let rawValue = "";

  for (const candidate of rawCandidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      const trimmed = candidate.trim();
      if (trimmed.startsWith("http")) {
        validUrl = trimmed;
        break;
      }
      if (!rawValue && trimmed.length > 50) {
        rawValue = trimmed;
      }
    }
  }

  if (validUrl) {
    const jobId = `music-${Date.now()}`;
    pendingJobs.set(jobId, { status: "completed", outputUrl: validUrl });
    return { jobId, audioUrl: validUrl, rawData: "", error: "" };
  }

  if (rawValue) {
    return {
      audioUrl: "",
      rawData: rawValue,
      error: "Music API returned raw data instead of a URL. The player cannot play this format.",
    };
  }

  return { audioUrl: "", rawData: "", error: "Music API did not return a valid audio URL." };
}

export function getMusicJobStatus(jobId: string): JobStatusResponse {
  const job = pendingJobs.get(jobId);
  if (!job) {
    return { status: "failed", errorMessage: "Job not found" };
  }
  return {
    status: job.status as JobStatusResponse["status"],
    outputUrl: job.outputUrl,
    errorMessage: job.error,
  };
}

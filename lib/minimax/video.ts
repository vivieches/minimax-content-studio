
import { getResolvedConfig, createMiniMaxHeaders } from "./config";
import { classifyMiniMaxError } from "./errors";
import type { JobStatusResponse } from "./types";

const pendingJobs = new Map<string, { status: string; outputUrl?: string; error?: string }>();

export async function generateVideo(params: {
  prompt: string;
  imageUrl?: string;
  duration?: number;
}): Promise<{ jobId: string; status: string }> {
  const config = await getResolvedConfig();

  if (!config.apiKey) {
    const { isEffectiveDemoMode } = await import("./client");
    if (await isEffectiveDemoMode()) {
      const jobId = `video-demo-${Date.now()}`;
      pendingJobs.set(jobId, {
        status: "completed",
        outputUrl: "https://placehold.co/1920x1080/0F1118/8B5CF6?text=MiniMax+Studio+Demo+Video",
      });
      return { jobId, status: "completed" };
    }
    throw new Error("MINIMAX_API_KEY is not configured. Please go to Settings and enter your MiniMax API key.");
  }

  if (!config.videoModel) {
    const jobId = `video-placeholder-${Date.now()}`;
    pendingJobs.set(jobId, {
      status: "failed",
      error:
        "Video model not configured. Set MINIMAX_VIDEO_MODEL in your .env.local or Settings page. MiniMax Video/Hailuo API integration is pending.",
    });
    return { jobId, status: "failed" };
  }

  const { prompt, imageUrl, duration = 5 } = params;

  try {
    const response = await fetch(`${config.baseUrl}/v1/video_generation`, {
      method: "POST",
      headers: createMiniMaxHeaders(config),
      body: JSON.stringify({
        model: config.videoModel,
        prompt,
        image_url: imageUrl ?? undefined,
        duration,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw classifyMiniMaxError(response.status, body);
    }

    const data = await response.json();

    if (data?.base_resp?.status_code !== undefined && data.base_resp.status_code !== 0) {
      throw new Error(`MiniMax Video API error: ${data.base_resp.status_msg || "Unknown error"}`);
    }

    const jobId = data?.data?.job_id ?? data?.job_id ?? `video-${Date.now()}`;
    const outputUrl = data?.data?.video_url ?? data?.video_url ?? data?.data?.url ?? data?.url;

    pendingJobs.set(jobId, {
      status: outputUrl ? "completed" : "queued",
      outputUrl: outputUrl ?? undefined,
    });

    return { jobId, status: outputUrl ? "completed" : "queued" };
  } catch {
    const jobId = `video-error-${Date.now()}`;
    pendingJobs.set(jobId, {
      status: "failed",
      error:
        "Video generation via MiniMax API is not yet available or the endpoint has changed. Check MiniMax documentation for the latest video generation endpoint.",
    });
    return { jobId, status: "failed" };
  }
}

export function getVideoJobStatus(jobId: string): JobStatusResponse {
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

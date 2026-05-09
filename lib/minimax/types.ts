export interface TextGenerationRequest {
  model?: string;
  systemPrompt: string;
  userMessage: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ImageGenerationRequest {
  model?: string;
  prompt: string;
  aspectRatio?: string;
  n?: number;
  responseFormat?: "url" | "b64_json";
  promptOptimizer?: boolean;
}

export interface MusicGenerationRequest {
  model?: string;
  prompt: string;
  isInstrumental?: boolean;
  outputFormat?: "url" | "base64";
  sampleRate?: number;
  bitrate?: number;
  format?: string;
}

export interface VideoGenerationRequest {
  model?: string;
  prompt: string;
  imageUrl?: string;
  duration?: number;
}

export interface JobStatusResponse {
  status: "queued" | "processing" | "completed" | "failed";
  progress?: number;
  outputUrl?: string;
  errorMessage?: string;
}

export interface AssetRecord {
  id: string;
  type: "script" | "thumbnail" | "music" | "video" | "export" | "prompt";
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  filePath?: string;
  content?: string;
  thumbnailPath?: string;
  metadata?: Record<string, unknown>;
  sourceModule?: string;
  tags?: string[];
  favorite?: boolean;
}

export interface ExportRecord {
  id: string;
  title: string;
  type: "package" | "video" | "music" | "document";
  status: "completed" | "processing" | "failed" | "pending";
  files: string[];
  createdAt: string;
  updatedAt: string;
  progress: number;
  format: string;
  downloadPath?: string;
  metadata?: Record<string, unknown>;
}

export type ExportStatus = "completed" | "processing" | "failed" | "pending";

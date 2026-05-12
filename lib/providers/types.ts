import type { Diagnostic } from "@/lib/daemon/diagnostics";
import type { Locale } from "@/lib/locales";

export type ActiveProviderCapability = "text" | "image";
export type LegacyProviderCapability = "audio" | "video";
export type ProviderCapability = ActiveProviderCapability | LegacyProviderCapability;

export const activeProviderCapabilities: ActiveProviderCapability[] = ["text", "image"];

export interface ProviderManifest {
  id: string;
  adapterId: string;
  name: string;
  description: string;
  capabilities: ProviderCapability[];
  defaultBaseUrl: string;
  defaultModels: Partial<Record<ProviderCapability, string>>;
  modelOptions?: Partial<Record<ProviderCapability, string[]>>;
  modelDiscovery: boolean;
  docsUrl: string;
  authHeader: string;
  requiresModelFor: ActiveProviderCapability[];
  tags?: string[];
  extraDefaults?: Record<string, string>;
}

export interface ProviderStoredConfig {
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  models: Partial<Record<ProviderCapability, string>>;
  customHeaders?: Record<string, string>;
  extra?: Record<string, string>;
  updatedAt?: string;
}

export type ProviderDefaults = Record<
  ActiveProviderCapability,
  {
    providerId: string;
    model: string;
  }
>;

export interface ProviderRuntimeConfig extends ProviderStoredConfig {
  providerId: string;
  manifest: ProviderManifest;
}

export interface ProviderTestResult {
  ok: boolean;
  models: string[];
  error?: string;
}

export interface TextGenerationRequest {
  systemPrompt?: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  locale?: Locale;
}

export interface TextGenerationResult {
  content: string;
  providerId: string;
  model: string;
  raw?: unknown;
  diagnostics?: Diagnostic[];
}

export interface ImageGenerationRequest {
  prompt: string;
  model?: string;
  aspectRatio?: string;
  n?: number;
  referenceImage?: string;
  referenceType?: "face" | "style";
  locale?: Locale;
  visibleText?: string;
}

export interface ImageGenerationResult {
  urls: string[];
  base64s: string[];
  finalPrompt: string;
  providerId: string;
  model: string;
  jobId?: string;
  raw?: unknown;
  diagnostics?: Diagnostic[];
}

export interface AudioGenerationRequest {
  prompt: string;
  model?: string;
  voiceId?: string;
  format?: string;
  isInstrumental?: boolean;
  sampleRate?: number;
  bitrate?: number;
}

export interface AudioGenerationResult {
  audioUrl: string;
  rawData: string;
  error: string;
  providerId: string;
  model: string;
  jobId?: string;
  raw?: unknown;
}

export interface VideoGenerationRequest {
  prompt: string;
  model?: string;
  imageUrl?: string;
  duration?: number;
}

export interface VideoGenerationResult {
  jobId: string;
  status: string;
  outputUrl?: string;
  providerId: string;
  model: string;
  raw?: unknown;
}

export interface ProviderAdapter {
  testConnection(config: ProviderRuntimeConfig): Promise<ProviderTestResult>;
  listModels?(config: ProviderRuntimeConfig): Promise<string[]>;
  generateText?(
    request: TextGenerationRequest,
    config: ProviderRuntimeConfig
  ): Promise<TextGenerationResult>;
  generateImage?(
    request: ImageGenerationRequest,
    config: ProviderRuntimeConfig
  ): Promise<ImageGenerationResult>;
  generateAudio?(
    request: AudioGenerationRequest,
    config: ProviderRuntimeConfig
  ): Promise<AudioGenerationResult>;
  generateVideo?(
    request: VideoGenerationRequest,
    config: ProviderRuntimeConfig
  ): Promise<VideoGenerationResult>;
}

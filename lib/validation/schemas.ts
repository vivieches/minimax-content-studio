import { z } from "zod";
import { sanitizeAgentCliEnv } from "@/lib/daemon/agentConfig";
import { normalizeLocale, SUPPORTED_LOCALES } from "@/lib/locales";

const capabilitySchema = z.enum(["text", "image"]);
const providerIdSchema = z.string().min(1).max(100);
const capabilityModelMapSchema = z.object({
  text: z.string().max(200).optional(),
  image: z.string().max(200).optional(),
  audio: z.string().max(200).optional(),
  video: z.string().max(200).optional(),
});
const providerOverrideSchema = z.object({
  providerId: providerIdSchema.optional(),
  model: z.string().max(200).optional(),
});
const localeSchema = z.preprocess(
  (raw) => normalizeLocale(raw),
  z.enum(SUPPORTED_LOCALES)
);

const creatorProfileSchema = z.object({
  tiktok: z.string().max(500).optional(),
  instagram: z.string().max(500).optional(),
  x: z.string().max(500).optional(),
  businessEmail: z.string().max(500).optional(),
  primaryLinkLabel: z.string().max(120).optional(),
  primaryLinkUrl: z.string().max(1000).optional(),
  language: z.union([z.literal("auto"), localeSchema]).optional().default("auto"),
});
const titleCandidateInputSchema = z.object({
  title: z.string().min(1).max(500),
  score: z.number().min(0).max(100).optional(),
  reason: z.string().max(1000).optional(),
  ctrAngle: z.string().max(500).optional(),
  seoKeywords: z.array(z.string().max(120)).max(30).optional(),
}).passthrough();

const providerStoredConfigSchema = z.object({
  enabled: z.boolean().optional(),
  apiKey: z.string().max(1000).optional(),
  baseUrl: z.string().url().max(500).optional(),
  models: capabilityModelMapSchema.optional(),
  customHeaders: z.record(z.string().max(100), z.string().max(500)).optional(),
  extra: z.record(z.string().max(100), z.string().max(500)).optional(),
  updatedAt: z.string().max(100).optional(),
});

const providerDefaultsSchema = z.object({
  text: z.object({
    providerId: providerIdSchema,
    model: z.string().max(200),
  }).optional(),
  image: z.object({
    providerId: providerIdSchema,
    model: z.string().max(200),
  }).optional(),
});

const agentChoiceSchema = z.object({
  model: z.string().max(200).optional(),
  reasoning: z.string().max(80).optional(),
});
const agentCliEnvSchema = z.preprocess(
  (raw) => sanitizeAgentCliEnv(raw),
  z.record(providerIdSchema, z.record(z.string().max(100), z.string().max(1000)))
);

// ── Settings ──────────────────────────────────────────────────────────
export const settingsSchema = z.object({
  action: z.enum(["reset", "clear_assets"]).optional(),
  providers: z.record(providerIdSchema, providerStoredConfigSchema).optional(),
  defaults: providerDefaultsSchema.optional(),
  executionMode: z.enum(["cli", "byok"]).optional(),
  agentId: z.string().max(100).nullable().optional(),
  agentModels: z.record(providerIdSchema, agentChoiceSchema).optional(),
  agentCliEnv: agentCliEnvSchema.optional(),
  language: localeSchema.optional(),
  // Legacy MiniMax settings are accepted for backward-compatible writes/tests.
  apiKey: z.string().max(500).optional(),
  apiKeyType: z.enum(["pay_as_you_go", "token_plan"]).optional(),
  baseUrl: z.string().url().max(500).optional(),
  textModel: z.string().max(100).optional(),
  textModelFast: z.string().max(100).optional(),
  imageModel: z.string().max(100).optional(),
  musicModel: z.string().max(100).optional(),
  videoModel: z.string().max(100).optional(),
  providerMode: z.enum(["official-text-v2", "openai-compatible", "anthropic-compatible"]).optional(),
  demoMode: z.boolean().optional(),
  debugMode: z.boolean().optional(),
  exportDirectory: z.string().max(500).optional(),
});

// ── Assets ───────────────────────────────────────────────────────────
export const assetSchema = z.object({
  type: z.enum(["script", "thumbnail", "music", "video", "export", "prompt"]),
  title: z.string().min(1).max(500),
  description: z.string().max(2000),
  content: z.string().optional(),
  filePath: z.string().max(1000).optional(),
  thumbnailPath: z.string().max(1000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  sourceModule: z.string().max(100).optional(),
  tags: z.array(z.string().max(200)).max(50).optional(),
  favorite: z.boolean().optional(),
});

// ── Exports ──────────────────────────────────────────────────────────
export const exportSchema = z.object({
  title: z.string().min(1).max(500),
  type: z.enum(["package", "document"]),
  status: z.enum(["completed", "processing", "failed", "pending"]),
  files: z.array(z.string().max(1000)).max(100),
  progress: z.number().min(0).max(100),
  format: z.string().max(50),
  downloadPath: z.string().max(1000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ── Script Generation ────────────────────────────────────────────────
export const scriptGenerateSchema = z.object({
  briefing: z.string().min(1).max(2000),
  locale: localeSchema.optional(),
  saveToAssets: z.boolean().optional().default(true),
});

// ── Thumbnail Prompt (legacy prompt generation) ──────────────────────
export const thumbnailGenerateSchema = z.object({
  theme: z.string().min(1).max(500),
  title: z.string().min(1).max(500),
  style: z.string().min(1).max(200),
  text: z.string().min(1).max(200),
  language: localeSchema.optional(),
});

// ── Thumbnail Input (full UI form validation) ────────────────────────
export const thumbnailInputSchema = z.object({
  topic: z.string().min(1).max(500),
  title: z.string().min(1).max(500),
  hookText: z.string().min(1).max(200),
  audience: z.string().min(1).max(100),
  style: z.string().min(1).max(100),
  mood: z.string().min(1).max(100),
  includeFace: z.boolean().default(false),
  includeText: z.boolean().default(true),
  includeLogo: z.boolean().default(false),
  background: z.string().min(1).max(100),
  brand: z.string().max(100).optional(),
  colorPreference: z.string().max(100).optional(),
  hasReferenceFace: z.boolean().default(false),
  hasReferenceStyle: z.boolean().default(false),
  safeTextMode: z.boolean().default(false),
  variations: z.number().int().min(1).max(4).default(1),
  locale: localeSchema.optional(),
});

// ── Music Generation ─────────────────────────────────────────────────
export const musicGenerateSchema = z.object({
  prompt: z.string().min(1).max(2000),
  isInstrumental: z.boolean().optional().default(true),
  sampleRate: z.number().int().min(8000).max(48000).optional(),
  bitrate: z.number().int().min(32000).max(320000).optional(),
  format: z.string().max(20).optional(),
  saveToAssets: z.boolean().optional().default(true),
});

// ── Image Generation ─────────────────────────────────────────────────
export const imageGenerateSchema = z.object({
  prompt: z.string().min(1).max(4000),
  aspectRatio: z.string().max(20).optional().default("16:9"),
  n: z.number().int().min(1).max(4).optional().default(1),
  saveToAssets: z.boolean().optional().default(true),
  referenceImage: z.string().max(500000).optional(), // base64 encoded image
  referenceType: z.enum(["face", "style"]).optional(),
  locale: localeSchema.optional(),
  visibleText: z.string().max(500).optional(),
});

// ── Video Generation ─────────────────────────────────────────────────
export const videoGenerateSchema = z.object({
  prompt: z.string().min(1).max(2000),
  imageUrl: z.string().url().max(2000).optional(),
  duration: z.number().min(1).max(60).optional(),
  saveToAssets: z.boolean().optional().default(true),
  provider: providerOverrideSchema.optional(),
});

// ── Provider-agnostic Generation ─────────────────────────────────────
export const textProviderGenerateSchema = z.object({
  prompt: z.string().min(1).max(4000),
  systemPrompt: z.string().max(4000).optional(),
  maxTokens: z.number().int().min(1).max(32000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  provider: providerOverrideSchema.optional(),
  locale: localeSchema.optional(),
});

export const imageProviderGenerateSchema = imageGenerateSchema.extend({
  provider: providerOverrideSchema.optional(),
});

export const thumbnailBatchGenerateSchema = z.object({
  topic: z.string().min(1).max(4000),
  title: z.string().max(1000).optional(),
  impactText: z.string().max(500).optional(),
  audience: z.string().max(500).optional(),
  visualStyle: z.string().max(500).optional(),
  mood: z.string().max(500).optional(),
  background: z.string().max(500).optional(),
  colorPreference: z.string().max(500).optional(),
  includeFace: z.boolean().optional().default(false),
  includeLogo: z.boolean().optional().default(false),
  includeText: z.boolean().optional().default(true),
  safeTextMode: z.boolean().optional().default(false),
  quantity: z.number().int().min(1).max(10).optional().default(1),
  aspectRatio: z.string().max(20).optional().default("16:9"),
  referenceImage: z.string().max(500000).optional(),
  referenceType: z.enum(["face", "style"]).optional(),
  provider: providerOverrideSchema.optional(),
  locale: localeSchema.optional(),
  saveToAssets: z.boolean().optional().default(true),
});

export const titleGenerateSchema = z.object({
  topic: z.string().min(1),
  briefing: z.string().optional(),
  audience: z.string().optional(),
  thumbnailConcept: z.string().optional(),
  outlierNotes: z.string().optional(),
  count: z.number().int().min(3).max(20).optional().default(10),
  research: z.boolean().optional().default(false),
  maxSources: z.number().int().min(1).max(20).optional().default(6),
  projectId: z.string().max(200).optional(),
  provider: providerOverrideSchema.optional(),
  locale: localeSchema.optional(),
  saveToAssets: z.boolean().optional().default(true),
});

export const researchSearchSchema = z.object({
  query: z.string().min(1).max(4000),
  maxSources: z.number().int().min(1).max(20).optional().default(6),
  projectId: z.string().max(200).optional(),
});

export const captionGenerateSchema = z.object({
  script: z.string().min(1).max(12000),
  topic: z.string().max(1000).optional(),
  title: z.string().max(500).optional(),
  pattern: z.string().max(6000).optional(),
  creatorProfile: creatorProfileSchema.optional(),
  projectId: z.string().max(200).optional(),
  provider: providerOverrideSchema.optional(),
  locale: localeSchema.optional(),
  saveToAssets: z.boolean().optional().default(true),
});

export const critiquePackageSchema = z.object({
  title: z.string().max(500).optional(),
  selectedTitle: z.string().max(500).optional(),
  script: z.string().max(50000).optional(),
  description: z.string().max(12000).optional(),
  thumbnailPrompt: z.string().max(12000).optional(),
  thumbnailText: z.string().max(500).optional(),
  titleCandidates: z.array(titleCandidateInputSchema).max(30).optional(),
  topTitleCandidates: z.array(titleCandidateInputSchema).max(10).optional(),
  captions: z.array(z.string().max(12000)).max(10).optional(),
  projectId: z.string().max(200).optional(),
  saveToAssets: z.boolean().optional().default(true),
});

export const audioProviderGenerateSchema = musicGenerateSchema.extend({
  provider: providerOverrideSchema.optional(),
  voiceId: z.string().max(200).optional(),
});

export const packageGenerateSchema = z.object({
  briefing: z.string().min(1).max(4000),
  steps: z.array(capabilitySchema).max(2).optional(),
  research: z.boolean().optional().default(false),
  maxSources: z.number().int().min(1).max(20).optional().default(6),
  projectId: z.string().max(200).optional(),
  providers: z.object({
    text: providerOverrideSchema.optional(),
    image: providerOverrideSchema.optional(),
  }).optional(),
  locale: localeSchema.optional(),
  saveToAssets: z.boolean().optional().default(true),
});

// ── Pipeline ──────────────────────────────────────────────────────────
export const pipelineSchema = z.object({
  briefing: z.string().min(1).max(2000),
  steps: z.array(z.enum(["script", "thumbnail", "export"])).max(3).optional(),
  generateThumbnail: z.boolean().optional().default(false),
  thumbnailPromptParams: z.object({
    theme: z.string().max(500).optional(),
    title: z.string().max(500).optional(),
    style: z.string().max(200).optional(),
    text: z.string().max(200).optional(),
  }).optional(),
});

// ── Generate (legacy pipeline) ───────────────────────────────────────
export const generateSchema = z.object({
  briefing: z.string().min(1).max(2000),
});

// ── Asset Update ──────────────────────────────────────────────────────
export const assetUpdateSchema = z.object({
  title: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  content: z.string().optional(),
  tags: z.array(z.string().max(200)).max(50).optional(),
  favorite: z.boolean().optional(),
});

// ── Export Update ─────────────────────────────────────────────────────
export const exportUpdateSchema = z.object({
  title: z.string().max(500).optional(),
  status: z.enum(["completed", "processing", "failed", "pending"]).optional(),
  progress: z.number().min(0).max(100).optional(),
  files: z.array(z.string().max(1000)).max(100).optional(),
});

// ── Video/Music Status ───────────────────────────────────────────────
export const jobStatusSchema = z.object({
  jobId: z.string().min(1).max(200),
});

// ── Helper: validate and return typed data or 400 ────────────────────
export function validateOr400<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const error = result.error.issues
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join("; ");
  return { success: false, error };
}

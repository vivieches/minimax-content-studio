import type { ProviderCapability, ProviderManifest, ProviderStoredConfig } from "./types";

export const providerManifests: ProviderManifest[] = [
  {
    id: "minimax",
    adapterId: "minimax",
    name: "MiniMax",
    description: "Native MiniMax integration for text, image, music and video workflows.",
    capabilities: ["text", "image", "audio", "video"],
    defaultBaseUrl: "https://api.minimax.io",
    defaultModels: {
      text: "MiniMax-M2.7",
      image: "image-01",
      audio: "music-2.6",
      video: "",
    },
    modelDiscovery: true,
    docsUrl: "https://www.minimax.io/platform/document",
    authHeader: "Authorization: Bearer",
    requiresModelFor: ["text", "image", "audio", "video"],
    tags: ["native", "media"],
  },
  {
    id: "openai-compatible",
    adapterId: "openai-compatible",
    name: "OpenAI Compatible",
    description: "Generic /v1-compatible API for OpenAI and many API hubs.",
    capabilities: ["text", "image"],
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModels: {
      text: "gpt-4.1-mini",
      image: "gpt-image-1",
    },
    modelDiscovery: true,
    docsUrl: "https://platform.openai.com/docs/api-reference",
    authHeader: "Authorization: Bearer",
    requiresModelFor: ["text", "image"],
    tags: ["preset", "custom"],
  },
  {
    id: "openrouter",
    adapterId: "openai-compatible",
    name: "OpenRouter",
    description: "OpenAI-compatible text gateway for many hosted models.",
    capabilities: ["text"],
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    defaultModels: {
      text: "openai/gpt-4.1-mini",
    },
    modelDiscovery: true,
    docsUrl: "https://openrouter.ai/docs",
    authHeader: "Authorization: Bearer",
    requiresModelFor: ["text"],
    tags: ["hub", "text"],
  },
  {
    id: "groq",
    adapterId: "openai-compatible",
    name: "Groq",
    description: "OpenAI-compatible low-latency text generation.",
    capabilities: ["text"],
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    defaultModels: {
      text: "llama-3.3-70b-versatile",
    },
    modelDiscovery: true,
    docsUrl: "https://console.groq.com/docs",
    authHeader: "Authorization: Bearer",
    requiresModelFor: ["text"],
    tags: ["preset", "text"],
  },
  {
    id: "together",
    adapterId: "openai-compatible",
    name: "Together AI",
    description: "OpenAI-compatible hosted open model provider.",
    capabilities: ["text", "image"],
    defaultBaseUrl: "https://api.together.xyz/v1",
    defaultModels: {
      text: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
      image: "black-forest-labs/FLUX.1-schnell",
    },
    modelDiscovery: true,
    docsUrl: "https://docs.together.ai/docs/openai-api-compatibility",
    authHeader: "Authorization: Bearer",
    requiresModelFor: ["text", "image"],
    tags: ["preset", "hub"],
  },
  {
    id: "anthropic",
    adapterId: "anthropic",
    name: "Anthropic",
    description: "Claude Messages API for text generation.",
    capabilities: ["text"],
    defaultBaseUrl: "https://api.anthropic.com",
    defaultModels: {
      text: "claude-sonnet-4-6",
    },
    modelDiscovery: true,
    docsUrl: "https://platform.claude.com/docs/en/api/messages",
    authHeader: "x-api-key",
    requiresModelFor: ["text"],
    tags: ["native", "text"],
  },
  {
    id: "gemini",
    adapterId: "gemini",
    name: "Gemini",
    description: "Google Gemini generateContent API for text generation.",
    capabilities: ["text"],
    defaultBaseUrl: "https://generativelanguage.googleapis.com",
    defaultModels: {
      text: "gemini-3-flash-preview",
    },
    modelDiscovery: true,
    docsUrl: "https://ai.google.dev/gemini-api/docs/text-generation",
    authHeader: "x-goog-api-key",
    requiresModelFor: ["text"],
    tags: ["native", "text"],
  },
  {
    id: "fal",
    adapterId: "fal",
    name: "fal.ai",
    description: "Queued image and video model endpoints through fal.",
    capabilities: ["image", "video"],
    defaultBaseUrl: "https://queue.fal.run",
    defaultModels: {
      image: "fal-ai/flux/schnell",
      video: "fal-ai/fast-svd-lcm",
    },
    modelDiscovery: false,
    docsUrl: "https://fal.ai/docs/documentation/model-apis/inference/queue",
    authHeader: "Authorization: Key",
    requiresModelFor: ["image", "video"],
    tags: ["native", "media"],
  },
  {
    id: "replicate",
    adapterId: "replicate",
    name: "Replicate",
    description: "Replicate model predictions for image and video generation.",
    capabilities: ["image", "video"],
    defaultBaseUrl: "https://api.replicate.com",
    defaultModels: {
      image: "black-forest-labs/flux-schnell",
      video: "",
    },
    modelDiscovery: false,
    docsUrl: "https://replicate.com/docs/topics/predictions/create-a-prediction",
    authHeader: "Authorization: Bearer",
    requiresModelFor: ["image", "video"],
    tags: ["native", "media"],
  },
  {
    id: "elevenlabs",
    adapterId: "elevenlabs",
    name: "ElevenLabs",
    description: "Text-to-speech audio generation with ElevenLabs voices.",
    capabilities: ["audio"],
    defaultBaseUrl: "https://api.elevenlabs.io",
    defaultModels: {
      audio: "eleven_multilingual_v2",
    },
    modelDiscovery: true,
    docsUrl: "https://elevenlabs.io/docs/api-reference/text-to-speech/convert",
    authHeader: "xi-api-key",
    requiresModelFor: ["audio"],
    extraDefaults: {
      voiceId: "JBFqnCBsd6RMkjVDRZzb",
      outputFormat: "mp3_44100_128",
    },
    tags: ["native", "audio"],
  },
];

export const providerManifestMap = new Map(providerManifests.map((manifest) => [manifest.id, manifest]));

export function getProviderManifest(providerId: string): ProviderManifest | undefined {
  return providerManifestMap.get(providerId);
}

export function getManifestsForCapability(capability: ProviderCapability): ProviderManifest[] {
  return providerManifests.filter((manifest) => manifest.capabilities.includes(capability));
}

export function createDefaultProviderConfig(manifest: ProviderManifest): ProviderStoredConfig {
  return {
    enabled: manifest.id === "minimax",
    apiKey: "",
    baseUrl: manifest.defaultBaseUrl,
    models: { ...manifest.defaultModels },
    customHeaders: {},
    extra: { ...manifest.extraDefaults },
  };
}

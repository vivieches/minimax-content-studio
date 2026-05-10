import { afterEach, describe, expect, it, vi } from "vitest";
import { anthropicAdapter } from "./adapters/anthropic";
import { elevenLabsAdapter } from "./adapters/elevenlabs";
import { falAdapter } from "./adapters/fal";
import { geminiAdapter } from "./adapters/gemini";
import { minimaxAdapter } from "./adapters/minimax";
import { openAICompatibleAdapter } from "./adapters/openaiCompatible";
import { replicateAdapter } from "./adapters/replicate";
import { getProviderManifest } from "./manifests";
import type { ProviderRuntimeConfig, ProviderStoredConfig } from "./types";

function providerConfig(
  providerId: string,
  overrides: Partial<ProviderStoredConfig> = {}
): ProviderRuntimeConfig {
  const manifest = getProviderManifest(providerId);
  if (!manifest) throw new Error(`Missing test manifest for ${providerId}`);

  return {
    providerId,
    manifest,
    enabled: overrides.enabled ?? true,
    apiKey: overrides.apiKey ?? "test-key",
    baseUrl: overrides.baseUrl ?? manifest.defaultBaseUrl,
    models: {
      ...manifest.defaultModels,
      ...overrides.models,
    },
    customHeaders: {
      ...overrides.customHeaders,
    },
    extra: {
      ...manifest.extraDefaults,
      ...overrides.extra,
    },
    updatedAt: overrides.updatedAt,
  };
}

function jsonResponse(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function mockFetchResponse(response: Response) {
  const fetchMock = vi.fn(async () => response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function parseBody(init: RequestInit | undefined): Record<string, unknown> {
  return JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("provider adapter contracts", () => {
  it("builds OpenAI-compatible text requests and parses chat completions", async () => {
    const fetchMock = mockFetchResponse(
      jsonResponse({ choices: [{ message: { content: "  Generated text  " } }] })
    );
    const config = providerConfig("openai-compatible");

    const result = await openAICompatibleAdapter.generateText?.(
      {
        systemPrompt: "System prompt",
        prompt: "User prompt",
        model: "custom-text-model",
        maxTokens: 123,
        temperature: 0.2,
      },
      config
    );

    const [url, init] = fetchMock.mock.calls[0] as [URL | string, RequestInit];
    expect(String(url)).toBe("https://api.openai.com/v1/chat/completions");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer test-key",
      "Content-Type": "application/json",
    });
    expect(parseBody(init)).toMatchObject({
      model: "custom-text-model",
      max_tokens: 123,
      temperature: 0.2,
      messages: [
        { role: "system", content: "System prompt" },
        { role: "user", content: "User prompt" },
      ],
    });
    expect(result).toMatchObject({
      content: "Generated text",
      providerId: "openai-compatible",
      model: "custom-text-model",
    });
  });

  it("builds OpenAI-compatible image requests and extracts URLs/base64 payloads", async () => {
    const fetchMock = mockFetchResponse(
      jsonResponse({ data: [{ url: "https://cdn.example/image.png" }, { b64_json: "abc123" }] })
    );
    const config = providerConfig("openai-compatible", { models: { image: "image-test" } });

    const result = await openAICompatibleAdapter.generateImage?.(
      { prompt: "Image prompt", aspectRatio: "9:16", n: 2 },
      config
    );

    const [url, init] = fetchMock.mock.calls[0] as [URL | string, RequestInit];
    expect(String(url)).toBe("https://api.openai.com/v1/images/generations");
    expect(parseBody(init)).toMatchObject({
      model: "image-test",
      prompt: "Image prompt",
      n: 2,
      size: "1024x1536",
    });
    expect(result?.urls).toEqual(["https://cdn.example/image.png"]);
    expect(result?.base64s).toEqual(["abc123"]);
  });

  it("builds Anthropic Messages requests and parses text parts", async () => {
    const fetchMock = mockFetchResponse(
      jsonResponse({ content: [{ type: "text", text: "Claude text" }] })
    );
    const config = providerConfig("anthropic", { models: { text: "claude-test" } });

    const result = await anthropicAdapter.generateText?.(
      { systemPrompt: "System", prompt: "Prompt", maxTokens: 321, temperature: 0.3 },
      config
    );

    const [url, init] = fetchMock.mock.calls[0] as [URL | string, RequestInit];
    expect(String(url)).toBe("https://api.anthropic.com/v1/messages");
    expect(init.headers).toMatchObject({
      "x-api-key": "test-key",
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    });
    expect(parseBody(init)).toMatchObject({
      model: "claude-test",
      max_tokens: 321,
      temperature: 0.3,
      system: "System",
      messages: [{ role: "user", content: "Prompt" }],
    });
    expect(result?.content).toBe("Claude text");
  });

  it("builds Gemini generateContent requests with key query auth", async () => {
    const fetchMock = mockFetchResponse(
      jsonResponse({ candidates: [{ content: { parts: [{ text: "Gemini text" }] } }] })
    );
    const config = providerConfig("gemini", { models: { text: "gemini-test" } });

    const result = await geminiAdapter.generateText?.(
      { systemPrompt: "System", prompt: "Prompt", maxTokens: 222, temperature: 0.4 },
      config
    );

    const [url, init] = fetchMock.mock.calls[0] as [URL | string, RequestInit];
    expect(String(url)).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent?key=test-key"
    );
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
    expect(parseBody(init)).toMatchObject({
      systemInstruction: { parts: [{ text: "System" }] },
      contents: [{ parts: [{ text: "Prompt" }] }],
      generationConfig: { maxOutputTokens: 222, temperature: 0.4 },
    });
    expect(result?.content).toBe("Gemini text");
  });

  it("uses resolved MiniMax runtime config instead of reading env directly", async () => {
    const fetchMock = mockFetchResponse(
      jsonResponse({ choices: [{ message: { content: "MiniMax text" } }] })
    );
    const config = providerConfig("minimax", {
      baseUrl: "https://minimax.test",
      models: { text: "minimax-runtime-model" },
    });

    const result = await minimaxAdapter.generateText?.(
      { prompt: "Prompt", model: "minimax-request-model" },
      config
    );

    const [url, init] = fetchMock.mock.calls[0] as [URL | string, RequestInit];
    expect(String(url)).toBe("https://minimax.test/v1/text/chatcompletion_v2");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer test-key",
      "Content-Type": "application/json",
    });
    expect(parseBody(init)).toMatchObject({
      model: "minimax-request-model",
      messages: [
        { role: "system", name: "MiniMax AI", content: "" },
        { role: "user", name: "user", content: "Prompt" },
      ],
    });
    expect(result).toMatchObject({
      content: "MiniMax text",
      providerId: "minimax",
      model: "minimax-request-model",
    });
  });

  it("builds ElevenLabs TTS requests and returns a data URL", async () => {
    const fetchMock = mockFetchResponse(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { "Content-Type": "audio/mpeg" },
      })
    );
    const config = providerConfig("elevenlabs", {
      extra: { voiceId: "voice-test", outputFormat: "mp3_44100_128" },
      models: { audio: "eleven-test" },
    });

    const result = await elevenLabsAdapter.generateAudio?.({ prompt: "Speak this" }, config);

    const [url, init] = fetchMock.mock.calls[0] as [URL | string, RequestInit];
    expect(String(url)).toBe(
      "https://api.elevenlabs.io/v1/text-to-speech/voice-test?output_format=mp3_44100_128"
    );
    expect(init.headers).toMatchObject({
      "xi-api-key": "test-key",
      "Content-Type": "application/json",
    });
    expect(parseBody(init)).toMatchObject({
      text: "Speak this",
      model_id: "eleven-test",
    });
    expect(result?.audioUrl).toBe("data:audio/mpeg;base64,AQID");
  });

  it("builds fal queued media requests and extracts returned URLs", async () => {
    const fetchMock = mockFetchResponse(
      jsonResponse({
        request_id: "fal-request",
        images: [{ url: "https://cdn.example/fal.png" }],
      })
    );
    const config = providerConfig("fal", { models: { image: "fal-ai/test-image" } });

    const result = await falAdapter.generateImage?.(
      { prompt: "Image prompt", aspectRatio: "1:1", n: 1 },
      config
    );

    const [url, init] = fetchMock.mock.calls[0] as [URL | string, RequestInit];
    expect(String(url)).toBe("https://queue.fal.run/fal-ai/test-image");
    expect(init.headers).toMatchObject({
      Authorization: "Key test-key",
      "Content-Type": "application/json",
    });
    expect(parseBody(init)).toMatchObject({
      prompt: "Image prompt",
      image_size: "square_hd",
      num_images: 1,
    });
    expect(result?.urls).toEqual(["https://cdn.example/fal.png"]);
    expect(result?.jobId).toBe("fal-request");
  });

  it("builds Replicate prediction requests for owner/model slugs", async () => {
    const fetchMock = mockFetchResponse(
      jsonResponse({
        id: "replicate-request",
        status: "succeeded",
        output: ["https://cdn.example/replicate.png"],
      })
    );
    const config = providerConfig("replicate", {
      models: { image: "owner/model-name" },
    });

    const result = await replicateAdapter.generateImage?.(
      { prompt: "Image prompt", aspectRatio: "16:9", n: 1 },
      config
    );

    const [url, init] = fetchMock.mock.calls[0] as [URL | string, RequestInit];
    expect(String(url)).toBe("https://api.replicate.com/v1/models/owner/model-name/predictions");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer test-key",
      "Content-Type": "application/json",
      Prefer: "wait=60",
    });
    expect(parseBody(init)).toMatchObject({
      input: {
        prompt: "Image prompt",
        aspect_ratio: "16:9",
        num_outputs: 1,
      },
    });
    expect(result?.urls).toEqual(["https://cdn.example/replicate.png"]);
    expect(result?.jobId).toBe("replicate-request");
  });

  it("reports missing API keys without making provider calls during connection tests", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await openAICompatibleAdapter.testConnection({
      ...providerConfig("openai-compatible"),
      apiKey: "",
    });

    expect(result.ok).toBe(false);
    expect(result.models).toEqual([]);
    expect(result.error).toMatch(/API key is not configured/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

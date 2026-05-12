import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateTextWithProvider, imageResultCacheSources } from "./generation";

const mocks = vi.hoisted(() => ({
  getSettings: vi.fn(),
  isDemoModeEnabled: vi.fn(),
  resolveProviderConfig: vi.fn(),
  getAdapterForProvider: vi.fn(),
  runAgentText: vi.fn(),
}));

vi.mock("@/lib/storage/settings", () => ({
  getSettings: mocks.getSettings,
}));

vi.mock("@/lib/daemon/agents", () => ({
  runAgentText: mocks.runAgentText,
}));

vi.mock("./runtime", () => ({
  isDemoModeEnabled: mocks.isDemoModeEnabled,
  resolveProviderConfig: mocks.resolveProviderConfig,
}));

vi.mock("./registry", () => ({
  getAdapterForProvider: mocks.getAdapterForProvider,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isDemoModeEnabled.mockResolvedValue(false);
});

describe("generateTextWithProvider", () => {
  it("uses the selected local agent when CLI mode is active and no provider override is passed", async () => {
    mocks.getSettings.mockResolvedValue({
      executionMode: "cli",
      agentId: "codex",
      agentModels: { codex: { model: "gpt-5.1", reasoning: "high" } },
      agentCliEnv: { codex: { CODEX_BIN: "codex" } },
    });
    mocks.runAgentText.mockResolvedValue({
      content: "roteiro gerado",
      agentName: "Codex CLI",
      model: "gpt-5.1",
    });

    const result = await generateTextWithProvider({
      systemPrompt: "System",
      prompt: "Briefing",
    });

    expect(result).toEqual({
      content: "roteiro gerado",
      providerId: "agent:codex",
      model: "gpt-5.1",
    });
    expect(mocks.runAgentText).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: "codex",
        prompt: "System\n\nBriefing",
        model: "gpt-5.1",
        reasoning: "high",
        agentCliEnv: { codex: { CODEX_BIN: "codex" } },
        timeoutMs: 180000,
        onEvent: expect.any(Function),
      })
    );
    expect(mocks.resolveProviderConfig).not.toHaveBeenCalled();
  });

  it("keeps explicit provider overrides on the BYOK path", async () => {
    const adapter = { generateText: vi.fn().mockResolvedValue({ content: "byok", providerId: "openai", model: "gpt-5.1" }) };
    mocks.getSettings.mockResolvedValue({
      executionMode: "cli",
      agentId: "codex",
      agentModels: {},
      agentCliEnv: {},
    });
    mocks.resolveProviderConfig.mockResolvedValue({
      providerId: "openai",
      manifest: { name: "OpenAI" },
    });
    mocks.getAdapterForProvider.mockReturnValue(adapter);

    await generateTextWithProvider({ prompt: "Briefing" }, { providerId: "openai", model: "gpt-5.1" });

    expect(mocks.runAgentText).not.toHaveBeenCalled();
    expect(mocks.resolveProviderConfig).toHaveBeenCalledWith("text", { providerId: "openai", model: "gpt-5.1" });
  });

  it("falls back to the default BYOK text provider when a selected CLI fails", async () => {
    const adapter = {
      generateText: vi.fn().mockResolvedValue({ content: "fallback text", providerId: "openai", model: "gpt-4.1-mini", raw: { id: "ok" } }),
    };
    mocks.getSettings.mockResolvedValue({
      executionMode: "cli",
      agentId: "codex",
      agentModels: { codex: { model: "default" } },
      agentCliEnv: {},
      defaults: { text: { providerId: "openai", model: "gpt-4.1-mini" } },
      providers: { openai: { enabled: true, apiKey: "sk-test" } },
    });
    mocks.runAgentText.mockRejectedValue(new Error("The 'gpt-5.5' model requires a newer version of Codex."));
    mocks.resolveProviderConfig.mockResolvedValue({
      providerId: "openai",
      manifest: { name: "OpenAI" },
    });
    mocks.getAdapterForProvider.mockReturnValue(adapter);

    const result = await generateTextWithProvider({ prompt: "Briefing" });

    expect(result.content).toBe("fallback text");
    expect(result.providerId).toBe("openai");
    expect(result.raw).toMatchObject({
      id: "ok",
      agentFallbackError: "The 'gpt-5.5' model requires a newer version of Codex.",
    });
    expect(result.diagnostics?.map((diagnostic) => diagnostic.kind)).toContain("fallback_used");
    expect(mocks.resolveProviderConfig).toHaveBeenCalledWith("text", undefined);
  });

  it("keeps the agent error actionable when no BYOK fallback is configured", async () => {
    mocks.getSettings.mockResolvedValue({
      executionMode: "cli",
      agentId: "codex",
      agentModels: { codex: { model: "default" } },
      agentCliEnv: {},
      defaults: { text: { providerId: "openai", model: "gpt-4.1-mini" } },
      providers: { openai: { enabled: false, apiKey: "" } },
    });
    mocks.runAgentText.mockRejectedValue(new Error("The 'gpt-5.5' model requires a newer version of Codex."));

    await expect(generateTextWithProvider({ prompt: "Briefing" })).rejects.toThrow("precisa de API key para fallback");
    expect(mocks.resolveProviderConfig).not.toHaveBeenCalled();
  });
});

describe("imageResultCacheSources", () => {
  it("normalizes OpenAI base64 image responses into data URLs", () => {
    expect(
      imageResultCacheSources({
        urls: [],
        base64s: ["abc123"],
        finalPrompt: "prompt",
        providerId: "openai",
        model: "gpt-image-1",
      })
    ).toEqual(["data:image/png;base64,abc123"]);
  });
});

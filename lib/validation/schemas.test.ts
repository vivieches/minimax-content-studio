import { describe, it, expect } from "vitest";
import {
  settingsSchema,
  assetSchema,
  scriptGenerateSchema,
  thumbnailGenerateSchema,
  titleGenerateSchema,
  captionGenerateSchema,
  critiquePackageSchema,
  validateOr400,
} from "./schemas";

describe("settingsSchema", () => {
  it("accepts valid settings", () => {
    const result = settingsSchema.safeParse({ apiKey: "sk-test", baseUrl: "https://api.minimax.io" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid URL", () => {
    const result = settingsSchema.safeParse({ baseUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects apiKey too long", () => {
    const result = settingsSchema.safeParse({ apiKey: "x".repeat(501) });
    expect(result.success).toBe(false);
  });

  it("keeps only allowlisted agent CLI env values", () => {
    const result = settingsSchema.safeParse({
      agentCliEnv: {
        codex: { CODEX_BIN: " codex ", BAD_KEY: "x" },
        "cursor-agent": { CURSOR_AGENT_BIN: "cursor-agent" },
        bad: { BAD_KEY: "x" },
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.agentCliEnv).toEqual({
        codex: { CODEX_BIN: "codex" },
        "cursor-agent": { CURSOR_AGENT_BIN: "cursor-agent" },
      });
    }
  });
});

describe("assetSchema", () => {
  it("accepts valid asset", () => {
    const result = assetSchema.safeParse({
      type: "script",
      title: "Test Script",
      description: "A test script",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = assetSchema.safeParse({ type: "script" });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = assetSchema.safeParse({ type: "script", title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid type", () => {
    const result = assetSchema.safeParse({ type: "invalid", title: "Test" });
    expect(result.success).toBe(false);
  });
});

describe("scriptGenerateSchema", () => {
  it("accepts valid briefing", () => {
    const result = scriptGenerateSchema.safeParse({ briefing: "Create a React tutorial" });
    expect(result.success).toBe(true);
  });

  it("rejects empty briefing", () => {
    const result = scriptGenerateSchema.safeParse({ briefing: "" });
    expect(result.success).toBe(false);
  });

  it("rejects briefing too long", () => {
    const result = scriptGenerateSchema.safeParse({ briefing: "x".repeat(2001) });
    expect(result.success).toBe(false);
  });
});

describe("thumbnailGenerateSchema", () => {
  it("accepts valid params", () => {
    const result = thumbnailGenerateSchema.safeParse({
      theme: "Tech",
      title: "React Tutorial",
      style: "Modern",
      text: "Learn React",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const result = thumbnailGenerateSchema.safeParse({ theme: "Tech" });
    expect(result.success).toBe(false);
  });
});

describe("titleGenerateSchema", () => {
  it("accepts long topics and research notes for title generation", () => {
    const result = titleGenerateSchema.safeParse({
      topic: "x".repeat(5000),
      briefing: "briefing ".repeat(1000),
      thumbnailConcept: "thumbnail concept ".repeat(500),
      outlierNotes: "outlier notes ".repeat(500),
    });

    expect(result.success).toBe(true);
  });

  it("still rejects empty title topics", () => {
    const result = titleGenerateSchema.safeParse({ topic: "" });
    expect(result.success).toBe(false);
  });
});

describe("captionGenerateSchema", () => {
  it("accepts SEO caption generation without a custom pattern", () => {
    const result = captionGenerateSchema.safeParse({
      script: "Roteiro sobre Gemma 4 e IA local.",
      title: "Gemma 4 acelera IA local",
      creatorProfile: {
        tiktok: "/viviexec.es",
        instagram: "/viviexec.es",
        x: "https://x.com/vivieches?s=21",
        businessEmail: "vitoria@example.com",
        primaryLinkLabel: "Link de Gemma 4",
        primaryLinkUrl: "https://ai.google.dev/gemma",
        language: "es",
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pattern).toBeUndefined();
      expect(result.data.creatorProfile?.language).toBe("es");
    }
  });
});

describe("critiquePackageSchema", () => {
  it("accepts full package critique payloads", () => {
    const result = critiquePackageSchema.safeParse({
      selectedTitle: "Como usar IA local sem depender de API",
      script: "Roteiro ".repeat(1000),
      thumbnailPrompt: "Creator desk with local AI models and API warning.",
      thumbnailText: "IA LOCAL",
      titleCandidates: [{ title: "Como usar IA local sem depender de API", score: 94 }],
      topTitleCandidates: [{ title: "Como usar IA local sem depender de API", reason: "promessa clara" }],
      captions: ["#IA\n\nDescrição SEO"],
      projectId: "proj_test",
    });

    expect(result.success).toBe(true);
  });

  it("rejects malformed title candidates", () => {
    const result = critiquePackageSchema.safeParse({
      selectedTitle: "Pacote",
      titleCandidates: [{ score: 94 }],
    });

    expect(result.success).toBe(false);
  });
});

describe("validateOr400", () => {
  it("returns success for valid data", () => {
    const result = validateOr400(scriptGenerateSchema, { briefing: "Test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.briefing).toBe("Test");
    }
  });

  it("returns error for invalid data", () => {
    const result = validateOr400(scriptGenerateSchema, { briefing: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("briefing");
    }
  });
});

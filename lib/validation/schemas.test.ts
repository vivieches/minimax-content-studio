import { describe, it, expect } from "vitest";
import {
  settingsSchema,
  assetSchema,
  scriptGenerateSchema,
  thumbnailGenerateSchema,
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

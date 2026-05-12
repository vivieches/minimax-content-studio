import { describe, expect, it } from "vitest";
import { composePrompt, PROMPT_LAYER_ORDER } from "./composer";

describe("prompt composer", () => {
  it("keeps the OpenDesign-style layer order stable", () => {
    const result = composePrompt({
      identity: "identity",
      routine: "routine",
      project: "project",
      request: "request",
      brandKit: {
        brandVoice: "voz direta",
        audience: "criadores",
        tone: "util",
        forbiddenWords: ["hype vazio"],
        references: [],
        updatedAt: "2026-05-11T00:00:00.000Z",
      },
      memories: [{ id: "m1", content: "Sempre usar exemplos praticos.", tags: ["preference"], source: "manual", weight: 5, createdAt: "x", updatedAt: "x" }],
      research: [],
      mediaContract: "media contract",
      skills: [{ id: "skill", name: "Skill", description: "desc", path: "SKILL.md", root: ".", mode: "local" }],
      schema: "schema",
    });

    expect(result.layers.map((layer) => layer.id)).toEqual([...PROMPT_LAYER_ORDER]);
    expect(result.prompt).toContain("## Brand Kit");
    expect(result.prompt).toContain("Sempre usar exemplos praticos.");
    expect(result.prompt).toContain("Skill: desc");
  });

  it("omits disabled layers from the final prompt while keeping metadata", () => {
    const result = composePrompt({ request: "Gere um roteiro" });

    expect(result.layers).toHaveLength(PROMPT_LAYER_ORDER.length);
    expect(result.layers.find((layer) => layer.id === "brandKit")?.enabled).toBe(false);
    expect(result.prompt).toBe("## Request\nGere um roteiro");
  });
});

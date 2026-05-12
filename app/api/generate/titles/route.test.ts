import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  generateTitlePack: vi.fn(),
}));

vi.mock("@/lib/providers/generation", () => ({
  generateTitlePack: mocks.generateTitlePack,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/generate/titles", () => {
  it("accepts long topics, research flag and returns a 10-title pack", async () => {
    mocks.generateTitlePack.mockResolvedValue({
      candidates: Array.from({ length: 10 }, (_, index) => ({
        title: `Title ${index + 1}`,
        score: 90 - index,
        reason: "test",
      })),
      top3: Array.from({ length: 3 }, (_, index) => ({
        title: `Title ${index + 1}`,
        score: 90 - index,
        reason: "test",
      })),
      providerId: "openai",
      model: "gpt-5.1",
    });

    const response = await POST(
      new Request("http://localhost/api/generate/titles", {
        method: "POST",
        body: JSON.stringify({
          topic: "Tema longo ".repeat(1000),
          briefing: "briefing",
          research: true,
          maxSources: 8,
          projectId: "proj_titles",
          saveToAssets: true,
        }),
      })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.candidates).toHaveLength(10);
    expect(json.top3).toHaveLength(3);
    expect(mocks.generateTitlePack).toHaveBeenCalledWith(
      expect.objectContaining({
        research: true,
        maxSources: 8,
        projectId: "proj_titles",
      }),
      undefined
    );
  });
});

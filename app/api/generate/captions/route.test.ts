import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  generateCaptionPack: vi.fn(),
}));

vi.mock("@/lib/providers/generation", () => ({
  generateCaptionPack: mocks.generateCaptionPack,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/generate/captions", () => {
  it("generates an SEO caption pack with creator socials and no required custom pattern", async () => {
    mocks.generateCaptionPack.mockResolvedValue({
      captions: ["#Gemma4\n\n👇🏻 Gemma 4 explicado 👇🏻"],
      notes: [],
      hashtags: ["#Gemma4", "#GoogleAI"],
      keywords: ["Gemma 4", "Google AI"],
      followBlock: "📌 FOLLOW ME:\nInstagram → /viviexec.es",
      providerId: "openai",
      model: "gpt-5.1",
    });

    const response = await POST(
      new Request("http://localhost/api/generate/captions", {
        method: "POST",
        body: JSON.stringify({
          script: "Roteiro sobre Gemma 4 e IA local.",
          topic: "Gemma 4",
          title: "Gemma 4 acelera IA local",
          creatorProfile: {
            instagram: "/viviexec.es",
            businessEmail: "vitoria@example.com",
          },
          saveToAssets: true,
        }),
      })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.captions[0]).toContain("Gemma 4");
    expect(json.hashtags).toEqual(["#Gemma4", "#GoogleAI"]);
    expect(mocks.generateCaptionPack).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Gemma 4 acelera IA local",
        creatorProfile: expect.objectContaining({ instagram: "/viviexec.es" }),
      }),
      undefined
    );
  });
});

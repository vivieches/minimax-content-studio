import { describe, expect, it } from "vitest";
import {
  buildHashtags,
  buildLocalSeoCaption,
  buildSeoCaptionPrompt,
  extractSeoKeywords,
  parseCaptionPackResponse,
} from "./pattern";

describe("SEO caption pattern", () => {
  it("extracts keywords and builds readable hashtags from the script", () => {
    const keywords = extractSeoKeywords({
      title: "Gemma 4 acelera IA local",
      script: "Google apresentou Multi-Token Prediction para acelerar Gemma 4, modelos locais e agentes de IA.",
    });

    expect(keywords).toEqual(expect.arrayContaining(["Gemma", "Multi-Token", "Prediction", "Google"]));
    expect(buildHashtags(keywords)).toEqual(expect.arrayContaining(["#Gemma", "#MultiToken"]));
  });

  it("builds a prompt with the Lucas SEO structure and creator profile", () => {
    const prompt = buildSeoCaptionPrompt({
      title: "Gemma 4 acelera IA local",
      script: "Roteiro sobre Gemma 4 e speculative decoding.",
      creatorProfile: {
        tiktok: "/viviexec.es",
        instagram: "/viviexec.es",
        x: "https://x.com/vivieches?s=21",
        businessEmail: "vitoria@example.com",
        primaryLinkLabel: "Link de Gemma 4",
        primaryLinkUrl: "https://ai.google.dev/gemma",
        language: "es-ES",
      },
    });

    expect(prompt).toContain("PATTERN:");
    expect(prompt).toContain("FOLLOW ME");
    expect(prompt).toContain("Link de Gemma 4 -> https://ai.google.dev/gemma");
    expect(prompt).toContain("vitoria@example.com");
  });

  it("parses provider JSON and keeps caption, hashtags and social blocks", () => {
    const parsed = parseCaptionPackResponse(
      JSON.stringify({
        caption: "#Gemma4\n\n👇🏻 Gemma 4 explicado 👇🏻",
        hashtags: ["#Gemma4", "#GoogleAI"],
        keywords: ["Gemma 4", "Google AI"],
        followBlock: "📌 FOLLOW ME:\nTikTok → /viviexec.es",
      }),
      { title: "Gemma 4", script: "Gemma 4 script" }
    );

    expect(parsed.captions[0]).toContain("Gemma 4 explicado");
    expect(parsed.hashtags).toEqual(["#Gemma4", "#GoogleAI"]);
    expect(parsed.followBlock).toContain("TikTok");
  });

  it("falls back to a complete SEO caption when provider output is plain text", () => {
    const fallback = buildLocalSeoCaption({
      title: "Gemma 4 acelera modelos de IA",
      script: "Google apresentou Gemma 4, Multi-Token Prediction, speculative decoding e IA local.",
      creatorProfile: {
        instagram: "/viviexec.es",
        businessEmail: "vitoria@example.com",
        language: "es-ES",
      },
    });

    expect(fallback.captions[0]).toContain("👇🏻 Gemma 4 acelera modelos de IA 👇🏻");
    expect(fallback.captions[0]).toContain("FOLLOW ME");
    expect(fallback.captions[0]).toContain("Business Inquiries");
    expect(fallback.hashtags.length).toBeGreaterThan(3);
  });
});

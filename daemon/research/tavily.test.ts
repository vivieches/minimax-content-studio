import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DiagnosticError } from "@/lib/daemon/diagnostics";
import { searchResearch, tavilySearch } from "./tavily";

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllGlobals();
});

describe("tavily research", () => {
  it("calls Tavily search with explicit answer/raw/max parameters and normalizes sources", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          answer: "Outlier videos combine specific promises with visual contrast.",
          results: [
            {
              title: "YouTube title patterns",
              url: "https://example.com/title-patterns",
              content: "Specificity, curiosity and search terms matter.",
              score: 0.9,
              published_date: "2026-05-01",
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await tavilySearch({
      apiKey: "tvly-test",
      query: "youtube outlier title ctr seo",
      maxResults: 6,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.tavily.com/search",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ authorization: "Bearer tvly-test" }),
        body: expect.stringContaining('"include_raw_content":false'),
      })
    );
    expect(result.sources[0]).toMatchObject({
      title: "YouTube title patterns",
      provider: "tavily",
      publishedAt: "2026-05-01",
    });
  });

  it("returns a categorized diagnostic when Tavily is not configured", async () => {
    delete process.env.TAVILY_API_KEY;
    await expect(searchResearch({ query: "youtube outliers" })).rejects.toMatchObject({
      errorKind: "research_unconfigured",
      diagnostics: [expect.objectContaining({ kind: "research_unconfigured" })],
    } satisfies Partial<DiagnosticError>);
  });
});

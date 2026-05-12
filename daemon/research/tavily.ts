import { DiagnosticError, researchDiagnostic } from "@/lib/daemon/diagnostics";
import type { ResearchFindings, ResearchSource } from "./types";

const DEFAULT_BASE_URL = "https://api.tavily.com";
const DEFAULT_TIMEOUT_MS = 30_000;
const TAVILY_MAX_RESULTS_LIMIT = 20;

type TavilySearchDepth = "basic" | "advanced" | "fast" | "ultra-fast";

export interface TavilySearchInput {
  apiKey?: string;
  baseUrl?: string;
  query: string;
  searchDepth?: TavilySearchDepth;
  maxResults?: number;
  includeAnswer?: boolean | "basic" | "advanced";
  signal?: AbortSignal;
}

interface TavilyRawResult {
  title?: unknown;
  url?: unknown;
  content?: unknown;
  score?: unknown;
  published_date?: unknown;
}

interface TavilyRawResponse {
  answer?: unknown;
  results?: unknown;
}

export interface SearchResearchInput {
  query: string;
  apiKey?: string;
  baseUrl?: string;
  maxSources?: number;
  signal?: AbortSignal;
}

export class TavilyError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "TavilyError";
  }
}

function clampMaxSources(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return 5;
  return Math.max(1, Math.min(Math.floor(value), TAVILY_MAX_RESULTS_LIMIT));
}

function resolveTavilyApiKey(apiKey?: string) {
  return apiKey || process.env.TAVILY_API_KEY || process.env.TAVILY_KEY || "";
}

function resolveTavilyBaseUrl(baseUrl?: string) {
  return (baseUrl || process.env.TAVILY_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

export async function tavilySearch(input: TavilySearchInput): Promise<{ answer: string; sources: ResearchSource[] }> {
  const apiKey = resolveTavilyApiKey(input.apiKey);
  if (!apiKey) {
    throw new DiagnosticError(
      "Tavily API key is not configured.",
      [researchDiagnostic({ kind: "research_unconfigured", message: "Tavily API key is not configured." })],
      "research_unconfigured"
    );
  }

  const query = input.query.trim().slice(0, 1000);
  if (!query) {
    throw new DiagnosticError(
      "Research query is required.",
      [researchDiagnostic({ kind: "research_failed", message: "Research query is required." })],
      "research_failed"
    );
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), DEFAULT_TIMEOUT_MS);
  if (input.signal) {
    input.signal.addEventListener("abort", () => ctrl.abort(), { once: true });
  }

  let response: Response;
  try {
    response = await fetch(`${resolveTavilyBaseUrl(input.baseUrl)}/search`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        search_depth: input.searchDepth ?? "basic",
        max_results: clampMaxSources(input.maxResults),
        include_answer: input.includeAnswer ?? true,
        include_raw_content: false,
      }),
      signal: ctrl.signal,
    });
  } catch (error) {
    throw new TavilyError(`Tavily request failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new TavilyError(`Tavily ${response.status}: ${text.slice(0, 200) || "no body"}`, response.status);
  }

  const json = (await response.json()) as TavilyRawResponse;
  const answer = typeof json.answer === "string" ? json.answer : "";
  const rawResults = Array.isArray(json.results) ? json.results : [];
  const sources: ResearchSource[] = [];

  for (const raw of rawResults as TavilyRawResult[]) {
    const url = typeof raw.url === "string" ? raw.url.trim() : "";
    if (!url) continue;
    const publishedAt = typeof raw.published_date === "string" && raw.published_date.trim()
      ? raw.published_date.trim()
      : undefined;
    sources.push({
      title: typeof raw.title === "string" && raw.title.trim() ? raw.title.trim() : url,
      url,
      snippet: typeof raw.content === "string" ? raw.content.trim().slice(0, 800) : "",
      provider: "tavily",
      score: typeof raw.score === "number" ? raw.score : undefined,
      ...(publishedAt ? { publishedAt } : {}),
    });
  }

  return { answer, sources };
}

export async function searchResearch(input: SearchResearchInput): Promise<ResearchFindings> {
  try {
    const query = input.query.trim().slice(0, 1000);
    const result = await tavilySearch({
      apiKey: input.apiKey,
      baseUrl: input.baseUrl,
      query,
      searchDepth: "basic",
      maxResults: input.maxSources,
      includeAnswer: true,
      signal: input.signal,
    });

    if (!result.sources.length) {
      throw new DiagnosticError(
        "No research sources found.",
        [researchDiagnostic({ kind: "research_no_sources", message: "No research sources found." })],
        "research_no_sources"
      );
    }

    return {
      query,
      summary: result.answer || synthesizeFallbackSummary(result.sources),
      sources: result.sources,
      provider: "tavily",
      depth: "shallow",
      fetchedAt: Date.now(),
    };
  } catch (error) {
    if (error instanceof DiagnosticError) throw error;
    const message = error instanceof Error ? error.message : String(error);
    throw new DiagnosticError(
      message,
      [researchDiagnostic({ kind: "research_failed", message })],
      "research_failed"
    );
  }
}

function synthesizeFallbackSummary(sources: ResearchSource[]): string {
  const lead = sources
    .slice(0, 5)
    .map((source, index) => `- [${index + 1}] ${source.title}: ${source.snippet.slice(0, 200)}`)
    .join("\n");
  return `(No provider summary; top snippets follow.)\n${lead}`;
}

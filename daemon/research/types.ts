export type ResearchDepth = "shallow" | "deep";

export type ResearchSource = {
  title: string;
  url: string;
  snippet: string;
  provider: "tavily" | "manual" | "fallback";
  score?: number;
  publishedAt?: string;
};

export type ResearchFindings = {
  query: string;
  summary: string;
  sources: ResearchSource[];
  provider: "tavily" | "manual" | "fallback";
  depth: ResearchDepth;
  fetchedAt: number;
  reportPath?: string;
  jsonPath?: string;
};

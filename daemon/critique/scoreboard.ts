export type CritiqueArea = "title" | "thumbnail" | "script" | "package";

export type CritiqueIssueSeverity = "info" | "warning" | "critical";

export type CritiqueScore = {
  key: CritiqueArea;
  label: string;
  score: number;
  reason: string;
};

export type CritiqueIssue = {
  severity: CritiqueIssueSeverity;
  area: CritiqueArea;
  message: string;
  recommendation?: string;
};

export type PackageCritique = {
  ok: true;
  cohesionScore: number;
  scores: CritiqueScore[];
  issues: CritiqueIssue[];
  recommendedTitle?: string;
  recommendedTitleReason?: string;
  transcript: string[];
  createdAt: string;
};

const STOPWORDS = new Set([
  "a",
  "ao",
  "as",
  "com",
  "como",
  "da",
  "de",
  "del",
  "do",
  "dos",
  "e",
  "el",
  "em",
  "en",
  "for",
  "la",
  "las",
  "lo",
  "los",
  "na",
  "no",
  "o",
  "os",
  "para",
  "por",
  "que",
  "sem",
  "the",
  "to",
  "um",
  "uma",
  "un",
  "una",
  "with",
]);

export function clampScore(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function weightedAverage(items: Array<{ score: number; weight: number }>) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (!totalWeight) return 0;
  return clampScore(items.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight);
}

export function tokenizeForCritique(text: string) {
  return Array.from(
    new Set(
      normalizeText(text)
        .split(/[^a-z0-9]+/i)
        .map((token) => token.trim())
        .filter((token) => token.length >= 3 && !STOPWORDS.has(token))
    )
  );
}

export function keywordOverlapRatio(primary: string, secondary: string) {
  const primaryTokens = tokenizeForCritique(primary);
  if (!primaryTokens.length) return 0;
  const secondaryTokens = new Set(tokenizeForCritique(secondary));
  if (!secondaryTokens.size) return 0;
  const matches = primaryTokens.filter((token) => secondaryTokens.has(token)).length;
  return matches / primaryTokens.length;
}

export function hasAnyTerm(text: string, terms: string[]) {
  const normalized = normalizeText(text);
  return terms.some((term) => normalized.includes(normalizeText(term)));
}

export function scoreBand(score: number) {
  if (score >= 85) return "forte";
  if (score >= 70) return "bom";
  if (score >= 55) return "fraco";
  return "critico";
}

function normalizeText(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

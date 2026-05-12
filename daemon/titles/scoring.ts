export type TitleCandidate = {
  title: string;
  score: number;
  reason: string;
  ctrAngle?: string;
  seoKeywords?: string[];
  rank?: number;
};

export type ParsedTitlePack = {
  candidates: TitleCandidate[];
  top3: TitleCandidate[];
  needsRepair: boolean;
  repairReason?: string;
};

type ParseContext = {
  topic: string;
  briefing?: string;
  thumbnailConcept?: string;
  outlierNotes?: string;
};

function clampScore(value: unknown, fallback: number) {
  const score = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function cleanTitle(value: unknown) {
  return String(value ?? "")
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function compactTopic(topic: string) {
  const clean = cleanTitle(topic);
  return clean.length <= 88 ? clean : `${clean.slice(0, 85).trim()}...`;
}

function fallbackCandidates(context: ParseContext): string[] {
  const topic = compactTopic(context.topic || "este tema");
  return [
    `${topic}: o detalhe que quase ninguém mostra`,
    `Eu testei ${topic} e isso mudou o resultado`,
    `${topic} do jeito certo: guia direto ao ponto`,
    `Pare de errar em ${topic}: veja isso antes`,
    `O método mais simples para entender ${topic}`,
    `${topic} na prática: o que funciona de verdade`,
    `A diferença entre usar ${topic} bem e perder tempo`,
    `Como aplicar ${topic} sem depender de promessa vazia`,
    `${topic}: 7 sinais de que você está fazendo errado`,
    `O caminho local-first para dominar ${topic}`,
    `Antes de tentar ${topic}, assista isso`,
    `${topic}: a estratégia que combina CTR e busca`,
  ];
}

function normalizeCandidate(item: unknown, index: number): TitleCandidate | null {
  if (typeof item === "string") {
    const title = cleanTitle(item);
    if (!title) return null;
    return {
      title,
      score: clampScore(undefined, 92 - index * 2),
      reason: "Título retornado como texto simples; rank preservado pela ordem do modelo.",
      rank: index + 1,
    };
  }

  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;
  const title = cleanTitle(record.title);
  if (!title) return null;

  return {
    title,
    score: clampScore(record.score, 92 - index * 2),
    reason: cleanTitle(record.reason ?? record.why) || "Combina curiosidade, busca e promessa específica.",
    ctrAngle: record.ctrAngle ? cleanTitle(record.ctrAngle) : undefined,
    seoKeywords: Array.isArray(record.seoKeywords)
      ? record.seoKeywords.map(cleanTitle).filter(Boolean)
      : [],
    rank: index + 1,
  };
}

function extractJsonObject(content: string): Record<string, unknown> | null {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start < 0 || end < start) return null;
  try {
    const parsed = JSON.parse(content.slice(start, end + 1));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function plainTextCandidates(content: string): TitleCandidate[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").trim())
    .filter(Boolean)
    .map((title, index) => normalizeCandidate(title, index))
    .filter((candidate): candidate is TitleCandidate => Boolean(candidate));
}

function dedupe(candidates: TitleCandidate[]) {
  const seen = new Set<string>();
  const out: TitleCandidate[] = [];
  for (const candidate of candidates) {
    const key = candidate.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(candidate);
  }
  return out;
}

function topFromParsed(rawTop3: unknown, candidates: TitleCandidate[]) {
  const raw = Array.isArray(rawTop3) ? rawTop3 : [];
  const top: TitleCandidate[] = [];
  for (const item of raw) {
    const title = typeof item === "string" ? cleanTitle(item) : cleanTitle((item as Record<string, unknown> | null)?.title);
    if (!title) continue;
    const match = candidates.find((candidate) => candidate.title === title);
    if (match) top.push(match);
  }
  return dedupe(top).slice(0, 3);
}

export function parseTitlePackResponse(content: string, count: number, context: ParseContext): ParsedTitlePack {
  const target = Math.max(3, Math.min(Math.floor(count || 10), 20));
  const json = extractJsonObject(content);
  const sourceCandidates = Array.isArray(json?.candidates)
    ? json!.candidates
        .map((item, index) => normalizeCandidate(item, index))
        .filter((candidate): candidate is TitleCandidate => Boolean(candidate))
    : plainTextCandidates(content);

  const needsRepair = !json || sourceCandidates.length < target;
  const repairReason = !json
    ? "provider returned non-json title output"
    : sourceCandidates.length < target
      ? `provider returned ${sourceCandidates.length}/${target} candidates`
      : undefined;

  const candidates = dedupe(sourceCandidates);
  for (const title of fallbackCandidates(context)) {
    if (candidates.length >= target) break;
    const index = candidates.length;
    candidates.push({
      title,
      score: Math.max(68, 84 - index),
      reason: "Fallback local para manter o pacote com 10 opções sem esconder falha parcial do modelo.",
      ctrAngle: "curiosidade + promessa específica",
      seoKeywords: [compactTopic(context.topic)],
      rank: index + 1,
    });
  }

  const normalized = candidates
    .slice(0, target)
    .map((candidate, index) => ({ ...candidate, rank: index + 1 }));
  const parsedTop = topFromParsed(json?.top3, normalized);
  const scoreRanked = [...normalized].sort((a, b) => b.score - a.score);
  const top3 = dedupe([...parsedTop, ...scoreRanked]).slice(0, 3);

  return {
    candidates: normalized,
    top3,
    needsRepair,
    repairReason,
  };
}

export function renderTitleRepairPrompt(raw: string, count: number) {
  return [
    "Repair the previous answer into strict JSON only.",
    `Return exactly ${count} title candidates and top3 as exact title strings.`,
    "Do not explain. Do not use markdown.",
    "",
    "Previous answer:",
    raw.slice(0, 12000),
  ].join("\n");
}

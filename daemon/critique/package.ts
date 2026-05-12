import { createDaemonContext, type DaemonContext } from "@/daemon/context";
import { createProject, getProject, writeProjectFile } from "@/daemon/projects/store";
import { DATA_DIR } from "@/lib/storage/db";

import {
  clampScore,
  hasAnyTerm,
  keywordOverlapRatio,
  scoreBand,
  weightedAverage,
  type CritiqueIssue,
  type CritiqueScore,
  type PackageCritique,
} from "./scoreboard";

export type CritiqueTitleCandidate = {
  title: string;
  score?: number;
  reason?: string;
  ctrAngle?: string;
  seoKeywords?: string[];
};

export type CritiquePackageInput = {
  title?: string;
  selectedTitle?: string;
  script?: string;
  description?: string;
  thumbnailPrompt?: string;
  thumbnailText?: string;
  titleCandidates?: CritiqueTitleCandidate[];
  topTitleCandidates?: CritiqueTitleCandidate[];
  captions?: string[];
  projectId?: string;
};

const TITLE_ANGLE_TERMS = [
  "antes",
  "como",
  "erros",
  "guia",
  "método",
  "metodo",
  "ninguém",
  "ninguem",
  "por que",
  "testei",
  "verdade",
  "sem depender",
  "vale a pena",
];

const SCRIPT_HOOK_TERMS = [
  "neste vídeo",
  "nesse vídeo",
  "hoje",
  "vou te mostrar",
  "te explico",
  "antes de",
  "no final",
  "o problema",
  "a verdade",
];

export function critiqueContentPackage(input: CritiquePackageInput): PackageCritique {
  const selectedTitle = cleanText(input.selectedTitle || input.title || firstCandidateTitle(input) || "Pacote sem título");
  const script = cleanText(input.script || "");
  const thumbnailPrompt = cleanText(input.thumbnailPrompt || "");
  const thumbnailText = cleanText(input.thumbnailText || "");
  const topTitleCandidates = Array.isArray(input.topTitleCandidates) ? input.topTitleCandidates : [];
  const titleCandidates = Array.isArray(input.titleCandidates) ? input.titleCandidates : [];
  const captions = Array.isArray(input.captions) ? input.captions : [];
  const candidates = normalizeCandidates([...topTitleCandidates, ...titleCandidates]);
  const transcript: string[] = [];
  const issues: CritiqueIssue[] = [];

  const titleScore = scoreTitle(selectedTitle, candidates.length);
  const thumbnailScore = scoreThumbnail({
    selectedTitle,
    thumbnailPrompt,
    thumbnailText,
    issues,
  });
  const scriptScore = scoreScript({
    selectedTitle,
    script,
    description: input.description || "",
    captions,
    issues,
  });

  const packageScore = scorePackage({
    titleScore: titleScore.score,
    thumbnailScore: thumbnailScore.score,
    scriptScore: scriptScore.score,
    titleCandidatesCount: candidates.length,
    captionsCount: captions.length,
  });

  const scores: CritiqueScore[] = [titleScore, thumbnailScore, scriptScore, packageScore];
  const cohesionScore = packageScore.score;
  const recommendation = recommendTitle({
    selectedTitle,
    candidates,
    script,
    thumbnailPrompt,
    thumbnailText,
  });

  transcript.push(`Título avaliado: ${selectedTitle}`);
  transcript.push(`Coerência título/thumbnail: ${scoreBand(thumbnailScore.score)} (${thumbnailScore.score}/100).`);
  transcript.push(`Coerência geral do pacote: ${scoreBand(cohesionScore)} (${cohesionScore}/100).`);
  if (recommendation.recommendedTitle && recommendation.recommendedTitle !== selectedTitle) {
    transcript.push(`Título recomendado após crítica: ${recommendation.recommendedTitle}`);
  }
  if (!issues.length) {
    issues.push({
      severity: "info",
      area: "package",
      message: "Pacote coerente o suficiente para exportação inicial.",
      recommendation: "Revise manualmente a promessa do título contra a imagem final antes de publicar.",
    });
  }

  return {
    ok: true,
    cohesionScore,
    scores,
    issues,
    recommendedTitle: recommendation.recommendedTitle,
    recommendedTitleReason: recommendation.reason,
    transcript,
    createdAt: new Date().toISOString(),
  };
}

export async function writeCritiqueProjectFile(params: {
  projectId?: string;
  critique: PackageCritique;
  context?: DaemonContext;
}) {
  if (!params.projectId) return null;
  const context = params.context ?? createDaemonContext({ storageDir: DATA_DIR });
  if (!(await getProject(context, params.projectId))) {
    await createProject(context, {
      id: params.projectId,
      name: "Open Studio critique package",
      metadata: { createdBy: "package-critique" },
    });
  }
  return writeProjectFile(
    context,
    params.projectId,
    "files/critique.json",
    Buffer.from(JSON.stringify(params.critique, null, 2), "utf8")
  );
}

function scoreTitle(title: string, candidatesCount: number): CritiqueScore {
  const length = title.length;
  let score = 68;
  if (length >= 35 && length <= 95) score += 12;
  else if (length < 18 || length > 120) score -= 12;
  else score += 3;

  if (/\d/.test(title)) score += 5;
  if (hasAnyTerm(title, TITLE_ANGLE_TERMS)) score += 6;
  if (/[?:]/.test(title)) score += 3;
  if (candidatesCount >= 10) score += 4;

  const finalScore = clampScore(score);
  return {
    key: "title",
    label: "Título",
    score: finalScore,
    reason:
      finalScore >= 75
        ? "O título tem promessa clara, tamanho publicável e sinais de CTR/SEO."
        : "O título precisa de promessa mais específica, contraste ou linguagem mais buscável.",
  };
}

function scoreThumbnail(params: {
  selectedTitle: string;
  thumbnailPrompt: string;
  thumbnailText: string;
  issues: CritiqueIssue[];
}): CritiqueScore {
  if (!params.thumbnailPrompt && !params.thumbnailText) {
    params.issues.push({
      severity: "critical",
      area: "thumbnail",
      message: "O pacote não tem prompt nem texto de thumbnail.",
      recommendation: "Crie uma thumbnail que visualize a promessa central do título.",
    });
    return {
      key: "thumbnail",
      label: "Thumbnail",
      score: 30,
      reason: "Sem thumbnail não existe pacote título + imagem para validar.",
    };
  }

  const visualText = `${params.thumbnailPrompt} ${params.thumbnailText}`;
  const overlap = keywordOverlapRatio(params.selectedTitle, visualText);
  const thumbnailWords = params.thumbnailText.split(/\s+/).filter(Boolean).length;
  let score = 54 + overlap * 38;

  if (thumbnailWords > 0 && thumbnailWords <= 6) score += 6;
  if (thumbnailWords > 8) score -= 9;
  if (params.thumbnailPrompt.length >= 80) score += 4;
  if (overlap < 0.16) {
    params.issues.push({
      severity: "warning",
      area: "thumbnail",
      message: "A thumbnail parece desconectada do título selecionado.",
      recommendation: "Repita visualmente o objeto, promessa ou tensão principal do título na imagem.",
    });
    score -= 10;
  }

  const finalScore = clampScore(score);
  return {
    key: "thumbnail",
    label: "Thumbnail",
    score: finalScore,
    reason:
      overlap >= 0.3
        ? "A thumbnail carrega termos e intenção próximos do título."
        : "A thumbnail ainda não reforça o mesmo clique prometido pelo título.",
  };
}

function scoreScript(params: {
  selectedTitle: string;
  script: string;
  description: string;
  captions: string[];
  issues: CritiqueIssue[];
}): CritiqueScore {
  if (params.script.length < 180) {
    params.issues.push({
      severity: "warning",
      area: "script",
      message: "O roteiro está curto demais para sustentar a promessa do pacote.",
      recommendation: "Expanda hook, desenvolvimento e fechamento antes de exportar.",
    });
    return {
      key: "script",
      label: "Roteiro",
      score: 42,
      reason: "Roteiro curto demais para avaliar retenção e entrega da promessa.",
    };
  }

  const overlap = keywordOverlapRatio(params.selectedTitle, `${params.script} ${params.description}`);
  let score = 62 + overlap * 24;
  if (params.script.length >= 500) score += 8;
  if (params.script.length >= 1200) score += 4;
  if (hasAnyTerm(params.script.slice(0, 700), SCRIPT_HOOK_TERMS)) score += 5;
  if (params.captions.length) score += 2;

  const finalScore = clampScore(score);
  return {
    key: "script",
    label: "Roteiro",
    score: finalScore,
    reason:
      finalScore >= 75
        ? "O roteiro sustenta o tema do título e tem material suficiente para entrega."
        : "O roteiro precisa conectar melhor a promessa do título com a entrega do vídeo.",
  };
}

function scorePackage(params: {
  titleScore: number;
  thumbnailScore: number;
  scriptScore: number;
  titleCandidatesCount: number;
  captionsCount: number;
}): CritiqueScore {
  let score = weightedAverage([
    { score: params.titleScore, weight: 0.28 },
    { score: params.thumbnailScore, weight: 0.36 },
    { score: params.scriptScore, weight: 0.36 },
  ]);
  if (params.titleCandidatesCount >= 10) score += 3;
  if (params.captionsCount) score += 2;
  score = clampScore(score);

  return {
    key: "package",
    label: "Pacote",
    score,
    reason:
      score >= 75
        ? "Título, thumbnail e roteiro estão trabalhando na mesma promessa."
        : "O pacote ainda tem desalinhamento entre clique, imagem e entrega.",
  };
}

function recommendTitle(params: {
  selectedTitle: string;
  candidates: CritiqueTitleCandidate[];
  script: string;
  thumbnailPrompt: string;
  thumbnailText: string;
}) {
  if (!params.candidates.length) {
    return {
      recommendedTitle: params.selectedTitle,
      reason: "Sem lista de candidatos; mantendo o título selecionado.",
    };
  }

  const scored = params.candidates.map((candidate) => {
    const title = cleanText(candidate.title);
    const providerScore = typeof candidate.score === "number" ? candidate.score : 72;
    const scriptFit = keywordOverlapRatio(title, params.script);
    const thumbnailFit = keywordOverlapRatio(title, `${params.thumbnailPrompt} ${params.thumbnailText}`);
    const angleBonus = hasAnyTerm(title, TITLE_ANGLE_TERMS) ? 5 : 0;
    return {
      ...candidate,
      title,
      critiqueScore: clampScore(providerScore * 0.58 + scriptFit * 18 + thumbnailFit * 18 + angleBonus),
      scriptFit,
      thumbnailFit,
    };
  });

  const currentScore = scored.find((candidate) => candidate.title === params.selectedTitle)?.critiqueScore ?? 0;
  const best = scored.sort((a, b) => b.critiqueScore - a.critiqueScore)[0];
  if (!best) {
    return {
      recommendedTitle: params.selectedTitle,
      reason: "Nenhum candidato válido para reavaliar.",
    };
  }

  const shouldChange = best.title !== params.selectedTitle && (best.critiqueScore >= currentScore + 4 || currentScore === 0);
  return {
    recommendedTitle: shouldChange ? best.title : params.selectedTitle,
    reason: shouldChange
      ? `Melhor encaixe após crítica: score ${best.critiqueScore}/100, com mais coerência entre roteiro e thumbnail.`
      : "O título selecionado continua sendo a opção mais coerente do pacote.",
  };
}

function firstCandidateTitle(input: CritiquePackageInput) {
  return input.topTitleCandidates?.[0]?.title || input.titleCandidates?.[0]?.title || "";
}

function normalizeCandidates(candidates: CritiqueTitleCandidate[]) {
  const seen = new Set<string>();
  const out: CritiqueTitleCandidate[] = [];
  for (const candidate of candidates) {
    const title = cleanText(candidate.title);
    if (!title) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...candidate, title });
  }
  return out;
}

function cleanText(value: string) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

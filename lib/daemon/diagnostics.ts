import type { ConnectionErrorKind } from "./connection";

export type DiagnosticSurface = "agent" | "provider" | "media" | "research" | "fallback";

export type DiagnosticSeverity = "info" | "warning" | "error";

export type DiagnosticKind =
  | ConnectionErrorKind
  | "success"
  | "agent_not_installed"
  | "agent_spawn_failed"
  | "fallback_unavailable"
  | "fallback_used"
  | "fallback_failed"
  | "provider_not_configured"
  | "media_generation_failed"
  | "unsupported_media_surface"
  | "unsupported_media_provider"
  | "stub_media"
  | "cancelled"
  | "research_unconfigured"
  | "research_failed"
  | "research_no_sources";

export type Diagnostic = {
  surface: DiagnosticSurface;
  kind: DiagnosticKind;
  severity: DiagnosticSeverity;
  message: string;
  action?: string;
  route?: string;
  model?: string;
  rawMessage?: string;
};

export class DiagnosticError extends Error {
  readonly diagnostics: Diagnostic[];
  readonly errorKind: DiagnosticKind;

  constructor(message: string, diagnostics: Diagnostic[], errorKind?: DiagnosticKind) {
    super(message);
    this.name = "DiagnosticError";
    this.diagnostics = diagnostics;
    this.errorKind = errorKind ?? diagnostics[0]?.kind ?? "unknown";
  }
}

const secretPatterns = [
  /\bsk-[A-Za-z0-9_-]{12,}\b/g,
  /\bsk-ant-[A-Za-z0-9_-]{12,}\b/g,
  /\bAIza[A-Za-z0-9_-]{20,}\b/g,
  /\bBearer\s+[A-Za-z0-9._-]{12,}\b/gi,
  /\b(api[_-]?key|authorization|x-api-key)["'\s:=]+[A-Za-z0-9._-]{8,}/gi,
];

export function redactSensitive(value: string): string {
  return secretPatterns.reduce((current, pattern) => current.replace(pattern, (match, prefix) => `${prefix || ""}[redacted]`), value);
}

export function diagnosticMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || "Unknown error");
  return redactSensitive(message).trim();
}

export function diagnosticsFromError(error: unknown): Diagnostic[] {
  if (error instanceof DiagnosticError) return error.diagnostics;
  return [];
}

function actionForKind(kind: DiagnosticKind, surface: DiagnosticSurface): string {
  switch (kind) {
    case "auth_failed":
      return "Revise a API key salva para esse provider.";
    case "rate_limited":
      return "Aguarde alguns minutos ou troque para outro provider/modelo.";
    case "not_found_model":
      return surface === "agent"
        ? "Troque para Default (CLI config) ou selecione um modelo suportado pela CLI instalada."
        : "Selecione um modelo existente para esse provider.";
    case "invalid_base_url":
      return "Corrija a Base URL. URLs remotas privadas/reservadas ficam bloqueadas por segurança.";
    case "forbidden":
      return "A chave existe, mas não tem permissão para essa rota ou modelo.";
    case "upstream_unavailable":
      return "O provider não respondeu corretamente. Tente novamente ou use fallback.";
    case "timeout":
      return "A chamada estourou o tempo limite. Tente novamente com prompt menor ou outro provider.";
    case "agent_not_installed":
      return "Instale a CLI, ajuste o PATH ou informe o executável customizado nas configurações.";
    case "agent_spawn_failed":
      return "Abra o erro da CLI, corrija autenticação/modelo/permissões ou escolha outro agente.";
    case "fallback_unavailable":
      return "Configure e teste um provider BYOK de texto para servir como fallback.";
    case "fallback_used":
      return "A geração continuou usando o fallback configurado.";
    case "fallback_failed":
      return "O agente falhou e o fallback também falhou; revise os dois caminhos.";
    case "provider_not_configured":
      return "Habilite o provider e salve a chave/base URL antes de testar ou gerar.";
    case "media_generation_failed":
      return "Revise provider/modelo de imagem e tente novamente.";
    case "unsupported_media_surface":
      return "Essa superfície existe no contrato, mas ainda está escondida na UI ativa.";
    case "unsupported_media_provider":
      return "Esse provider está no catálogo, mas ainda não tem adapter ativo neste build.";
    case "stub_media":
      return "Resultado gerado por stub local, útil para smoke test sem API key.";
    case "cancelled":
      return "A tarefa foi cancelada; gere novamente se ainda precisar do arquivo.";
    case "research_unconfigured":
      return "Configure Tavily antes de ativar pesquisa de outliers.";
    case "research_failed":
      return "Revise a chave/base URL de pesquisa ou gere sem pesquisa externa.";
    case "research_no_sources":
      return "Tente uma query mais específica ou cole outliers manualmente.";
    default:
      return "Veja o detalhe do erro e tente novamente.";
  }
}

export function agentDiagnostic(input: {
  kind: DiagnosticKind;
  message?: string;
  agentName?: string;
  model?: string;
}): Diagnostic {
  const label = input.agentName ? `${input.agentName}` : "CLI local";
  const message = input.message
    ? `${label}: ${diagnosticMessage(input.message)}`
    : `${label}: teste concluído.`;
  return {
    surface: "agent",
    kind: input.kind,
    severity: input.kind === "success" ? "info" : "error",
    message,
    action: actionForKind(input.kind, "agent"),
    route: input.agentName,
    model: input.model,
    rawMessage: input.message ? diagnosticMessage(input.message) : undefined,
  };
}

export function providerDiagnostic(input: {
  kind: DiagnosticKind;
  message?: string;
  providerName?: string;
  providerId?: string;
  model?: string;
}): Diagnostic {
  const label = input.providerName || input.providerId || "Provider";
  const message = input.message
    ? `${label}: ${diagnosticMessage(input.message)}`
    : `${label}: conexão testada.`;
  return {
    surface: "provider",
    kind: input.kind,
    severity: input.kind === "success" ? "info" : "error",
    message,
    action: actionForKind(input.kind, "provider"),
    route: input.providerId,
    model: input.model,
    rawMessage: input.message ? diagnosticMessage(input.message) : undefined,
  };
}

export function fallbackDiagnostic(input: {
  kind: "fallback_unavailable" | "fallback_used" | "fallback_failed";
  from?: string;
  to?: string;
  model?: string;
  reason?: string;
}): Diagnostic {
  const route = [input.from, input.to].filter(Boolean).join(" -> ");
  const base =
    input.kind === "fallback_used"
      ? `Fallback usado: ${route || input.to || "provider BYOK"}.`
      : input.kind === "fallback_failed"
        ? `Fallback falhou: ${route || input.to || "provider BYOK"}.`
        : "Fallback BYOK indisponível.";
  const reason = input.reason ? ` Motivo: ${diagnosticMessage(input.reason)}` : "";
  return {
    surface: "fallback",
    kind: input.kind,
    severity: input.kind === "fallback_used" ? "warning" : "error",
    message: `${base}${reason}`,
    action: actionForKind(input.kind, "fallback"),
    route,
    model: input.model,
    rawMessage: input.reason ? diagnosticMessage(input.reason) : undefined,
  };
}

export function mediaDiagnostic(input: { message: string; providerId?: string; model?: string }): Diagnostic {
  return {
    surface: "media",
    kind: "media_generation_failed",
    severity: "error",
    message: diagnosticMessage(input.message),
    action: actionForKind("media_generation_failed", "media"),
    route: input.providerId,
    model: input.model,
    rawMessage: diagnosticMessage(input.message),
  };
}

export function unsupportedMediaDiagnostic(input: {
  surface?: string;
  providerId?: string;
  model?: string;
  message?: string;
}): Diagnostic {
  const kind = input.surface ? "unsupported_media_surface" : "unsupported_media_provider";
  return {
    surface: "media",
    kind,
    severity: "error",
    message:
      input.message ??
      (input.surface
        ? `${input.surface} existe no contrato, mas não está ativo na UI.`
        : `${input.providerId ?? "media"} está no catálogo de mídia, mas ainda não tem adapter ativo.`),
    action: actionForKind(kind, "media"),
    route: input.providerId ?? input.surface,
    model: input.model,
  };
}

export function stubMediaDiagnostic(input: { providerId?: string; model?: string } = {}): Diagnostic {
  return {
    surface: "media",
    kind: "stub_media",
    severity: "info",
    message: "Imagem gerada por stub local determinístico.",
    action: actionForKind("stub_media", "media"),
    route: input.providerId ?? "stub",
    model: input.model ?? "stub-image",
  };
}

export function researchDiagnostic(input: {
  kind: "research_unconfigured" | "research_failed" | "research_no_sources";
  message?: string;
  route?: string;
}): Diagnostic {
  return {
    surface: "research",
    kind: input.kind,
    severity: "error",
    message: input.message ? diagnosticMessage(input.message) : "Pesquisa externa indisponível.",
    action: actionForKind(input.kind, "research"),
    route: input.route ?? "tavily",
    rawMessage: input.message ? diagnosticMessage(input.message) : undefined,
  };
}

import { getProviderManifest } from "@/lib/providers/manifests";
import type { ProviderDefaults, ProviderStoredConfig } from "@/lib/providers/types";
import type { AppSettings } from "@/lib/storage/settings";
import { fallbackDiagnostic, type Diagnostic } from "./diagnostics";

export type FallbackPlan =
  | {
      available: true;
      capability: "text";
      providerId: string;
      model: string;
      diagnostic?: Diagnostic;
    }
  | {
      available: false;
      capability: "text";
      reason: string;
      diagnostic: Diagnostic;
    };

function defaultTextChoice(settings: Pick<AppSettings, "defaults">): ProviderDefaults["text"] | undefined {
  return settings.defaults?.text;
}

function providerConfig(
  settings: Pick<AppSettings, "providers">,
  providerId: string
): ProviderStoredConfig | undefined {
  return settings.providers?.[providerId];
}

export function evaluateTextFallback(settings: Pick<AppSettings, "defaults" | "providers">): FallbackPlan {
  const choice = defaultTextChoice(settings);
  if (!choice?.providerId) {
    const reason = "Nenhum provider padrão de texto foi definido.";
    return {
      available: false,
      capability: "text",
      reason,
      diagnostic: fallbackDiagnostic({ kind: "fallback_unavailable", reason }),
    };
  }

  const manifest = getProviderManifest(choice.providerId);
  if (!manifest) {
    const reason = `Provider padrão "${choice.providerId}" não existe no catálogo.`;
    return {
      available: false,
      capability: "text",
      reason,
      diagnostic: fallbackDiagnostic({ kind: "fallback_unavailable", to: choice.providerId, reason }),
    };
  }

  if (!manifest.capabilities.includes("text")) {
    const reason = `${manifest.name} não suporta geração de texto.`;
    return {
      available: false,
      capability: "text",
      reason,
      diagnostic: fallbackDiagnostic({ kind: "fallback_unavailable", to: choice.providerId, reason }),
    };
  }

  const stored = providerConfig(settings, choice.providerId);
  if (!stored) {
    const reason = `${manifest.name} não tem configuração salva.`;
    return {
      available: false,
      capability: "text",
      reason,
      diagnostic: fallbackDiagnostic({ kind: "fallback_unavailable", to: choice.providerId, reason }),
    };
  }

  const hasAuth = manifest.authHeader === "none" || Boolean(stored.apiKey?.trim());
  if (!hasAuth) {
    const reason = `${manifest.name} precisa de API key para fallback.`;
    return {
      available: false,
      capability: "text",
      reason,
      diagnostic: fallbackDiagnostic({ kind: "fallback_unavailable", to: choice.providerId, reason }),
    };
  }

  if (!stored.enabled && manifest.authHeader !== "none" && !stored.apiKey?.trim()) {
    const reason = `${manifest.name} está desativado e sem chave.`;
    return {
      available: false,
      capability: "text",
      reason,
      diagnostic: fallbackDiagnostic({ kind: "fallback_unavailable", to: choice.providerId, reason }),
    };
  }

  return {
    available: true,
    capability: "text",
    providerId: choice.providerId,
    model: choice.model || stored.models?.text || manifest.defaultModels.text || "default",
  };
}

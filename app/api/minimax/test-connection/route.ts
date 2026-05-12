import { NextResponse } from "next/server";
import { getAdapterForProvider } from "@/lib/providers/registry";
import { resolveProviderConfig } from "@/lib/providers/runtime";
import { classifyConnectionError, validateBaseUrl } from "@/lib/daemon/connection";
import { providerDiagnostic } from "@/lib/daemon/diagnostics";
import { saveProviderModelCache } from "@/lib/providers/modelCatalog";

export async function GET() {
  try {
    const config = await resolveProviderConfig("text", { providerId: "minimax" });
    if (!config.apiKey) {
      return NextResponse.json({
        ok: false,
        models: [],
        error: "API Key not configured. Please go to Settings and add your MiniMax API key.",
        errorKind: "auth_failed",
        diagnostics: [
          providerDiagnostic({
            kind: "auth_failed",
            message: "API Key not configured. Please go to Settings and add your MiniMax API key.",
            providerId: "minimax",
          }),
        ],
      });
    }

    const baseUrl = await validateBaseUrl(config.baseUrl);
    if (!baseUrl.ok) {
      return NextResponse.json({
        ok: false,
        models: [],
        error: baseUrl.error,
        errorKind: "invalid_base_url",
        diagnostics: [providerDiagnostic({ kind: "invalid_base_url", message: baseUrl.error, providerId: "minimax" })],
      });
    }

    const result = await getAdapterForProvider("minimax").testConnection(config);
    if (result.ok && result.models.length) {
      await saveProviderModelCache({
        providerId: "minimax",
        capability: "text",
        models: result.models,
        baseUrl: config.baseUrl,
      });
    }
    const errorKind = result.ok ? undefined : classifyConnectionError({ message: result.error });
    return NextResponse.json({
      ...result,
      errorKind,
      diagnostics: result.ok
        ? [providerDiagnostic({ kind: "success", providerId: "minimax", model: config.models.text })]
        : [providerDiagnostic({ kind: errorKind ?? "unknown", message: result.error, providerId: "minimax" })],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection test failed";
    const errorKind = classifyConnectionError({ message });
    return NextResponse.json({
      ok: false,
      models: [],
      error: message,
      errorKind,
      diagnostics: [providerDiagnostic({ kind: errorKind, message, providerId: "minimax" })],
    });
  }
}

import { NextResponse } from "next/server";
import { classifyConnectionError, validateBaseUrl } from "@/lib/daemon/connection";
import { providerDiagnostic } from "@/lib/daemon/diagnostics";
import { runtimeConfigFromPayload, type ProviderConnectionPayload } from "@/lib/providers/connectionPayload";
import { saveProviderModelCache } from "@/lib/providers/modelCatalog";
import { getAdapterForProvider } from "@/lib/providers/registry";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ProviderConnectionPayload;
    const config = runtimeConfigFromPayload(body);
    const baseUrl = await validateBaseUrl(config.baseUrl);
    if (!baseUrl.ok) {
      return NextResponse.json({
        ok: false,
        models: [],
        error: baseUrl.error,
        errorKind: "invalid_base_url",
        diagnostics: [providerDiagnostic({ kind: "invalid_base_url", message: baseUrl.error, providerId: config.providerId })],
      });
    }

    const adapter = getAdapterForProvider(config.providerId);
    const result = await adapter.testConnection(config);
    const capability =
      body.capability ??
      config.manifest.capabilities.find((item): item is "text" | "image" => item === "text" || item === "image");
    if (result.ok && capability && result.models.length) {
      await saveProviderModelCache({
        providerId: config.providerId,
        capability,
        models: result.models,
        baseUrl: config.baseUrl,
      });
    }
    const errorKind = result.ok ? undefined : classifyConnectionError({ message: result.error });
    return NextResponse.json({
      ...result,
      errorKind,
      diagnostics: result.ok
        ? [providerDiagnostic({ kind: "success", providerId: config.providerId, model: config.models.text || config.models.image })]
        : [providerDiagnostic({ kind: errorKind ?? "unknown", message: result.error, providerId: config.providerId })],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection failed";
    const errorKind = classifyConnectionError({ message });
    return NextResponse.json({
      ok: false,
      models: [],
      error: message,
      errorKind,
      diagnostics: [providerDiagnostic({ kind: errorKind, message })],
    });
  }
}

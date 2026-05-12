import { NextResponse } from "next/server";
import { getAdapterForProvider } from "@/lib/providers/registry";
import { resolveProviderConfig } from "@/lib/providers/runtime";
import { getProviderManifest } from "@/lib/providers/manifests";
import { classifyConnectionError, validateBaseUrl } from "@/lib/daemon/connection";
import { providerDiagnostic } from "@/lib/daemon/diagnostics";
import { saveProviderModelCache } from "@/lib/providers/modelCatalog";
import type { ActiveProviderCapability } from "@/lib/providers/types";

type Context = { params: Promise<{ providerId: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { providerId } = await params;
  try {
    const manifest = getProviderManifest(providerId);
    if (!manifest) {
      return NextResponse.json({ ok: false, models: [], error: "Unknown provider" }, { status: 404 });
    }

    const capability = manifest.capabilities.find((item): item is ActiveProviderCapability => item === "text" || item === "image");
    if (!capability) {
      return NextResponse.json({ ok: false, models: [], error: "Provider has no active capabilities" }, { status: 400 });
    }
    const config = await resolveProviderConfig(capability, { providerId });
    const baseUrl = await validateBaseUrl(config.baseUrl);
    if (!baseUrl.ok) {
      return NextResponse.json({
        ok: false,
        models: [],
        error: baseUrl.error,
        errorKind: "invalid_base_url",
        diagnostics: [providerDiagnostic({ kind: "invalid_base_url", message: baseUrl.error, providerId })],
      });
    }

    const adapter = getAdapterForProvider(providerId);
    const result = await adapter.testConnection(config);
    if (result.ok && result.models.length) {
      await saveProviderModelCache({
        providerId,
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
        ? [providerDiagnostic({ kind: "success", providerName: manifest.name, providerId, model: config.models[capability] })]
        : [providerDiagnostic({ kind: errorKind ?? "unknown", message: result.error, providerName: manifest.name, providerId })],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection failed";
    const errorKind = classifyConnectionError({ message });
    return NextResponse.json({
      ok: false,
      models: [],
      error: message,
      errorKind,
      diagnostics: [providerDiagnostic({ kind: errorKind, message, providerId })],
    });
  }
}

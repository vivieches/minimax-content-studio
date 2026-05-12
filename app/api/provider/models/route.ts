import { NextResponse } from "next/server";
import { classifyConnectionError } from "@/lib/daemon/connection";
import { providerDiagnostic } from "@/lib/daemon/diagnostics";
import { runtimeConfigFromPayload, type ProviderConnectionPayload } from "@/lib/providers/connectionPayload";
import { listProviderModels } from "@/lib/providers/modelCatalog";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ProviderConnectionPayload;
    const config = runtimeConfigFromPayload(body);
    const capability =
      body.capability ??
      config.manifest.capabilities.find((item): item is "text" | "image" => item === "text" || item === "image");
    if (!capability) {
      return NextResponse.json({ ok: false, models: [], modelsDetailed: [], error: "Provider has no active capability" }, { status: 400 });
    }
    const result = await listProviderModels({ config, capability, refresh: true });
    const errorKind = result.error ? classifyConnectionError({ message: result.error }) : undefined;
    return NextResponse.json({
      ...result,
      errorKind,
      diagnostics: result.error
        ? [providerDiagnostic({ kind: errorKind ?? "unknown", message: result.error, providerId: config.providerId })]
        : [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list models";
    const errorKind = classifyConnectionError({ message });
    return NextResponse.json({
      ok: false,
      models: [],
      modelsDetailed: [],
      error: message,
      errorKind,
      diagnostics: [providerDiagnostic({ kind: errorKind, message })],
    });
  }
}

import { NextResponse } from "next/server";
import { classifyConnectionError } from "@/lib/daemon/connection";
import { providerDiagnostic } from "@/lib/daemon/diagnostics";
import { listProviderModels } from "@/lib/providers/modelCatalog";
import { resolveProviderConfig } from "@/lib/providers/runtime";
import { getProviderManifest } from "@/lib/providers/manifests";
import type { ActiveProviderCapability } from "@/lib/providers/types";

type Context = { params: Promise<{ providerId: string }> };

export async function GET(request: Request, { params }: Context) {
  const { providerId } = await params;
  try {
    const manifest = getProviderManifest(providerId);
    if (!manifest) {
      return NextResponse.json({ ok: false, models: [], error: "Unknown provider" }, { status: 404 });
    }

    const url = new URL(request.url);
    const requestedCapability = url.searchParams.get("capability");
    const capability = (requestedCapability === "text" || requestedCapability === "image"
      ? requestedCapability
      : manifest.capabilities.find((item): item is ActiveProviderCapability => item === "text" || item === "image"));
    if (!capability) {
      return NextResponse.json({ ok: false, models: [], error: "Provider has no active capabilities" }, { status: 400 });
    }

    const config = await resolveProviderConfig(capability, { providerId });
    const result = await listProviderModels({
      config,
      capability,
      refresh: url.searchParams.get("refresh") === "1",
    });
    const errorKind = result.error ? classifyConnectionError({ message: result.error }) : undefined;
    return NextResponse.json({
      ...result,
      errorKind,
      diagnostics: result.error
        ? [providerDiagnostic({ kind: errorKind ?? "unknown", message: result.error, providerName: manifest.name, providerId })]
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
      diagnostics: [providerDiagnostic({ kind: errorKind, message, providerId })],
    });
  }
}

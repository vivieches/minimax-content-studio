import { NextResponse } from "next/server";
import { getAdapterForProvider } from "@/lib/providers/registry";
import { resolveProviderConfig } from "@/lib/providers/runtime";
import { getProviderManifest } from "@/lib/providers/manifests";

type Context = { params: Promise<{ providerId: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { providerId } = await params;
  try {
    const manifest = getProviderManifest(providerId);
    if (!manifest) {
      return NextResponse.json({ ok: false, models: [], error: "Unknown provider" }, { status: 404 });
    }

    const capability = manifest.capabilities[0];
    const config = await resolveProviderConfig(capability, { providerId });
    const adapter = getAdapterForProvider(providerId);
    const result = await adapter.testConnection(config);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({
      ok: false,
      models: [],
      error: error instanceof Error ? error.message : "Connection failed",
    });
  }
}

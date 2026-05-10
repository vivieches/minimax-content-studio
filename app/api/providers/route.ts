import { NextResponse } from "next/server";
import { listProviderManifests } from "@/lib/providers/registry";
import { getSettings } from "@/lib/storage/settings";

export async function GET() {
  const settings = await getSettings();
  const providers = listProviderManifests().map((manifest) => {
    const config = settings.providers[manifest.id];
    return {
      ...manifest,
      enabled: Boolean(config?.enabled),
      hasApiKey: Boolean(config?.apiKey),
      configuredModels: config?.models ?? {},
    };
  });

  return NextResponse.json({
    ok: true,
    providers,
    defaults: settings.defaults,
  });
}

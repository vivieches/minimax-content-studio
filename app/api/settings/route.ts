import { NextResponse } from "next/server";
import { getSettings, updateSettings, resetSettings } from "@/lib/storage/settings";
import { settingsSchema, validateOr400 } from "@/lib/validation/schemas";

type Settings = Awaited<ReturnType<typeof getSettings>>;
type SafeSettings = Omit<Settings, "providers"> & {
  providers: Record<string, Omit<Settings["providers"][string], "apiKey"> & { hasApiKey: boolean }>;
};

function stripApiKeys(settings: Settings): SafeSettings {
  const providers = Object.fromEntries(
    Object.entries(settings.providers).map(([providerId, config]) => {
      const { apiKey: _apiKey, ...safeConfig } = config;
      return [providerId, { ...safeConfig, hasApiKey: Boolean(_apiKey) }];
    })
  );

  return { ...settings, providers };
}

export async function GET() {
  try {
    const settings = await getSettings();
    // Never expose API keys in GET responses
    const safeSettings = stripApiKeys(settings);
    return NextResponse.json({ ok: true, settings: safeSettings });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const validation = validateOr400(settingsSchema, body);
    if (!validation.success) {
      return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
    }

    const { action, ...settings } = validation.data;

    if (action === "reset") {
      const result = await resetSettings();
      return NextResponse.json({ ok: true, settings: stripApiKeys(result) });
    }

    if (action === "clear_assets") {
      const { clearAssets } = await import("@/lib/storage/assets");
      await clearAssets();
      return NextResponse.json({ ok: true });
    }

    const result = await updateSettings(settings as Partial<Awaited<ReturnType<typeof getSettings>>>);
    // Never expose API keys in PUT responses either
    return NextResponse.json({ ok: true, settings: stripApiKeys(result) });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to save settings" },
      { status: 500 }
    );
  }
}

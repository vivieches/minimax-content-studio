import { NextResponse } from "next/server";
import { getSettings, updateSettings, resetSettings } from "@/lib/storage/settings";
import { settingsSchema, validateOr400 } from "@/lib/validation/schemas";

// SafeSettings omits apiKey — never returned to the client
type SafeSettings = Omit<Awaited<ReturnType<typeof getSettings>>, "apiKey"> & {
  hasApiKey: boolean;
};

function stripApiKey(settings: Awaited<ReturnType<typeof getSettings>>): SafeSettings {
  const { apiKey: _apiKey, ...safe } = settings;
  return { ...safe, hasApiKey: Boolean(_apiKey) };
}

export async function GET() {
  try {
    const settings = await getSettings();
    // Never expose apiKey in GET responses
    const safeSettings = stripApiKey(settings);
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
      return NextResponse.json({ ok: true, settings: stripApiKey(result) });
    }

    if (action === "clear_assets") {
      const { clearAssets } = await import("@/lib/storage/assets");
      await clearAssets();
      return NextResponse.json({ ok: true });
    }

    const result = await updateSettings(settings);
    // Never expose apiKey in PUT responses either
    return NextResponse.json({ ok: true, settings: stripApiKey(result) });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to save settings" },
      { status: 500 }
    );
  }
}

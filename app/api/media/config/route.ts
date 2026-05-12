import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/storage/settings";
import { settingsSchema, validateOr400 } from "@/lib/validation/schemas";

function maskedProviderConfig(settings: Awaited<ReturnType<typeof getSettings>>) {
  return Object.fromEntries(
    Object.entries(settings.providers).map(([providerId, config]) => [
      providerId,
      {
        enabled: config.enabled,
        configured: Boolean(config.apiKey),
        apiKeyTail: config.apiKey ? config.apiKey.slice(-4) : "",
        baseUrl: config.baseUrl,
        models: config.models,
        extra: config.extra,
      },
    ])
  );
}

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({
    ok: true,
    providers: maskedProviderConfig(settings),
    defaults: settings.defaults,
  });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => ({}));
  const validation = validateOr400(settingsSchema, body);
  if (!validation.success) {
    return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
  }

  const { action, ...patch } = validation.data;
  void action;
  const settings = await updateSettings(patch as Partial<Awaited<ReturnType<typeof getSettings>>>);
  return NextResponse.json({
    ok: true,
    providers: maskedProviderConfig(settings),
    defaults: settings.defaults,
  });
}

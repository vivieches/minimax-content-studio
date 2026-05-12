import { NextResponse } from "next/server";
import { buildProviderCatalog } from "@/lib/providers/modelCatalog";
import { getSettings } from "@/lib/storage/settings";

export async function GET() {
  const settings = await getSettings();
  const providers = await buildProviderCatalog({ providers: settings.providers });

  return NextResponse.json({
    ok: true,
    providers,
    defaults: settings.defaults,
  });
}

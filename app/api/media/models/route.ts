import { NextResponse } from "next/server";
import { buildMediaCatalog } from "@/lib/providers/modelCatalog";
import { getSettings } from "@/lib/storage/settings";

export async function GET(request: Request) {
  const settings = await getSettings();
  const url = new URL(request.url);
  const includeHidden = url.searchParams.get("includeHidden") === "1";
  const providers = await buildMediaCatalog({ providers: settings.providers, includeHidden });

  return NextResponse.json({
    ok: true,
    activeSurfaces: ["image"],
    hiddenSurfaces: includeHidden ? ["video", "audio"] : [],
    providers,
    imageModels: providers
      .filter((provider) => provider.surface === "image" && provider.active)
      .flatMap((provider) =>
        provider.models.map((model) => ({
          id: model,
          providerId: provider.id,
          providerName: provider.name,
        }))
      ),
    aspects: ["1:1", "16:9", "9:16", "4:3", "3:4"],
  });
}

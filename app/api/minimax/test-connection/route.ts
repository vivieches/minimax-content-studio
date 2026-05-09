import { NextResponse } from "next/server";
import { testConnection } from "@/lib/minimax/client";
import { getSettings } from "@/lib/storage/settings";

export async function GET() {
  try {
    const settings = await getSettings();
    if (!settings.apiKey) {
      return NextResponse.json({
        ok: false,
        models: [],
        error: "API Key not configured. Please go to Settings and add your MiniMax API key.",
      });
    }

    const result = await testConnection();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({
      ok: false,
      models: [],
      error: error instanceof Error ? error.message : "Connection test failed",
    });
  }
}

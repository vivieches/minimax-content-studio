import { NextResponse } from "next/server";
import { listModels } from "@/lib/minimax/client";

export async function GET() {
  try {
    const models = await listModels();
    return NextResponse.json({ ok: true, models });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      models: [],
      error: error instanceof Error ? error.message : "Failed to list models",
    });
  }
}

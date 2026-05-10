import { NextResponse } from "next/server";
import { generateTextWithProvider } from "@/lib/providers/generation";
import { createAsset } from "@/lib/storage/assets";
import { saveContentFile } from "@/lib/minimax/files";
import { scriptGenerateSchema, validateOr400 } from "@/lib/validation/schemas";
import { withRateLimitHeaders, validatePayloadSize, PAYLOAD_LIMITS } from "@/lib/security/rateLimit";

function parseScriptResponse(content: string): Record<string, unknown> {
  const jsonStart = content.indexOf("{");
  const jsonEnd = content.lastIndexOf("}");
  const jsonStr = jsonStart >= 0 && jsonEnd >= jsonStart ? content.slice(jsonStart, jsonEnd + 1) : content;

  try {
    const parsed = JSON.parse(jsonStr);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {
      detected_requirements: [],
      script: content,
      thumbnail_prompt: "",
      thumbnail_text: "",
      music_prompt: "",
      compliance_check: [],
      missing_requirements: [],
      assumptions: ["The provider returned plain text instead of JSON."],
    };
  }
}

export async function POST(request: Request) {
  const sizeError = validatePayloadSize(request, PAYLOAD_LIMITS.briefing);
  if (sizeError) return sizeError;

  try {
    const body = await request.json();
    const validation = validateOr400(scriptGenerateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { briefing, saveToAssets = true } = validation.data;
    const { systemPrompt } = await import("@/prompts/content-agent-prompt");
    const textResult = await generateTextWithProvider({
      systemPrompt,
      prompt: briefing,
      maxTokens: 4096,
      temperature: 0.7,
    });
    const result: Record<string, unknown> = {
      ...parseScriptResponse(textResult.content),
      providerId: textResult.providerId,
      model: textResult.model,
    };

    if (saveToAssets && result.script) {
      try {
        const title = (result.title as string) ?? `Script - ${briefing.slice(0, 50)}`;
        const filePath = `files/scripts/${Date.now()}-script.md`;
        await saveContentFile("scripts", `${Date.now()}-script.md`, String(result.script));

        await createAsset({
          type: "script",
          title,
          description: briefing.slice(0, 200),
          content: String(result.script),
          filePath,
          metadata: result,
          sourceModule: "script-generator",
          tags: (result.tags as string[]) ?? [],
        });
      } catch {
        // Asset saving is non-blocking
      }
    }

    return withRateLimitHeaders(NextResponse.json(result));
  } catch (error) {
    console.error("Script generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate script", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

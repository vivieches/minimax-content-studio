import { NextResponse } from "next/server";
import { diagnosticsFromError } from "@/lib/daemon/diagnostics";
import { generateTextWithProvider } from "@/lib/providers/generation";
import { createAsset } from "@/lib/storage/assets";
import { saveContentFile } from "@/lib/minimax/files";
import { scriptGenerateSchema, validateOr400 } from "@/lib/validation/schemas";
import { withRateLimitHeaders, validatePayloadSize, PAYLOAD_LIMITS } from "@/lib/security/rateLimit";
import { getBrandKit } from "@/daemon/brand-kit/store";
import { listMemories } from "@/daemon/memory/store";
import { composePrompt } from "@/daemon/prompts/composer";
import { listSkills } from "@/daemon/skills/registry";

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
    const [brandKit, memories, skills] = await Promise.all([
      getBrandKit(),
      listMemories({ query: briefing, limit: 6 }),
      listSkills({ limit: 8 }).catch(() => []),
    ]);
    const composed = composePrompt({
      routine: "Generate a creator-ready video script. Respect the brand kit, memories and references. Do not invent unavailable facts.",
      request: briefing,
      brandKit,
      memories,
      skills,
      schema: `Return JSON when possible with keys: title, script, thumbnail_prompt, thumbnail_text, tags, assumptions. If JSON is impossible, return a complete script as plain text.`,
    });
    const textResult = await generateTextWithProvider({
      systemPrompt,
      prompt: composed.prompt,
      maxTokens: 4096,
      temperature: 0.7,
    });
    const result: Record<string, unknown> = {
      ...parseScriptResponse(textResult.content),
      providerId: textResult.providerId,
      model: textResult.model,
      diagnostics: textResult.diagnostics,
      promptLayers: composed.layers.map((layer) => ({
        id: layer.id,
        title: layer.title,
        enabled: layer.enabled,
      })),
    };

    if (saveToAssets && result.script) {
      try {
        const title = (result.title as string) ?? `Script - ${briefing.slice(0, 50)}`;
        const filename = `${Date.now()}-script.md`;
        const filePath = `files/scripts/${filename}`;
        await saveContentFile("scripts", filename, String(result.script));

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
      {
        error: "Failed to generate script",
        details: error instanceof Error ? error.message : "Unknown error",
        diagnostics: diagnosticsFromError(error),
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { generateText } from "@/lib/minimax/text";
import { buildYoutubeThumbnailPrompt, buildThumbnailPromptGenerationPrompt, type ThumbnailInput } from "@/lib/prompts/thumbnailPrompt";
import { thumbnailGenerateSchema, thumbnailInputSchema, validateOr400 } from "@/lib/validation/schemas";
import { withRateLimitHeaders, validatePayloadSize, PAYLOAD_LIMITS } from "@/lib/security/rateLimit";

export async function POST(request: Request) {
  const sizeError = validatePayloadSize(request, PAYLOAD_LIMITS.briefing);
  if (sizeError) return sizeError;

  try {
    const body = await request.json();

    // Check if this is the new format (has 'topic' field)
    if (body.topic !== undefined) {
      const fullValidation = validateOr400(thumbnailInputSchema, body);
      if (!fullValidation.success) {
        return NextResponse.json({ error: fullValidation.error }, { status: 400 });
      }
      const input = fullValidation.data as ThumbnailInput;
      const instructions = buildYoutubeThumbnailPrompt(input);

      // Run through LLM to produce a concise, image-model-optimized visual prompt
      const hasFaceRef = input.hasReferenceFace;
      const prompt = await generateText({
        systemPrompt:
          "You are an expert image generation prompt engineer for YouTube thumbnails with millions of views. " +
          "Given thumbnail specs, write ONE image generation prompt under 200 words. " +
          "MANDATORY RULES — follow all exactly:\n" +
          "1. LAYOUT: split-frame. Person on the RIGHT 35-45% of frame, chest/waist up (NOT a face close-up). LEFT 55% has bold text.\n" +
          "2. PERSON: upper body visible, one hand pointing LEFT or reacting expressively. Strong emotion (shock, excitement, disbelief). Slight forward lean.\n" +
          "3. BACKGROUND: solid or 2-color gradient. Dark base (black, deep blue, dark green, dark purple). NO busy scenes. Dramatic rim or side lighting on face.\n" +
          "4. TEXT: 1-2 lines ultra-bold text left half. White or bright accent color. Large, readable, high contrast. Describe exact words from the title.\n" +
          "5. VISUAL ELEMENTS: include 1-2 topic-relevant floating graphic elements to make it feel like a real YouTube thumbnail. Examples: a glowing app icon or logo related to the topic, a floating UI card/mockup, a 3D object, an arrow or badge. Position them near the person or overlapping the text area. Make them relevant to the topic — e.g. for AI tools: a floating ChatGPT logo or robot; for finance: coins/chart; for gaming: controller/trophy.\n" +
          "6. COLOR: boosted saturation, cinematic grade. Skin tones warm and vivid. Background uses 1-2 strong accent colors that complement the topic.\n" +
          "7. STYLE: professional studio lighting, sharp focus on eyes, looks like MrBeast or top tech-channel thumbnail.\n" +
          (hasFaceRef ? "8. FACE: face from reference image — same likeness, new pose and expression.\n" : "") +
          "Write only the visual description. No JSON, no headers, no explanations.",
        userMessage: instructions,
      });

      return withRateLimitHeaders(NextResponse.json({ prompt }));
    }

    // Legacy format (has 'theme' field)
    const legacyValidation = validateOr400(thumbnailGenerateSchema, body);
    if (!legacyValidation.success) {
      return NextResponse.json({ error: legacyValidation.error }, { status: 400 });
    }

    const { theme, title, style, text, language } = legacyValidation.data;
    const prompt = buildThumbnailPromptGenerationPrompt({ theme, title, style, text, language });

    const content = await generateText({
      systemPrompt: "You are a thumbnail prompt engineer. Generate a detailed, professional visual prompt for a YouTube thumbnail. Return only the prompt text, no JSON or explanations.",
      userMessage: prompt,
    });

    return withRateLimitHeaders(NextResponse.json({ prompt: content }));
  } catch (error) {
    console.error("Thumbnail prompt error:", error);
    return NextResponse.json(
      { error: "Failed to generate thumbnail prompt", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

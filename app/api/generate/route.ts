import { NextResponse } from "next/server";
import { generateContentPipeline } from "@/lib/minimax";
import { generateThumbnailImage } from "@/lib/minimax-image";
import { generateMusic } from "@/lib/minimax-music";
import { generateSchema, validateOr400 } from "@/lib/validation/schemas";
import { withRateLimitHeaders, validatePayloadSize, PAYLOAD_LIMITS } from "@/lib/security/rateLimit";

export async function POST(request: Request) {
  const sizeError = validatePayloadSize(request, PAYLOAD_LIMITS.briefing);
  if (sizeError) return sizeError;

  try {
    const body = await request.json();
    const validation = validateOr400(generateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { briefing } = validation.data;

    // Step 1: Generate content pipeline with M2.7
    const pipelineResult = await generateContentPipeline(briefing);

    // Build final response with defaults
    const finalResult: Record<string, unknown> = {
      detected_requirements: pipelineResult.detected_requirements ?? [],
      script: pipelineResult.script ?? "",
      thumbnail_prompt: pipelineResult.thumbnail_prompt ?? "",
      thumbnail_text: pipelineResult.thumbnail_text ?? "",
      thumbnail_final_prompt: "",
      thumbnail_image_url: "",
      thumbnail_image_base64: "",
      thumbnail_error: "",
      music_prompt: pipelineResult.music_prompt ?? "",
      music_audio_url: "",
      music_audio_raw: "",
      music_error: "",
      compliance_check: pipelineResult.compliance_check ?? [],
      missing_requirements: pipelineResult.missing_requirements ?? [],
      assumptions: pipelineResult.assumptions ?? [],
    };

    // Step 2: Generate thumbnail image (non-blocking failure)
    if (finalResult.thumbnail_prompt && finalResult.thumbnail_text) {
      try {
        const imageResult = await generateThumbnailImage(
          String(finalResult.thumbnail_prompt),
          String(finalResult.thumbnail_text)
        );
        finalResult.thumbnail_image_url = imageResult.url ?? "";
        finalResult.thumbnail_image_base64 = imageResult.base64 ?? "";
        finalResult.thumbnail_final_prompt = imageResult.finalPrompt ?? "";
      } catch (imageError) {
        finalResult.thumbnail_error = imageError instanceof Error ? imageError.message : "Image generation failed";
      }
    }

    // Step 3: Generate music (non-blocking failure)
    if (finalResult.music_prompt) {
      try {
        const musicResult = await generateMusic(String(finalResult.music_prompt));
        finalResult.music_audio_url = musicResult.music_audio_url ?? "";
        finalResult.music_audio_raw = musicResult.music_audio_raw ?? "";
        finalResult.music_error = musicResult.music_error ?? "";
      } catch (musicError) {
        finalResult.music_error = musicError instanceof Error ? musicError.message : "Music generation failed";
      }
    }

    return withRateLimitHeaders(NextResponse.json(finalResult));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to generate pipeline",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

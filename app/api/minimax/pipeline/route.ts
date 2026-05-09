import { NextResponse } from "next/server";
import { generateScript } from "@/lib/minimax/text";
import { createAsset } from "@/lib/storage/assets";
import { createExport } from "@/lib/storage/exports";
import { saveContentFile } from "@/lib/minimax/files";
import { pipelineSchema, validateOr400 } from "@/lib/validation/schemas";
import { withRateLimitHeaders, validatePayloadSize, PAYLOAD_LIMITS } from "@/lib/security/rateLimit";

export async function POST(request: Request) {
  const sizeError = validatePayloadSize(request, PAYLOAD_LIMITS.briefing);
  if (sizeError) return sizeError;

  try {
    const body = await request.json();
    const validation = validateOr400(pipelineSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const {
      briefing,
      steps = ["script"],
      generateThumbnail = false,
      generateMusic = false,
      generateVideo = false,
      thumbnailPromptParams,
      musicPromptParams,
      videoPromptParams,
    } = validation.data;

    const pipelineStatus: Record<string, { status: string; output?: unknown; error?: string }> = {};
    const exportFiles: string[] = [];

    // Step 1: Script
    if (steps.includes("script")) {
      pipelineStatus.script = { status: "running" };
      try {
        const scriptResult = await generateScript(briefing);
        pipelineStatus.script = { status: "completed", output: scriptResult };

        const scriptContent = String(scriptResult.script ?? "");
        const scriptPath = `files/scripts/${Date.now()}-pipeline-script.md`;
        await saveContentFile("scripts", `${Date.now()}-pipeline-script.md`, scriptContent);

        const title = (scriptResult.title as string) ?? `Pipeline - ${briefing.slice(0, 50)}`;
        await createAsset({
          type: "script",
          title,
          description: briefing.slice(0, 200),
          content: scriptContent,
          filePath: scriptPath,
          metadata: scriptResult,
          sourceModule: "pipeline",
          tags: ["pipeline"],
        });

        exportFiles.push(scriptPath);
      } catch (e) {
        pipelineStatus.script = { status: "failed", error: String(e) };
      }
    }

    // Step 2: Thumbnail (prompt + image)
    if (steps.includes("thumbnail") && pipelineStatus.script?.status === "completed") {
      pipelineStatus.thumbnail = { status: "running" };
      try {
        const { generateImage: genImg, buildThumbnailPrompt: buildTp } = await import("@/lib/minimax/image");
        const { buildThumbnailPrompt } = await import("@/lib/prompts/thumbnailPrompt");

        const scriptData = pipelineStatus.script.output as Record<string, unknown>;
        const tpText = (thumbnailPromptParams?.text as string) ?? (scriptData?.thumbnail_text as string) ?? "New Video";
        const tpTheme = (thumbnailPromptParams?.theme as string) ?? briefing;

        const tpPrompt = buildThumbnailPrompt({
          theme: tpTheme,
          title: (scriptData?.title as string) ?? "Video",
          style: "Modern tech",
          text: tpText,
        });

        if (generateThumbnail) {
          const imageResult = await genImg({ prompt: tpPrompt });
          pipelineStatus.thumbnail = {
            status: "completed",
            output: { prompt: tpPrompt, ...imageResult },
          };
        } else {
          pipelineStatus.thumbnail = { status: "completed", output: { prompt: tpPrompt } };
        }
      } catch (e) {
        pipelineStatus.thumbnail = { status: "failed", error: String(e) };
      }
    }

    // Step 3: Music
    if (steps.includes("music") && generateMusic) {
      pipelineStatus.music = { status: "running" };
      try {
        const { generateMusic: genMusic } = await import("@/lib/minimax/music");
        const { buildMusicPromptForIntro } = await import("@/lib/prompts/musicPrompt");

        const mPrompt = (musicPromptParams?.prompt as string) ?? buildMusicPromptForIntro("modern tech");

        const musicResult = await genMusic({ prompt: mPrompt });
        pipelineStatus.music = { status: "completed", output: musicResult };

        if (musicResult.audioUrl) {
          await createAsset({
            type: "music",
            title: "Pipeline Music",
            description: mPrompt,
            filePath: musicResult.audioUrl,
            metadata: musicResult,
            sourceModule: "pipeline",
            tags: ["pipeline"],
          });
        }
      } catch (e) {
        pipelineStatus.music = { status: "failed", error: String(e) };
      }
    }

    // Step 4: Video
    if (steps.includes("video") && generateVideo) {
      pipelineStatus.video = { status: "running" };
      try {
        const { generateVideo: genVideo } = await import("@/lib/minimax/video");
        const { buildVideoPrompt } = await import("@/lib/prompts/videoPrompt");

        const vPrompt = (videoPromptParams?.prompt as string) ?? buildVideoPrompt({
          prompt: briefing,
          duration: "5",
          style: "Cinematic",
        });

        const videoResult = await genVideo({ prompt: vPrompt });
        pipelineStatus.video = { status: videoResult.status, output: videoResult };
      } catch (e) {
        pipelineStatus.video = { status: "failed", error: String(e) };
      }
    }

    // Create export
    const exportRecord = await createExport({
      title: `Pipeline - ${briefing.slice(0, 60)}`,
      type: "package",
      status: Object.values(pipelineStatus).some((s) => s.status === "failed") ? "failed" : "completed",
      files: exportFiles,
      progress: 100,
      format: "package",
      metadata: { pipelineStatus, briefing },
    });

    return withRateLimitHeaders(NextResponse.json({
      ok: true,
      status: pipelineStatus,
      exportId: exportRecord.id,
    }));
  } catch (error) {
    console.error("Pipeline error:", error);
    return NextResponse.json(
      { error: "Pipeline execution failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

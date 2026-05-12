import { NextResponse } from "next/server";
import { DiagnosticError, diagnosticsFromError, mediaDiagnostic } from "@/lib/daemon/diagnostics";
import { generateMedia, resolveImageProviderForModel } from "@/lib/daemon/media";
import { createMediaTask, updateMediaTask } from "@/lib/daemon/mediaTasks";
import type { MediaSurface } from "@/lib/daemon/mediaTasks";

function stringField(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const surface = (stringField(body.surface) || "image") as MediaSurface;
  const prompt = stringField(body.prompt);
  const model = stringField(body.model) || "default";
  const providerId = stringField(body.providerId);

  if (!["image", "video", "audio"].includes(surface)) {
    return NextResponse.json({ ok: false, error: "surface must be image, video or audio" }, { status: 400 });
  }
  if (!prompt) {
    return NextResponse.json({ ok: false, error: "prompt is required" }, { status: 400 });
  }

  const choice = surface === "image"
    ? await resolveImageProviderForModel(model, providerId || undefined).catch(() => ({ providerId: providerId || "", model }))
    : { providerId: providerId || "", model };
  const task = await createMediaTask({
    surface,
    model: choice.model || model,
    providerId: choice.providerId,
    prompt,
  });

  await updateMediaTask(task.id, {
    status: "running",
    progressMessage: `${surface} generation started with ${choice.providerId || "default"}/${choice.model || "default"}`,
  });

  try {
    const file = await generateMedia({
      surface,
      prompt,
      model: choice.model,
      providerId: choice.providerId,
      aspectRatio: stringField(body.aspectRatio) || stringField(body.aspect) || "16:9",
      output: stringField(body.output),
      n: typeof body.n === "number" ? body.n : 1,
      saveToAssets: body.saveToAssets !== false,
      projectId: stringField(body.projectId) || stringField(body.project) || undefined,
    });
    const done = await updateMediaTask(task.id, {
      status: "done",
      file,
      providerId: file.providerId,
      model: file.model || choice.model || model,
      progressMessage: `wrote ${file.name}`,
    });
    return NextResponse.json({ ok: true, taskId: task.id, status: "done", file: done?.file ?? file });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Media generation failed.";
    const diagnostic = error instanceof DiagnosticError
      ? error.diagnostics[0]
      : mediaDiagnostic({ message, providerId: choice.providerId, model: choice.model || model });
    const diagnostics = diagnosticsFromError(error);
    await updateMediaTask(task.id, {
      status: "failed",
      error: message,
      errorKind: diagnostic?.kind,
      diagnostics: diagnostics.length ? diagnostics : diagnostic ? [diagnostic] : undefined,
      progressMessage: message,
    });
    return NextResponse.json(
      {
        ok: false,
        taskId: task.id,
        status: "failed",
        error: message,
        errorKind: diagnostic?.kind ?? "media_generation_failed",
        diagnostics: diagnostics.length ? diagnostics : diagnostic ? [diagnostic] : [],
      },
      { status: 500 }
    );
  }
}

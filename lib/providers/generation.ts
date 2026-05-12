import { createAsset } from "@/lib/storage/assets";
import { createExport } from "@/lib/storage/exports";
import { cacheGeneratedImageUrls } from "@/lib/storage/generatedImages";
import { saveContentFile } from "@/lib/minimax/files";
import { buildThumbnailPrompt } from "@/lib/prompts/thumbnailPrompt";
import { runAgentText } from "@/lib/daemon/agents";
import { classifyConnectionError } from "@/lib/daemon/connection";
import { createDaemonContext, type DaemonContext } from "@/daemon/context";
import {
  DiagnosticError,
  agentDiagnostic,
  diagnosticMessage,
  fallbackDiagnostic,
  type Diagnostic,
} from "@/lib/daemon/diagnostics";
import { evaluateTextFallback } from "@/lib/daemon/fallback";
import { emitRunEvent } from "@/daemon/runs/events";
import { createRun, transitionRun } from "@/daemon/runs/store";
import {
  buildSeoCaptionPrompt,
  normalizeCreatorProfile,
  parseCaptionPackResponse,
  type CaptionPack,
  type CreatorProfile,
} from "@/daemon/captions/pattern";
import { createProject, getProject, writeProjectFile } from "@/daemon/projects/store";
import { renderResearchForPrompt, writeResearchReport } from "@/daemon/research/report";
import { searchResearch } from "@/daemon/research/tavily";
import type { ResearchFindings } from "@/daemon/research/types";
import { parseTitlePackResponse, renderTitleRepairPrompt, type TitleCandidate } from "@/daemon/titles/scoring";
import { createProfessionalPackageExport } from "@/daemon/export/package";
import { DATA_DIR } from "@/lib/storage/db";
import { getSettings } from "@/lib/storage/settings";
import { getAdapterForProvider } from "./registry";
import { isDemoModeEnabled, resolveProviderConfig, type ProviderOverride } from "./runtime";
import type {
  ActiveProviderCapability,
  ImageGenerationRequest,
  ImageGenerationResult,
  TextGenerationRequest,
  TextGenerationResult,
} from "./types";

export type TitlePackResult = {
  candidates: TitleCandidate[];
  top3: TitleCandidate[];
  providerId: string;
  model: string;
  research?: ResearchFindings | null;
  diagnostics?: Diagnostic[];
};

export type CaptionPackResult = CaptionPack & {
  providerId: string;
  model: string;
  diagnostics?: Diagnostic[];
};

const packageSystemPrompt = `You are Open Studio's content package planner.
Convert a creator briefing into a publish-ready content package.
Return only valid JSON with this shape:
{
  "title": "project title",
  "script": "ready-to-record script",
  "description": "platform-ready description",
  "tags": ["tag"],
  "titleCandidates": [],
  "selectedTitle": "",
  "thumbnailPrompt": "visual prompt for image generation",
  "thumbnailText": "short readable thumbnail text",
  "assumptions": ["short assumption"]
}`;

const titleSystemPrompt = `You are Open Studio's YouTube title strategist.
Generate high-CTR, SEO-aware video titles from the user's topic and context.
Use outlier-style thinking: curiosity gap, specificity, contrast, transformation, and searchable wording.
Return only valid JSON:
{
  "candidates": [
    {
      "title": "string",
      "score": 0-100,
      "reason": "short reason",
      "ctrAngle": "short angle",
      "seoKeywords": ["keyword"]
    }
  ],
  "top3": ["exact title", "exact title", "exact title"]
}`;

function parseJsonObject(content: string): Record<string, unknown> {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  const json = start >= 0 && end >= start ? content.slice(start, end + 1) : content;
  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {
      title: "Generated Package",
      script: content,
      description: "",
      tags: [],
      titleCandidates: [],
      selectedTitle: "",
      thumbnailPrompt: content.slice(0, 500),
      thumbnailText: "New Video",
      assumptions: ["The provider returned plain text instead of JSON."],
    };
  }
}

function withAgentFallbackRaw(raw: unknown, agentError: string): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return { ...(raw as Record<string, unknown>), agentFallbackError: agentError };
  }
  return { providerRaw: raw, agentFallbackError: agentError };
}

function classifyAgentGenerationError(message: string): "agent_not_installed" | "not_found_model" | "timeout" | "agent_spawn_failed" | "unknown" {
  if (/não foi encontrada|not found in path|not installed|cannot find/i.test(message)) return "agent_not_installed";
  const providerKind = classifyConnectionError({ message });
  if (providerKind === "not_found_model" || providerKind === "timeout") return providerKind;
  if (/spawn|enoent|permission|exited with code|failed to load|auth|token/i.test(message)) return "agent_spawn_failed";
  return "unknown";
}

async function createAgentRun(params: {
  agentId: string;
  model?: string;
  reasoning?: string;
  prompt: string;
}): Promise<{ context: DaemonContext; runId: string } | null> {
  try {
    const context = createDaemonContext({ storageDir: DATA_DIR });
    const run = await createRun(context, {
      kind: "agent",
      title: "Text generation",
      metadata: {
        agentId: params.agentId,
        model: params.model || "default",
        reasoning: params.reasoning || "default",
        promptChars: params.prompt.length,
      },
    });
    await transitionRun(context, run.id, "running");
    return { context, runId: run.id };
  } catch {
    return null;
  }
}

async function safeRunEvent(context: DaemonContext | undefined, runId: string | undefined, type: string, payload: unknown) {
  if (!context || !runId) return;
  await emitRunEvent(context, runId, type, payload).catch(() => undefined);
}

async function safeRunTransition(
  context: DaemonContext | undefined,
  runId: string | undefined,
  status: "succeeded" | "failed" | "cancelled",
  payload: Record<string, unknown> = {}
) {
  if (!context || !runId) return;
  await transitionRun(context, runId, status, payload).catch(() => undefined);
}

async function generateTextByProvider(
  request: TextGenerationRequest,
  override?: ProviderOverride
): Promise<TextGenerationResult> {
  const config = await resolveProviderConfig("text", override);
  const adapter = getAdapterForProvider(config.providerId);
  if (!adapter.generateText) throw new Error(`${config.manifest.name} does not support text generation.`);
  return adapter.generateText(request, config);
}

export async function generateTextWithProvider(
  request: TextGenerationRequest,
  override?: ProviderOverride
): Promise<TextGenerationResult> {
  if (await isDemoModeEnabled()) {
    return {
      content: `[DEMO MODE]\n\n${request.prompt}`,
      providerId: override?.providerId || "demo",
      model: override?.model || "demo-text",
    };
  }

  const settings = await getSettings();
  if (!override && settings.executionMode === "cli" && settings.agentId) {
    const agentChoice = settings.agentModels[settings.agentId] ?? {};
    const prompt = [request.systemPrompt, request.prompt].filter(Boolean).join("\n\n");
    const runRef = await createAgentRun({
      agentId: settings.agentId,
      model: agentChoice.model,
      reasoning: agentChoice.reasoning,
      prompt,
    });
    const eventWrites: Promise<unknown>[] = [];
    try {
      const result = await runAgentText({
        agentId: settings.agentId,
        prompt,
        model: agentChoice.model,
        reasoning: agentChoice.reasoning,
        agentCliEnv: settings.agentCliEnv,
        timeoutMs: 180_000,
        onEvent: (event) => {
          if (!runRef) return;
          eventWrites.push(emitRunEvent(runRef.context, runRef.runId, `agent.${event.type}`, event).catch(() => undefined));
        },
      });
      await Promise.allSettled(eventWrites);
      await safeRunTransition(runRef?.context, runRef?.runId, "succeeded", {
        providerId: `agent:${settings.agentId}`,
        model: result.model,
      });
      return {
        content: result.content,
        providerId: `agent:${settings.agentId}`,
        model: result.model,
      };
    } catch (agentError) {
      await Promise.allSettled(eventWrites);
      const agentErrorText = diagnosticMessage(agentError);
      const agentFailure = agentDiagnostic({
        kind: classifyAgentGenerationError(agentErrorText),
        message: agentErrorText,
        agentName: settings.agentId,
        model: agentChoice.model,
      });
      await safeRunEvent(runRef?.context, runRef?.runId, "agent.error", agentFailure);
      const fallbackPlan = evaluateTextFallback(settings);
      if (!fallbackPlan.available) {
        await safeRunEvent(runRef?.context, runRef?.runId, "fallback.unavailable", fallbackPlan.diagnostic);
        await safeRunTransition(runRef?.context, runRef?.runId, "failed", {
          error: agentErrorText,
          diagnostics: [agentFailure, fallbackPlan.diagnostic],
        });
        throw new DiagnosticError(
          `A CLI local ${settings.agentId} falhou antes de gerar texto: ${agentErrorText}. ${fallbackPlan.reason}`,
          [agentFailure, fallbackPlan.diagnostic],
          fallbackPlan.diagnostic.kind
        );
      }

      await safeRunEvent(runRef?.context, runRef?.runId, "fallback.started", {
        from: `agent:${settings.agentId}`,
        to: fallbackPlan.providerId,
        model: fallbackPlan.model,
        reason: agentErrorText,
      });
      try {
        const fallback = await generateTextByProvider(request);
        const fallbackUsed = fallbackDiagnostic({
          kind: "fallback_used",
          from: `agent:${settings.agentId}`,
          to: fallback.providerId,
          model: fallback.model,
          reason: agentErrorText,
        });
        await safeRunEvent(runRef?.context, runRef?.runId, "fallback.used", fallbackUsed);
        await safeRunTransition(runRef?.context, runRef?.runId, "succeeded", {
          providerId: fallback.providerId,
          model: fallback.model,
          fallbackFrom: `agent:${settings.agentId}`,
          diagnostics: [agentFailure, fallbackUsed],
        });
        return {
          ...fallback,
          raw: withAgentFallbackRaw(fallback.raw, agentErrorText),
          diagnostics: [...(fallback.diagnostics ?? []), agentFailure, fallbackUsed],
        };
      } catch (fallbackError) {
        const fallbackErrorText = diagnosticMessage(fallbackError);
        const fallbackFailed = fallbackDiagnostic({
          kind: "fallback_failed",
          from: `agent:${settings.agentId}`,
          to: fallbackPlan.providerId,
          model: fallbackPlan.model,
          reason: fallbackErrorText,
        });
        await safeRunEvent(runRef?.context, runRef?.runId, "fallback.failed", fallbackFailed);
        await safeRunTransition(runRef?.context, runRef?.runId, "failed", {
          error: `${agentErrorText}; fallback: ${fallbackErrorText}`,
          diagnostics: [agentFailure, fallbackFailed],
        });
        throw new DiagnosticError(
          `A CLI local ${settings.agentId} falhou antes de gerar texto: ${agentErrorText}. O fallback BYOK também falhou: ${fallbackErrorText}`,
          [agentFailure, fallbackFailed],
          fallbackFailed.kind
        );
      }
    }
  }

  return generateTextByProvider(request, override);
}

export async function generateImageWithProvider(
  request: ImageGenerationRequest,
  override?: ProviderOverride
): Promise<ImageGenerationResult> {
  if (await isDemoModeEnabled()) {
    const text = encodeURIComponent(request.prompt.slice(0, 40) || "Open Studio");
    return {
      urls: [`https://placehold.co/1280x720/151922/ff5aa7?text=${text}`],
      base64s: [],
      finalPrompt: request.prompt,
      providerId: override?.providerId || "demo",
      model: override?.model || "demo-image",
    };
  }

  const config = await resolveProviderConfig("image", override);
  const adapter = getAdapterForProvider(config.providerId);
  if (!adapter.generateImage) throw new Error(`${config.manifest.name} does not support image generation.`);
  return adapter.generateImage(request, config);
}

export function imageResultCacheSources(result: ImageGenerationResult): string[] {
  return [
    ...result.urls,
    ...result.base64s
      .filter(Boolean)
      .map((base64) => (base64.startsWith("data:image/") ? base64 : `data:image/png;base64,${base64}`)),
  ];
}

export async function generateTitlePack(
  params: {
    topic: string;
    briefing?: string;
    audience?: string;
    thumbnailConcept?: string;
    outlierNotes?: string;
    research?: boolean;
    maxSources?: number;
    projectId?: string;
    count?: number;
    saveToAssets?: boolean;
  },
  override?: ProviderOverride
): Promise<TitlePackResult> {
  const count = params.count ?? 10;
  const diagnostics: Diagnostic[] = [];
  let research: ResearchFindings | null = null;

  if (params.research) {
    try {
      const findings = await searchResearch({
        query: buildTitleResearchQuery(params),
        maxSources: params.maxSources ?? 6,
      });
      research = await writeResearchReport({ projectId: params.projectId, findings });
    } catch (error) {
      diagnostics.push(...(error instanceof DiagnosticError ? error.diagnostics : []));
    }
  }

  const prompt = [
    `TOPIC: ${params.topic}`,
    params.briefing ? `BRIEFING: ${params.briefing}` : "",
    params.audience ? `AUDIENCE: ${params.audience}` : "",
    params.thumbnailConcept ? `THUMBNAIL_CONCEPT: ${params.thumbnailConcept}` : "",
    params.outlierNotes ? `OUTLIER_NOTES: ${params.outlierNotes}` : "",
    research ? renderResearchForPrompt(research) : "",
    `COUNT: ${count}`,
    "Return exactly the requested number of candidates and mark the best 3.",
  ]
    .filter(Boolean)
    .join("\n");

  let result = await generateTextWithProvider(
    {
      systemPrompt: titleSystemPrompt,
      prompt,
      maxTokens: 2600,
      temperature: 0.85,
    },
    override
  );
  let parsed = parseTitlePackResponse(result.content, count, params);

  if (parsed.needsRepair) {
    try {
      const repaired = await generateTextWithProvider(
        {
          systemPrompt: titleSystemPrompt,
          prompt: renderTitleRepairPrompt(result.content, count),
          maxTokens: 2600,
          temperature: 0.2,
        },
        override
      );
      const repairedParsed = parseTitlePackResponse(repaired.content, count, params);
      if (!repairedParsed.needsRepair || repairedParsed.candidates.length >= parsed.candidates.length) {
        result = repaired;
        parsed = repairedParsed;
      }
    } catch (error) {
      diagnostics.push(...(error instanceof DiagnosticError ? error.diagnostics : []));
    }
  }
  diagnostics.push(...(result.diagnostics ?? []));

  if (params.saveToAssets !== false) {
    const titlePackPayload = {
      ...parsed,
      research,
      providerId: result.providerId,
      model: result.model,
      diagnostics,
    };
    await createAsset({
      type: "prompt",
      title: `Title Pack - ${params.topic}`,
      description: params.briefing?.slice(0, 500) || params.topic,
      content: JSON.stringify(titlePackPayload, null, 2),
      metadata: {
        topic: params.topic,
        briefing: params.briefing ?? "",
        audience: params.audience ?? "",
        thumbnailConcept: params.thumbnailConcept ?? "",
        outlierNotes: params.outlierNotes ?? "",
        research,
        providerId: result.providerId,
        model: result.model,
      },
      sourceModule: "title-generator",
      tags: ["titles", "ctr", "seo"],
    });
    await writeTitlePackProjectFile(params.projectId, titlePackPayload);
  }

  return {
    ...parsed,
    providerId: result.providerId,
    model: result.model,
    research,
    diagnostics,
  };
}

async function writeTitlePackProjectFile(projectId: string | undefined, payload: Record<string, unknown>) {
  if (!projectId) return;
  const context = createDaemonContext({ storageDir: DATA_DIR });
  if (!(await getProject(context, projectId))) {
    await createProject(context, {
      id: projectId,
      name: "Open Studio title package",
      metadata: { createdBy: "title-generator" },
    });
  }
  await writeProjectFile(context, projectId, "files/titles.json", Buffer.from(JSON.stringify(payload, null, 2), "utf8"));
}

function buildTitleResearchQuery(params: {
  topic: string;
  briefing?: string;
  audience?: string;
  thumbnailConcept?: string;
}) {
  return [
    "YouTube outlier titles CTR SEO patterns",
    params.topic,
    params.audience ? `audience: ${params.audience}` : "",
    params.briefing ? `briefing: ${params.briefing.slice(0, 280)}` : "",
    params.thumbnailConcept ? `thumbnail: ${params.thumbnailConcept.slice(0, 180)}` : "",
  ]
    .filter(Boolean)
    .join(" | ")
    .slice(0, 1000);
}

const captionSystemPrompt = `You are Open Studio's SEO caption and description strategist.
Generate a publish-ready YouTube/social description following the provided pattern.
The output is not subtitles; it is the SEO description/caption that accompanies the video.
Adapt every keyword, hashtag, hook, link label and CTA to the script, title, topic and creator profile.
Use search-friendly natural language, not keyword stuffing.
Return only valid JSON:
{
  "caption": "full caption/description with hashtags, paragraphs, links, follow block and business block",
  "captions": ["same full caption or platform variants"],
  "hashtags": ["#Tag"],
  "keywords": ["keyword"],
  "followBlock": "string",
  "linkBlock": "string",
  "businessBlock": "string",
  "notes": ["short note"]
}`;

export async function generateCaptionPack(
  params: {
    script: string;
    topic?: string;
    title?: string;
    pattern?: string;
    creatorProfile?: CreatorProfile;
    projectId?: string;
    saveToAssets?: boolean;
  },
  override?: ProviderOverride
): Promise<CaptionPackResult> {
  const creatorProfile = normalizeCreatorProfile(params.creatorProfile);
  const result = await generateTextWithProvider(
    {
      systemPrompt: captionSystemPrompt,
      prompt: buildSeoCaptionPrompt({
        script: params.script,
        topic: params.topic,
        title: params.title,
        pattern: params.pattern,
        creatorProfile,
      }),
      maxTokens: 3200,
      temperature: 0.55,
    },
    override
  );
  const parsed = parseCaptionPackResponse(result.content, {
    script: params.script,
    topic: params.topic,
    title: params.title,
    creatorProfile,
  });
  const payload: CaptionPackResult = {
    ...parsed,
    providerId: result.providerId,
    model: result.model,
    diagnostics: result.diagnostics,
  };

  if (params.saveToAssets !== false) {
    await createAsset({
      type: "prompt",
      title: `SEO Caption - ${params.title || params.topic || "Open Studio"}`,
      description: params.script.slice(0, 500),
      content: JSON.stringify(payload, null, 2),
      metadata: {
        topic: params.topic ?? "",
        title: params.title ?? "",
        pattern: params.pattern ?? "",
        creatorProfile,
        providerId: result.providerId,
        model: result.model,
      },
      sourceModule: "caption-generator",
      tags: ["captions", "seo", "description"],
    });
    await writeCaptionPackProjectFile(params.projectId, payload);
  }

  return payload;
}

async function writeCaptionPackProjectFile(projectId: string | undefined, payload: Record<string, unknown>) {
  if (!projectId) return;
  const context = createDaemonContext({ storageDir: DATA_DIR });
  if (!(await getProject(context, projectId))) {
    await createProject(context, {
      id: projectId,
      name: "Open Studio caption package",
      metadata: { createdBy: "caption-generator" },
    });
  }
  await writeProjectFile(context, projectId, "files/captions.json", Buffer.from(JSON.stringify(payload, null, 2), "utf8"));
}

export async function generateContentPackage(params: {
  briefing: string;
  steps?: ActiveProviderCapability[];
  research?: boolean;
  maxSources?: number;
  projectId?: string;
  providers?: Partial<Record<ActiveProviderCapability, ProviderOverride>>;
  saveToAssets?: boolean;
}): Promise<Record<string, unknown>> {
  const { briefing, steps = ["text", "image"], providers = {}, saveToAssets = true } = params;
  const projectId = params.projectId || `pkg_${Date.now().toString(36)}`;
  const projectContext = saveToAssets ? createDaemonContext({ storageDir: DATA_DIR }) : null;
  if (projectContext && !(await getProject(projectContext, projectId))) {
    await createProject(projectContext, {
      id: projectId,
      name: briefing.slice(0, 80) || "Open Studio package",
      metadata: { createdBy: "package-generator", briefing },
    });
  }
  const textResult = await generateTextWithProvider(
    {
      systemPrompt: packageSystemPrompt,
      prompt: briefing,
      maxTokens: 4096,
      temperature: 0.7,
    },
    providers.text
  );

  const packageData = parseJsonObject(textResult.content);
  const title = String(packageData.title || `Open Studio - ${briefing.slice(0, 50)}`);
  const script = String(packageData.script || textResult.content);
  const exportFiles: string[] = [];
  const diagnostics: Diagnostic[] = [...(textResult.diagnostics ?? [])];
  let titlePack: TitlePackResult | null = null;

  try {
    titlePack = await generateTitlePack(
      {
        topic: String(packageData.selectedTitle || title || briefing),
        briefing,
        thumbnailConcept: String(packageData.thumbnailPrompt || ""),
        outlierNotes: "Use padrões de outliers: curiosidade clara, promessa específica, contraste e busca orgânica.",
        research: params.research,
        maxSources: params.maxSources,
        projectId,
        count: 10,
        saveToAssets,
      },
      providers.text
    );
    diagnostics.push(...(titlePack.diagnostics ?? []));
  } catch (error) {
    packageData.titleError = error instanceof Error ? error.message : "Title generation failed.";
    diagnostics.push(...(error instanceof DiagnosticError ? error.diagnostics : []));
  }

  const selectedTitle = String(titlePack?.top3[0]?.title || packageData.selectedTitle || title);
  const outputs: Record<string, unknown> = {
    text: {
      ...packageData,
      selectedTitle,
      titleCandidates: titlePack?.candidates ?? packageData.titleCandidates ?? [],
      topTitleCandidates: titlePack?.top3 ?? [],
      providerId: textResult.providerId,
      model: textResult.model,
    },
  };
  if (titlePack) outputs.titles = titlePack;

    if (saveToAssets && script) {
    const timestamp = Date.now();
    const filename = `${timestamp}-open-studio-package-script.md`;
    await saveContentFile("scripts", filename, script);
    const filePath = `files/scripts/${filename}`;
    exportFiles.push(filePath);
    await createAsset({
      type: "script",
      title,
      description: briefing.slice(0, 200),
      content: script,
      filePath,
      metadata: packageData,
      sourceModule: "package-generator",
      tags: Array.isArray(packageData.tags) ? packageData.tags.map(String) : ["package"],
    });
    if (projectContext) {
      await writeProjectFile(projectContext, projectId, "files/script.md", Buffer.from(script, "utf8"));
    }
  }

  if (steps.includes("image")) {
    const thumbnailPrompt = String(
      packageData.thumbnailPrompt ||
      buildThumbnailPrompt({
        theme: briefing,
        title: selectedTitle,
        style: "Modern creator studio",
        text: String(packageData.thumbnailText || "New Video"),
      })
    );
    const imageResult = await generateImageWithProvider(
      { prompt: thumbnailPrompt, aspectRatio: "16:9", n: 1 },
      providers.image
    );
    const cachedUrls = await cacheGeneratedImageUrls(imageResultCacheSources(imageResult));
    const cachedImageResult = {
      ...imageResult,
      urls: cachedUrls,
      rawUrls: imageResult.urls,
    };
    outputs.image = cachedImageResult;

    if (saveToAssets && cachedImageResult.urls[0]) {
      await createAsset({
        type: "thumbnail",
        title: `Thumbnail - ${selectedTitle}`,
        description: thumbnailPrompt,
        thumbnailPath: cachedImageResult.urls[0],
        metadata: cachedImageResult as unknown as Record<string, unknown>,
        sourceModule: "package-generator",
        tags: ["package", "thumbnail"],
      });
      if (projectContext) {
        await writeProjectFile(
          projectContext,
          projectId,
          "files/thumbnail.json",
          Buffer.from(JSON.stringify(cachedImageResult, null, 2), "utf8")
        );
      }
    }
  }

  const packageJson = {
    title,
    selectedTitle,
    briefing,
    script,
    description: String(packageData.description || ""),
    tags: Array.isArray(packageData.tags) ? packageData.tags.map(String) : [],
    titleCandidates: titlePack?.candidates ?? (Array.isArray(packageData.titleCandidates) ? packageData.titleCandidates : []),
    topTitleCandidates: titlePack?.top3 ?? [],
    thumbnailPrompt: String(packageData.thumbnailPrompt || ""),
    thumbnailText: String(packageData.thumbnailText || ""),
    outputs,
    diagnostics,
  };

  if (saveToAssets) {
    const timestamp = Date.now();
    const jsonFilename = `${timestamp}-content-package.json`;
    const mdFilename = `${timestamp}-content-package.md`;
    await saveContentFile("packages", jsonFilename, JSON.stringify(packageJson, null, 2));
    await saveContentFile(
      "exports",
      mdFilename,
      [
        `# ${selectedTitle}`,
        "",
        "## Briefing",
        briefing,
        "",
        "## Script",
        script,
        "",
        "## Thumbnail",
        String(packageData.thumbnailPrompt || ""),
      ].join("\n")
    );
    exportFiles.push(`files/packages/${jsonFilename}`, `files/exports/${mdFilename}`);
    if (projectContext) {
      await writeProjectFile(projectContext, projectId, "files/package.json", Buffer.from(JSON.stringify(packageJson, null, 2), "utf8"));
      await writeProjectFile(
        projectContext,
        projectId,
        "files/package.md",
        Buffer.from(
          [
            `# ${selectedTitle}`,
            "",
            "## Briefing",
            briefing,
            "",
            "## Script",
            script,
            "",
            "## Thumbnail",
            String(packageData.thumbnailPrompt || ""),
          ].join("\n"),
          "utf8"
        )
      );
      await writeProjectFile(
        projectContext,
        projectId,
        "files/live-preview.json",
        Buffer.from(
          JSON.stringify(
            {
              title,
              selectedTitle,
              source: "files/package.json",
              refreshedAt: new Date().toISOString(),
            },
            null,
            2
          ),
          "utf8"
        )
      );
    }
  }

  const professionalExport = saveToAssets && projectContext
    ? await createProfessionalPackageExport({ projectId, context: projectContext })
    : null;
  const exportRecord = professionalExport?.exportRecord ?? (saveToAssets
    ? await createExport({
        title,
        type: "package",
        status: "completed",
        files: exportFiles,
        progress: 100,
        format: "package",
        metadata: { briefing, outputs, projectId },
      })
    : null);

  return {
    ok: true,
    title,
    selectedTitle,
    briefing,
    package: packageJson,
    outputs,
    diagnostics,
    projectId,
    exportId: exportRecord?.id,
  };
}

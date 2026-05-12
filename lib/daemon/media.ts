import { createAsset } from "@/lib/storage/assets";
import { cacheGeneratedImageUrls } from "@/lib/storage/generatedImages";
import { generateImageWithProvider, imageResultCacheSources } from "@/lib/providers/generation";
import {
  findImageProviderByModel,
  getMediaCatalogProvider,
} from "@/lib/providers/modelCatalog";
import { getSettings } from "@/lib/storage/settings";
import { DATA_DIR } from "@/lib/storage/db";
import { createDaemonContext } from "@/daemon/context";
import { createProject, getProject, writeProjectFile } from "@/daemon/projects/store";
import { DiagnosticError, unsupportedMediaDiagnostic } from "./diagnostics";
import { readFile } from "fs/promises";
import { basename, extname, join } from "path";
import type { ImageGenerationRequest } from "@/lib/providers/types";
import type { MediaSurface, MediaTaskFile } from "./mediaTasks";

export interface MediaGenerateInput {
  surface: MediaSurface;
  prompt: string;
  model?: string;
  providerId?: string;
  aspectRatio?: string;
  output?: string;
  n?: number;
  saveToAssets?: boolean;
  projectId?: string;
}

function slug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 80)
    .replace(/^-+|-+$/g, "");
}

function imageMimeFromUrl(url: string) {
  const clean = url.split("?")[0] ?? "";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";
  return "image/png";
}

function extensionFromMime(mime: string) {
  if (mime.includes("webp")) return "webp";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("png")) return "png";
  return "png";
}

async function writeMediaProjectFile(input: {
  projectId?: string;
  file: MediaTaskFile;
  url: string;
  baseName: string;
  metadata: Record<string, unknown>;
}) {
  if (!input.projectId) return undefined;

  const context = createDaemonContext({ storageDir: DATA_DIR });
  if (!(await getProject(context, input.projectId))) {
    await createProject(context, {
      id: input.projectId,
      name: "Open Studio media package",
      metadata: { createdBy: "media-tool" },
    });
  }

  if (input.url.startsWith("/generated/")) {
    const relative = input.url.replace(/^\/+/, "");
    const bytes = await readFile(join(process.cwd(), "public", relative));
    const extension = extname(input.file.name).replace(/^\./, "") || extensionFromMime(input.file.mime);
    const projectPath = `files/media/${input.baseName || "open-studio-image"}.${extension}`;
    await writeProjectFile(context, input.projectId, projectPath, bytes);
    return projectPath;
  }

  const projectPath = `files/media/${input.baseName || "open-studio-image"}.json`;
  await writeProjectFile(context, input.projectId, projectPath, Buffer.from(JSON.stringify(input.metadata, null, 2), "utf8"));
  return projectPath;
}

export async function resolveImageProviderForModel(model?: string, providerId?: string) {
  if (providerId) {
    const provider = getMediaCatalogProvider(providerId);
    if (provider && !provider.integrated) {
      throw new DiagnosticError(
        `${provider.name} está no catálogo de mídia, mas ainda não tem adapter ativo neste build.`,
        [unsupportedMediaDiagnostic({ providerId, model })],
        "unsupported_media_provider"
      );
    }
    return { providerId, model };
  }
  if (!model || model === "default") {
    const settings = await getSettings();
    return settings.defaults.image;
  }

  const providerFromCatalog = findImageProviderByModel(model);
  if (providerFromCatalog) {
    const provider = getMediaCatalogProvider(providerFromCatalog);
    if (provider && !provider.integrated) {
      throw new DiagnosticError(
        `${provider.name} está no catálogo de mídia, mas ainda não tem adapter ativo neste build.`,
        [unsupportedMediaDiagnostic({ providerId: providerFromCatalog, model })],
        "unsupported_media_provider"
      );
    }
    return { providerId: providerFromCatalog, model };
  }

  const settings = await getSettings();
  return { providerId: settings.defaults.image.providerId, model };
}

export async function generateImageMedia(input: MediaGenerateInput): Promise<MediaTaskFile> {
  if (input.surface !== "image") {
    throw new DiagnosticError(
      `${input.surface} existe no contrato de mídia, mas continua escondido fora da UI ativa.`,
      [unsupportedMediaDiagnostic({ surface: input.surface, model: input.model, providerId: input.providerId })],
      "unsupported_media_surface"
    );
  }
  const choice = await resolveImageProviderForModel(input.model, input.providerId);
  const request: ImageGenerationRequest = {
    prompt: input.prompt,
    model: choice.model,
    aspectRatio: input.aspectRatio ?? "16:9",
    n: input.n ?? 1,
  };
  const result = await generateImageWithProvider(request, choice);
  const cachedUrls = await cacheGeneratedImageUrls(imageResultCacheSources(result));
  const url = cachedUrls[0] ?? result.urls[0] ?? "";
  if (!url) {
    throw new Error(`${result.providerId} returned no image URL or base64 image.`);
  }

  const baseName = slug(input.output || input.prompt || "open-studio-image");
  const name = basename(url.split("?")[0] || "") || `${baseName || "open-studio-image"}.png`;
  const file: MediaTaskFile = {
    name,
    kind: "image",
    mime: imageMimeFromUrl(url),
    url,
    providerId: result.providerId,
    model: result.model,
  };
  const metadata = {
    finalPrompt: result.finalPrompt,
    providerId: result.providerId,
    model: result.model,
    remoteUrls: result.urls,
    diagnostics: result.diagnostics,
  };

  const projectPath = await writeMediaProjectFile({
    projectId: input.projectId,
    file,
    url,
    baseName,
    metadata,
  });
  if (projectPath) file.projectPath = projectPath;

  if (input.saveToAssets !== false) {
    await createAsset({
      type: "thumbnail",
      title: `Media Image - ${baseName || result.model}`,
      description: input.prompt,
      thumbnailPath: url,
      metadata,
      sourceModule: "media-tool",
      tags: ["media", "image", result.providerId],
    });
  }

  return file;
}

export async function generateMedia(input: MediaGenerateInput): Promise<MediaTaskFile> {
  return generateImageMedia(input);
}

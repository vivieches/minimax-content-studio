import { mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDaemonContext } from "@/daemon/context";
import { listProjectFiles } from "@/daemon/projects/store";
import { DATA_DIR } from "@/lib/storage/db";
import { getAssets } from "@/lib/storage/assets";
import { generateImageMedia, generateMedia, resolveImageProviderForModel } from "./media";

const mocks = vi.hoisted(() => ({
  cacheGeneratedImageUrls: vi.fn(),
}));

vi.mock("@/lib/storage/generatedImages", () => ({
  cacheGeneratedImageUrls: mocks.cacheGeneratedImageUrls,
}));

const generatedDir = join(process.cwd(), "public", "generated", "thumbnails");
const generatedFile = join(generatedDir, "media-test.png");

beforeEach(async () => {
  vi.clearAllMocks();
  await mkdir(generatedDir, { recursive: true });
  await writeFile(generatedFile, Buffer.from("stub-image", "utf8"));
  mocks.cacheGeneratedImageUrls.mockResolvedValue(["/generated/thumbnails/media-test.png"]);
});

describe("daemon media generation", () => {
  it("uses the stub image adapter for smoke tests and writes media into a project", async () => {
    const file = await generateImageMedia({
      surface: "image",
      prompt: "thumbnail for a local-first studio",
      providerId: "stub",
      model: "stub-image",
      projectId: "proj_media_test",
    });

    expect(file).toMatchObject({
      kind: "image",
      providerId: "stub",
      model: "stub-image",
      projectPath: expect.stringMatching(/^files\/media\/thumbnail-for-a-local-first-studio[.]png$/),
    });

    const context = createDaemonContext({ storageDir: DATA_DIR });
    await expect(listProjectFiles(context, "proj_media_test")).resolves.toEqual([
      expect.objectContaining({ path: file.projectPath, kind: "image", mime: "image/png" }),
    ]);

    const assets = await getAssets();
    expect(assets[0]).toMatchObject({
      type: "thumbnail",
      sourceModule: "media-tool",
      tags: expect.arrayContaining(["media", "image", "stub"]),
    });
  });

  it("keeps hidden video/audio surfaces in the contract with actionable diagnostics", async () => {
    await expect(
      generateMedia({
        surface: "video",
        prompt: "hidden video generation",
        providerId: "kling",
        model: "kling-2.0",
      })
    ).rejects.toMatchObject({
      errorKind: "unsupported_media_surface",
      diagnostics: [expect.objectContaining({ kind: "unsupported_media_surface" })],
    });
  });

  it("detects hidden image providers before trying to call a missing adapter", async () => {
    await expect(resolveImageProviderForModel("flux-1.1-pro")).rejects.toMatchObject({
      errorKind: "unsupported_media_provider",
      diagnostics: [expect.objectContaining({ kind: "unsupported_media_provider", route: "bfl" })],
    });
  });
});

afterEach(async () => {
  await rm(generatedFile, { force: true });
});

import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDaemonContext, type DaemonContext } from "@/daemon/context";
import { createProject, writeProjectFile } from "@/daemon/projects/store";

import { buildPackageLiveArtifact } from "./package";

describe("package live artifact", () => {
  let storageDir: string;
  let context: DaemonContext;

  beforeEach(() => {
    storageDir = mkdtempSync(join(tmpdir(), "open-studio-live-artifact-"));
    context = createDaemonContext({ storageDir });
  });

  afterEach(() => {
    rmSync(storageDir, { recursive: true, force: true });
  });

  it("builds a live preview from project package files", async () => {
    await createProject(context, { id: "proj_live", name: "Live package" });
    await writeProjectFile(
      context,
      "proj_live",
      "files/package.json",
      Buffer.from(
        JSON.stringify({
          title: "IA local",
          selectedTitle: "Como usar IA local sem depender de API",
          script: "Roteiro do vídeo",
          thumbnailPrompt: "Creator desk with local AI",
          titleCandidates: [{ title: "Como usar IA local sem depender de API" }],
        }),
        "utf8"
      )
    );
    await writeProjectFile(
      context,
      "proj_live",
      "files/critique.json",
      Buffer.from(JSON.stringify({ cohesionScore: 84 }), "utf8")
    );

    const artifact = await buildPackageLiveArtifact(context, { projectId: "proj_live" });

    expect(artifact).toMatchObject({
      selectedTitle: "Como usar IA local sem depender de API",
      titleCount: 1,
      critiqueScore: 84,
    });
    expect(artifact?.provenance.sourceFiles).toContain("files/package.json");
  });

  it("refreshes when package data changes", async () => {
    await createProject(context, { id: "proj_refresh", name: "Refresh" });
    await writeProjectFile(
      context,
      "proj_refresh",
      "files/package.json",
      Buffer.from(JSON.stringify({ selectedTitle: "Título antigo" }), "utf8")
    );

    await expect(buildPackageLiveArtifact(context, { projectId: "proj_refresh" })).resolves.toMatchObject({
      selectedTitle: "Título antigo",
    });

    await writeProjectFile(
      context,
      "proj_refresh",
      "files/package.json",
      Buffer.from(JSON.stringify({ selectedTitle: "Título editado" }), "utf8")
    );

    await expect(buildPackageLiveArtifact(context, { projectId: "proj_refresh" })).resolves.toMatchObject({
      selectedTitle: "Título editado",
    });
  });
});

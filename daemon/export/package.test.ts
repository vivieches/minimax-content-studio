import { mkdtempSync, rmSync } from "fs";
import { readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDaemonContext, type DaemonContext } from "@/daemon/context";
import { createProject, readProjectFile, writeProjectFile } from "@/daemon/projects/store";

import { createProfessionalPackageExport } from "./package";

describe("professional package export", () => {
  let storageDir: string;
  let context: DaemonContext;

  beforeEach(() => {
    storageDir = mkdtempSync(join(tmpdir(), "open-studio-export-"));
    context = createDaemonContext({ storageDir });
  });

  afterEach(() => {
    rmSync(storageDir, { recursive: true, force: true });
  });

  it("writes markdown, json, html and zip exports from project files", async () => {
    await createProject(context, { id: "proj_export", name: "Export package" });
    await writeProjectFile(
      context,
      "proj_export",
      "files/package.json",
      Buffer.from(
        JSON.stringify({
          title: "IA local",
          selectedTitle: "Como usar IA local sem depender de API",
          description: "Pacote para vídeo sobre IA local.",
          script: "Neste vídeo vou te mostrar como usar IA local.",
          thumbnailPrompt: "Creator desk with local AI dashboard.",
          titleCandidates: [{ title: "Como usar IA local sem depender de API" }],
        }),
        "utf8"
      )
    );
    await writeProjectFile(
      context,
      "proj_export",
      "files/captions.json",
      Buffer.from(JSON.stringify({ captions: ["#IA\n\nDescrição SEO"] }), "utf8")
    );
    await writeProjectFile(
      context,
      "proj_export",
      "files/critique.json",
      Buffer.from(JSON.stringify({ cohesionScore: 88, issues: [{ message: "Bom encaixe." }] }), "utf8")
    );

    const result = await createProfessionalPackageExport({
      projectId: "proj_export",
      context,
      createRecord: false,
    });

    expect(result.exportRecord).toBeNull();
    expect(result.files.markdown).toMatch(/\.md$/);
    expect(result.files.json).toMatch(/\.json$/);
    expect(result.files.html).toMatch(/\.html$/);
    expect(result.files.zip).toMatch(/\.zip$/);

    const markdown = readFileSync(join(storageDir, result.files.markdown), "utf8");
    const html = readFileSync(join(storageDir, result.files.html), "utf8");
    const zip = readFileSync(join(storageDir, result.files.zip));

    expect(markdown).toContain("Como usar IA local sem depender de API");
    expect(markdown).toContain("Score de coerência: 88/100");
    expect(html).toContain("<!doctype html>");
    expect(zip.readUInt32LE(0)).toBe(0x04034b50);

    await expect(readProjectFile(context, "proj_export", "files/exports/package.md")).resolves.toBeTruthy();
  });
});

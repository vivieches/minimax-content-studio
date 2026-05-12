import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDaemonContext, type DaemonContext } from "@/daemon/context";
import { createProject, readProjectFile } from "@/daemon/projects/store";

import { critiqueContentPackage, writeCritiqueProjectFile } from "./package";

describe("package critique", () => {
  let storageDir: string;
  let context: DaemonContext;

  beforeEach(() => {
    storageDir = mkdtempSync(join(tmpdir(), "open-studio-critique-"));
    context = createDaemonContext({ storageDir });
  });

  afterEach(() => {
    rmSync(storageDir, { recursive: true, force: true });
  });

  it("flags weak title and thumbnail fit with a low cohesion score", () => {
    const critique = critiqueContentPackage({
      selectedTitle: "Gemma 4 acelera IA local com Multi-Token Prediction",
      script:
        "Neste vídeo te explico como Gemma 4 usa Multi-Token Prediction para acelerar modelos locais, agentes de IA e fluxos open source.",
      thumbnailPrompt: "Fitness meal prep on a sunny beach, healthy body transformation, tropical colors.",
      thumbnailText: "SHAPE",
      titleCandidates: [
        { title: "Gemma 4 acelera IA local com Multi-Token Prediction", score: 92 },
        { title: "O novo truque do Google para IA local ficar 3x mais rápida", score: 95 },
      ],
    });

    expect(critique.cohesionScore).toBeLessThan(70);
    expect(critique.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          area: "thumbnail",
          message: expect.stringContaining("desconectada"),
        }),
      ])
    );
  });

  it("can recommend a stronger title after package critique", () => {
    const critique = critiqueContentPackage({
      selectedTitle: "Atualização sobre IA",
      script:
        "Hoje vou te mostrar como IA local, modelos open source e agentes de IA permitem criar conteúdo sem depender de uma única API.",
      thumbnailPrompt: "Creator desk with local AI dashboard, open source models, no single API dependency, bold warning text.",
      thumbnailText: "SEM API",
      titleCandidates: [
        { title: "Atualização sobre IA", score: 58, reason: "genérico" },
        { title: "Como criar conteúdo com IA local sem depender de uma única API", score: 94, reason: "promessa específica" },
      ],
    });

    expect(critique.recommendedTitle).toBe("Como criar conteúdo com IA local sem depender de uma única API");
    expect(critique.recommendedTitleReason).toContain("Melhor encaixe");
  });

  it("writes critique into the project artifact tree", async () => {
    await createProject(context, { id: "proj_critique", name: "Critique" });
    const critique = critiqueContentPackage({
      selectedTitle: "Como usar IA local sem depender de API",
      script: "Neste vídeo vou te mostrar como usar IA local, modelos open source e agentes de IA na prática.",
      thumbnailPrompt: "Local AI workstation, open source models, no API dependency, creator setup.",
      thumbnailText: "IA LOCAL",
    });

    const file = await writeCritiqueProjectFile({ projectId: "proj_critique", critique, context });
    const read = await readProjectFile(context, "proj_critique", "files/critique.json");

    expect(file).toMatchObject({ path: "files/critique.json", kind: "json" });
    expect(JSON.parse(read.bytes.toString("utf8"))).toMatchObject({ cohesionScore: critique.cohesionScore });
  });
});

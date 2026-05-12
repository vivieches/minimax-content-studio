import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  critiqueContentPackage: vi.fn(),
  writeCritiqueProjectFile: vi.fn(),
  createAsset: vi.fn(),
}));

vi.mock("@/daemon/critique/package", () => ({
  critiqueContentPackage: mocks.critiqueContentPackage,
  writeCritiqueProjectFile: mocks.writeCritiqueProjectFile,
}));

vi.mock("@/lib/storage/assets", () => ({
  createAsset: mocks.createAsset,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.critiqueContentPackage.mockReturnValue({
    ok: true,
    cohesionScore: 82,
    scores: [],
    issues: [],
    transcript: [],
    createdAt: "2026-05-11T00:00:00.000Z",
  });
});

describe("POST /api/critique/package", () => {
  it("critiques a package and persists the critique asset", async () => {
    const response = await POST(
      new Request("http://localhost/api/critique/package", {
        method: "POST",
        body: JSON.stringify({
          selectedTitle: "Como usar IA local sem depender de API",
          script: "Neste vídeo vou te mostrar IA local, modelos open source e agentes.",
          thumbnailPrompt: "Creator desk with local AI models and no API dependency.",
          titleCandidates: [{ title: "Como usar IA local sem depender de API", score: 94 }],
          projectId: "proj_package",
        }),
      })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.critique.cohesionScore).toBe(82);
    expect(mocks.critiqueContentPackage).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "proj_package",
        selectedTitle: "Como usar IA local sem depender de API",
      })
    );
    expect(mocks.writeCritiqueProjectFile).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: "proj_package" })
    );
    expect(mocks.createAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceModule: "package-critique",
        tags: ["critique", "package", "ctr"],
      })
    );
  });

  it("returns 400 for malformed title candidates", async () => {
    const response = await POST(
      new Request("http://localhost/api/critique/package", {
        method: "POST",
        body: JSON.stringify({
          selectedTitle: "Pacote",
          titleCandidates: [{ score: 90 }],
        }),
      })
    );

    expect(response.status).toBe(400);
    expect(mocks.critiqueContentPackage).not.toHaveBeenCalled();
  });
});

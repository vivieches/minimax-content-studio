import type { DaemonContext } from "@/daemon/context";
import { listProjectFiles, listProjects, readProjectFile } from "@/daemon/projects/store";
import type { ProjectFileEntry, OpenStudioProject } from "@/daemon/projects/types";

export type PackageLiveArtifact = {
  project: OpenStudioProject;
  title: string;
  selectedTitle: string;
  script: string;
  description: string;
  thumbnailPrompt: string;
  thumbnailText: string;
  titleCount: number;
  topTitles: string[];
  captionsCount: number;
  critiqueScore?: number;
  provenance: {
    packagePath: string;
    sourceFiles: string[];
    refreshedAt: string;
    packageUpdatedAt: number;
  };
};

export async function buildPackageLiveArtifact(
  context: DaemonContext,
  input: { projectId?: string } = {}
): Promise<PackageLiveArtifact | null> {
  const project = input.projectId
    ? await importProject(context, input.projectId)
    : (await listProjects(context))[0] ?? null;
  if (!project) return null;

  const files = await listProjectFiles(context, project.id);
  const packageFile = pickPackageFile(files);
  if (!packageFile) return null;

  const packageJson = await readJsonFile(context, project.id, packageFile.path);
  if (!packageJson) return null;

  const titles = await readJsonFile(context, project.id, "files/titles.json");
  const captions = await readJsonFile(context, project.id, "files/captions.json");
  const critique = await readJsonFile(context, project.id, "files/critique.json");
  const sourceFiles = [
    packageFile.path,
    titles ? "files/titles.json" : "",
    captions ? "files/captions.json" : "",
    critique ? "files/critique.json" : "",
  ].filter(Boolean);

  const packageRecord = packageJson as Record<string, unknown>;
  const titleCandidates = asArray(packageRecord.titleCandidates).length
    ? asArray(packageRecord.titleCandidates)
    : asArray((titles as Record<string, unknown> | null)?.candidates);
  const topTitles = asArray(packageRecord.topTitleCandidates).length
    ? asArray(packageRecord.topTitleCandidates)
    : asArray((titles as Record<string, unknown> | null)?.top3);
  const captionList = asArray((captions as Record<string, unknown> | null)?.captions);

  return {
    project,
    title: stringValue(packageRecord.title) || "Open Studio Package",
    selectedTitle: stringValue(packageRecord.selectedTitle) || stringValue(packageRecord.title) || "Open Studio Package",
    script: stringValue(packageRecord.script),
    description: stringValue(packageRecord.description),
    thumbnailPrompt: stringValue(packageRecord.thumbnailPrompt),
    thumbnailText: stringValue(packageRecord.thumbnailText),
    titleCount: titleCandidates.length,
    topTitles: topTitles.map((item) => stringValue((item as Record<string, unknown>)?.title || item)).filter(Boolean),
    captionsCount: captionList.length,
    critiqueScore: numberValue((critique as Record<string, unknown> | null)?.cohesionScore),
    provenance: {
      packagePath: packageFile.path,
      sourceFiles,
      refreshedAt: new Date().toISOString(),
      packageUpdatedAt: packageFile.mtime,
    },
  };
}

async function importProject(context: DaemonContext, projectId: string) {
  const project = (await listProjects(context)).find((item) => item.id === projectId);
  return project ?? null;
}

function pickPackageFile(files: ProjectFileEntry[]) {
  const candidates = files.filter((file) => {
    const path = file.path.toLowerCase();
    return file.kind === "json" && (
      path === "files/package.json" ||
      path.endsWith("/package.json") ||
      path.includes("content-package")
    );
  });
  return candidates.sort((a, b) => b.mtime - a.mtime)[0] ?? null;
}

async function readJsonFile(context: DaemonContext, projectId: string, path: string) {
  try {
    const { bytes } = await readProjectFile(context, projectId, path);
    const parsed = JSON.parse(bytes.toString("utf8"));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

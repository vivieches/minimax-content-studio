import { randomUUID } from "crypto";
import { mkdir, readdir, readFile, rm, stat, unlink, writeFile } from "fs/promises";
import { dirname, join } from "path";

import type { DaemonContext } from "../context";
import {
  assertNoSymlinkEscape,
  ensureProjectDir,
  kindFor,
  mimeFor,
  pathExists,
  projectDir,
  resolveProjectFilePath,
} from "./paths";
import type { CreateProjectInput, OpenStudioProject, ProjectFileEntry, UpdateProjectInput } from "./types";

const PROJECT_MANIFEST = "project.json";

export async function createProject(context: DaemonContext, input: CreateProjectInput = {}) {
  const now = new Date().toISOString();
  const id = input.id ?? `proj_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const dir = await ensureProjectDir(context, id);
  const manifestPath = join(dir, PROJECT_MANIFEST);

  if (await pathExists(manifestPath)) {
    throw new Error("project already exists");
  }

  const project: OpenStudioProject = {
    id,
    name: input.name?.trim() || "Untitled package",
    status: "draft",
    createdAt: now,
    updatedAt: now,
    metadata: input.metadata && typeof input.metadata === "object" ? input.metadata : {},
  };

  await writeProjectManifest(context, project);
  return project;
}

export async function listProjects(context: DaemonContext) {
  const entries = await readdir(context.projectsDir, { withFileTypes: true }).catch(() => []);
  const projects: OpenStudioProject[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const project = await getProject(context, entry.name);
    if (project) projects.push(project);
  }

  return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getProject(context: DaemonContext, projectId: string) {
  const manifestPath = join(projectDir(context, projectId), PROJECT_MANIFEST);
  try {
    const raw = await readFile(manifestPath, "utf8");
    return normalizeProject(JSON.parse(raw));
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return null;
    throw error;
  }
}

export async function updateProject(context: DaemonContext, projectId: string, input: UpdateProjectInput) {
  const existing = await getProject(context, projectId);
  if (!existing) return null;

  const project: OpenStudioProject = {
    ...existing,
    name: typeof input.name === "string" && input.name.trim() ? input.name.trim() : existing.name,
    status: input.status ?? existing.status,
    metadata: input.metadata && typeof input.metadata === "object" ? input.metadata : existing.metadata,
    updatedAt: new Date().toISOString(),
  };

  await writeProjectManifest(context, project);
  return project;
}

export async function deleteProject(context: DaemonContext, projectId: string) {
  await rm(projectDir(context, projectId), { recursive: true, force: true });
}

export async function writeProjectFile(context: DaemonContext, projectId: string, pathname: string, bytes: Buffer) {
  const { safePath, filePath } = await resolveProjectFilePath(context, projectId, pathname);
  await assertNoSymlinkEscape(context, projectId, safePath);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, bytes);
  await touchProject(context, projectId);
  return projectFileEntry(filePath, safePath);
}

export async function readProjectFile(context: DaemonContext, projectId: string, pathname: string) {
  const { safePath, filePath } = await resolveProjectFilePath(context, projectId, pathname);
  return {
    file: await projectFileEntry(filePath, safePath),
    bytes: await readFile(filePath),
  };
}

export async function deleteProjectFile(context: DaemonContext, projectId: string, pathname: string) {
  const { filePath } = await resolveProjectFilePath(context, projectId, pathname);
  await unlink(filePath);
  await touchProject(context, projectId);
}

export async function listProjectFiles(context: DaemonContext, projectId: string) {
  const dir = projectDir(context, projectId);
  const files: ProjectFileEntry[] = [];
  await collectFiles(dir, "", files);
  return files.sort((a, b) => b.mtime - a.mtime);
}

async function collectFiles(dir: string, relDir: string, out: ProjectFileEntry[]) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (entry.name === PROJECT_MANIFEST || entry.name.startsWith(".")) continue;
    const rel = relDir ? `${relDir}/${entry.name}` : entry.name;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(fullPath, rel, out);
      continue;
    }
    if (!entry.isFile()) continue;
    out.push(await projectFileEntry(fullPath, rel));
  }
}

async function projectFileEntry(filePath: string, safePath: string): Promise<ProjectFileEntry> {
  const info = await stat(filePath);
  return {
    name: safePath,
    path: safePath,
    size: info.size,
    mtime: info.mtimeMs,
    kind: kindFor(safePath),
    mime: mimeFor(safePath),
  };
}

async function touchProject(context: DaemonContext, projectId: string) {
  const project = await getProject(context, projectId);
  if (!project) return;
  await writeProjectManifest(context, { ...project, updatedAt: new Date().toISOString() });
}

async function writeProjectManifest(context: DaemonContext, project: OpenStudioProject) {
  const dir = await ensureProjectDir(context, project.id);
  await writeFile(join(dir, PROJECT_MANIFEST), JSON.stringify(project, null, 2), "utf8");
}

function normalizeProject(value: unknown): OpenStudioProject {
  if (!value || typeof value !== "object") throw new Error("invalid project manifest");
  const candidate = value as Partial<OpenStudioProject>;
  if (typeof candidate.id !== "string") throw new Error("invalid project manifest");
  return {
    id: candidate.id,
    name: typeof candidate.name === "string" && candidate.name.trim() ? candidate.name : "Untitled package",
    status: candidate.status === "active" || candidate.status === "archived" ? candidate.status : "draft",
    createdAt: typeof candidate.createdAt === "string" ? candidate.createdAt : new Date().toISOString(),
    updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : new Date().toISOString(),
    metadata: candidate.metadata && typeof candidate.metadata === "object" ? candidate.metadata : {},
  };
}

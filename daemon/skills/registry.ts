import { readdir, readFile, stat } from "fs/promises";
import { homedir } from "os";
import { join, resolve } from "path";

export type SkillRecord = {
  id: string;
  name: string;
  description: string;
  path: string;
  root: string;
  mode: "local" | "project" | "user";
  updatedAt?: number;
};

export type SkillRegistryOptions = {
  rootDir?: string;
  roots?: string[];
  maxDepth?: number;
  limit?: number;
};

function defaultRoots(rootDir = process.cwd()) {
  const envRoots = (process.env.OPEN_STUDIO_SKILL_ROOTS || "")
    .split(/[;]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return [
    ...envRoots,
    join(rootDir, ".open-studio", "skills"),
    join(rootDir, ".agents", "skills"),
    join(homedir(), ".codex", "skills"),
    join(homedir(), ".agents", "skills"),
  ];
}

function modeForRoot(root: string, rootDir: string): SkillRecord["mode"] {
  const normalized = resolve(root).toLowerCase();
  const projectRoot = resolve(rootDir).toLowerCase();
  if (normalized.startsWith(projectRoot)) {
    return normalized.includes(`${resolve(rootDir, ".agents").toLowerCase()}`) ? "project" : "local";
  }
  return "user";
}

function parseFrontmatter(text: string): { name?: string; description?: string } {
  const match = text.match(/^---\s*([\s\S]*?)\s*---/);
  if (!match) return {};
  const out: { name?: string; description?: string } = {};
  for (const line of match[1].split(/\r?\n/)) {
    const [key, ...rest] = line.split(":");
    const value = rest.join(":").trim().replace(/^["']|["']$/g, "");
    if (key.trim() === "name") out.name = value;
    if (key.trim() === "description") out.description = value;
  }
  return out;
}

function skillIdFromPath(skillPath: string) {
  return skillPath
    .replace(/[\\/]+SKILL[.]md$/i, "")
    .split(/[\\/]+/)
    .filter(Boolean)
    .slice(-2)
    .join("/")
    .toLowerCase();
}

async function findSkillFiles(root: string, depth: number, out: string[]) {
  if (depth < 0) return;
  let entries: Array<{ name: string; isFile(): boolean; isDirectory(): boolean }>;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const pathname = join(root, entry.name);
    if (entry.isFile() && entry.name.toLowerCase() === "skill.md") {
      out.push(pathname);
      continue;
    }
    if (!entry.isDirectory()) continue;
    if (entry.name === "node_modules" || entry.name.startsWith(".git")) continue;
    await findSkillFiles(pathname, depth - 1, out);
  }
}

export async function listSkills(options: SkillRegistryOptions = {}): Promise<SkillRecord[]> {
  const rootDir = options.rootDir ?? process.cwd();
  const roots = options.roots ?? defaultRoots(rootDir);
  const files: string[] = [];
  for (const root of roots) {
    await findSkillFiles(resolve(root), options.maxDepth ?? 3, files);
  }

  const skills: SkillRecord[] = [];
  const seen = new Set<string>();
  for (const file of files) {
    const id = skillIdFromPath(file);
    if (seen.has(id)) continue;
    seen.add(id);
    const text = await readFile(file, "utf8").catch(() => "");
    const frontmatter = parseFrontmatter(text);
    const info = await stat(file).catch(() => null);
    skills.push({
      id,
      name: frontmatter.name || id.split("/").pop() || id,
      description: frontmatter.description || "",
      path: file,
      root: roots.find((root) => resolve(file).toLowerCase().startsWith(resolve(root).toLowerCase())) || "",
      mode: modeForRoot(file, rootDir),
      updatedAt: info?.mtimeMs,
    });
  }

  return skills
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, Math.max(1, Math.min(options.limit ?? 200, 1000)));
}

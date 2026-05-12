import { mkdir, writeFile } from "fs/promises";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { listSkills } from "./registry";

describe("skills registry", () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "open-studio-skills-"));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("scans SKILL.md files and parses frontmatter", async () => {
    const skillDir = join(root, "creator", "seo-title");
    await mkdir(skillDir, { recursive: true });
    await writeFile(
      join(skillDir, "SKILL.md"),
      [
        "---",
        "name: seo-title",
        "description: Generate CTR and SEO titles",
        "---",
        "",
        "# Skill",
      ].join("\n"),
      "utf8"
    );

    const skills = await listSkills({ rootDir: root, roots: [root], maxDepth: 4 });

    expect(skills).toEqual([
      expect.objectContaining({
        name: "seo-title",
        description: "Generate CTR and SEO titles",
        mode: "local",
      }),
    ]);
  });
});

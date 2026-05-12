import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDaemonContext, type DaemonContext } from "../context";
import { validateProjectPath } from "./paths";
import {
  createProject,
  deleteProjectFile,
  getProject,
  listProjectFiles,
  listProjects,
  readProjectFile,
  updateProject,
  writeProjectFile,
} from "./store";

describe("project paths", () => {
  it("validates safe project paths", () => {
    expect(validateProjectPath("files/script.md")).toBe("files/script.md");
    expect(() => validateProjectPath("../secret.txt")).toThrow("invalid project path");
    expect(() => validateProjectPath("C:\\secret.txt")).toThrow("invalid project path");
    expect(() => validateProjectPath("project.json")).toThrow("reserved project path");
  });
});

describe("project store", () => {
  let storageDir: string;
  let context: DaemonContext;

  beforeEach(() => {
    storageDir = mkdtempSync(join(tmpdir(), "open-studio-projects-"));
    context = createDaemonContext({ storageDir });
  });

  afterEach(() => {
    rmSync(storageDir, { recursive: true, force: true });
  });

  it("creates, updates and lists projects", async () => {
    const project = await createProject(context, { id: "proj_test", name: "Video package" });
    const updated = await updateProject(context, "proj_test", { status: "active" });

    expect(project).toMatchObject({ id: "proj_test", name: "Video package", status: "draft" });
    expect(updated).toMatchObject({ id: "proj_test", status: "active" });
    await expect(getProject(context, "proj_test")).resolves.toMatchObject({ id: "proj_test" });
    await expect(listProjects(context)).resolves.toHaveLength(1);
  });

  it("writes, reads, lists and deletes project files", async () => {
    await createProject(context, { id: "proj_files", name: "Files" });
    const file = await writeProjectFile(context, "proj_files", "files/script.md", Buffer.from("# roteiro", "utf8"));
    const read = await readProjectFile(context, "proj_files", "files/script.md");

    expect(file).toMatchObject({ path: "files/script.md", kind: "markdown" });
    expect(read.bytes.toString("utf8")).toBe("# roteiro");
    await expect(listProjectFiles(context, "proj_files")).resolves.toEqual([expect.objectContaining({ path: "files/script.md" })]);

    await deleteProjectFile(context, "proj_files", "files/script.md");
    await expect(listProjectFiles(context, "proj_files")).resolves.toHaveLength(0);
  });
});

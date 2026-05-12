import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDaemonContext, type DaemonContext } from "@/daemon/context";
import { createProject } from "@/daemon/projects/store";

import { resolveRevealTarget, revealPath } from "./bridge";

describe("desktop bridge", () => {
  let storageDir: string;
  let context: DaemonContext;

  beforeEach(() => {
    storageDir = mkdtempSync(join(tmpdir(), "open-studio-desktop-"));
    context = createDaemonContext({ storageDir });
  });

  afterEach(() => {
    rmSync(storageDir, { recursive: true, force: true });
  });

  it("resolves only storage-backed reveal targets", async () => {
    await createProject(context, { id: "proj_reveal", name: "Reveal" });

    expect(resolveRevealTarget(context, { target: "storage" }).path).toBe(storageDir);
    expect(resolveRevealTarget(context, { target: "project", projectId: "proj_reveal" }).path).toBe(
      join(storageDir, "projects", "proj_reveal"),
    );
  });

  it("supports dry-run reveal without launching desktop apps", async () => {
    await expect(revealPath(storageDir, { dryRun: true })).resolves.toEqual({ opened: false, command: null });
  });
});

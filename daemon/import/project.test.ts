import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDaemonContext, type DaemonContext } from "@/daemon/context";
import { createZip } from "@/daemon/export/zip";
import { readProjectFile } from "@/daemon/projects/store";

import { importProjectArchive, readStoredZip } from "./project";

describe("project archive import", () => {
  let storageDir: string;
  let context: DaemonContext;

  beforeEach(() => {
    storageDir = mkdtempSync(join(tmpdir(), "open-studio-import-"));
    context = createDaemonContext({ storageDir });
  });

  afterEach(() => {
    rmSync(storageDir, { recursive: true, force: true });
  });

  it("imports project-files and generated package files from an export zip", async () => {
    const archive = createZip([
      { name: "package.md", data: Buffer.from("# pacote", "utf8") },
      { name: "project-files/files/package.json", data: Buffer.from('{"title":"Pacote"}', "utf8") },
      { name: "project-files/files/script.md", data: Buffer.from("roteiro", "utf8") },
    ]);

    const result = await importProjectArchive({ context, archive, sourceName: "package.zip" });

    expect(result.project.name).toBe("Imported package");
    expect(result.importedEntries).toEqual(expect.arrayContaining(["files/imported/package.md", "files/package.json", "files/script.md"]));
    await expect(readProjectFile(context, result.project.id, "files/script.md")).resolves.toMatchObject({
      file: expect.objectContaining({ path: "files/script.md" }),
    });
  });

  it("rejects unsafe archive paths before writing files", () => {
    const archive = createZip([{ name: "project-files/aa/evil.txt", data: Buffer.from("owned", "utf8") }]);
    const nameOffset = archive.indexOf("project-files/aa/evil.txt");
    archive.write("project-files/../evil.txt", nameOffset, "utf8");

    expect(() => readStoredZip(archive)).toThrow("unsafe archive path");
  });

  it("rejects compressed entries instead of guessing decompression", () => {
    const archive = createZip([{ name: "project-files/files/script.md", data: Buffer.from("x") }]);
    archive.writeUInt16LE(8, 8);

    expect(() => readStoredZip(archive)).toThrow("compressed zip entries are not supported");
  });
});

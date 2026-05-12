import { mkdir, mkdtemp, rm, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AGENT_DEFS, createAgentCommandInvocation, extractAgentError, extractAgentText, resolveAgentExecutable, wellKnownUserToolchainBins } from "./agents";

let tempRoot = "";

function agent(id: string) {
  const def = AGENT_DEFS.find((item) => item.id === id);
  if (!def) throw new Error(`Missing agent ${id}`);
  return def;
}

async function touch(filePath: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, "@echo off\r\necho test\r\n", "utf8");
}

beforeEach(async () => {
  tempRoot = await mkdtemp(path.join(os.tmpdir(), "open-studio-agents-"));
});

afterEach(async () => {
  if (tempRoot) await rm(tempRoot, { recursive: true, force: true });
});

describe("agent executable resolver", () => {
  it("finds Windows npm shims from APPDATA even when PATH is empty", async () => {
    const appData = path.join(tempRoot, "Roaming");
    await touch(path.join(appData, "npm", "codex.cmd"));

    const resolved = resolveAgentExecutable(agent("codex"), {}, {
      env: { PATH: "", APPDATA: appData, PATHEXT: ".EXE;.CMD;.BAT;.COM" },
      homeDir: tempRoot,
      platform: "win32",
    });

    expect(resolved).toMatchObject({ source: "well_known" });
    expect(resolved?.bin.toLowerCase()).toContain("codex.cmd");
  });

  it("lets configured agent bins override PATH and known toolchain dirs", async () => {
    const custom = path.join(tempRoot, "custom", "codex");
    const pathDir = path.join(tempRoot, "path-bin");
    await touch(`${custom}.cmd`);
    await touch(path.join(pathDir, "codex.cmd"));

    const resolved = resolveAgentExecutable(agent("codex"), { CODEX_BIN: custom }, {
      env: { PATH: pathDir, PATHEXT: ".EXE;.CMD;.BAT;.COM" },
      homeDir: tempRoot,
      platform: "win32",
    });

    expect(resolved).toMatchObject({ source: "configured" });
    expect(resolved?.bin).toBe(`${custom}.cmd`);
  });

  it("resolves fallback bins such as opencode when the primary bin is absent", async () => {
    const appData = path.join(tempRoot, "Roaming");
    await touch(path.join(appData, "npm", "opencode.cmd"));

    const resolved = resolveAgentExecutable(agent("opencode"), {}, {
      env: { PATH: "", APPDATA: appData, PATHEXT: ".EXE;.CMD;.BAT;.COM" },
      homeDir: tempRoot,
      platform: "win32",
    });

    expect(resolved).toMatchObject({ source: "fallback" });
    expect(resolved?.bin.toLowerCase()).toContain("opencode.cmd");
  });

  it("returns undefined when an agent is not installed anywhere searched", () => {
    const resolved = resolveAgentExecutable(agent("gemini"), {}, {
      env: { PATH: "", PATHEXT: ".EXE;.CMD;.BAT;.COM" },
      homeDir: tempRoot,
      platform: "win32",
    });

    expect(resolved).toBeUndefined();
  });

  it("exposes known user toolchain locations used by GUI-launched apps", () => {
    const dirs = wellKnownUserToolchainBins({
      env: { APPDATA: path.join(tempRoot, "Roaming"), LOCALAPPDATA: path.join(tempRoot, "Local") },
      homeDir: tempRoot,
      platform: "win32",
    });

    expect(dirs).toContain(path.join(tempRoot, "Roaming", "npm"));
    expect(dirs).toContain(path.join(tempRoot, ".local", "bin"));
  });

  it("wraps Windows cmd shims in cmd.exe safely", () => {
    const invocation = createAgentCommandInvocation("C:\\Users\\Lucas Test\\AppData\\Roaming\\npm\\codex.cmd", ["--version"], {
      ComSpec: "C:\\Windows\\System32\\cmd.exe",
    }, "win32");

    expect(invocation.command).toBe("C:\\Windows\\System32\\cmd.exe");
    expect(invocation.windowsVerbatimArguments).toBe(true);
    expect(invocation.args.slice(0, 3)).toEqual(["/d", "/s", "/c"]);
  });

  it("runs Codex in an isolated OpenDesign-style exec mode", () => {
    const args = agent("codex").buildArgs({ model: "default", reasoning: "default" });

    expect(args).toContain("--ephemeral");
    expect(args).toEqual(expect.arrayContaining(["--disable", "plugins"]));
  });
});

describe("agent output parsing", () => {
  it("extracts assistant text from JSON event streams", () => {
    const output = [
      JSON.stringify({ type: "status", text: "running" }),
      JSON.stringify({ type: "message", role: "assistant", content: "Título forte" }),
      JSON.stringify({ type: "result", content: " final" }),
    ].join("\n");

    expect(extractAgentText(output)).toBe("Título forte final");
  });

  it("falls back to plain stdout when a CLI returns text", () => {
    expect(extractAgentText("Texto direto\n")).toBe("Texto direto");
  });

  it("extracts structured agent errors before stderr noise", () => {
    const output = [
      JSON.stringify({ type: "thread.started" }),
      JSON.stringify({
        type: "error",
        message: JSON.stringify({
          type: "error",
          status: 400,
          error: { message: "The 'gpt-5.5' model requires a newer version of Codex." },
        }),
      }),
    ].join("\n");

    expect(extractAgentError(output)).toBe("The 'gpt-5.5' model requires a newer version of Codex.");
  });
});

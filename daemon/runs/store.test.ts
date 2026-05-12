import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDaemonContext, type DaemonContext } from "../context";
import { readRunEvents } from "./events";
import {
  cancelRun,
  createRun,
  isLegalRunTransition,
  listRuns,
  registerRunAbortHandler,
  transitionRun,
} from "./store";

describe("run transitions", () => {
  it("allows expected lifecycle transitions", () => {
    expect(isLegalRunTransition("queued", "running")).toBe(true);
    expect(isLegalRunTransition("running", "awaiting_input")).toBe(true);
    expect(isLegalRunTransition("running", "succeeded")).toBe(true);
    expect(isLegalRunTransition("running", "failed")).toBe(true);
    expect(isLegalRunTransition("running", "cancelled")).toBe(true);
    expect(isLegalRunTransition("awaiting_input", "running")).toBe(true);
    expect(isLegalRunTransition("succeeded", "running")).toBe(false);
  });
});

describe("run store", () => {
  let storageDir: string;
  let context: DaemonContext;

  beforeEach(() => {
    storageDir = mkdtempSync(join(tmpdir(), "open-studio-runs-"));
    context = createDaemonContext({ storageDir });
  });

  afterEach(() => {
    rmSync(storageDir, { recursive: true, force: true });
  });

  it("creates runs and writes JSONL events", async () => {
    const run = await createRun(context, { id: "run_test", projectId: "proj_test", kind: "agent" });
    const running = await transitionRun(context, run.id, "running");
    const succeeded = await transitionRun(context, run.id, "succeeded", { result: "ok" });
    const events = await readRunEvents(context, run.id);

    expect(run.status).toBe("queued");
    expect(running.status).toBe("running");
    expect(succeeded.status).toBe("succeeded");
    expect(events).toEqual([
      expect.objectContaining({ runId: run.id, type: "run.created" }),
      expect.objectContaining({ runId: run.id, type: "run.status", payload: expect.objectContaining({ to: "running" }) }),
      expect.objectContaining({ runId: run.id, type: "run.status", payload: expect.objectContaining({ to: "succeeded" }) }),
    ]);
  });

  it("rejects invalid transitions", async () => {
    const run = await createRun(context, { id: "run_invalid" });
    await expect(transitionRun(context, run.id, "succeeded")).rejects.toThrow("invalid run transition");
  });

  it("lists active runs and stores cancellation signal", async () => {
    const abort = vi.fn();
    const run = await createRun(context, { id: "run_cancel", projectId: "proj_test" });
    registerRunAbortHandler(run.id, abort);
    await transitionRun(context, run.id, "running");
    const active = await listRuns(context, { status: "active" });
    const cancelled = await cancelRun(context, run.id, "SIGINT");

    expect(active).toEqual([expect.objectContaining({ id: run.id, status: "running" })]);
    expect(abort).toHaveBeenCalledWith("SIGINT");
    expect(cancelled).toMatchObject({
      status: "cancelled",
      cancelRequested: true,
      cancelSignal: "SIGINT",
    });
  });
});

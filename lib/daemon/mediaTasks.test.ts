import { describe, expect, it } from "vitest";
import { cancelMediaTask, createMediaTask, getMediaTask, updateMediaTask } from "./mediaTasks";

describe("media tasks", () => {
  it("tracks video/audio surfaces and supports cancellation", async () => {
    const task = await createMediaTask({
      surface: "video",
      model: "kling-2.0",
      providerId: "kling",
      prompt: "Hidden video test",
    });
    await updateMediaTask(task.id, { status: "running", progressMessage: "started" });

    const cancelled = await cancelMediaTask(task.id, "user cancelled");
    expect(cancelled).toMatchObject({
      id: task.id,
      surface: "video",
      status: "cancelled",
      errorKind: "cancelled",
    });
    await expect(getMediaTask(task.id)).resolves.toMatchObject({ progress: ["started", "user cancelled"] });
  });
});

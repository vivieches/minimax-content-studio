import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  getSettings: vi.fn(),
  testAgent: vi.fn(),
}));

vi.mock("@/lib/storage/settings", () => ({
  getSettings: mocks.getSettings,
}));

vi.mock("@/lib/daemon/agents", () => ({
  testAgent: mocks.testAgent,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/agents/test", () => {
  it("passes saved agent CLI env into the smoke test", async () => {
    const agentCliEnv = { codex: { CODEX_BIN: "C:\\Tools\\codex.cmd" } };
    mocks.getSettings.mockResolvedValue({ agentCliEnv });
    mocks.testAgent.mockResolvedValue({
      ok: true,
      kind: "success",
      latencyMs: 10,
      model: "default",
      agentName: "Codex CLI",
    });

    const response = await POST(
      new Request("http://localhost/api/agents/test", {
        method: "POST",
        body: JSON.stringify({ agentId: "codex", model: "gpt-5.5", reasoning: "high" }),
      })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.kind).toBe("success");
    expect(json.errorKind).toBe("success");
    expect(json.diagnostics[0]).toMatchObject({ surface: "agent", kind: "success" });
    expect(mocks.testAgent).toHaveBeenCalledWith({
      agentId: "codex",
      model: "gpt-5.5",
      reasoning: "high",
      agentCliEnv,
    });
  });

  it("sanitizes body-provided agent CLI env before testing", async () => {
    mocks.getSettings.mockResolvedValue({ agentCliEnv: {} });
    mocks.testAgent.mockResolvedValue({
      ok: false,
      kind: "agent_not_installed",
      latencyMs: 10,
      model: "default",
      agentName: "Codex CLI",
    });

    await POST(
      new Request("http://localhost/api/agents/test", {
        method: "POST",
        body: JSON.stringify({
          agentId: "codex",
          agentCliEnv: { codex: { CODEX_BIN: " codex ", BAD_KEY: "x" }, bad: { BAD_KEY: "x" } },
        }),
      })
    );

    expect(mocks.testAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        agentCliEnv: { codex: { CODEX_BIN: "codex" } },
      })
    );
  });
});

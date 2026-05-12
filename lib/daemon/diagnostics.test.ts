import { describe, expect, it } from "vitest";
import {
  DiagnosticError,
  agentDiagnostic,
  diagnosticsFromError,
  fallbackDiagnostic,
  providerDiagnostic,
  redactSensitive,
} from "./diagnostics";

describe("daemon diagnostics", () => {
  it("redacts API keys from diagnostic messages", () => {
    expect(redactSensitive("Bearer sk-testsecret1234567890 failed")).toContain("[redacted]");
    expect(redactSensitive("key=AIzaSyAaaaaaaaaaaaaaaaaaaaaaaaaaaaa")).toContain("[redacted]");
  });

  it("builds agent diagnostics with actionable guidance", () => {
    const diagnostic = agentDiagnostic({
      kind: "not_found_model",
      agentName: "Codex CLI",
      model: "gpt-5.5",
      message: "model not found",
    });

    expect(diagnostic.surface).toBe("agent");
    expect(diagnostic.kind).toBe("not_found_model");
    expect(diagnostic.action).toMatch(/modelo/i);
  });

  it("builds provider and fallback diagnostics", () => {
    expect(providerDiagnostic({ kind: "auth_failed", providerId: "openai", message: "invalid api key" })).toMatchObject({
      surface: "provider",
      kind: "auth_failed",
      severity: "error",
    });
    expect(fallbackDiagnostic({ kind: "fallback_used", from: "agent:codex", to: "openai" })).toMatchObject({
      surface: "fallback",
      kind: "fallback_used",
      severity: "warning",
    });
  });

  it("extracts diagnostics from diagnostic errors only", () => {
    const diagnostic = fallbackDiagnostic({ kind: "fallback_unavailable", reason: "missing key" });
    expect(diagnosticsFromError(new DiagnosticError("failed", [diagnostic]))).toEqual([diagnostic]);
    expect(diagnosticsFromError(new Error("plain"))).toEqual([]);
  });
});

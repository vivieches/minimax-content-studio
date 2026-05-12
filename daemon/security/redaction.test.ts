import { describe, expect, it } from "vitest";

import { redactSecrets, redactString } from "./redaction";

describe("secret redaction", () => {
  it("redacts known secret keys recursively", () => {
    const redacted = redactSecrets({
      apiKey: "sk-secret-value",
      nested: { authorization: "Bearer abcdefghijklmnopqrstuvwxyz" },
      safe: "visible",
    });

    expect(redacted).toEqual({
      apiKey: "[redacted]",
      nested: { authorization: "[redacted]" },
      safe: "visible",
    });
  });

  it("redacts secrets embedded in log strings", () => {
    expect(redactString("failed with sk-ant-1234567890abcdef and Bearer abcdefghijklmnopqrstuvwxyz")).toBe(
      "failed with sk-ant-[redacted] and Bearer [redacted]",
    );
    expect(redactString("url?api_key=abc123456789&ok=1")).toBe("url?api_key=[redacted]&ok=1");
  });
});

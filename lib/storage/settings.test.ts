import { describe, expect, it } from "vitest";
import { getDefaultSettings } from "./settings";

describe("provider settings defaults", () => {
  it("creates local BYOK provider settings without stored keys", () => {
    const settings = getDefaultSettings();

    expect(settings.providers.minimax.apiKey).toBe("");
    expect(settings.providers["openai-compatible"].apiKey).toBe("");
    expect(settings.defaults.text.providerId).toBe("minimax");
  });

  it("keeps generation defaults per capability", () => {
    const settings = getDefaultSettings();

    expect(settings.defaults.image.model).toBe("image-01");
    expect(settings.defaults.audio.model).toBe("music-2.6");
    expect(settings.defaults.video.providerId).toBe("minimax");
  });
});

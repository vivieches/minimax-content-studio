import { describe, expect, it } from "vitest";
import { deleteBrandReference, getBrandKit, updateBrandKit, upsertBrandReference } from "./store";

describe("brand kit store", () => {
  it("updates brand voice and persists references", async () => {
    const updated = await updateBrandKit({
      brandVoice: "Fala direto, com exemplos concretos.",
      audience: "criadores tech",
      forbiddenWords: ["revolucionario"],
    });

    expect(updated).toMatchObject({
      brandVoice: "Fala direto, com exemplos concretos.",
      audience: "criadores tech",
      forbiddenWords: ["revolucionario"],
    });

    const withReference = await upsertBrandReference({
      title: "Gemma docs",
      content: "https://ai.google.dev/gemma",
    });
    expect(withReference.references[0]).toMatchObject({ title: "Gemma docs", type: "link" });

    const cleaned = await deleteBrandReference(withReference.references[0].id);
    expect(cleaned.references).toHaveLength(0);
    await expect(getBrandKit()).resolves.toMatchObject({ brandVoice: "Fala direto, com exemplos concretos." });
  });
});

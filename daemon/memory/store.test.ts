import { describe, expect, it } from "vitest";
import { createMemory, deleteMemory, extractMemoryCandidates, listMemories, updateMemory } from "./store";

describe("memory store", () => {
  it("creates, ranks, updates and deletes memories", async () => {
    const low = await createMemory({ content: "Usar tom calmo.", tags: ["tone"], weight: 2 });
    const high = await createMemory({ content: "Sempre usar exemplos de IA local.", tags: ["ia", "local"], weight: 8 });

    const ranked = await listMemories({ query: "IA local", limit: 2 });
    expect(ranked[0].id).toBe(high.id);

    await expect(updateMemory(low.id, { content: "Evitar hype vazio.", tags: ["avoid"] })).resolves.toMatchObject({
      content: "Evitar hype vazio.",
      tags: ["avoid"],
    });

    await expect(deleteMemory(high.id)).resolves.toBe(true);
    await expect(deleteMemory(low.id)).resolves.toBe(true);
  });

  it("extracts preference-like memory candidates from text", () => {
    const candidates = extractMemoryCandidates("Sempre usar exemplos praticos. Nunca prometer resultado falso.");

    expect(candidates).toHaveLength(2);
    expect(candidates[0]).toMatchObject({ tags: ["preference"], source: "extracted" });
  });
});

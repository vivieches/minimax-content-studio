import { describe, expect, it } from "vitest";
import { parseTitlePackResponse } from "./scoring";

describe("title scoring parser", () => {
  it("normalizes provider JSON into exactly 10 candidates and top 3", () => {
    const parsed = parseTitlePackResponse(
      JSON.stringify({
        candidates: [
          { title: "Como usar IA local sem depender de APIs", score: 95, reason: "clear promise" },
          { title: "O jeito local-first de criar conteúdo com IA", score: 91, reason: "positioning" },
        ],
        top3: ["Como usar IA local sem depender de APIs"],
      }),
      10,
      { topic: "IA local para criadores" }
    );

    expect(parsed.candidates).toHaveLength(10);
    expect(parsed.top3).toHaveLength(3);
    expect(parsed.top3[0].title).toBe("Como usar IA local sem depender de APIs");
    expect(parsed.needsRepair).toBe(true);
  });

  it("repairs plain text output into a usable ranked pack", () => {
    const parsed = parseTitlePackResponse(
      "1. Título de teste\n2. Outro título de teste\n3. Terceiro título",
      10,
      { topic: "ferramenta de PDF com IA" }
    );

    expect(parsed.candidates).toHaveLength(10);
    expect(parsed.candidates[0]).toMatchObject({ title: "Título de teste", rank: 1 });
    expect(parsed.top3).toHaveLength(3);
    expect(parsed.needsRepair).toBe(true);
    expect(parsed.repairReason).toContain("non-json");
  });
});

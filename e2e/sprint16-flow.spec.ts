import { test, expect } from "@playwright/test";

const captionPattern = `#Gemma4 #GoogleAI #InteligenciaArtificial
👇🏻 Google acaba de acelerar modelos de IA hasta 3 veces con Gemma 4 👇🏻

En este vídeo te explico el tema principal con palabras clave naturales, hashtags relevantes, link principal, bloque FOLLOW ME y contacto comercial.`;

test.describe("Sprint 16 full-flow smoke", () => {
  test.afterEach(async ({ request }) => {
    await request.put("/api/settings", { data: { demoMode: false, executionMode: "byok" } });
  });

  test("demo mode generates package, titles and SEO captions without external keys", async ({ request }) => {
    await request.put("/api/settings", {
      data: {
        demoMode: true,
        executionMode: "byok",
        defaults: {
          image: { providerId: "stub", model: "stub-image" },
        },
        providers: {
          stub: { enabled: true, models: { image: "stub-image" } },
        },
      },
    });

    const titleResponse = await request.post("/api/generate/titles", {
      data: {
        topic: "Como usar IA local para criar conteúdo sem depender de uma única API",
        briefing: "Vídeo para criadores que querem um setup local-first com CLIs, BYOK e imagem.",
        thumbnailConcept: "Criador olhando para várias CLIs conectadas",
        outlierNotes: "Contraste entre depender de uma API e ter vários provedores.",
        research: false,
        count: 10,
        saveToAssets: true,
      },
    });
    expect(titleResponse.ok()).toBe(true);
    const titleData = await titleResponse.json();
    expect(titleData.candidates).toHaveLength(10);
    expect(titleData.top3).toHaveLength(3);

    const captionWithoutPattern = await request.post("/api/generate/captions", {
      data: {
        topic: "IA local para conteúdo",
        title: titleData.top3[0].title,
        script: "Neste vídeo explico como conectar CLIs locais, provedores BYOK e geração de imagem em um fluxo local-first.",
        creatorProfile: {
          tiktok: "/ lucasvalen",
          instagram: "/ lucasvalen",
          x: "https://x.com/lucasvalen",
          businessEmail: "contato@example.com",
          language: "pt-BR",
        },
        saveToAssets: true,
      },
    });
    expect(captionWithoutPattern.ok()).toBe(true);
    const captionWithoutPatternData = await captionWithoutPattern.json();
    expect(captionWithoutPatternData.captions[0]).toContain("#");

    const captionWithPattern = await request.post("/api/generate/captions", {
      data: {
        topic: "IA local para conteúdo",
        title: titleData.top3[0].title,
        script: "Neste vídeo explico como conectar CLIs locais, provedores BYOK e geração de imagem em um fluxo local-first.",
        pattern: captionPattern,
        creatorProfile: {
          tiktok: "/ lucasvalen",
          instagram: "/ lucasvalen",
          x: "https://x.com/lucasvalen",
          businessEmail: "contato@example.com",
          primaryLinkLabel: "Setup local-first",
          primaryLinkUrl: "https://example.com/setup",
          language: "pt-BR",
        },
        saveToAssets: true,
      },
    });
    expect(captionWithPattern.ok()).toBe(true);
    const captionWithPatternData = await captionWithPattern.json();
    expect(captionWithPatternData.captions[0]).toContain("FOLLOW ME");

    const packageResponse = await request.post("/api/generate/package", {
      data: {
        briefing: "Criar um pacote sobre Open Studio local-first: roteiro, títulos, thumbnail e export.",
        research: false,
        providers: {
          image: { providerId: "stub", model: "stub-image" },
        },
        saveToAssets: true,
      },
    });
    expect(packageResponse.ok()).toBe(true);
    const packageData = await packageResponse.json();
    expect(packageData.ok).toBe(true);
    expect(packageData.projectId).toBeTruthy();
    expect(packageData.outputs.text).toBeTruthy();
    expect(packageData.outputs.image.urls.length).toBeGreaterThan(0);
    expect(packageData.exportId).toBeTruthy();
  });

  test("stub media tool creates waitable image tasks", async ({ request }) => {
    await request.put("/api/settings", {
      data: {
        demoMode: false,
        executionMode: "byok",
        defaults: {
          image: { providerId: "stub", model: "stub-image" },
        },
        providers: {
          stub: { enabled: true, models: { image: "stub-image" } },
        },
      },
    });

    const imageResponse = await request.post("/api/generate/image", {
      data: {
        prompt: "Open Studio local-first creator thumbnail, 16:9, high contrast",
        provider: { providerId: "stub", model: "stub-image" },
        saveToAssets: false,
      },
    });
    expect(imageResponse.ok()).toBe(true);
    const imageData = await imageResponse.json();
    expect(imageData.providerId).toBe("stub");
    expect(imageData.urls.length).toBeGreaterThan(0);

    const mediaResponse = await request.post("/api/media/generate", {
      data: {
        surface: "image",
        providerId: "stub",
        model: "stub-image",
        prompt: "Open Studio media tool smoke",
        saveToAssets: true,
      },
    });
    expect(mediaResponse.ok()).toBe(true);
    const mediaData = await mediaResponse.json();
    expect(mediaData.status).toBe("done");
    expect(mediaData.taskId).toBeTruthy();

    const waitResponse = await request.post(`/api/media/tasks/${mediaData.taskId}/wait`, { data: {} });
    expect(waitResponse.ok()).toBe(true);
    const waitData = await waitResponse.json();
    expect(waitData.status).toBe("done");
    expect(waitData.file.providerId).toBe("stub");
  });

  test("research route is explicit when Tavily is unavailable", async ({ request }) => {
    const response = await request.post("/api/research/search", {
      data: {
        query: "YouTube title outlier CTR SEO local AI tools",
        maxSources: 3,
      },
    });
    const data = await response.json();

    if (response.ok()) {
      expect(data.research.sources.length).toBeGreaterThan(0);
      return;
    }

    expect(response.status()).toBe(400);
    expect(data.diagnostics?.[0]?.kind).toBe("research_unconfigured");
  });

  test("agent registry loads without running hidden prompts", async ({ request }) => {
    const response = await request.get("/api/agents?rescan=1");
    expect(response.ok()).toBe(true);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.agents)).toBe(true);
    expect(data.agents.length).toBeGreaterThan(0);
    expect(data.agents[0]).toHaveProperty("available");
    expect(data.agents[0]).toHaveProperty("commandPreview");
  });
});

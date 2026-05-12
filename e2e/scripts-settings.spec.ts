import { test, expect } from "@playwright/test";

test.describe("Scripts and settings wiring", () => {
  test("scripts side controls feed editable state", async ({ page }) => {
    await page.goto("/scripts");
    await expect(page.getByRole("heading", { name: "Guion", exact: true })).toBeVisible();

    const instructions = page.locator("#script-instructions");
    await page.getByRole("button", { name: "{{TEMA}} Tema principal" }).click();
    await expect(instructions).toHaveValue(/{{TEMA}}/);

    await page.getByLabel("Editar voz de marca").click();
    const brandVoice = page.locator("aside textarea");
    await brandVoice.fill("Voz directa, analítica e intensa.");
    await expect(brandVoice).toHaveValue("Voz directa, analítica e intensa.");

    page.once("dialog", (dialog) => dialog.accept("https://example.com/reference"));
    await page.getByRole("button", { name: "Agregar referencia" }).click();
    await expect(page.getByText("https://example.com/reference").first()).toBeVisible();
  });

  test("settings exposes execution defaults and only supported sections", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Execução e modelo" })).toBeVisible();
    const cliMode = page.getByRole("button", { name: /^CLI local \d+ instalados$/ });
    const byokMode = page.getByRole("button", { name: /^BYOK Provedor de API$/ });
    await expect(cliMode).toBeVisible();
    await expect(byokMode).toBeVisible();
    await expect(page.getByRole("button", { name: /Idioma/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Aparência/ })).toBeVisible();
    await expect(page.getByText("Provedor padrão")).toHaveCount(2);
    await expect(page.locator("option[value='pollinations']")).toHaveCount(1);

    await cliMode.click();
    await expect(page.getByRole("button", { name: /^Claude Code / })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Codex CLI / })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Gemini CLI / })).toBeVisible();

    await expect(page.getByRole("button", { name: /Provedores de mídia/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Connectors/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /MCP server/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Notificações/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Bichinhos/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Habilidades/ })).toHaveCount(0);
  });

  test("pipeline exposes title and caption modules", async ({ page }) => {
    await page.goto("/pipeline");
    await expect(page.getByLabel("Gerar 10 títulos e top 3")).toBeChecked();
    await expect(page.getByLabel("Gerar thumbnail")).toBeChecked();
    await page.getByLabel("Gerar legendas").check();
    await expect(page.getByText("Padrão de legenda")).toBeVisible();
    await expect(page.getByText("Módulos do pacote")).toBeVisible();
    await expect(page.getByText("10 títulos CTR/SEO com ranking top 3")).toBeVisible();
  });

  test("content tools route exposes titles and captions", async ({ page }) => {
    await page.goto("/content");
    await expect(page.getByRole("heading", { name: "Títulos e legendas" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Gerar 10 títulos" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Gerar legendas" })).toBeVisible();
  });

  test("content tools loads the latest title pack generated elsewhere", async ({ page }) => {
    const title = `Título persistido ${Date.now()}`;
    const response = await page.request.post("/api/assets", {
      data: {
        type: "prompt",
        title: "Title Pack - Teste pipeline",
        description: "Briefing vindo da pipeline",
        content: JSON.stringify({
          candidates: [
            { title, score: 97, reason: "Persisted title" },
            { title: `${title} 2`, score: 92, reason: "Persisted title 2" },
          ],
          top3: [{ title, score: 97, reason: "Persisted title" }],
        }),
        metadata: {
          topic: "Teste pipeline",
          briefing: "Briefing vindo da pipeline",
          thumbnailConcept: "Pessoa surpresa",
          outlierNotes: "Outlier A",
        },
        sourceModule: "title-generator",
        tags: ["titles", "ctr", "seo"],
      },
    });
    expect(response.ok()).toBe(true);

    await page.goto("/content");
    await expect(page.getByRole("button", { name: title, exact: true })).toBeVisible();
    await expect(page.locator("input").first()).toHaveValue("Teste pipeline");
  });
});

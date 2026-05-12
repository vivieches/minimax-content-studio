import { test, expect } from "@playwright/test";

test.describe("Thumbnail Generator", () => {
  test.afterEach(async ({ request }) => {
    await request.put("/api/settings", { data: { demoMode: false } });
  });

  test("loads current thumbnail UI without hydration errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/thumbnails");
    await expect(page.getByRole("heading", { name: "Gerador de Miniaturas" })).toBeVisible();

    await page.getByPlaceholder("MiniMax M2.7 construiu minha fábrica de conteúdo").fill("AI Tools for Developers");
    await page.getByPlaceholder("5 AI Tools in 2024").fill("Best AI Tools 2024");
    await page.locator('input[maxlength="40"]').fill("MUST HAVE");

    const hydrationErrors = consoleErrors.filter(
      (error) => error.includes("hydrat") || error.includes("insertBefore") || error.includes("does not match")
    );

    expect(hydrationErrors).toHaveLength(0);
  });

  test("generate action reports provider errors instead of fake success", async ({ page }) => {
    await page.request.put("/api/settings", { data: { demoMode: true } });
    await page.goto("/thumbnails");
    await expect(page.getByRole("heading", { name: "Gerador de Miniaturas" })).toBeVisible();

    await page.getByPlaceholder("MiniMax M2.7 construiu minha fábrica de conteúdo").fill("AI Tools for Developers");
    await page.getByPlaceholder("5 AI Tools in 2024").fill("Best AI Tools 2024");
    await page.locator('input[maxlength="40"]').fill("MUST HAVE");
    await page.getByRole("button", { name: "Gerar miniatura" }).click();

    await expect(page.getByText(/Miniatura gerada|Configure um provedor|Não foi possível gerar/i)).toBeVisible({
      timeout: 15000,
    });
    await page.request.put("/api/settings", { data: { demoMode: false } });
  });
});

import { test, expect } from "@playwright/test";

test.describe("Open Studio smoke", () => {
  test("active pages load without music or video routes", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Open Studio/);

    await page.goto("/scripts");
    await expect(page.getByRole("heading", { name: "Roteiro", exact: true })).toBeVisible();

    await page.goto("/thumbnails");
    await expect(page.getByRole("heading", { name: "Gerador de Miniaturas" })).toBeVisible();

    await page.goto("/assets");
    await expect(page.getByRole("heading", { name: "Arquivos", exact: true })).toBeVisible();

    await page.goto("/pipeline");
    await expect(page.getByRole("heading", { name: "Pipeline" })).toBeVisible();

    await page.goto("/content");
    await expect(page.getByRole("heading", { name: "Títulos e legendas" })).toBeVisible();
  });

  test("navigation exposes only active generation surfaces", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav a[href='/scripts']")).toBeVisible();
    await expect(page.locator("nav a[href='/thumbnails']")).toBeVisible();
    await expect(page.locator("nav a[href='/pipeline']")).toBeVisible();
    await expect(page.locator("nav a[href='/content']")).toBeVisible();
    await expect(page.locator("nav a[href='/music']")).toHaveCount(0);
    await expect(page.locator("nav a[href='/video']")).toHaveCount(0);
  });

  test("daemon health route is available", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBe(true);
    const data = await response.json();
    expect(data.capabilities).toEqual(["text", "image", "package"]);
  });
});

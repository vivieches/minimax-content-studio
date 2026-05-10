import { test, expect } from "@playwright/test";

test.describe("MiniMax Dashboard - Smoke Tests", () => {
  test("All pages load correctly", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Open Studio/);
    
    await page.goto("/scripts");
    await expect(page).toHaveTitle(/Script Generator/);
    await expect(page.locator("text=Describe your video idea")).toBeVisible();
    
    await page.goto("/thumbnails");
    await expect(page).toHaveTitle(/Thumbnail Generator/);
    
    await page.goto("/music");
    await expect(page).toHaveTitle(/Music Generator/);
    
    await page.goto("/assets");
    await expect(page).toHaveTitle(/Assets/);
    
    await page.goto("/pipeline");
    await expect(page).toHaveTitle(/Pipeline/);
  });

  test("Navigation has correct links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav a[href='/video']")).toHaveCount(0);
    await expect(page.locator("nav a[href='/scripts']")).toBeVisible();
    await expect(page.locator("nav a[href='/thumbnails']")).toBeVisible();
    await expect(page.locator("nav a[href='/music']")).toBeVisible();
  });

  test("Script page has generate button", async ({ page }) => {
    await page.goto("/scripts");
    await expect(page.locator("button").filter({ hasText: /Generate Script|Gerar Roteiro/i }).first()).toBeVisible();
  });
});

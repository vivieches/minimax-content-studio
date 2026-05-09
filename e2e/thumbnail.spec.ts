import { test, expect } from "@playwright/test";

test.describe("Thumbnail Generator", () => {
  test("should load thumbnail page without hydration errors", async ({ page }) => {
    // Navigate to thumbnails page
    await page.goto("/thumbnails");
    
    // Wait for page to load
    await page.waitForSelector("h1:has-text('Thumbnail Generator')");
    
    // Check console for errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });
    
    // Fill form fields
    await page.fill('input[placeholder*="Ex: MiniMax"]', "AI Tools for Developers");
    await page.fill('input[placeholder="5 AI Tools in 2024"]', "Best AI Tools 2024");
    await page.fill('input[placeholder*="FÁBRICA"]', "MUST HAVE");
    
    // Wait a bit for any hydration to complete
    await page.waitForTimeout(1000);
    
    // Check no hydration errors occurred
    const hydrationErrors = consoleErrors.filter(e => 
      e.includes("hydrat") || 
      e.includes("insertBefore") || 
      e.includes("does not match") ||
      e.includes("Algo salió mal")
    );
    
    expect(hydrationErrors).toHaveLength(0);
    
    // Take screenshot for verification
    await page.screenshot({ path: "e2e/screenshots/thumbnail-form-filled.png" });
  });
  
  test("should click Generate Prompt without errors", async ({ page }) => {
    await page.goto("/thumbnails");
    await page.waitForSelector("h1:has-text('Thumbnail Generator')");
    
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });
    
    // Fill required fields
    await page.fill('input[placeholder*="Ex: MiniMax"]', "AI Tools for Developers");
    await page.fill('input[placeholder="5 AI Tools in 2024"]', "Best AI Tools 2024");
    await page.fill('input[placeholder*="FÁBRICA"]', "MUST HAVE");
    
    // Click Generate Prompt
    await page.click('button:has-text("Generate Prompt")');
    
    // Wait for loading or result
    await page.waitForTimeout(3000);
    
    // Check for specific error
    const hasInsertBeforeError = consoleErrors.some(e => 
      e.includes("insertBefore") || e.includes("Algo salió mal")
    );
    
    expect(hasInsertBeforeError).toBe(false);
    
    await page.screenshot({ path: "e2e/screenshots/thumbnail-after-generate-prompt.png" });
  });

  test("should handle image upload without payload errors", async ({ page }) => {
    await page.goto("/thumbnails");
    await page.waitForSelector("h1:has-text('Thumbnail Generator')");

    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Fill required fields
    await page.fill('input[placeholder*="Ex: MiniMax"]', "AI Tools for Developers");
    await page.fill('input[placeholder="5 AI Tools in 2024"]', "Best AI Tools 2024");
    await page.fill('input[placeholder*="FÁBRICA"]', "MUST HAVE");

    // Click Generate Prompt
    await page.click('button:has-text("Generate Prompt")');
    await page.waitForTimeout(3000);

    // Check no payload errors
    const hasPayloadError = consoleErrors.some(e => 
      e.includes("Payload too large") || e.includes("413")
    );

    expect(hasPayloadError).toBe(false);

    // Click Generate Image from Prompt
    await page.click('button:has-text("Generate Image from Prompt")');
    await page.waitForTimeout(3000);

    // Check for thumbnail generation (may fail due to no API key, but not payload error)
    const hasPayloadErrorAfterImage = consoleErrors.some(e => 
      e.includes("Payload too large") || e.includes("413")
    );

    expect(hasPayloadErrorAfterImage).toBe(false);

    await page.screenshot({ path: "e2e/screenshots/thumbnail-after-generate-image.png" });
  });
});

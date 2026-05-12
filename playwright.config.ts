import { defineConfig, devices } from "@playwright/test";
import { mkdirSync, rmSync } from "fs";
import path from "path";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3107);
const host = process.env.PLAYWRIGHT_HOST ?? "127.0.0.1";
const baseURL = `http://${host}:${port}`;
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER === "true";
const e2eDataDir = path.resolve(process.cwd(), ".open-studio-test", "playwright");

if (!reuseExistingServer) {
  rmSync(e2eDataDir, { recursive: true, force: true });
  mkdirSync(e2eDataDir, { recursive: true });
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // Sequential to avoid rate limiting
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to avoid API rate limits
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run dev -- --hostname ${host} --port ${port}`,
    url: baseURL,
    reuseExistingServer,
    env: {
      OPEN_STUDIO_DATA_DIR: e2eDataDir,
    },
    timeout: 120000,
  },
});

import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 430, height: 932 },
    launchOptions: {
      executablePath: process.env.CHROME_PATH ?? "/opt/google/chrome/chrome",
      args: [
        "--no-sandbox",
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
    },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/serve-preview.mjs",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 30000,
  },
});

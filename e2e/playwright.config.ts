import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "npm run build -w server && npm run start -w server",
      url: "http://localhost:3000/api",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      cwd: "..",
    },
    {
      command:
        "npm run build -w client && npm run preview -w client -- --port 5173",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      cwd: "..",
    },
  ],
});

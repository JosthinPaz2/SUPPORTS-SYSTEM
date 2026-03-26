import { defineConfig } from "cypress";

const frontendUrl = process.env.CYPRESS_FRONTEND_URL ?? "http://127.0.0.1:5173";
const backendUrl =
  process.env.CYPRESS_BACKEND_URL ??
  "http://127.0.0.1:8000";

export default defineConfig({
  e2e: {
    baseUrl: frontendUrl,
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    video: true,
    screenshotsFolder: "cypress/screenshots",
    videosFolder: "cypress/videos",
    defaultCommandTimeout: 15000, // Aumentado para formularios complejos
    requestTimeout: 12000,
    responseTimeout: 12000,
    env: {
      frontendUrl,
      backendUrl,
      blockExternalApi: false,
      slowMode: true,
      slowMs: 1200,
      slowSuiteStartMs: 1500,
    },
  },
});

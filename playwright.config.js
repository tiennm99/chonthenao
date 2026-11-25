import { defineConfig } from '@playwright/test';

// Runs against the built site (`npm run build` first), so the production CSP applies.
// Set PW_CHANNEL=chrome to use an installed Chrome instead of Playwright's Chromium.
export default defineConfig({
  testDir: 'e2e',
  webServer: {
    command: 'npm run preview -- --port 4319 --strictPort',
    url: 'http://localhost:4319/',
    reuseExistingServer: false,
  },
  use: {
    baseURL: 'http://localhost:4319',
    ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}),
  },
});

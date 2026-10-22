import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 40_000,
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [{
    name: 'edge',
    use: { ...devices['Desktop Edge'], channel: 'msedge', viewport: { width: 1440, height: 900 } },
  }],
  webServer: {
    command: `"${process.execPath}" node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4173 --configLoader runner`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});

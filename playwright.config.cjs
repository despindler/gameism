const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

const port = Number(process.env.PLAYWRIGHT_PORT || 8091);
const baseURL = `http://127.0.0.1:${port}`;

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  globalSetup: require.resolve('./tests/e2e/global-setup.cjs'),
  webServer: {
    command: `php -S 127.0.0.1:${port} -t site site/index.php`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 15_000,
    env: {
      GAMEISM_ENV_FILE: path.join(__dirname, 'site', '.env.test'),
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});


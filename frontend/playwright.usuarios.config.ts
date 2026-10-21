import { defineConfig } from '@playwright/test';
import { opcionesNavegador } from './playwright.navegador';

export default defineConfig({
  testDir: './tests/usuarios', workers: 1, timeout: 45000,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3100',
    launchOptions: opcionesNavegador(),
    screenshot: 'only-on-failure', trace: 'retain-on-failure',
  },
  webServer: [
    { command: 'npm run dev --prefix ../backend', url: 'http://127.0.0.1:3001/api/v1/usuarios/me', timeout: 120000, env: { APP_ORIGIN: 'http://127.0.0.1:3100', NODE_ENV: 'test', PORT: '3001' }, reuseExistingServer: false },
    { command: `"${process.execPath}" node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3100`, url: 'http://127.0.0.1:3100', timeout: 120000, reuseExistingServer: false },
  ],
});

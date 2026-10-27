import { defineConfig } from '@playwright/test';
import config from './playwright.usuarios.config';
// Usa los mismos puertos que las otras E2E: ejecutar las suites secuencialmente.
export default defineConfig({
  ...config, testDir: './tests/reservas', timeout: 90000,
  use: { ...config.use, baseURL: 'http://127.0.0.1:3100' },
  webServer: [
    { command: 'npm run start --prefix ../backend', url: 'http://127.0.0.1:3001/api/v1/usuarios/me', timeout: 120000,
      env: { APP_ORIGIN: 'http://127.0.0.1:3100', NODE_ENV: 'test', PORT: '3001' }, reuseExistingServer: false },
    { command: `"${process.execPath}" node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3100`, url: 'http://127.0.0.1:3100', timeout: 120000, reuseExistingServer: false },
  ],
});

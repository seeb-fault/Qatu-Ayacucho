import { defineConfig } from '@playwright/test';
import { opcionesNavegador } from './playwright.navegador';
// Almacén de archivos en memoria (013): las subidas y descargas recorren el camino del almacén externo sin salir a internet.
// Puerto del backend de prueba; en CI es 3001. Localmente puede cambiarse si 3001 está ocupado (el frontend debe compilarse con QATU_API_URL igual).
const API_PORT = process.env.QATU_E2E_API_PORT ?? '3001';

export default defineConfig({
  testDir: './tests/usuarios', workers: 1, timeout: 45000,
  reporter: [['list']],
  expect: { timeout: 10000 },
  use: {
    baseURL: 'http://127.0.0.1:3100',
    launchOptions: opcionesNavegador(),
    screenshot: 'only-on-failure', trace: 'retain-on-failure',
  },
  webServer: [
    { command: 'npm run start --prefix ../backend', url: `http://127.0.0.1:${API_PORT}/api/v1/usuarios/me`, timeout: 120000, env: { APP_ORIGIN: 'http://127.0.0.1:3100', NODE_ENV: 'test', PORT: API_PORT, QATU_ALMACEN: 'memoria' }, reuseExistingServer: false },
    { command: `"${process.execPath}" node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3100`, url: 'http://127.0.0.1:3100', timeout: 120000, reuseExistingServer: false },
  ],
});

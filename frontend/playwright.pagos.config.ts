import { defineConfig } from '@playwright/test';
import config from './playwright.reservas.config';
// Usa los mismos puertos que las otras E2E: ejecutar las suites secuencialmente.
export default defineConfig({ ...config, testDir: './tests/pagos' });

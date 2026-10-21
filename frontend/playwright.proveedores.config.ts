import { defineConfig } from '@playwright/test';
import usuariosConfig from './playwright.usuarios.config';

export default defineConfig({ ...usuariosConfig, testDir: './tests/proveedores' });

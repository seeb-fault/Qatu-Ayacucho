import {defineConfig} from '@playwright/test';
import config from './playwright.usuarios.config';
export default defineConfig({...config,testDir:'./tests/catalogo',timeout:90000});

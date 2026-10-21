import {defineConfig} from '@playwright/test';
import { opcionesNavegador } from './playwright.navegador';
const port=Number(process.env.QATU_TEST_PORT??3001);
const baseURL='http://127.0.0.1:'+port;
export default defineConfig({testDir:'./tests',projects:[{name:'descubrimiento',testDir:'./tests/descubrimiento'}],fullyParallel:false,workers:1,timeout:45000,expect:{timeout:10000},reporter:[['list']],webServer:{command:'"'+process.execPath+'" node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port '+port,url:baseURL,reuseExistingServer:false,timeout:120000},use:{baseURL,viewport:{width:1440,height:1050},launchOptions:opcionesNavegador(),trace:'retain-on-failure',screenshot:'only-on-failure'}});

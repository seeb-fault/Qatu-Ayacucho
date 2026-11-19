import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { crearApp } from '../src/app';
import { crearDocumento } from '../src/shared/infraestructura/documentacion-api';

/**
 * Genera el contrato OpenAPI de la API (014) en docs/03-diseño-de-software/diseño-externo/openapi.json.
 * - npm run openapi              escribe el archivo.
 * - npm run openapi -- --comprobar  falla si el archivo no coincide con el código (lo usa el CI).
 * No se conecta a la base: solo recorre los controladores. Por eso acepta valores de relleno si faltan variables.
 */
export const RUTA_CONTRATO = resolve(__dirname, '../../docs/03-diseño-de-software/diseño-externo/openapi.json');

export async function generarContrato(): Promise<string> {
  process.env.DATABASE_URL ??= 'postgresql://openapi@127.0.0.1:1/sin-conexion';
  process.env.JWT_SECRET ??= 'solo-para-generar-el-contrato-openapi-sin-conexion';
  process.env.QATU_DOCS = '0';
  const app = await crearApp();
  try { return JSON.stringify(crearDocumento(app), null, 2) + '\n'; } finally { await app.close(); }
}

async function principal() {
  const contrato = await generarContrato();
  if (process.argv.includes('--comprobar')) {
    const actual = await readFile(RUTA_CONTRATO, 'utf8').catch(() => '');
    if (actual.replace(/\r\n/g, '\n') !== contrato) {
      console.error('openapi.json no coincide con los controladores. Ejecuta: npm run openapi');
      process.exitCode = 1;
      return;
    }
    console.log('openapi.json al día.');
    return;
  }
  await writeFile(RUTA_CONTRATO, contrato);
  console.log('Contrato OpenAPI escrito en docs/03-diseño-de-software/diseño-externo/openapi.json');
}

if (require.main === module) principal().catch(error => { console.error('No se pudo generar el contrato OpenAPI:', error instanceof Error ? error.message : error); process.exitCode = 1; });

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';

// Se carga antes de cada archivo de prueba (npm test, Jest setupFiles).
// 1. Como --env-file-if-exists: lee backend/.env si existe, sin pisar variables ya definidas (las del CI o de la terminal).
const archivo = resolve(__dirname, '../.env');
if (existsSync(archivo)) {
  for (const [nombre, valor] of Object.entries(parseEnv(readFileSync(archivo, 'utf8')))) process.env[nombre] ??= valor;
}
// 2. Aunque el .env de desarrollo pida R2, las pruebas nunca salen a internet: usan PostgreSQL salvo que una prueba
//    elija otro almacén de forma explícita (por ejemplo, memoria).
process.env.QATU_ALMACEN = process.env.QATU_ALMACEN_PRUEBAS ?? 'postgres';

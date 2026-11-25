// Pruebas de contrato y reglas de negocio de la API con Bruno (Sprint 2, spec 014 etapa 2).
// 1. Crea en una base _test un proveedor aprobado con una oferta de servicio y un cliente (fixture de reservas).
// 2. Arranca la API compilada (backend/dist) en el puerto 3403.
// 3. Corre la colección docs/06-pruebas-atributos-calidad/bruno con el entorno "ci" y deja los reportes HTML, JSON y
//    JUnit en bruno/reportes/. Los reportes omiten cookies y cuerpos de petición: no guardan sesiones ni contraseñas.
// Uso (desde la raíz, con el backend compilado): DATABASE_URL=postgresql://…/<base>_test node docs/06-pruebas-atributos-calidad/scripts/bruno.mjs
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const BACKEND = join(RAIZ, 'backend'), COLECCION = join(RAIZ, 'docs/06-pruebas-atributos-calidad/bruno'), REPORTES = join(COLECCION, 'reportes');
const PUERTO = '3403', ORIGEN = 'http://127.0.0.1:3100';
if (!process.env.DATABASE_URL || !new URL(process.env.DATABASE_URL).pathname.endsWith('_test')) throw new Error('DATABASE_URL debe apuntar a una base con sufijo _test.');

const env = { ...process.env, PORT: PUERTO, APP_ORIGIN: ORIGEN, NODE_ENV: 'test', QATU_DESPACHO_EVENTOS: 'inactivo', QATU_PAGOS: 'doble',
  JWT_SECRET: process.env.JWT_SECRET ?? 'secreto-exclusivo-de-la-coleccion-bruno-qatu-2026', QATU_E2E_RESERVAS: '1' };
const fixture = JSON.parse(execFileSync(process.execPath, ['--import', 'tsx', 'test/reservas/fixture-e2e.ts', '--servicio'], { cwd: BACKEND, env, encoding: 'utf8' }));

const api = spawn(process.execPath, ['dist/main.js'], { cwd: BACKEND, env, stdio: 'ignore' });
let codigo = 1;
try {
  for (let i = 0; ; i++) {
    try { if ((await fetch(`http://127.0.0.1:${PUERTO}/api/v1/salud`)).ok) break; } catch {}
    if (i > 60) throw new Error('La API no respondió.');
    await new Promise(r => setTimeout(r, 1000));
  }
  mkdirSync(REPORTES, { recursive: true });
  const variables = { clienteEmail: fixture.clienteEmail, proveedorEmail: fixture.proveedorEmail, fixturePassword: fixture.password, publicacionId: fixture.publicacionId, recursoId: fixture.recursoId };
  const bru = join(BACKEND, 'node_modules', '@usebruno', 'cli', 'bin', 'bru.js');
  const args = ['run', '--env', 'ci', '--disable-cookies', ...Object.entries(variables).flatMap(([k, v]) => ['--env-var', `${k}=${v}`]),
    '--reporter-html', join(REPORTES, 'reporte.html'), '--reporter-json', join(REPORTES, 'reporte.json'), '--reporter-junit', join(REPORTES, 'reporte.xml'),
    '--reporter-skip-headers', 'Cookie', 'Set-Cookie', '--reporter-skip-request-body'];
  const proceso = spawn(process.execPath, [bru, ...args], { cwd: COLECCION, stdio: 'inherit' });
  codigo = await new Promise(r => proceso.on('close', r));
} finally {
  api.kill();
}
process.exitCode = codigo;

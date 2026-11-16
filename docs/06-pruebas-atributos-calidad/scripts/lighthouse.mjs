// Lighthouse sobre la build de producción (frontend 3100 → backend 3401) con datos de prueba reales.
// Guarda el reporte HTML de cada página y un resumen con puntajes y métricas de carga.
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Tercer argumento opcional: subcarpeta de la corrida (por ejemplo, 02-tras-correcciones).
const RAIZ = process.argv[2], OUT = join(RAIZ, 'docs/06-pruebas-atributos-calidad/lighthouse', process.argv[4] ?? '');
const LH = process.argv[3];
const WEB = 'http://127.0.0.1:3100', API = 'http://127.0.0.1:3401';
mkdirSync(OUT, { recursive: true });
const BASE = `qatu_lighthouse_${Date.now()}_test`;
const psql = sql => execFileSync('docker', ['exec', 'qatu-local-db-1', 'psql', '-U', 'qatu', '-d', 'postgres', '-qc', sql], { stdio: 'inherit' });
psql(`CREATE DATABASE ${BASE}`);
execFileSync('docker', ['exec', 'qatu-local-db-1', 'psql', '-U', 'qatu', '-d', BASE, '-qc', 'CREATE EXTENSION IF NOT EXISTS postgis'], { stdio: 'ignore' });
const env = { ...process.env, DATABASE_URL: `postgresql://qatu:qatu_local@127.0.0.1:5433/${BASE}`, JWT_SECRET: 'secreto-lighthouse-calidad-qatu-2026-medicion', APP_ORIGIN: WEB,
  NODE_ENV: 'test', QATU_DESPACHO_EVENTOS: 'inactivo', QATU_PAGOS: 'doble', PORT: '3401', QATU_E2E_RESERVAS: '1' };
const back = join(RAIZ, 'backend'), front = join(RAIZ, 'frontend');
execFileSync('npm', ['run', '-s', 'migrate'], { cwd: back, env, shell: true, stdio: 'inherit' });
const f = JSON.parse(execFileSync(process.execPath, ['--import', 'tsx', 'test/reservas/fixture-e2e.ts'], { cwd: back, env, encoding: 'utf8' }));

const procesos = [
  spawn(process.execPath, ['dist/main.js'], { cwd: back, env, stdio: 'ignore' }),
  spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3100'], { cwd: front, env: { ...process.env, QATU_API_URL: API }, stdio: 'ignore' }),
];
const esperar = async url => { for (let i = 0; i < 90; i++) { try { if ((await fetch(url)).status < 500) return; } catch {} await new Promise(r => setTimeout(r, 1000)); } throw new Error('no responde ' + url); };
const resumen = [];
try {
  await esperar(API + '/api/v1/publicaciones/opciones'); await esperar(WEB);
  const entrar = async email => { const r = await fetch(API + '/api/v1/auth/login', { method: 'POST', headers: { Origin: WEB, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: f.password }) }); return r.headers.get('set-cookie').split(';')[0]; };
  const [cliente, proveedor] = [await entrar(f.clienteEmail), await entrar(f.proveedorEmail)];
  const pedir = (ruta, metodo, cuerpo, cookie) => fetch(API + '/api/v1' + ruta, { method: metodo, headers: { Origin: WEB, 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify(cuerpo) }).then(r => r.json());
  await pedir(`/publicaciones/${f.publicacionId}/ubicacion`, 'PUT', { lat: -13.160227, lng: -74.225762, precision: 'aproximada' }, proveedor);
  const desde = Date.now() + 5 * 86_400_000;
  const s = await pedir('/reservas', 'POST', { publicacionId: f.publicacionId, recursoId: f.recursoId, inicio: new Date(desde).toISOString(), fin: new Date(desde + 2 * 86_400_000).toISOString(), aceptaCondiciones: true, tarifaEsperadaCentimos: 4250 }, cliente);
  await pedir(`/reservas/${s.id}/aceptacion`, 'POST', { versionActual: s.version }, proveedor);
  await pedir('/lista/items', 'POST', { publicacionId: f.publicacionId, recursoId: f.recursoId, inicio: new Date(desde + 9 * 86_400_000).toISOString(), fin: new Date(desde + 10 * 86_400_000).toISOString() }, cliente);
  const cabeceras = join(OUT, '.cabeceras.json'); writeFileSync(cabeceras, JSON.stringify({ Cookie: cliente }));

  const paginas = [
    ['inicio', '/', false], ['busqueda', '/buscar?tipo=herramienta', false], ['detalle-con-mapa', '/publicaciones/' + f.publicacionId, false],
    ['ingresar', '/ingresar', false], ['mi-lista', '/lista', true], ['pago', `/reservas/${s.id}/pago`, true],
  ];
  for (const [nombre, ruta, sesion] of paginas) for (const dispositivo of ['movil', 'escritorio']) {
    const destino = join(OUT, `${nombre}-${dispositivo}`);
    const args = [LH, WEB + ruta, '--quiet', '--output=html', '--output=json', `--output-path=${destino}`, '--chrome-flags=--headless=new',
      '--only-categories=performance,accessibility,best-practices,seo', ...(dispositivo === 'escritorio' ? ['--preset=desktop'] : []), ...(sesion ? [`--extra-headers=${cabeceras}`] : [])];
    execFileSync(process.execPath, args, { cwd: front, stdio: 'ignore', timeout: 180_000 });
    const r = JSON.parse(readFileSync(destino + '.report.json', 'utf8'));
    const ms = id => r.audits[id]?.numericValue ?? null;
    resumen.push({ pagina: nombre, ruta: ruta.replace(f.publicacionId, ':id').replace(s.id, ':id'), dispositivo,
      puntajes: Object.fromEntries(Object.entries(r.categories).map(([k, v]) => [k, Math.round(v.score * 100)])),
      metricas: { FCP_ms: Math.round(ms('first-contentful-paint')), LCP_ms: Math.round(ms('largest-contentful-paint')), TBT_ms: Math.round(ms('total-blocking-time')), CLS: Number((ms('cumulative-layout-shift') ?? 0).toFixed(3)), SI_ms: Math.round(ms('speed-index')) } });
    rmSync(destino + '.report.json');
    console.log(nombre, dispositivo, JSON.stringify(resumen.at(-1).puntajes), 'LCP', resumen.at(-1).metricas.LCP_ms);
  }
  rmSync(cabeceras);
  writeFileSync(join(OUT, 'resumen.json'), JSON.stringify({ fecha: new Date().toISOString(), herramienta: 'Lighthouse 12.6.1 (Chrome sin interfaz)', entorno: 'Windows, build de producción local (next start) y backend local con base _test', resultados: resumen }, null, 2) + '\n');
} finally {
  for (const p of procesos) p.kill();
  psql(`DROP DATABASE IF EXISTS ${BASE} WITH (FORCE)`);
}

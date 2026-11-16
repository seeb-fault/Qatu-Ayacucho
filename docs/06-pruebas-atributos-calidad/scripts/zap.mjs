// AC04 Seguridad: OWASP ZAP en Docker contra la build de producción local (frontend 3100 → backend 3401) con una base _test nueva.
// Escaneos: pasivo sin sesión (baseline), activo sin sesión y activo con la sesión de un cliente sintético.
// Requiere el frontend compilado con QATU_API_URL=http://127.0.0.1:3401.
// Uso: node docs/06-pruebas-atributos-calidad/scripts/zap.mjs "$(pwd)" [minutos por escaneo activo]
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = process.argv[2], MINUTOS = process.argv[3] ?? '10';
const OUT = join(RAIZ, 'docs/06-pruebas-atributos-calidad/zap', process.argv[4] ?? ''); // argv[4]: subcarpeta de la corrida
mkdirSync(OUT, { recursive: true });
// ZAP (en Docker) entra por host.docker.internal: ese es el origen que el backend debe aceptar.
const WEB_LOCAL = 'http://127.0.0.1:3100', API = 'http://127.0.0.1:3401', OBJETIVO = 'http://host.docker.internal:3100';
const BASE = `qatu_zap_${Date.now()}_test`;
const psql = (sql, base = 'postgres') => execFileSync('docker', ['exec', 'qatu-local-db-1', 'psql', '-U', 'qatu', '-d', base, '-qc', sql], { stdio: 'ignore' });
psql(`CREATE DATABASE ${BASE}`); psql('CREATE EXTENSION IF NOT EXISTS postgis', BASE);
const env = { ...process.env, DATABASE_URL: `postgresql://qatu:qatu_local@127.0.0.1:5433/${BASE}`, JWT_SECRET: 'secreto-zap-calidad-qatu-2026-solo-local-abcdef', APP_ORIGIN: OBJETIVO,
  NODE_ENV: 'test', QATU_DESPACHO_EVENTOS: 'inactivo', QATU_PAGOS: 'doble', PORT: '3401', QATU_E2E_RESERVAS: '1' };
const back = join(RAIZ, 'backend'), front = join(RAIZ, 'frontend');
const procesos = [];
try {
  execFileSync('npm', ['run', '-s', 'migrate'], { cwd: back, env, shell: true, stdio: 'inherit' });
  // Compila el backend para escanear el código actual, no un dist/ anterior.
  execFileSync('npm', ['run', '-s', 'build'], { cwd: back, env, shell: true, stdio: 'inherit' });
  const f = JSON.parse(execFileSync(process.execPath, ['--import', 'tsx', 'test/reservas/fixture-e2e.ts'], { cwd: back, env, encoding: 'utf8' }));
  procesos.push(spawn(process.execPath, ['dist/main.js'], { cwd: back, env, stdio: 'ignore' }));
  procesos.push(spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3100'], { cwd: front, env: { ...process.env, QATU_API_URL: API }, stdio: 'ignore' }));
  for (const url of [API + '/api/v1/publicaciones/opciones', WEB_LOCAL]) for (let i = 0; ; i++) { try { if ((await fetch(url)).status < 500) break; } catch {} if (i > 90) throw new Error('no responde ' + url); await new Promise(r => setTimeout(r, 1000)); }
  const login = await fetch(API + '/api/v1/auth/login', { method: 'POST', headers: { Origin: OBJETIVO, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: f.clienteEmail, password: f.password }) });
  const cookie = login.headers.get('set-cookie').split(';')[0];

  const wrk = execFileSync('cygpath', ['-w', OUT], { encoding: 'utf8' }).trim();
  const zap = (nombre, script, extra = []) => {
    console.log(`== ZAP: ${nombre}`);
    const r = spawnSync('docker', ['run', '--rm', '-v', `${wrk}:/zap/wrk:rw`, '-t', 'zaproxy/zap-stable', script, '-t', OBJETIVO, '-r', `${nombre}.html`, '-J', `${nombre}.json`, '-w', `${nombre}.md`, '-I', ...extra],
      { env: { ...process.env, MSYS_NO_PATHCONV: '1' }, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    writeFileSync(join(OUT, `${nombre}.txt`), (r.stdout ?? '') + (r.stderr ?? ''));
    console.log((r.stdout ?? '').split('\n').filter(l => /^FAIL|^WARN-NEW|^PASS: \d|FAIL-NEW|WARN-NEW:|PASS:/.test(l)).slice(-3).join('\n'));
  };
  zap('1-pasivo-sin-sesion', 'zap-baseline.py', ['-j']);
  zap('2-activo-sin-sesion', 'zap-full-scan.py', ['-m', MINUTOS]);
  // Con sesión: ZAP agrega la cookie del cliente a cada petición (regla de reemplazo).
  zap('3-activo-con-sesion', 'zap-full-scan.py', ['-m', MINUTOS, '-z',
    `-config replacer.full_list(0).description=sesion -config replacer.full_list(0).enabled=true -config replacer.full_list(0).matchtype=REQ_HEADER -config replacer.full_list(0).matchstr=Cookie -config replacer.full_list(0).regex=false -config replacer.full_list(0).replacement=${cookie}`]);
  // El token de la sesión sintética no se guarda en los reportes (aunque su base y su secreto se descartan al terminar).
  const token = cookie.split('=')[1];
  for (const a of readdirSync(OUT, { withFileTypes: true }).filter(e => e.isFile()).map(e => e.name)) { const p = join(OUT, a), t = readFileSync(p, 'utf8'); if (t.includes(token)) writeFileSync(p, t.split(token).join('<token-de-prueba>')); }
} finally {
  for (const p of procesos) p.kill();
  psql(`DROP DATABASE IF EXISTS ${BASE} WITH (FORCE)`);
}

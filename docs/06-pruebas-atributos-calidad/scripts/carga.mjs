// Prueba de carga local (AC01, AC03): base _test nueva con datos sintéticos, backend en 3402 y k6 en Docker.
// Registra el resultado de k6 y el uso de CPU y memoria del backend y de PostgreSQL durante la prueba.
// Uso: node docs/06-pruebas-atributos-calidad/scripts/carga.mjs "$(pwd)" [--rapido]
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, appendFileSync } from 'node:fs';
import { cpus, totalmem, release } from 'node:os';
import { join } from 'node:path';

const RAIZ = process.argv[2], RAPIDO = process.argv.includes('--rapido');
const OUT = join(RAIZ, 'docs/06-pruebas-atributos-calidad/carga'), SCRIPTS = join(RAIZ, 'docs/06-pruebas-atributos-calidad/scripts');
mkdirSync(OUT, { recursive: true });
const PUERTO = '3402', API = 'http://127.0.0.1:' + PUERTO;
const BASE = `qatu_carga_${Date.now()}_test`;
const psql = (sql, base = 'postgres') => execFileSync('docker', ['exec', 'qatu-local-db-1', 'psql', '-U', 'qatu', '-d', base, '-tAqc', sql], { encoding: 'utf8' }).trim();
psql(`CREATE DATABASE ${BASE}`);
psql('CREATE EXTENSION IF NOT EXISTS postgis', BASE);
const env = { ...process.env, DATABASE_URL: `postgresql://qatu:qatu_local@127.0.0.1:5433/${BASE}`, JWT_SECRET: 'secreto-prueba-de-carga-qatu-2026-solo-local-xyz', APP_ORIGIN: 'http://127.0.0.1:3100',
  NODE_ENV: 'test', QATU_DESPACHO_EVENTOS: 'inactivo', QATU_PAGOS: 'doble', PORT: PUERTO };
const back = join(RAIZ, 'backend');
const tmp = join(OUT, '.tmp'); mkdirSync(tmp, { recursive: true });
let backend, muestreo;
try {
  execFileSync('npm', ['run', '-s', 'migrate'], { cwd: back, env, shell: true, stdio: 'inherit' });
  execFileSync('npm', ['run', '-s', 'build'], { cwd: back, env, shell: true, stdio: 'inherit' }); // mide el código actual
  console.log('Generando datos sintéticos (100 proveedores, 1 000 publicaciones, 5 000 reservas)...');
  const datos = execFileSync(process.execPath, ['--import', 'tsx', 'test/carga/datos-carga.ts'], { cwd: back, env, encoding: 'utf8' });
  writeFileSync(join(tmp, 'datos.json'), datos);
  const conteo = psql("SELECT (SELECT count(*) FROM catalogo_publicaciones)||' publicaciones, '||(SELECT count(*) FROM proveedores)||' proveedores, '||(SELECT count(*) FROM reservas)||' reservas'", BASE);
  console.log('Datos:', conteo);

  backend = spawn(process.execPath, ['dist/main.js'], { cwd: back, env, stdio: 'ignore' });
  for (let i = 0; ; i++) { try { if ((await fetch(API + '/api/v1/publicaciones/opciones')).ok) break; } catch {} if (i > 60) throw new Error('El backend no respondió'); await new Promise(r => setTimeout(r, 1000)); }

  // Muestreo de recursos cada 5 s: CPU y memoria del proceso del backend, y CPU, memoria y conexiones de PostgreSQL.
  const recursos = join(OUT, 'recursos.csv');
  writeFileSync(recursos, 'hora,backend_cpu_s,backend_memoria_mb,postgres_cpu,postgres_memoria,conexiones\n');
  let previo = null;
  muestreo = setInterval(() => {
    try {
      const p = JSON.parse(execFileSync('powershell', ['-NoProfile', '-Command', `Get-Process -Id ${backend.pid} | Select-Object CPU,WorkingSet64 | ConvertTo-Json`], { encoding: 'utf8' }));
      const [cpu, mem] = execFileSync('docker', ['stats', '--no-stream', '--format', '{{.CPUPerc}};{{.MemUsage}}', 'qatu-local-db-1'], { encoding: 'utf8' }).trim().split(';');
      const conexiones = psql(`SELECT count(*) FROM pg_stat_activity WHERE datname='${BASE}'`);
      appendFileSync(recursos, `${new Date().toISOString()},${p.CPU.toFixed(1)},${(p.WorkingSet64 / 1048576).toFixed(0)},${cpu},${mem.split('/')[0].trim()},${conexiones}\n`);
      previo = p;
    } catch {}
  }, 5000);

  const vol = p => execFileSync('cygpath', ['-w', p], { encoding: 'utf8' }).trim();
  const args = ['run', '--rm', '-v', `${vol(SCRIPTS)}:/scripts:ro`, '-v', `${vol(tmp)}:/datos:ro`, '-v', `${vol(OUT)}:/salida`, 'grafana/k6', 'run',
    '-e', `API=http://host.docker.internal:${PUERTO}`, '-e', 'DATOS=/datos/datos.json', '-e', 'ORIGEN=http://127.0.0.1:3100', '-e', 'SALIDA=/salida/resumen-k6.json', ...(RAPIDO ? ['-e', 'RAPIDO=1'] : []),
    '--quiet', '/scripts/carga.k6.js'];
  const k6 = spawn('docker', args, { env: { ...process.env, MSYS_NO_PATHCONV: '1' }, stdio: ['ignore', 'pipe', 'inherit'] });
  let salida = ''; k6.stdout.on('data', b => { salida += b; process.stdout.write(b); });
  const codigo = await new Promise(r => k6.on('close', r));
  writeFileSync(join(OUT, 'k6.txt'), salida);
  writeFileSync(join(OUT, 'entorno.json'), JSON.stringify({ fecha: new Date().toISOString(), cpu: cpus()[0].model, nucleos: cpus().length, memoria_gb: Math.round(totalmem() / 1e9), windows: release(),
    node: process.version, k6: execFileSync('docker', ['run', '--rm', 'grafana/k6', 'version'], { encoding: 'utf8' }).trim(), postgres: psql('SHOW server_version'), datos: conteo,
    nota: 'k6 corre en Docker y llega al backend local por host.docker.internal; backend con un solo proceso de Node y pool de PostgreSQL por defecto.', codigo_k6: codigo }, null, 2) + '\n');
  console.log('k6 terminó con código', codigo, '(99 = alguna meta no se cumplió)');
} finally {
  clearInterval(muestreo); backend?.kill();
  rmSync(tmp, { recursive: true, force: true });
  psql(`DROP DATABASE IF EXISTS ${BASE} WITH (FORCE)`);
}

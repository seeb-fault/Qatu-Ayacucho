import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { Pool } from 'pg';
import { crearApp } from '../../src/app';
import { direccionEscucha, proxiesConfiables } from '../../src/shared/infraestructura/proxies';
import { test } from '@jest/globals';
import { caso } from '../caso';

test('QATU_PROXIES_CONFIABLES: solo valores que no confían en cualquier cabecera', () => {
  assert.equal(proxiesConfiables(undefined), null);
  assert.equal(proxiesConfiables('  '), null);
  assert.deepEqual(proxiesConfiables('loopback'), ['loopback']);
  assert.deepEqual(proxiesConfiables('loopback, 10.0.0.0/8, 172.18.0.2, ::1, fd00::/8'), ['loopback', '10.0.0.0/8', '172.18.0.2', '::1', 'fd00::/8']);
  for (const malo of ['true', '1', '*', 'todos', '10.0.0.0/33', '300.1.1.1', 'loopback,,true', '10.0.0.0/8/1']) assert.throws(() => proxiesConfiables(malo), /QATU_PROXIES_CONFIABLES/, malo);
});

test('QATU_HOST: por defecto solo la propia máquina; en Docker, 0.0.0.0', () => {
  assert.equal(direccionEscucha(undefined), '127.0.0.1');
  assert.equal(direccionEscucha(''), '127.0.0.1');
  assert.equal(direccionEscucha(' 0.0.0.0 '), '0.0.0.0');
  assert.equal(direccionEscucha('::'), '::');
  for (const malo of ['localhost', 'api.qatu.pe', '0.0.0.0:3001', '*']) assert.throws(() => direccionEscucha(malo), /QATU_HOST/, malo);
});

test('Dokploy: con uniquelocal, la IP es la que escribió Traefik aunque llegue por la red de Docker', async () => {
  // Visitante → Traefik (agrega la IP real) → web → API. Las IP privadas de Docker se saltan; una IP falsa a la izquierda se ignora.
  assert.equal(await ipVista(['uniquelocal', 'loopback'], '1.2.3.4, 198.51.100.9, 10.0.1.7'), '198.51.100.9');
});

/** Servidor mínimo que responde la IP que ve Express con la configuración dada. */
async function ipVista(confianza: string[] | null, cabecera?: string) {
  const app = express();
  if (confianza) app.set('trust proxy', confianza);
  app.get('/', (req, res) => { res.send(req.ip); });
  const servidor = app.listen(0, '127.0.0.1');
  await new Promise(r => servidor.once('listening', r));
  try {
    const r = await fetch(`http://127.0.0.1:${(servidor.address() as AddressInfo).port}/`, { headers: cabecera ? { 'X-Forwarded-For': cabecera } : {} });
    return (await r.text()).replace(/^::ffff:/, '');
  } finally { servidor.close(); }
}

test('sin configurar, X-Forwarded-For se ignora y nadie puede falsificar su IP', async () => {
  assert.equal(await ipVista(null, '203.0.113.7'), '127.0.0.1');
});

test('con loopback, la IP es la que escribió el proxy inverso, aun si el visitante mandó otra', async () => {
  // Nginx con $proxy_add_x_forwarded_for agrega la IP real al final: Express toma la última no confiable.
  assert.equal(await ipVista(['loopback'], '198.51.100.9'), '198.51.100.9');
  assert.equal(await ipVista(['loopback'], '1.2.3.4, 198.51.100.9'), '198.51.100.9');
  // Sin cabecera (nadie delante), sigue siendo la conexión local.
  assert.equal(await ipVista(['loopback']), '127.0.0.1');
});

(!process.env.TEST_DATABASE_URL ? test.skip : test)('límite de inicio de sesión por visitante detrás del proxy, con PostgreSQL real', async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.JWT_SECRET = 'secreto-exclusivo-proxies-pruebas-2026-qatu'; process.env.APP_ORIGIN = 'http://127.0.0.1:3000';
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const ipA = `203.0.113.${10 + Math.floor(Math.random() * 200)}`, ipB = `198.51.100.${10 + Math.floor(Math.random() * 200)}`;
  await pool.query("DELETE FROM limites_acceso WHERE clave IN ($1, $2, 'ip:127.0.0.1:login')", [`ip:${ipA}:login`, `ip:${ipB}:login`]);
  const anterior = process.env.QATU_PROXIES_CONFIABLES;
  const login = (base: string, ip: string) => fetch(base + '/api/v1/auth/login', { method: 'POST',
    headers: { Origin: process.env.APP_ORIGIN!, 'Content-Type': 'application/json', 'X-Forwarded-For': ip },
    body: JSON.stringify({ email: `nadie-${randomUUID()}@example.com`, password: 'una contraseña que no existe' }) });
  try {
    await caso('con loopback: 30 intentos de un visitante no bloquean a otro', async () => {
      process.env.QATU_PROXIES_CONFIABLES = 'loopback';
      const app = await crearApp(); await app.listen(0, '127.0.0.1'); const base = await app.getUrl();
      try {
        for (let i = 0; i < 30; i++) assert.equal((await login(base, ipA)).status, 401);
        assert.equal((await login(base, ipA)).status, 429);
        assert.equal((await login(base, ipB)).status, 401);
        const claves = (await pool.query("SELECT clave FROM limites_acceso WHERE clave LIKE 'ip:%:login' AND clave IN ($1,$2)", [`ip:${ipA}:login`, `ip:${ipB}:login`])).rows.map(r => r.clave).sort();
        assert.deepEqual(claves, [`ip:${ipB}:login`, `ip:${ipA}:login`].sort());
      } finally { await app.close(); }
    });
    await caso('sin configurar: la cabecera se ignora y cuenta la conexión local', async () => {
      delete process.env.QATU_PROXIES_CONFIABLES;
      await pool.query("DELETE FROM limites_acceso WHERE clave='ip:127.0.0.1:login'");
      const app = await crearApp(); await app.listen(0, '127.0.0.1'); const base = await app.getUrl();
      try {
        assert.equal((await login(base, `192.0.2.${Math.floor(Math.random() * 250)}`)).status, 401);
        assert.equal((await pool.query("SELECT intentos FROM limites_acceso WHERE clave='ip:127.0.0.1:login'")).rows[0]?.intentos, 1);
      } finally { await app.close(); }
    });
    await caso('un valor inseguro impide arrancar', async () => {
      process.env.QATU_PROXIES_CONFIABLES = 'true';
      await assert.rejects(crearApp(), /QATU_PROXIES_CONFIABLES/);
    });
  } finally {
    if (anterior === undefined) delete process.env.QATU_PROXIES_CONFIABLES; else process.env.QATU_PROXIES_CONFIABLES = anterior;
    await pool.query("DELETE FROM limites_acceso WHERE clave IN ($1, $2, 'ip:127.0.0.1:login')", [`ip:${ipA}:login`, `ip:${ipB}:login`]);
    await pool.end();
  }
});

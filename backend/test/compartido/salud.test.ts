import assert from 'node:assert/strict';
import { test } from 'node:test';
import { crearApp } from '../../src/app';

test('salud: vida sin base y lista con PostgreSQL real, sin datos sensibles', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.JWT_SECRET = 'secreto-exclusivo-salud-pruebas-2026-qatu-abc'; process.env.APP_ORIGIN = 'http://127.0.0.1:3000';
  const app = await crearApp(); await app.listen(0, '127.0.0.1'); const base = await app.getUrl() + '/api/v1';
  try {
    const vida = await fetch(base + '/salud/vida');
    assert.equal(vida.status, 200); assert.deepEqual(await vida.json(), { estado: 'ok' });
    const lista = await fetch(base + '/salud');
    assert.equal(lista.status, 200);
    const cuerpo = await lista.json();
    assert.equal(cuerpo.estado, 'ok'); assert.equal(cuerpo.base, 'ok'); assert.equal(cuerpo.almacen, 'postgres');
    assert.ok(Number.isInteger(cuerpo.baseMs) && cuerpo.baseMs >= 0);
    assert.deepEqual(Object.keys(cuerpo).sort(), ['almacen', 'base', 'baseMs', 'estado', 'version']);
    assert.equal(lista.headers.get('cache-control'), 'no-store');
  } finally { await app.close(); }
});

import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { entradaSolicitud, entradaRechazo, filtros } from '../../src/modules/reservas/dominio/solicitud';

const ahora = Date.parse('2030-01-01T00:00:00Z');
const base = { publicacionId: randomUUID(), recursoId: randomUUID(), inicio: '2030-02-01T10:00:00Z', fin: '2030-02-02T10:00:00Z' };
test('solicitudes: fechas futuras UTC reales, rango no vacío y sin normalización silenciosa', () => {
  assert.equal(entradaSolicitud(base, ahora).inicio, '2030-02-01T10:00:00.000Z');
  for (const cambio of [
    { inicio: base.fin }, { fin: base.inicio }, { inicio: '2029-01-01T00:00:00Z' },
    { inicio: '2030-02-30T10:00:00Z' }, { inicio: '2030-02-01T10:00:00' },
    { inicio: '2030-02-01T25:00:00Z' }, { inicio: '2030-02-01' }, { inicio: 'Infinity' },
  ]) assert.throws(() => entradaSolicitud({ ...base, ...cambio }, ahora));
});
test('solicitudes: el navegador no determina identidad, estado, tarifa ni snapshot', () => {
  for (const campo of ['clienteId', 'propietarioId', 'proveedorId', 'estado', 'importe', 'snapshot']) {
    assert.throws(() => entradaSolicitud({ ...base, [campo]: 'valor manipulado' }, ahora));
  }
  assert.throws(() => entradaSolicitud({ ...base, recursoId: 'no-es-uuid' }, ahora));
  assert.throws(() => entradaSolicitud({ ...base, descripcionTrabajo: 'a'.repeat(1501) }, ahora));
});
test('respuestas: motivo y versión obligatorios; filtros no permiten cuentas ajenas ni arrays', () => {
  assert.deepEqual(entradaRechazo({ versionActual: 1, motivo: 'No disponible en las fechas solicitadas' }).versionActual, 1);
  for (const versionActual of [0, 1.5, '1', NaN, 2147483647]) assert.throws(() => entradaRechazo({ versionActual, motivo: 'No disponible en las fechas solicitadas' }));
  assert.throws(() => entradaRechazo({ versionActual: 1, motivo: 'corto' }));
  for (const f of [{ vista: ['cliente', 'proveedor'] }, { clienteId: randomUUID() }, { page: '0' }, { page: '10000' }, { limit: '50' }]) assert.throws(() => filtros(f));
  assert.deepEqual(filtros({}), { vista: 'cliente', page: 1, limit: 20 });
});

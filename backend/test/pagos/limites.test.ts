import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const archivos = (raiz: string): string[] => readdirSync(raiz, { withFileTypes: true }).flatMap(e => e.isDirectory() ? archivos(join(raiz, e.name)) : [join(raiz, e.name)]);
const conPatron = (raiz: string, patron: RegExp) => archivos(raiz).filter(f => patron.test(readFileSync(f, 'utf8')));

test('Reservas no conoce a Pagos: ni sus archivos ni sus tablas ni la pasarela', () => {
  assert.deepEqual(conPatron('src/modules/reservas', /modules\/pagos|\.\.\/pagos|pagos_intentos|pagos_eventos_pasarela|culqi/i), []);
});

test('Pagos usa a Reservas solo por su API pública y no toca sus tablas', () => {
  assert.deepEqual(conPatron('src/modules/pagos', /from '\.\.\/(\.\.\/)?reservas\/|(FROM|JOIN|UPDATE|INTO) +reservas(_|\b)/i), []);
});

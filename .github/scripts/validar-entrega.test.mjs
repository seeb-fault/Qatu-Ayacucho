import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { validarEntrega } from './validar-entrega.mjs';

function escenario(context, entrega) {
  const root = mkdtempSync(join(tmpdir(), 'qatu-ci-entrega-'));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  const crear = (relative, content = '') => {
    const target = join(root, relative);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  };
  crear('.github/entrega.json', JSON.stringify({ ultimaEntrega: entrega }));
  return { root, crear };
}

test('base declara explícitamente que no hay aplicaciones', context => {
  const { root } = escenario(context, 'base');
  assert.deepEqual(validarEntrega(root), { entrega: 'base', frontend: false, backend: false, proveedores: false, specs: false });
});

test('no acepta entrega desconocida', context => {
  const { root } = escenario(context, '999');
  assert.throws(() => validarEntrega(root), /Entrega desconocida/);
});

test('no permite esconder una aplicación existente declarando base', context => {
  const { root, crear } = escenario(context, 'base');
  crear('frontend/package.json', '{}');
  assert.throws(() => validarEntrega(root), /No corresponde frontend/);
});

test('001 exige especificación completa, no solo una carpeta', context => {
  const { root } = escenario(context, '001');
  assert.throws(() => validarEntrega(root), /specs\/001-descubrimiento-ofertas\/spec.md/);
});

test('base no admite proveedores adelantados', context => {
  const { root, crear } = escenario(context, 'base');
  crear('backend/src/modules/proveedores/index.ts');
  assert.throws(() => validarEntrega(root), /No corresponde backend\/src\/modules\/proveedores/);
});

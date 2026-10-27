import assert from 'node:assert/strict';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const entregas = ['base', '001', '002', '003', '004'];
const carpetas = ['001-descubrimiento-ofertas', '002-usuarios-acceso', '003-proveedores-verificacion', '004-catalogo-publicaciones'];
const artefactos = ['spec.md', 'plan.md', 'tasks.md', 'research.md', 'data-model.md', 'quickstart.md', 'contracts/api.md', 'checklists/requirements.md'];

export function validarEntrega(root) {
  const manifest = JSON.parse(readFileSync(resolve(root, '.github/entrega.json'), 'utf8'));
  assert.deepEqual(Object.keys(manifest).sort(), manifest.incrementos === undefined ? ['ultimaEntrega'] : ['incrementos','ultimaEntrega'], 'Campos desconocidos en manifiesto');
  const indice = entregas.indexOf(manifest.ultimaEntrega);
  assert.ok(indice >= 0, 'Entrega desconocida');
  const incrementos = manifest.incrementos ?? [];
  assert.ok(Array.isArray(incrementos) && incrementos.every(i => i === '005.1') && new Set(incrementos).size === incrementos.length, 'Incremento desconocido o repetido');
  const reservas = incrementos.includes('005.1');
  assert.ok(!reservas || indice >= 4, 'Solicitudes requiere Catálogo 004');
  const requerir = relative => assert.ok(existsSync(resolve(root, relative)), `Falta ${relative}`);
  const ausente = relative => assert.ok(!existsSync(resolve(root, relative)), `No corresponde ${relative} en esta entrega`);
  for (let posicion = 0; posicion < indice; posicion++) {
    for (const artefacto of artefactos) requerir(`specs/${carpetas[posicion]}/${artefacto}`);
  }
  const scripts = (relative, necesarios) => {
    const value = JSON.parse(readFileSync(resolve(root, relative), 'utf8'));
    for (const nombre of necesarios) assert.equal(typeof value.scripts?.[nombre], 'string', `Falta script ${relative}: ${nombre}`);
  };
  if (indice >= 1) {
    for (const relative of ['frontend/package-lock.json', 'frontend/playwright.config.ts', 'frontend/tests/descubrimiento/busqueda.spec.ts', 'frontend/tests/descubrimiento/accesibilidad.spec.ts', '.specify/scripts/powershell/check-prerequisites.ps1', 'specs/scripts/validar-specs.ps1']) requerir(relative);
    scripts('frontend/package.json', ['build', 'typecheck', 'test']);
  } else ausente('frontend/package.json');
  if (indice >= 2) {
    for (const relative of ['backend/package-lock.json', 'backend/scripts/migrate.ts', 'backend/test/usuarios/acceso.test.ts', 'backend/test/usuarios/administracion.test.ts', 'frontend/playwright.usuarios.config.ts', 'frontend/tests/usuarios/acceso.spec.ts', 'frontend/tests/acceso/diseno.spec.ts']) requerir(relative);
    scripts('backend/package.json', ['build', 'migrate', 'test']);
    scripts('frontend/package.json', ['test:usuarios', 'test:acceso']);
  } else ausente('backend/package.json');
  if (indice >= 3) {
    for (const relative of ['backend/src/modules/proveedores/proveedores.module.ts', 'backend/test/proveedores/verificacion.test.ts', 'frontend/playwright.proveedores.config.ts', 'frontend/tests/proveedores/verificacion.spec.ts']) requerir(relative);
    scripts('frontend/package.json', ['test:proveedores']);
  } else {
    ausente('backend/src/modules/proveedores');
    ausente('frontend/src/components/proveedores');
  }
  if (indice >= 4) {
    for (const relative of ['backend/src/modules/catalogo/catalogo.module.ts','backend/migrations/catalogo/001-publicaciones.sql','backend/test/catalogo/persistencia.test.ts','frontend/src/app/publicar/page.tsx','frontend/playwright.catalogo.config.ts','frontend/tests/catalogo/publicaciones.spec.ts']) requerir(relative);
    scripts('frontend/package.json',['test:catalogo']);
  } else ausente('backend/src/modules/catalogo');
  if (reservas) {
    for (const artefacto of artefactos) requerir(`specs/005-reservas-contratacion-pagos/${artefacto}`);
    for (const relative of ['backend/src/modules/reservas/reservas.module.ts','backend/migrations/reservas/001-solicitudes.sql','backend/test/reservas/persistencia.test.ts','frontend/src/app/reservas/page.tsx','frontend/playwright.reservas.config.ts','frontend/tests/reservas/solicitudes.spec.ts']) requerir(relative);
    scripts('frontend/package.json',['test:reservas']);
  } else ausente('backend/src/modules/reservas');
  return {
    entrega: manifest.ultimaEntrega,
    frontend: indice >= 1,
    backend: indice >= 2,
    proveedores: indice >= 3,
    catalogo: indice >= 4,
    reservas,
    specs: existsSync(resolve(root, '.specify/scripts/powershell/check-prerequisites.ps1')),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const alcance = validarEntrega(process.cwd());
  for (const [nombre, valor] of Object.entries(alcance)) {
    const linea = `${nombre}=${valor}\n`;
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, linea);
    process.stdout.write(linea);
  }
}

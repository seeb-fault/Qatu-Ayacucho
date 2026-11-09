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
  assert.ok(Array.isArray(incrementos) && incrementos.every(i => ['005.1','005.2','005.3','005.4','005.5','005.6','005.7','005.8'].includes(i)) && new Set(incrementos).size === incrementos.length, 'Incremento desconocido o repetido');
  const reservas = incrementos.includes('005.1');
  const efectivo = incrementos.includes('005.2');
  const cotizaciones = incrementos.includes('005.3');
  const agenda = incrementos.includes('005.4');
  const ejecucion = incrementos.includes('005.5');
  const despacho = incrementos.includes('005.6');
  const avisos = incrementos.includes('005.7');
  const pagos = incrementos.includes('005.8');
  assert.ok(!pagos || avisos, '005.8 requiere avisos 005.7');
  assert.ok(!avisos || despacho, '005.7 requiere despacho 005.6');
  assert.ok(!despacho || ejecucion, '005.6 requiere ejecución 005.5');
  assert.ok(!ejecucion || agenda, '005.5 requiere agenda 005.4');
  assert.ok(!agenda || cotizaciones, '005.4 requiere cotizaciones 005.3');
  assert.ok(!cotizaciones || efectivo, '005.3 requiere la base de reservas 005.2');
  assert.ok(!efectivo || reservas, '005.2 requiere solicitudes 005.1');
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
  if (efectivo) {
    for (const relative of ['backend/migrations/reservas/002-alquiler-efectivo.sql','backend/migrations/reservas/003-condiciones-estables.sql','backend/src/modules/reservas/dominio/alquiler.ts','backend/test/reservas/alquiler.test.ts','backend/test/reservas/calendario.test.ts','frontend/src/components/reservas/TarjetaReserva.tsx','frontend/tests/reservas/efectivo.spec.ts']) requerir(relative);
  } else ausente('backend/src/modules/reservas/dominio/alquiler.ts');
  if (cotizaciones) {
    for (const relative of ['backend/migrations/reservas/004-cotizaciones.sql','backend/src/modules/reservas/dominio/cotizacion.ts','backend/test/reservas/cotizaciones.test.ts','frontend/src/components/reservas/CotizacionesServicio.tsx','frontend/tests/reservas/cotizaciones.spec.ts']) requerir(relative);
  } else ausente('backend/src/modules/reservas/dominio/cotizacion.ts');
  if (agenda) {
    for (const relative of ['backend/migrations/reservas/005-agenda-oficios.sql','backend/test/reservas/agenda.test.ts','frontend/tests/reservas/agenda.spec.ts']) requerir(relative);
  } else ausente('backend/migrations/reservas/005-agenda-oficios.sql');
  if (ejecucion) {
    for (const relative of ['backend/migrations/reservas/006-ejecucion-oficios.sql','backend/test/reservas/ejecucion.test.ts','frontend/tests/reservas/ejecucion.spec.ts']) requerir(relative);
  } else ausente('backend/migrations/reservas/006-ejecucion-oficios.sql');
  if (despacho) {
    for (const relative of ['backend/migrations/reservas/007-despacho-eventos.sql','backend/src/modules/reservas/aplicacion/despacho.ts','backend/test/reservas/despacho.test.ts']) requerir(relative);
  } else ausente('backend/migrations/reservas/007-despacho-eventos.sql');
  if (avisos) {
    for (const relative of ['backend/migrations/reservas/008-avisos.sql','backend/src/modules/reservas/aplicacion/avisos.ts','backend/test/reservas/avisos.test.ts','frontend/src/app/avisos/page.tsx','frontend/tests/reservas/avisos.spec.ts']) requerir(relative);
  } else ausente('backend/migrations/reservas/008-avisos.sql');
  if (pagos) {
    for (const relative of ['backend/migrations/reservas/009-pagos-en-linea.sql','backend/migrations/pagos/001-tablas-propias.sql','backend/src/modules/pagos/pagos.module.ts','backend/src/modules/pagos/aplicacion/pagos.ts','backend/src/modules/pagos/infraestructura/culqi.ts','backend/test/pagos/pagos.test.ts','backend/test/pagos/limites.test.ts','frontend/playwright.pagos.config.ts','frontend/tests/pagos/pagos.spec.ts']) requerir(relative);
    scripts('frontend/package.json',['test:pagos']);
  } else { ausente('backend/migrations/reservas/009-pagos-en-linea.sql'); ausente('backend/src/modules/pagos'); }
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

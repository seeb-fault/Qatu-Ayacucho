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
  assert.ok(Array.isArray(incrementos) && incrementos.every(i => ['005.1','005.2','005.3','005.4','005.5','005.6','005.7','005.8','006.1','006.2','006.3','009.1','010.1','011.1','012.1','013.1','014.1','014.2','015.1','016.1','007.1'].includes(i)) && new Set(incrementos).size === incrementos.length, 'Incremento desconocido o repetido');
  const reservas = incrementos.includes('005.1');
  const efectivo = incrementos.includes('005.2');
  const cotizaciones = incrementos.includes('005.3');
  const agenda = incrementos.includes('005.4');
  const ejecucion = incrementos.includes('005.5');
  const despacho = incrementos.includes('005.6');
  const avisos = incrementos.includes('005.7');
  const pagos = incrementos.includes('005.8');
  const resenas = incrementos.includes('006.1');
  const evidencias = incrementos.includes('006.2');
  assert.ok(!evidencias || resenas, '006.2 requiere reseñas 006.1');
  const incidencias = incrementos.includes('006.3');
  assert.ok(!incidencias || evidencias, '006.3 requiere evidencias 006.2');
  const lista = incrementos.includes('009.1');
  assert.ok(!lista || reservas, '009.1 requiere solicitudes 005.1');
  const whatsapp = incrementos.includes('010.1');
  assert.ok(!whatsapp || cotizaciones, '010.1 requiere cotizaciones 005.3');
  const mapas = incrementos.includes('011.1');
  assert.ok(!mapas || whatsapp, '011.1 requiere el contacto de reserva de 010.1');
  const legal = incrementos.includes('012.1');
  const almacen = incrementos.includes('013.1');
  assert.ok(!almacen || evidencias, '013.1 requiere evidencias 006.2 (archivos cifrados que mover al almacén)');
  const documentacion = incrementos.includes('014.1');
  const bruno = incrementos.includes('014.2');
  assert.ok(!bruno || documentacion, '014.2 requiere el contrato OpenAPI de 014.1');
  const cache = incrementos.includes('015.1');
  const jest = incrementos.includes('016.1');
  const busquedaIA = incrementos.includes('007.1');
  assert.ok(!legal || incidencias, '012.1 requiere incidencias 006.3 (el libro vive en Reputación y confianza)');
  assert.ok(!resenas || ejecucion, '006.1 requiere operaciones cerradas: herramientas devueltas (005.2) y servicios cerrados (005.5)');
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
  if (resenas) {
    for (const artefacto of artefactos) requerir(`specs/006-reputacion-confianza/${artefacto}`);
    for (const relative of ['backend/migrations/resenas/001-resenas.sql','backend/src/modules/resenas/resenas.module.ts','backend/src/modules/resenas/dominio/resenas.ts','backend/test/resenas/resenas.test.ts','frontend/src/components/resenas/ResenaReserva.tsx','frontend/src/app/admin/resenas/page.tsx','frontend/playwright.resenas.config.ts','frontend/tests/resenas/resenas.spec.ts']) requerir(relative);
    scripts('frontend/package.json',['test:resenas']);
  } else ausente('backend/src/modules/resenas');
  if (evidencias) {
    for (const relative of ['backend/migrations/resenas/002-evidencias.sql','backend/src/shared/infraestructura/archivos-cifrados.ts','backend/src/modules/resenas/aplicacion/evidencias.ts','backend/test/resenas/evidencias.test.ts','frontend/src/components/resenas/EvidenciasReserva.tsx','frontend/tests/resenas/evidencias.spec.ts']) requerir(relative);
  } else ausente('backend/migrations/resenas/002-evidencias.sql');
  if (incidencias) {
    for (const relative of ['backend/migrations/resenas/003-incidencias-garantias.sql','backend/migrations/reservas/010-eventos-incidencias.sql','backend/scripts/restauracion.ts','backend/test/resenas/restauracion.test.ts','backend/src/modules/resenas/aplicacion/incidencias.ts','backend/test/resenas/incidencias.test.ts','backend/test/resenas/fixture-admin-e2e.ts','frontend/src/components/resenas/GarantiaReserva.tsx','frontend/src/components/resenas/IncidenciasReserva.tsx','frontend/src/app/admin/incidencias/page.tsx','frontend/tests/resenas/incidencias.spec.ts']) requerir(relative);
  } else ausente('backend/migrations/resenas/003-incidencias-garantias.sql');
  if (lista) {
    for (const artefacto of artefactos) requerir(`specs/009-mi-lista/${artefacto}`);
    for (const relative of ['backend/migrations/reservas/011-lista.sql','backend/src/modules/reservas/dominio/lista.ts','backend/src/modules/reservas/aplicacion/lista.ts','backend/src/modules/reservas/presentacion/lista.controller.ts','backend/test/reservas/lista.test.ts','frontend/src/lib/rutas.ts','frontend/src/components/lista/MiLista.tsx','frontend/src/components/lista/BotonLista.tsx','frontend/src/app/lista/page.tsx','frontend/tests/reservas/lista.spec.ts']) requerir(relative);
  } else ausente('backend/migrations/reservas/011-lista.sql');
  if (whatsapp) {
    for (const artefacto of artefactos) requerir(`specs/010-coordinacion-whatsapp/${artefacto}`);
    for (const relative of ['backend/migrations/usuarios/003-whatsapp.sql','backend/src/modules/reservas/dominio/coordinacion.ts','backend/test/reservas/whatsapp.test.ts','frontend/src/components/reservas/CoordinarWhatsapp.tsx','frontend/tests/reservas/whatsapp.spec.ts']) requerir(relative);
  } else ausente('backend/migrations/usuarios/003-whatsapp.sql');
  if (mapas) {
    for (const artefacto of artefactos) requerir(`specs/011-mapas-ubicacion/${artefacto}`);
    for (const relative of ['backend/migrations/catalogo/002-ubicaciones.sql','backend/src/modules/catalogo/dominio/ubicacion.ts','backend/test/catalogo/ubicacion.test.ts','frontend/src/components/mapa/Mapa.tsx','frontend/src/components/mapa/EditorUbicacion.tsx','frontend/tests/reservas/mapa.spec.ts']) requerir(relative);
  } else ausente('backend/migrations/catalogo/002-ubicaciones.sql');
  if (legal) {
    for (const artefacto of artefactos) requerir(`specs/012-legal-reclamaciones/${artefacto}`);
    for (const relative of ['backend/migrations/resenas/004-libro-reclamaciones.sql','backend/src/modules/resenas/dominio/reclamaciones.ts','backend/src/modules/resenas/aplicacion/reclamaciones.ts','backend/test/resenas/reclamaciones.test.ts','frontend/src/components/legal/LibroReclamaciones.tsx','frontend/src/app/libro-de-reclamaciones/page.tsx','frontend/src/app/terminos/page.tsx','frontend/src/app/devoluciones/page.tsx','frontend/src/app/privacidad/page.tsx','frontend/src/app/contacto/page.tsx','frontend/src/app/admin/reclamaciones/page.tsx','frontend/tests/resenas/reclamaciones.spec.ts']) requerir(relative);
  } else ausente('backend/migrations/resenas/004-libro-reclamaciones.sql');
  if (almacen) {
    for (const artefacto of artefactos) requerir(`specs/013-almacenamiento-cloudflare/${artefacto}`);
    for (const relative of ['backend/migrations/compartido/001-objetos-por-borrar.sql','backend/migrations/proveedores/003-almacen-objetos.sql','backend/migrations/resenas/005-almacen-objetos.sql','backend/src/shared/infraestructura/almacen.ts','backend/src/shared/infraestructura/archivos-externos.ts','backend/src/shared/infraestructura/almacen.module.ts','backend/scripts/migrar-archivos.ts','backend/scripts/mover-archivos.ts','backend/test/almacen/almacen.test.ts','backend/test/entorno-pruebas.ts']) requerir(relative);
  } else ausente('backend/migrations/compartido/001-objetos-por-borrar.sql');
  if (documentacion) {
    for (const artefacto of artefactos) requerir(`specs/014-documentacion-api/${artefacto}`);
    for (const relative of ['backend/src/shared/presentacion/openapi.ts','backend/src/shared/infraestructura/documentacion-api.ts','backend/scripts/openapi.ts','backend/test/compartido/openapi.test.ts','docs/03-diseño-de-software/diseño-externo/openapi.json']) requerir(relative);
  } else ausente('backend/src/shared/presentacion/openapi.ts');
  if (bruno) {
    for (const relative of ['docs/06-pruebas-atributos-calidad/bruno/bruno.json','docs/06-pruebas-atributos-calidad/bruno/README.md','docs/06-pruebas-atributos-calidad/scripts/bruno.mjs']) requerir(relative);
  } else ausente('docs/06-pruebas-atributos-calidad/bruno/bruno.json');
  if (cache) {
    for (const artefacto of artefactos) requerir(`specs/015-cache-y-base-de-datos/${artefacto}`);
    for (const relative of ['backend/src/shared/infraestructura/cache.ts','backend/src/modules/catalogo/infraestructura/cache.ts','backend/scripts/analizar-base.ts','backend/test/catalogo/cache.test.ts','docs/06-pruebas-atributos-calidad/base-de-datos/README.md']) requerir(relative);
  } else ausente('backend/src/shared/infraestructura/cache.ts');
  if (jest) {
    for (const artefacto of artefactos) requerir(`specs/016-pruebas-jest-y-carga/${artefacto}`);
    for (const relative of ['backend/jest.config.cjs','backend/test/caso.ts','backend/test/assert-jest.ts','.github/workflows/carga.yml']) requerir(relative);
  } else ausente('backend/jest.config.cjs');
  if (busquedaIA) {
    for (const artefacto of artefactos) requerir(`specs/007-busqueda-inteligente/${artefacto}`);
    for (const relative of ['backend/src/modules/busqueda/dominio/intencion.ts','backend/src/modules/busqueda/aplicacion/busqueda.ts','backend/src/modules/busqueda/infraestructura/openrouter.ts','backend/src/modules/busqueda/presentacion/busqueda.controller.ts','backend/src/modules/busqueda/busqueda.module.ts','backend/test/busqueda/busqueda.test.ts','frontend/src/components/busqueda/BuscadorIA.tsx','frontend/tests/descubrimiento/busqueda-ia.spec.ts']) requerir(relative);
  } else ausente('backend/src/modules/busqueda/busqueda.module.ts');
  return {
    entrega: manifest.ultimaEntrega,
    frontend: indice >= 1,
    backend: indice >= 2,
    proveedores: indice >= 3,
    catalogo: indice >= 4,
    reservas,
    resenas,
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

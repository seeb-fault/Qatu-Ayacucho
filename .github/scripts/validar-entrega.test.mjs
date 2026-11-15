import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
  assert.deepEqual(validarEntrega(root), { entrega: 'base', frontend: false, backend: false, proveedores: false, catalogo: false, reservas: false, resenas: false, specs: false });
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

function prepararCatalogo(context) {
  const {root,crear}=escenario(context,'004');
  for(const carpeta of ['001-descubrimiento-ofertas','002-usuarios-acceso','003-proveedores-verificacion','004-catalogo-publicaciones'])
    for(const nombre of ['spec.md','plan.md','tasks.md','research.md','data-model.md','quickstart.md','contracts/api.md','checklists/requirements.md'])crear(`specs/${carpeta}/${nombre}`);
  crear('frontend/package.json',JSON.stringify({scripts:Object.fromEntries(['build','typecheck','test','test:usuarios','test:acceso','test:proveedores','test:catalogo'].map(nombre=>[nombre,'comando']))}));
  crear('backend/package.json',JSON.stringify({scripts:{build:'comando',migrate:'comando',test:'comando'}}));
  for(const nombre of [
    'frontend/package-lock.json','frontend/playwright.config.ts','frontend/tests/descubrimiento/busqueda.spec.ts','frontend/tests/descubrimiento/accesibilidad.spec.ts',
    '.specify/scripts/powershell/check-prerequisites.ps1','specs/scripts/validar-specs.ps1','backend/package-lock.json','backend/scripts/migrate.ts',
    'backend/test/usuarios/acceso.test.ts','backend/test/usuarios/administracion.test.ts','frontend/playwright.usuarios.config.ts','frontend/tests/usuarios/acceso.spec.ts','frontend/tests/acceso/diseno.spec.ts',
    'frontend/playwright.proveedores.config.ts','backend/src/modules/proveedores/proveedores.module.ts','backend/test/proveedores/verificacion.test.ts','frontend/tests/proveedores/verificacion.spec.ts',
    'backend/src/modules/catalogo/catalogo.module.ts','backend/migrations/catalogo/001-publicaciones.sql','backend/test/catalogo/persistencia.test.ts','frontend/src/app/publicar/page.tsx','frontend/playwright.catalogo.config.ts','frontend/tests/catalogo/publicaciones.spec.ts',
  ])crear(nombre);
  return root;
}
test('004 habilita el CI de catálogo solo con migración, contratos y recorridos presentes',context=>{
 const resultado=validarEntrega(prepararCatalogo(context));assert.equal(resultado.catalogo,true);assert.equal(resultado.frontend,true);assert.equal(resultado.backend,true);
});
test('004 rechaza la entrega si falta su migración de persistencia',context=>{
 const root=prepararCatalogo(context);rmSync(join(root,'backend/migrations/catalogo/001-publicaciones.sql'));assert.throws(()=>validarEntrega(root),/migrations\/catalogo/);
});
test('no permite adelantar catálogo sin declarar su entrega',context=>{
 const {root,crear}=escenario(context,'base');crear('backend/src/modules/catalogo/catalogo.module.ts');assert.throws(()=>validarEntrega(root),/No corresponde backend\/src\/modules\/catalogo/);
});

function prepararSolicitudes(context) {
  const root = prepararCatalogo(context);
  const crear = (relative, content = '') => { const target=join(root,relative); mkdirSync(dirname(target),{recursive:true});writeFileSync(target,content); };
  crear('.github/entrega.json', JSON.stringify({ultimaEntrega:'004',incrementos:['005.1']}));
  for (const nombre of ['spec.md','plan.md','tasks.md','research.md','data-model.md','quickstart.md','contracts/api.md','checklists/requirements.md']) crear(`specs/005-reservas-contratacion-pagos/${nombre}`);
  for (const nombre of ['backend/src/modules/reservas/reservas.module.ts','backend/migrations/reservas/001-solicitudes.sql','backend/test/reservas/persistencia.test.ts','frontend/src/app/reservas/page.tsx','frontend/playwright.reservas.config.ts','frontend/tests/reservas/solicitudes.spec.ts']) crear(nombre);
  crear('frontend/package.json',JSON.stringify({scripts:Object.fromEntries(['build','typecheck','test','test:usuarios','test:acceso','test:proveedores','test:catalogo','test:reservas','test:pagos'].map(n=>[n,'comando']))}));
  return root;
}
test('005.1 habilita solicitudes sin declarar completa la entrega 005',context=>{
  const resultado=validarEntrega(prepararSolicitudes(context));assert.equal(resultado.entrega,'004');assert.equal(resultado.reservas,true);
});
test('005.1 no permite omitir el recorrido de navegador',context=>{
  const root=prepararSolicitudes(context);rmSync(join(root,'frontend/tests/reservas/solicitudes.spec.ts'));assert.throws(()=>validarEntrega(root),/tests\/reservas/);
});
test('no permite incorporar Reservas sin declarar el incremento',context=>{
  const root=prepararSolicitudes(context);writeFileSync(join(root,'.github/entrega.json'),JSON.stringify({ultimaEntrega:'004'}));assert.throws(()=>validarEntrega(root),/No corresponde backend\/src\/modules\/reservas/);
});

test('005.2 exige migración, reglas y recorrido de efectivo sin declarar completa la entrega',context=>{
  const root=prepararSolicitudes(context);
  const crear=(relative,content='')=>{const target=join(root,relative);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,content);};
  crear('.github/entrega.json',JSON.stringify({ultimaEntrega:'004',incrementos:['005.1','005.2']}));
  for(const nombre of ['backend/migrations/reservas/002-alquiler-efectivo.sql','backend/migrations/reservas/003-condiciones-estables.sql','backend/src/modules/reservas/dominio/alquiler.ts','backend/test/reservas/alquiler.test.ts','backend/test/reservas/calendario.test.ts','frontend/src/components/reservas/TarjetaReserva.tsx','frontend/tests/reservas/efectivo.spec.ts'])crear(nombre);
  assert.equal(validarEntrega(root).reservas,true);
  rmSync(join(root,'frontend/tests/reservas/efectivo.spec.ts'));assert.throws(()=>validarEntrega(root),/efectivo.spec/);
});
test('no permite declarar efectivo sin las solicitudes previas',context=>{
  const root=prepararSolicitudes(context);writeFileSync(join(root,'.github/entrega.json'),JSON.stringify({ultimaEntrega:'004',incrementos:['005.2']}));assert.throws(()=>validarEntrega(root),/requiere solicitudes/);
});

function prepararCotizaciones(context) {
  const root=prepararSolicitudes(context);
  const crear=(relative,content='')=>{const target=join(root,relative);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,content);};
  crear('.github/entrega.json',JSON.stringify({ultimaEntrega:'004',incrementos:['005.1','005.2','005.3']}));
  for(const nombre of ['backend/migrations/reservas/002-alquiler-efectivo.sql','backend/migrations/reservas/003-condiciones-estables.sql','backend/src/modules/reservas/dominio/alquiler.ts','backend/test/reservas/alquiler.test.ts','backend/test/reservas/calendario.test.ts','frontend/src/components/reservas/TarjetaReserva.tsx','frontend/tests/reservas/efectivo.spec.ts','backend/migrations/reservas/004-cotizaciones.sql','backend/src/modules/reservas/dominio/cotizacion.ts','backend/test/reservas/cotizaciones.test.ts','frontend/src/components/reservas/CotizacionesServicio.tsx','frontend/tests/reservas/cotizaciones.spec.ts'])crear(nombre);
  return root;
}
test('005.3 exige propuestas versionadas y su recorrido de navegador',context=>{
  const root=prepararCotizaciones(context);
  assert.equal(validarEntrega(root).reservas,true);
  rmSync(join(root,'frontend/tests/reservas/cotizaciones.spec.ts'));assert.throws(()=>validarEntrega(root),/cotizaciones.spec/);
});
test('005.3 no permite omitir su base de reservas',context=>{
  const root=prepararSolicitudes(context);writeFileSync(join(root,'.github/entrega.json'),JSON.stringify({ultimaEntrega:'004',incrementos:['005.1','005.3']}));assert.throws(()=>validarEntrega(root),/005.3 requiere/);
});

test('005.4 exige migración de agenda y pruebas de conflicto y liberación',context=>{
  const root=prepararCotizaciones(context);
  writeFileSync(join(root,'.github/entrega.json'),JSON.stringify({ultimaEntrega:'004',incrementos:['005.1','005.2','005.3','005.4']}));
  for(const nombre of ['backend/migrations/reservas/005-agenda-oficios.sql','backend/test/reservas/agenda.test.ts','frontend/tests/reservas/agenda.spec.ts']) {
    const target=join(root,nombre);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,'');
  }
  assert.equal(validarEntrega(root).reservas,true);
  rmSync(join(root,'frontend/tests/reservas/agenda.spec.ts'));assert.throws(()=>validarEntrega(root),/agenda.spec/);
});
test('005.4 no puede declararse sin cotizaciones',context=>{
  const root=prepararSolicitudes(context);writeFileSync(join(root,'.github/entrega.json'),JSON.stringify({ultimaEntrega:'004',incrementos:['005.1','005.2','005.4']}));assert.throws(()=>validarEntrega(root),/005.4 requiere/);
});

test('005.5 exige migración y pruebas de ejecución de oficios',context=>{
  const root=prepararCotizaciones(context);
  writeFileSync(join(root,'.github/entrega.json'),JSON.stringify({ultimaEntrega:'004',incrementos:['005.1','005.2','005.3','005.4','005.5']}));
  for(const nombre of ['backend/migrations/reservas/005-agenda-oficios.sql','backend/test/reservas/agenda.test.ts','frontend/tests/reservas/agenda.spec.ts','backend/migrations/reservas/006-ejecucion-oficios.sql','backend/test/reservas/ejecucion.test.ts','frontend/tests/reservas/ejecucion.spec.ts']) {
    const target=join(root,nombre);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,'');
  }
  assert.equal(validarEntrega(root).reservas,true);
  rmSync(join(root,'frontend/tests/reservas/ejecucion.spec.ts'));assert.throws(()=>validarEntrega(root),/ejecucion.spec/);
});
test('005.5 no puede declararse sin agenda',context=>{
  const root=prepararCotizaciones(context);writeFileSync(join(root,'.github/entrega.json'),JSON.stringify({ultimaEntrega:'004',incrementos:['005.1','005.2','005.3','005.5']}));assert.throws(()=>validarEntrega(root),/005.5 requiere/);
});

test('005.6 exige migración, despachador y pruebas de entrega',context=>{
  const root=prepararCotizaciones(context);
  writeFileSync(join(root,'.github/entrega.json'),JSON.stringify({ultimaEntrega:'004',incrementos:['005.1','005.2','005.3','005.4','005.5','005.6']}));
  for(const nombre of ['backend/migrations/reservas/005-agenda-oficios.sql','backend/test/reservas/agenda.test.ts','frontend/tests/reservas/agenda.spec.ts','backend/migrations/reservas/006-ejecucion-oficios.sql','backend/test/reservas/ejecucion.test.ts','frontend/tests/reservas/ejecucion.spec.ts','backend/migrations/reservas/007-despacho-eventos.sql','backend/src/modules/reservas/aplicacion/despacho.ts','backend/test/reservas/despacho.test.ts']) {
    const target=join(root,nombre);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,'');
  }
  assert.equal(validarEntrega(root).reservas,true);
  rmSync(join(root,'backend/test/reservas/despacho.test.ts'));assert.throws(()=>validarEntrega(root),/despacho.test/);
});
test('005.6 no puede declararse sin ejecución',context=>{
  const root=prepararCotizaciones(context);writeFileSync(join(root,'.github/entrega.json'),JSON.stringify({ultimaEntrega:'004',incrementos:['005.1','005.2','005.3','005.4','005.6']}));assert.throws(()=>validarEntrega(root),/005.6 requiere/);
});

test('005.7 exige migración, bandeja y pruebas de avisos',context=>{
  const root=prepararCotizaciones(context);
  writeFileSync(join(root,'.github/entrega.json'),JSON.stringify({ultimaEntrega:'004',incrementos:['005.1','005.2','005.3','005.4','005.5','005.6','005.7']}));
  for(const nombre of ['backend/migrations/reservas/005-agenda-oficios.sql','backend/test/reservas/agenda.test.ts','frontend/tests/reservas/agenda.spec.ts','backend/migrations/reservas/006-ejecucion-oficios.sql','backend/test/reservas/ejecucion.test.ts','frontend/tests/reservas/ejecucion.spec.ts','backend/migrations/reservas/007-despacho-eventos.sql','backend/src/modules/reservas/aplicacion/despacho.ts','backend/test/reservas/despacho.test.ts','backend/migrations/reservas/008-avisos.sql','backend/src/modules/reservas/aplicacion/avisos.ts','backend/test/reservas/avisos.test.ts','frontend/src/app/avisos/page.tsx','frontend/tests/reservas/avisos.spec.ts']) {
    const target=join(root,nombre);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,'');
  }
  assert.equal(validarEntrega(root).reservas,true);
  rmSync(join(root,'frontend/tests/reservas/avisos.spec.ts'));assert.throws(()=>validarEntrega(root),/avisos.spec/);
});
test('005.7 no puede declararse sin despacho',context=>{
  const root=prepararCotizaciones(context);writeFileSync(join(root,'.github/entrega.json'),JSON.stringify({ultimaEntrega:'004',incrementos:['005.1','005.2','005.3','005.4','005.5','005.7']}));assert.throws(()=>validarEntrega(root),/005.7 requiere/);
});

test('005.8 exige migración, adaptador y pruebas de pago',context=>{
  const root=prepararCotizaciones(context);
  writeFileSync(join(root,'.github/entrega.json'),JSON.stringify({ultimaEntrega:'004',incrementos:['005.1','005.2','005.3','005.4','005.5','005.6','005.7','005.8']}));
  for(const nombre of ["backend/migrations/reservas/005-agenda-oficios.sql","backend/test/reservas/agenda.test.ts","frontend/tests/reservas/agenda.spec.ts","backend/migrations/reservas/006-ejecucion-oficios.sql","backend/test/reservas/ejecucion.test.ts","frontend/tests/reservas/ejecucion.spec.ts","backend/migrations/reservas/007-despacho-eventos.sql","backend/src/modules/reservas/aplicacion/despacho.ts","backend/test/reservas/despacho.test.ts","backend/migrations/reservas/008-avisos.sql","backend/src/modules/reservas/aplicacion/avisos.ts","backend/test/reservas/avisos.test.ts","frontend/src/app/avisos/page.tsx","frontend/tests/reservas/avisos.spec.ts","backend/migrations/reservas/009-pagos-en-linea.sql","backend/migrations/pagos/001-tablas-propias.sql","backend/src/modules/pagos/pagos.module.ts","backend/src/modules/pagos/aplicacion/pagos.ts","backend/src/modules/pagos/infraestructura/culqi.ts","backend/test/pagos/pagos.test.ts","backend/test/pagos/limites.test.ts","frontend/playwright.pagos.config.ts","frontend/tests/pagos/pagos.spec.ts"]) {
    const target=join(root,nombre);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,'');
  }
  assert.equal(validarEntrega(root).reservas,true);
  rmSync(join(root,'backend/test/pagos/pagos.test.ts'));assert.throws(()=>validarEntrega(root),/pagos.test/);
});

test('006.1 exige módulo, migración, pruebas y specs de reseñas',context=>{
  const root=prepararCotizaciones(context);
  writeFileSync(join(root,'.github/entrega.json'),JSON.stringify({ultimaEntrega:'004',incrementos:['005.1','005.2','005.3','005.4','005.5','005.6','005.7','005.8','006.1']}));
  for(const nombre of ["backend/migrations/resenas/001-resenas.sql","backend/src/modules/resenas/resenas.module.ts","backend/src/modules/resenas/dominio/resenas.ts","backend/test/resenas/resenas.test.ts","frontend/src/components/resenas/ResenaReserva.tsx","frontend/src/app/admin/resenas/page.tsx","frontend/playwright.resenas.config.ts","frontend/tests/resenas/resenas.spec.ts",...["spec.md","plan.md","tasks.md","research.md","data-model.md","quickstart.md","contracts/api.md","checklists/requirements.md"].map(a=>"specs/006-reputacion-confianza/"+a),"backend/migrations/reservas/005-agenda-oficios.sql","backend/test/reservas/agenda.test.ts","frontend/tests/reservas/agenda.spec.ts","backend/migrations/reservas/006-ejecucion-oficios.sql","backend/test/reservas/ejecucion.test.ts","frontend/tests/reservas/ejecucion.spec.ts","backend/migrations/reservas/007-despacho-eventos.sql","backend/src/modules/reservas/aplicacion/despacho.ts","backend/test/reservas/despacho.test.ts","backend/migrations/reservas/008-avisos.sql","backend/src/modules/reservas/aplicacion/avisos.ts","backend/test/reservas/avisos.test.ts","frontend/src/app/avisos/page.tsx","frontend/tests/reservas/avisos.spec.ts","backend/migrations/reservas/009-pagos-en-linea.sql","backend/migrations/pagos/001-tablas-propias.sql","backend/src/modules/pagos/pagos.module.ts","backend/src/modules/pagos/aplicacion/pagos.ts","backend/src/modules/pagos/infraestructura/culqi.ts","backend/test/pagos/pagos.test.ts","backend/test/pagos/limites.test.ts","frontend/playwright.pagos.config.ts","frontend/tests/pagos/pagos.spec.ts"]) {
    const target=join(root,nombre);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,'');
  }
  const paquete=join(root,'frontend/package.json'),datos=JSON.parse(readFileSync(paquete,'utf8'));datos.scripts['test:resenas']='comando';writeFileSync(paquete,JSON.stringify(datos));
  assert.equal(validarEntrega(root).resenas,true);
  rmSync(join(root,'backend/test/resenas/resenas.test.ts'));assert.throws(()=>validarEntrega(root),/resenas.test/);
});

test('006.2 exige migración, cifrado compartido y pruebas de evidencias',context=>{
  const root=prepararCotizaciones(context);
  writeFileSync(join(root,'.github/entrega.json'),JSON.stringify({ultimaEntrega:'004',incrementos:['005.1','005.2','005.3','005.4','005.5','005.6','005.7','005.8','006.1','006.2']}));
  for(const nombre of ["backend/migrations/resenas/002-evidencias.sql","backend/src/shared/infraestructura/archivos-cifrados.ts","backend/src/modules/resenas/aplicacion/evidencias.ts","backend/test/resenas/evidencias.test.ts","frontend/src/components/resenas/EvidenciasReserva.tsx","frontend/tests/resenas/evidencias.spec.ts","backend/migrations/resenas/001-resenas.sql","backend/src/modules/resenas/resenas.module.ts","backend/src/modules/resenas/dominio/resenas.ts","backend/test/resenas/resenas.test.ts","frontend/src/components/resenas/ResenaReserva.tsx","frontend/src/app/admin/resenas/page.tsx","frontend/playwright.resenas.config.ts","frontend/tests/resenas/resenas.spec.ts",...["spec.md","plan.md","tasks.md","research.md","data-model.md","quickstart.md","contracts/api.md","checklists/requirements.md"].map(a=>"specs/006-reputacion-confianza/"+a),"backend/migrations/reservas/005-agenda-oficios.sql","backend/test/reservas/agenda.test.ts","frontend/tests/reservas/agenda.spec.ts","backend/migrations/reservas/006-ejecucion-oficios.sql","backend/test/reservas/ejecucion.test.ts","frontend/tests/reservas/ejecucion.spec.ts","backend/migrations/reservas/007-despacho-eventos.sql","backend/src/modules/reservas/aplicacion/despacho.ts","backend/test/reservas/despacho.test.ts","backend/migrations/reservas/008-avisos.sql","backend/src/modules/reservas/aplicacion/avisos.ts","backend/test/reservas/avisos.test.ts","frontend/src/app/avisos/page.tsx","frontend/tests/reservas/avisos.spec.ts","backend/migrations/reservas/009-pagos-en-linea.sql","backend/migrations/pagos/001-tablas-propias.sql","backend/src/modules/pagos/pagos.module.ts","backend/src/modules/pagos/aplicacion/pagos.ts","backend/src/modules/pagos/infraestructura/culqi.ts","backend/test/pagos/pagos.test.ts","backend/test/pagos/limites.test.ts","frontend/playwright.pagos.config.ts","frontend/tests/pagos/pagos.spec.ts"]) {
    const target=join(root,nombre);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,'');
  }
  const paquete=join(root,'frontend/package.json'),datos=JSON.parse(readFileSync(paquete,'utf8'));datos.scripts['test:resenas']='comando';writeFileSync(paquete,JSON.stringify(datos));
  assert.equal(validarEntrega(root).resenas,true);
  rmSync(join(root,'backend/test/resenas/evidencias.test.ts'));assert.throws(()=>validarEntrega(root),/evidencias.test/);
});

test('006.3 exige migración, interfaz y pruebas de incidencias y garantía',context=>{
  const root=prepararCotizaciones(context);
  writeFileSync(join(root,'.github/entrega.json'),JSON.stringify({ultimaEntrega:'004',incrementos:['005.1','005.2','005.3','005.4','005.5','005.6','005.7','005.8','006.1','006.2','006.3']}));
  for(const nombre of ["backend/migrations/resenas/003-incidencias-garantias.sql","backend/src/modules/resenas/aplicacion/incidencias.ts","backend/test/resenas/incidencias.test.ts","backend/test/resenas/fixture-admin-e2e.ts","frontend/src/components/resenas/GarantiaReserva.tsx","frontend/src/components/resenas/IncidenciasReserva.tsx","frontend/src/app/admin/incidencias/page.tsx","frontend/tests/resenas/incidencias.spec.ts","backend/migrations/resenas/002-evidencias.sql","backend/src/shared/infraestructura/archivos-cifrados.ts","backend/src/modules/resenas/aplicacion/evidencias.ts","backend/test/resenas/evidencias.test.ts","frontend/src/components/resenas/EvidenciasReserva.tsx","frontend/tests/resenas/evidencias.spec.ts","backend/migrations/resenas/001-resenas.sql","backend/src/modules/resenas/resenas.module.ts","backend/src/modules/resenas/dominio/resenas.ts","backend/test/resenas/resenas.test.ts","frontend/src/components/resenas/ResenaReserva.tsx","frontend/src/app/admin/resenas/page.tsx","frontend/playwright.resenas.config.ts","frontend/tests/resenas/resenas.spec.ts",...["spec.md","plan.md","tasks.md","research.md","data-model.md","quickstart.md","contracts/api.md","checklists/requirements.md"].map(a=>"specs/006-reputacion-confianza/"+a),"backend/migrations/reservas/005-agenda-oficios.sql","backend/test/reservas/agenda.test.ts","frontend/tests/reservas/agenda.spec.ts","backend/migrations/reservas/006-ejecucion-oficios.sql","backend/test/reservas/ejecucion.test.ts","frontend/tests/reservas/ejecucion.spec.ts","backend/migrations/reservas/007-despacho-eventos.sql","backend/src/modules/reservas/aplicacion/despacho.ts","backend/test/reservas/despacho.test.ts","backend/migrations/reservas/008-avisos.sql","backend/src/modules/reservas/aplicacion/avisos.ts","backend/test/reservas/avisos.test.ts","frontend/src/app/avisos/page.tsx","frontend/tests/reservas/avisos.spec.ts","backend/migrations/reservas/009-pagos-en-linea.sql","backend/migrations/pagos/001-tablas-propias.sql","backend/src/modules/pagos/pagos.module.ts","backend/src/modules/pagos/aplicacion/pagos.ts","backend/src/modules/pagos/infraestructura/culqi.ts","backend/test/pagos/pagos.test.ts","backend/test/pagos/limites.test.ts","frontend/playwright.pagos.config.ts","frontend/tests/pagos/pagos.spec.ts"]) {
    const target=join(root,nombre);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,'');
  }
  const paquete=join(root,'frontend/package.json'),datos=JSON.parse(readFileSync(paquete,'utf8'));datos.scripts['test:resenas']='comando';writeFileSync(paquete,JSON.stringify(datos));
  assert.equal(validarEntrega(root).resenas,true);
  rmSync(join(root,'backend/test/resenas/incidencias.test.ts'));assert.throws(()=>validarEntrega(root),/incidencias.test/);
});
test('005.8 no puede declararse sin avisos',context=>{
  const root=prepararCotizaciones(context);writeFileSync(join(root,'.github/entrega.json'),JSON.stringify({ultimaEntrega:'004',incrementos:['005.1','005.2','005.3','005.4','005.5','005.6','005.8']}));assert.throws(()=>validarEntrega(root),/005.8 requiere/);
});

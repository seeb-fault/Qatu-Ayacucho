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
  assert.deepEqual(validarEntrega(root), { entrega: 'base', frontend: false, backend: false, proveedores: false, catalogo: false, reservas: false, specs: false });
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
  crear('frontend/package.json',JSON.stringify({scripts:Object.fromEntries(['build','typecheck','test','test:usuarios','test:acceso','test:proveedores','test:catalogo','test:reservas'].map(n=>[n,'comando']))}));
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

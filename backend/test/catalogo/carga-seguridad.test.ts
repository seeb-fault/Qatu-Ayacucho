import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {test} from 'node:test';
const script=resolve('scripts/carga-catalogo.mjs');
test('la carga rechaza una base de desarrollo o un servidor externo antes de conectar',()=>{
 for(const url of ['postgresql://prueba@127.0.0.1:5433/qatu','postgresql://prueba@example.invalid/qatu_catalogo_load_test']){
  const r=spawnSync(process.execPath,[script],{env:{...process.env,BENCH_DATABASE_URL:url},encoding:'utf8',timeout:30000,windowsHide:true});assert.notEqual(r.status,0);assert.match(r.stderr,/base Qatu local exclusiva/);
 }
});
test('la carga no puede sobrescribir archivos fuera de las carpetas de informes',()=>{
 const readme=resolve('../README.md'),before=readFileSync(readme);
 const r=spawnSync(process.execPath,[script,'--output','../README.md'],{env:{...process.env,BENCH_DATABASE_URL:'postgresql://prueba@127.0.0.1:5433/qatu_catalogo_load_test'},encoding:'utf8',timeout:30000,windowsHide:true});
 assert.notEqual(r.status,0);assert.match(r.stderr,/ruta JSON de evidencias/);assert.deepEqual(readFileSync(readme),before);
});
test('duración inválida no inicia servidores ni consulta datos',()=>{
 const r=spawnSync(process.execPath,[script,'--stage-seconds','0'],{env:{...process.env,BENCH_DATABASE_URL:'postgresql://prueba@127.0.0.1:5433/qatu_catalogo_load_test'},encoding:'utf8',timeout:30000,windowsHide:true});assert.notEqual(r.status,0);assert.match(r.stderr,/Duraciones inválidas/);
});

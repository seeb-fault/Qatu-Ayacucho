import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { condiciones, liquidar, transicion, entradaAccion } from '../../src/modules/reservas/dominio/alquiler';
import type { Solicitud } from '../../src/modules/reservas/dominio/solicitud';

const ahora = Date.parse('2030-01-01T10:00:00.000Z');
function solicitud(): Solicitud {
  const inicio = '2030-01-01T10:10:00.000Z', fin = '2030-01-02T10:10:00.000Z';
  return { id: randomUUID(), clienteId: randomUUID(), propietarioId: randomUUID(), proveedorId: randomUUID(), publicacionId: randomUUID(), recursoId: randomUUID(),
    inicio,fin,descripcionTrabajo:'',snapshot:{titulo:'Taladro',tipo:'herramienta',proveedor:'Taller',recurso:'Unidad',tarifaReferenciaCentimos:4250,unidad:'día'},
    tipoSolicitud:'alquiler',condiciones:condiciones(inicio,fin,4250),estado:'PENDIENTE',motivoRechazo:null,version:1,creadoEn:new Date(ahora).toISOString(),
    venceEn:null,pagoEstado:'PENDIENTE',efectivoCentimos:0,entregadoEn:null,recibidoEn:null,devolucionInformadaEn:null,devueltoEn:null,importeFinalCentimos:null,saldoCentimos:0,diasExtra:0,motivoOperacion:null };
}
test('tarifa diaria: mínimo un bloque, cada bloque iniciado y dinero entero', () => {
  assert.equal(condiciones('2030-01-01T10:00:00Z','2030-01-01T10:01:00Z',4250).importeCentimos,4250);
  assert.equal(condiciones('2030-01-01T10:00:00Z','2030-01-02T10:00:00Z',4250).dias,1);
  assert.equal(condiciones('2030-01-01T10:00:00Z','2030-01-02T10:00:01Z',4250).importeCentimos,8500);
  for (const tarifa of [0,-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER]) assert.throws(() => condiciones('2030-01-01T10:00:00Z','2030-01-03T10:00:00Z',tarifa));
});
test('devolución: tolerancia exacta de treinta minutos y bloques adicionales iniciados', () => {
  const s=solicitud(),c=s.condiciones!;
  assert.equal(liquidar(c,s.fin,s.inicio).importeFinalCentimos,4250);
  assert.equal(liquidar(c,s.fin,'2030-01-02T10:40:00.000Z').saldoCentimos,0);
  assert.equal(liquidar(c,s.fin,'2030-01-02T10:40:00.001Z').saldoCentimos,4250);
  assert.equal(liquidar(c,s.fin,'2030-01-03T10:40:00.000Z').diasExtra,1);
  assert.equal(liquidar(c,s.fin,'2030-01-03T10:40:00.001Z').diasExtra,2);
});
test('apartado: vence en sesenta minutos, no permite reanimación ni ampliación después del límite', () => {
  const s=solicitud(),aceptada=transicion(s,s.propietarioId,'aceptacion',null,ahora);
  assert.equal(Date.parse(aceptada.venceEn!)-ahora,3600000);
  assert.throws(() => transicion(aceptada,s.propietarioId,'efectivo',null,ahora+3600000));
  assert.throws(() => transicion(aceptada,s.propietarioId,'ampliacion','Tiempo adicional coordinado',ahora+3600000));
  const ampliada=transicion(aceptada,s.propietarioId,'ampliacion','Tiempo adicional coordinado',ahora+600000);
  assert.equal(Date.parse(ampliada.venceEn!),ahora+4200000);
  assert.throws(() => transicion({...s,condiciones:null},s.propietarioId,'aceptacion',null,ahora));
});
test('efectivo y entrega requieren ambos participantes; devolución no confirma cobro adicional', () => {
  const s=solicitud(),p=s.propietarioId,c=s.clienteId;
  const aceptada=transicion(s,p,'aceptacion',null,ahora);
  assert.throws(() => transicion(aceptada,c,'efectivo',null,ahora));
  const registrada=transicion(aceptada,p,'efectivo',null,ahora);
  assert.equal(registrada.pagoEstado,'REGISTRADO_PROVEEDOR');assert.equal(registrada.venceEn,null);
  assert.throws(() => transicion(registrada,p,'recepcion',null,ahora));
  assert.throws(() => transicion(registrada,c,'cancelacion','Cambiar de opinión',ahora));
  const recibida=transicion(registrada,c,'recepcion',null,ahora+1000);
  assert.equal(recibida.pagoEstado,'CONFIRMADO_PARTICIPANTES');
  const informada=transicion(recibida,c,'devolucion/aviso',null,Date.parse(s.fin)+1800001);
  assert.throws(() => transicion(informada,c,'devolucion/confirmacion',null,Date.parse(s.fin)+1800002));
  const devuelta=transicion(informada,p,'devolucion/confirmacion',null,Date.parse(s.fin)+3600000);
  assert.equal(devuelta.saldoCentimos,4250);assert.equal(devuelta.efectivoCentimos,4250);assert.equal(devuelta.importeFinalCentimos,8500);
  assert.equal(devuelta.devueltoEn,informada.devolucionInformadaEn);
});
test('visita sin condiciones económicas; mutaciones rechazan dinero, actores y fechas del navegador', () => {
  const s={...solicitud(),tipoSolicitud:'visita' as const,condiciones:null};
  assert.equal(transicion(s,s.propietarioId,'visita','Visita coordinada en el taller',ahora).venceEn,null);
  assert.throws(() => transicion(s,s.propietarioId,'aceptacion',null,ahora));
  for (const campo of ['clienteId','importe','entregadoEn','devueltoEn']) assert.throws(() => entradaAccion({versionActual:1,[campo]:'manipulado'},'efectivo'));
  assert.throws(() => entradaAccion({versionActual:1},'ampliacion'));
});

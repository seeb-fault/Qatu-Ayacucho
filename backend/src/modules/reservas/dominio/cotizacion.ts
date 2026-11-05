import { ErrorReserva, invalida, instante, objeto, texto, type Solicitud } from './solicitud';

export interface Cotizacion {
  version: number;
  alcance: string;
  materiales: string;
  importeCentimos: number;
  moneda: 'PEN';
  vigenteHasta: string;
  creadaEn: string;
  respuesta: { decision: 'ACEPTADA' | 'RECHAZADA'; motivo: string | null; respondidaEn: string } | null;
}
export type PropuestaCotizacion = Pick<Cotizacion, 'alcance' | 'materiales' | 'importeCentimos' | 'vigenteHasta'>;

export function versionSolicitud(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1 || value >= 2147483647) invalida('Actualiza la solicitud antes de continuar.');
  return value as number;
}
export function entradaCotizacion(value: unknown, ahora: number) {
  const d = objeto(value, ['versionActual', 'alcance', 'materiales', 'importeCentimos', 'vigenteHasta']);
  const versionActual = versionSolicitud(d.versionActual);
  const alcance = texto(d.alcance, 20, 1500), materiales = texto(d.materiales, 10, 1000);
  if (typeof d.importeCentimos !== 'number' || !Number.isSafeInteger(d.importeCentimos) || d.importeCentimos < 1 || d.importeCentimos > 99999999) invalida('Indica un importe total válido en céntimos.');
  const vigenteHasta = instante(d.vigenteHasta);
  if (Date.parse(vigenteHasta) <= ahora) invalida('La vigencia debe ser futura.');
  return { versionActual, propuesta: { alcance, materiales, importeCentimos: d.importeCentimos as number, vigenteHasta } };
}
export function entradaRespuestaCotizacion(value: unknown, decision: 'ACEPTADA' | 'RECHAZADA') {
  const d = objeto(value, decision === 'RECHAZADA' ? ['versionActual', 'versionCotizacion', 'motivo'] : ['versionActual', 'versionCotizacion']);
  return { versionActual: versionSolicitud(d.versionActual), versionCotizacion: versionSolicitud(d.versionCotizacion),
    motivo: decision === 'RECHAZADA' ? texto(d.motivo, 10, 500) : null };
}
export function puedeCotizar(s: Solicitud, actorId: string, publicar: boolean) {
  if ((publicar ? s.propietarioId : s.clienteId) !== actorId) throw new ErrorReserva('SIN_PERMISO', 403, publicar ? 'Solo el proveedor puede cotizar.' : 'Solo el cliente puede responder a la cotización.');
  if (s.estado !== 'PENDIENTE' || s.snapshot.tipo !== 'servicio' || s.tipoSolicitud !== 'alquiler') {
    throw new ErrorReserva('COTIZACION_NO_PERMITIDA', 409, 'Esta solicitud no permite cotizaciones.');
  }
  if (s.cotizaciones?.some(c => c.respuesta?.decision === 'ACEPTADA')) throw new ErrorReserva('COTIZACION_ACORDADA', 409, 'La cotización aceptada se conserva; no puede reemplazarse.');
}

export function puedeConfirmarAgenda(s: Solicitud, actorId: string, versionCotizacion: number) {
  if (s.clienteId !== actorId) throw new ErrorReserva('SIN_PERMISO',403,'Solo el cliente puede confirmar el horario acordado.');
  const c = s.cotizaciones?.find(c => c.version === versionCotizacion && c.respuesta?.decision === 'ACEPTADA');
  if (s.estado !== 'PENDIENTE' || s.snapshot.tipo !== 'servicio' || s.tipoSolicitud !== 'alquiler' || !c) {
    throw new ErrorReserva('AGENDA_NO_CONFIRMABLE',409,'Se necesita una cotización aceptada y un horario pendiente de confirmar.');
  }
}

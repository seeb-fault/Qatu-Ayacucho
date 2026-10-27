import { ErrorAplicacion } from '../../../shared/dominio/error-aplicacion';

export class ErrorReserva extends ErrorAplicacion {}
export interface SnapshotSolicitud {
  titulo: string;
  tipo: 'herramienta' | 'servicio';
  proveedor: string;
  recurso: string;
  tarifaReferenciaCentimos: number | null;
  unidad: string | null;
}
export interface Solicitud {
  id: string;
  clienteId: string;
  propietarioId: string;
  proveedorId: string;
  publicacionId: string;
  recursoId: string;
  inicio: string;
  fin: string;
  descripcionTrabajo: string;
  snapshot: SnapshotSolicitud;
  estado: 'PENDIENTE' | 'RECHAZADA';
  motivoRechazo: string | null;
  version: number;
  creadoEn: string;
}
export type NuevaSolicitud = Omit<Solicitud, 'id' | 'estado' | 'motivoRechazo' | 'version' | 'creadoEn'>;

export function invalida(mensaje = 'Revisa los datos de la solicitud.'): never {
  throw new ErrorReserva('ENTRADA_INVALIDA', 400, mensaje);
}
export function objeto(value: unknown, campos: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !campos.includes(k))) invalida();
  return value as Record<string, unknown>;
}
export function uuid(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) invalida('Identificador inválido.');
  return value.toLowerCase();
}
export function texto(value: unknown, min: number, max: number): string {
  if (typeof value !== 'string' || Array.from(value.trim()).length < min || Array.from(value.trim()).length > max || /[\u0000-\u001f\u007f]/.test(value.replace(/[\r\n\t]/g, ''))) invalida();
  return value.trim();
}
function instante(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) invalida('Envía las fechas en UTC.');
  const fecha = new Date(value);
  if (!Number.isFinite(fecha.getTime()) || fecha.toISOString() !== value.replace(/:([0-9]{2})Z$/, ':$1.000Z')) invalida('Fecha inválida.');
  return fecha.toISOString();
}
export function entradaSolicitud(value: unknown, ahora: number) {
  const d = objeto(value, ['publicacionId', 'recursoId', 'inicio', 'fin', 'descripcionTrabajo']);
  const inicio = instante(d.inicio), fin = instante(d.fin);
  if (Date.parse(inicio) <= ahora || inicio >= fin) invalida('El inicio debe ser futuro y anterior al fin.');
  return { publicacionId: uuid(d.publicacionId), recursoId: uuid(d.recursoId), inicio, fin,
    descripcionTrabajo: d.descripcionTrabajo === undefined ? '' : texto(d.descripcionTrabajo, 0, 1500) };
}
export function entradaRechazo(value: unknown) {
  const d = objeto(value, ['versionActual', 'motivo']);
  if (typeof d.versionActual !== 'number' || !Number.isSafeInteger(d.versionActual) || d.versionActual < 1 || d.versionActual > 2147483646) invalida('Recarga la solicitud antes de responder.');
  return { versionActual: d.versionActual, motivo: texto(d.motivo, 10, 500) };
}
export function filtros(value: unknown) {
  const d = objeto(value, ['vista', 'page']);
  if (d.vista !== undefined && d.vista !== 'cliente' && d.vista !== 'proveedor') invalida('Selecciona una bandeja válida.');
  if (d.page !== undefined && (typeof d.page !== 'string' || !/^[1-9]\d{0,3}$/.test(d.page))) invalida('Página inválida.');
  return { vista: (d.vista ?? 'cliente') as 'cliente' | 'proveedor', page: Number(d.page ?? 1), limit: 20 };
}

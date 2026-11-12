import { ErrorAplicacion } from '../../../shared/dominio/error-aplicacion';
import type { Transaccion } from '../../../shared/dominio/transaccion';

export class ErrorResena extends ErrorAplicacion {}

/** D09: el cliente puede reseñar hasta 14 días después del cierre. */
export const DIAS_PARA_RESENAR = 14;
/** Estados de Reservas que cierran una operación: herramienta devuelta o servicio cerrado. */
export const ESTADOS_CERRADOS = ['DEVUELTA', 'SERVICIO_CERRADO'];

export interface ReservaParaResena {
  id: string; clienteId: string; propietarioId: string; proveedorId: string; publicacionId: string;
  titulo: string; tipo: 'herramienta' | 'servicio'; estado: string; cerradaEn: string | null;
}
/** Lo que Reseñas necesita de Reservas. Lo cumple la fachada ConsultaReservas. */
export interface ReservasDeResena {
  paraResena(id: string, actorId: string): Promise<ReservaParaResena | null>;
  /** Registra el cambio de Reseñas y su aviso en la misma transacción de Reservas. */
  conEvento<T>(reservaId: string, tipo: 'INCIDENCIA_ABIERTA' | 'INCIDENCIA_RESUELTA', actorId: string, operar: (tx: Transaccion) => Promise<T>): Promise<T>;
}
export interface IdentidadResenas { resolver(token: string): Promise<{ id: string; roles: string[] }> }

export interface Resena {
  id: string; reservaId: string; clienteId: string; propietarioId: string; proveedorId: string; publicacionId: string;
  titulo: string; puntuacion: number; texto: string | null; oculta: boolean; creadaEn: string;
}
export interface Reputacion { promedio: number | null; total: number }
export interface Moderacion { oculta: boolean; motivo: string; creadaEn: string }

export interface RepositorioResenas {
  crear(r: Omit<Resena, 'id' | 'oculta' | 'creadaEn'>): Promise<Resena>;
  deReserva(reservaId: string): Promise<Resena | null>;
  publicas(proveedorId: string, page: number): Promise<{ items: Resena[]; total: number; promedio: number | null }>;
  resumen(proveedorIds: string[]): Promise<Map<string, Reputacion>>;
  paraAdministrar(page: number): Promise<{ items: (Resena & { ultimaModeracion: Moderacion | null })[]; total: number }>;
  porId(id: string): Promise<Resena | null>;
  moderar(id: string, adminId: string, oculta: boolean, motivo: string): Promise<Resena | null>;
}

const invalida = (mensaje = 'Revisa los datos de la reseña.'): never => { throw new ErrorResena('ENTRADA_INVALIDA', 400, mensaje); };
function objeto(value: unknown, campos: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !campos.includes(k))) invalida();
  return value as Record<string, unknown>;
}
export function uuid(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) invalida('Identificador inválido.');
  return (value as string).toLowerCase();
}
export function pagina(value: unknown): number {
  if (value === undefined) return 1;
  if (typeof value !== 'string' || !/^[1-9]\d{0,3}$/.test(value)) invalida('Página inválida.');
  return Number(value);
}
const sinControl = (t: string) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(t);

export function entradaResena(value: unknown): { puntuacion: number; texto: string | null } {
  const d = objeto(value, ['puntuacion', 'texto']);
  if (typeof d.puntuacion !== 'number' || !Number.isInteger(d.puntuacion) || d.puntuacion < 1 || d.puntuacion > 5) invalida('Elige una puntuación de 1 a 5 estrellas.');
  if (d.texto !== undefined && d.texto !== null && typeof d.texto !== 'string') invalida();
  const texto = typeof d.texto === 'string' ? d.texto.trim() : '';
  if (Array.from(texto).length > 600 || !sinControl(texto)) invalida('El comentario admite hasta 600 caracteres.');
  return { puntuacion: d.puntuacion as number, texto: texto || null };
}

export function entradaModeracion(value: unknown): { oculta: boolean; motivo: string } {
  const d = objeto(value, ['oculta', 'motivo']);
  if (typeof d.oculta !== 'boolean') invalida('Indica si la reseña se oculta o se muestra.');
  const motivo = typeof d.motivo === 'string' ? d.motivo.trim() : '';
  if (Array.from(motivo).length < 10 || Array.from(motivo).length > 500 || !sinControl(motivo)) invalida('El motivo debe tener entre 10 y 500 caracteres.');
  return { oculta: d.oculta as boolean, motivo };
}

/** Fecha límite para reseñar, o null si la operación no está cerrada. */
export function plazoParaResenar(r: ReservaParaResena): string | null {
  if (!ESTADOS_CERRADOS.includes(r.estado) || !r.cerradaEn) return null;
  return new Date(Date.parse(r.cerradaEn) + DIAS_PARA_RESENAR * 86_400_000).toISOString();
}

/** Lanza el error que corresponde si el actor no puede reseñar esta reserva ahora. */
export function exigirElegible(r: ReservaParaResena, actorId: string, ahora: number) {
  if (r.clienteId !== actorId) throw new ErrorResena('SIN_PERMISO', 403, 'Solo el cliente de la reserva puede reseñarla.');
  const plazo = plazoParaResenar(r);
  if (!plazo) throw new ErrorResena('RESERVA_NO_CERRADA', 409, 'Podrás reseñar cuando la operación termine.');
  if (Date.parse(plazo) <= ahora) throw new ErrorResena('PLAZO_VENCIDO', 409, `El plazo para reseñar terminó ${DIAS_PARA_RESENAR} días después del cierre.`);
}

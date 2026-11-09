import { ErrorAplicacion } from '../../../shared/dominio/error-aplicacion';
import type { Transaccion } from '../../../shared/dominio/transaccion';

export class ErrorPago extends ErrorAplicacion {}

export type EstadoIntento = 'PROCESANDO' | 'APROBADO' | 'RECHAZADO' | 'DESCONOCIDO';
export interface IntentoPago {
  id: string; reservaId: string; importeCentimos: number; moneda: 'PEN'; estado: EstadoIntento;
  codigo: string | null; reembolsoPendiente: boolean; creadoEn: string;
}
export type ResultadoPago =
  | { estado: 'aprobado'; referencia: string }
  | { estado: 'rechazado'; codigo: string }
  | { estado: 'desconocido' };
export interface CargoExterno { referencia: string; intentoId: string | null; importeCentimos: number; moneda: string; exitoso: boolean }
export interface SolicitudCobro { intentoId: string; reservaId: string; importeCentimos: number; moneda: 'PEN'; tokenId: string; email: string; descripcion: string }
/** Pasarela externa. Un timeout o una respuesta ambigua es 'desconocido', nunca un rechazo. */
export interface ProcesadorPagos {
  cobrar(cobro: SolicitudCobro): Promise<ResultadoPago>;
  consultar(referencia: string): Promise<CargoExterno | null>;
  buscarPorIntento(intento: { id: string; importeCentimos: number }): Promise<CargoExterno | null>;
}
export interface IdentidadPagos { resolver(token: string): Promise<{ id: string; email: string }> }
/**
 * Reserva bloqueada dentro de una transacción abierta por Reservas. Pagos escribe en ella solo sus
 * tablas; el estado de la reserva, su bloqueo y sus eventos los cambia Reservas con estas operaciones.
 */
export interface ReservaEnPago {
  tx: Transaccion; id: string; clienteId: string; titulo: string; importePagable: number | null;
  registrarPago(intentoId: string, importeCentimos: number): Promise<void>;
  registrarPagoTardio(intentoId: string): Promise<void>;
}
export interface ReservasDePago {
  conReserva<T>(id: string, actorId: string | null, operar: (reserva: ReservaEnPago) => Promise<T>): Promise<T>;
  visible(id: string, actorId: string): Promise<boolean>;
}
export interface RepositorioPagos {
  prepararPago(reservaId: string, actorId: string, clave: string, huella: string): Promise<{ intento: IntentoPago; repetido: boolean; titulo: string }>;
  rechazarPago(intentoId: string, codigo: string): Promise<IntentoPago | null>;
  marcarPagoDesconocido(intentoId: string): Promise<IntentoPago | null>;
  aprobarPago(intentoId: string, referencia: string): Promise<IntentoPago | null>;
  pagosDe(reservaId: string, actorId: string): Promise<IntentoPago[] | null>;
  pagoPorId(intentoId: string): Promise<IntentoPago | null>;
  pagosPorConciliar(procesandoMs: number, limite: number): Promise<IntentoPago[]>;
  eventoPasarelaRegistrado(proveedor: string, eventoId: string): Promise<boolean>;
  registrarEventoPasarela(proveedor: string, eventoId: string): Promise<void>;
}

function objeto(value: unknown, campos: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !campos.includes(k))) throw new ErrorPago('ENTRADA_INVALIDA', 400, 'Revisa los datos de la solicitud.');
  return value as Record<string, unknown>;
}
export function uuid(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new ErrorPago('ENTRADA_INVALIDA', 400, 'Identificador inválido.');
  return value.toLowerCase();
}

/** Solo se aceptan tokens de prueba: la pasarela está acordada únicamente para sandbox. */
export function entradaPago(value: unknown): { tokenId: string } {
  const d = objeto(value, ['tokenId']);
  if (typeof d.tokenId !== 'string' || !/^tkn_test_[A-Za-z0-9_-]{1,120}$/.test(d.tokenId)) throw new ErrorPago('TOKEN_INVALIDO', 400, 'No se pudo leer el pago. Inténtalo de nuevo.');
  return { tokenId: d.tokenId };
}
export function claveIdempotencia(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{16,64}$/.test(value)) throw new ErrorPago('CLAVE_REQUERIDA', 400, 'Falta la clave del pago. Recarga antes de continuar.');
  return value;
}

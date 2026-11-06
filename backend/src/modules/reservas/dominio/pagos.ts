import { ErrorReserva, objeto, type Solicitud } from './solicitud';

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

/** Solo se aceptan tokens de prueba: la pasarela está acordada únicamente para sandbox. */
export function entradaPago(value: unknown): { tokenId: string } {
  const d = objeto(value, ['tokenId']);
  if (typeof d.tokenId !== 'string' || !/^tkn_test_[A-Za-z0-9_-]{1,120}$/.test(d.tokenId)) throw new ErrorReserva('TOKEN_INVALIDO', 400, 'No se pudo leer el pago. Inténtalo de nuevo.');
  return { tokenId: d.tokenId };
}
export function claveIdempotencia(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{16,64}$/.test(value)) throw new ErrorReserva('CLAVE_REQUERIDA', 400, 'Falta la clave del pago. Recarga antes de continuar.');
  return value;
}
/** Lo que corresponde pagar según el servidor, o null si ahora no se puede pagar en línea. */
export function importeAPagar(s: Solicitud, ahora: number): number | null {
  if (s.estado === 'ACEPTADA' && s.condiciones && s.venceEn && Date.parse(s.venceEn) > ahora) return s.condiciones.importeCentimos;
  if (s.estado === 'SERVICIO_POR_PAGAR') return s.cotizaciones?.find(c => c.respuesta?.decision === 'ACEPTADA')?.importeCentimos ?? null;
  return null;
}

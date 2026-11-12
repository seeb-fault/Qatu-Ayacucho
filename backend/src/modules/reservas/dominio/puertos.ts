import type { NuevaSolicitud, Solicitud } from './solicitud';
import type { AccionReserva } from './alquiler';
import type { PropuestaCotizacion } from './cotizacion';
import type { Transaccion } from '../../../shared/dominio/transaccion';

export interface EventoReserva {
  id: string; tipo: string; reservaId: string; clienteId: string; propietarioId: string;
  payload: Record<string, unknown>; creadoEn: string; intento: number;
}
/** Canal externo. Puede recibir un evento repetido: debe deduplicar por su id. */
export interface Notificador { enviar(evento: EventoReserva): Promise<void> }
/** El canal rechazó el evento de forma definitiva: reintentar no serviría. */
export class NotificacionRechazada extends Error {
  readonly codigo: string;
  constructor(codigo: string) {
    super('Notificación rechazada por el canal.');
    this.codigo = /^[A-Z0-9_]{1,64}$/.test(codigo) ? codigo : 'RECHAZADA';
  }
}
export interface RepositorioDespacho {
  reclamar(limite: number, reclamoMs: number): Promise<EventoReserva[]>;
  confirmar(id: string, intento: number): Promise<void>;
  fallar(id: string, intento: number, codigo: string, esperaMs: number | null): Promise<void>;
}
export interface IdentidadReservas { resolver(token: string): Promise<{ id: string; email: string }> }
export interface CatalogoReservas {
  consultar(id: string): Promise<{
    id: string; proveedorId: string; titulo: string; tipo: 'herramienta' | 'servicio';
    tarifaCentimos: number | null; unidad: string | null;
    proveedor: { nombrePublico: string };
    recursos: { id?: string; identificador: string; activo: boolean }[];
  }>;
}
export interface ProveedoresReservas { titular(id: string): Promise<{ usuarioId: string }> }
export interface UltimoPago { estado: string; codigo: string | null; reembolsoPendiente: boolean }
/** Lo que Reservas necesita de los pagos. Lo implementa el módulo Pagos; Reservas no lo importa. */
export interface PagosDeReserva {
  ultimos(reservaIds: string[]): Promise<Map<string, UltimoPago>>;
  /** Corre dentro de la transacción de la cancelación: si falla, la reserva no se cancela. */
  marcarReembolso(tx: Transaccion, reservaId: string): Promise<void>;
}
/** Reserva bloqueada que se entrega a quien cobra, junto con la transacción que la protege. */
export interface ReservaParaPago {
  tx: Transaccion; id: string; clienteId: string; titulo: string; importePagable: number | null;
  registrarPago(intentoId: string, importeCentimos: number): Promise<void>;
  registrarPagoTardio(intentoId: string): Promise<void>;
}
/** Datos mínimos de una reserva para otros módulos; solo se entregan a sus participantes. */
export interface ParticipacionReserva {
  id: string; clienteId: string; propietarioId: string; proveedorId: string; publicacionId: string;
  titulo: string; tipo: 'herramienta' | 'servicio'; estado: string; cerradaEn: string | null;
}
export interface RepositorioReservas {
  cotizar(id: string, actorId: string, versionActual: number, propuesta: PropuestaCotizacion): Promise<Solicitud>;
  responderCotizacion(id: string, actorId: string, versionActual: number, versionCotizacion: number, decision: 'ACEPTADA' | 'RECHAZADA', motivo: string | null): Promise<Solicitud>;
  confirmarAgenda(id: string, actorId: string, versionActual: number, versionCotizacion: number): Promise<Solicitud>;
  crear(datos: NuevaSolicitud): Promise<Solicitud>;
  porId(id: string, actorId: string): Promise<Solicitud | null>;
  listar(actorId: string, vista: 'cliente' | 'proveedor', page: number): Promise<{ items: Solicitud[]; total: number }>;
  rechazar(id: string, propietarioId: string, versionActual: number, motivo: string): Promise<Solicitud>;
  vencer(): Promise<number>;
  ejecutar(id: string, actorId: string, versionActual: number, accion: AccionReserva, motivo: string | null): Promise<Solicitud>;
  disponibilidad(recursoId: string, inicio: string, fin: string): Promise<{franjas: {inicio: string; fin: string}[]; enUso: boolean}>;
  conReserva<T>(id: string, actorId: string | null, operar: (reserva: ReservaParaPago) => Promise<T>): Promise<T>;
  visible(id: string, actorId: string): Promise<boolean>;
  participacion(id: string, actorId: string): Promise<ParticipacionReserva | null>;
  cierres(ids: string[]): Promise<Map<string, string | null>>;
}

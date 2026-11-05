import { invalida, objeto } from './solicitud';
import type { EventoReserva } from './puertos';

type Receptor = 'cliente' | 'proveedor' | 'ambos' | 'otro';
/** Quién debe enterarse de cada evento. 'otro' es el participante que no realizó la acción. */
export const AVISOS: Record<string, { para: Receptor; mensaje: string }> = {
  SOLICITUD_CREADA: { para: 'proveedor', mensaje: 'Recibiste una nueva solicitud.' },
  SOLICITUD_RECHAZADA: { para: 'cliente', mensaje: 'El proveedor rechazó tu solicitud.' },
  SOLICITUD_ACEPTADA: { para: 'cliente', mensaje: 'El proveedor apartó la herramienta. Tienes 60 minutos para acercarte.' },
  VISITA_ACORDADA: { para: 'cliente', mensaje: 'El proveedor acordó tu visita.' },
  APARTADO_AMPLIADO: { para: 'cliente', mensaje: 'El proveedor te dio más tiempo para recoger la herramienta.' },
  RESERVA_CANCELADA: { para: 'otro', mensaje: 'La otra persona canceló la reserva.' },
  EFECTIVO_REGISTRADO: { para: 'cliente', mensaje: 'El proveedor registró el efectivo y la entrega. Falta tu confirmación.' },
  RECEPCION_CONFIRMADA: { para: 'proveedor', mensaje: 'El cliente confirmó el pago y la recepción.' },
  DEVOLUCION_INFORMADA: { para: 'proveedor', mensaje: 'El cliente avisó que devolvió la herramienta. Falta tu confirmación.' },
  DEVOLUCION_CONFIRMADA: { para: 'cliente', mensaje: 'El proveedor confirmó la devolución.' },
  DEVOLUCION_RECHAZADA: { para: 'cliente', mensaje: 'El proveedor rechazó tu aviso de devolución.' },
  RESERVA_VENCIDA: { para: 'ambos', mensaje: 'El apartado venció y la unidad quedó libre.' },
  COTIZACION_PROPUESTA: { para: 'cliente', mensaje: 'Recibiste una cotización para revisar.' },
  COTIZACION_ACEPTADA: { para: 'proveedor', mensaje: 'El cliente aceptó tu cotización.' },
  COTIZACION_RECHAZADA: { para: 'proveedor', mensaje: 'El cliente rechazó tu cotización.' },
  AGENDA_CONFIRMADA: { para: 'proveedor', mensaje: 'El horario del servicio quedó reservado.' },
  SERVICIO_INICIADO: { para: 'cliente', mensaje: 'El proveedor registró el inicio del trabajo.' },
  SERVICIO_TERMINADO: { para: 'cliente', mensaje: 'El proveedor declaró el trabajo terminado. Falta tu confirmación.' },
  TERMINO_RECHAZADO: { para: 'proveedor', mensaje: 'El cliente rechazó el término del trabajo.' },
  SERVICIO_CERRADO: { para: 'proveedor', mensaje: 'El cliente confirmó el trabajo y el pago.' },
};

export function destinatarios(evento: EventoReserva): string[] | null {
  const aviso = AVISOS[evento.tipo];
  if (!aviso) return null;
  const { clienteId, propietarioId } = evento, actor = evento.payload.actorId;
  if (aviso.para === 'cliente') return [clienteId];
  if (aviso.para === 'proveedor') return [propietarioId];
  if (aviso.para === 'otro' && actor === clienteId) return [propietarioId];
  if (aviso.para === 'otro' && actor === propietarioId) return [clienteId];
  return [clienteId, propietarioId];
}

export function paginaAvisos(value: unknown): number {
  const d = objeto(value, ['page']);
  if (d.page !== undefined && (typeof d.page !== 'string' || !/^[1-9]\d{0,3}$/.test(d.page))) invalida('Página inválida.');
  return Number(d.page ?? 1);
}

export interface AvisoGuardado { id: string; reservaId: string; tipo: string; titulo: string; vista: 'cliente' | 'proveedor'; creadoEn: string; leidoEn: string | null }
export interface RepositorioAvisos {
  listar(usuarioId: string, page: number): Promise<{ items: AvisoGuardado[]; total: number; noLeidos: number }>;
  noLeidos(usuarioId: string): Promise<number>;
  marcar(id: string, usuarioId: string): Promise<boolean>;
  marcarTodos(usuarioId: string): Promise<number>;
}

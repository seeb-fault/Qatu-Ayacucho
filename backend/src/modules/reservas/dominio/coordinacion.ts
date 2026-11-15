import type { Solicitud } from './solicitud';

/**
 * Coordinación por WhatsApp (010). El número de la contraparte se muestra desde que hay un compromiso
 * (visita acordada, cotización enviada o reserva aceptada) y deja de mostrarse al cerrar, cancelar o rechazar.
 * Una solicitud pendiente sin respuesta no lo muestra: así no se obtienen números solo con enviar solicitudes.
 */
const ACTIVOS = new Set(['VISITA_ACORDADA', 'ACEPTADA', 'APARTADO_PAGADO', 'ENTREGA_POR_CONFIRMAR', 'EN_CURSO', 'DEVOLUCION_PENDIENTE',
  'SERVICIO_CONFIRMADO', 'SERVICIO_EN_CURSO', 'SERVICIO_POR_CONFIRMAR', 'SERVICIO_POR_PAGAR']);

export function contactoPermitido(s: Pick<Solicitud, 'estado' | 'cotizaciones'>) {
  return ACTIVOS.has(s.estado) || (s.estado === 'PENDIENTE' && (s.cotizaciones?.length ?? 0) > 0);
}

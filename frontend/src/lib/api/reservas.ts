export interface CotizacionServicio {
  version: number; alcance: string; materiales: string; importeCentimos: number; moneda: 'PEN';
  vigenteHasta: string; creadaEn: string;
  respuesta: {decision: 'ACEPTADA' | 'RECHAZADA'; motivo: string | null; respondidaEn: string} | null;
}
export interface SolicitudReserva {
  cotizaciones?: CotizacionServicio[];
  id: string;
  publicacionId: string;
  proveedorId: string;
  recursoId: string;
  inicio: string;
  fin: string;
  descripcionTrabajo: string;
  snapshot: { titulo: string; tipo: 'herramienta' | 'servicio'; proveedor: string; recurso: string; tarifaReferenciaCentimos: number | null; unidad: string | null };
  estado: 'PENDIENTE' | 'RECHAZADA' | 'VISITA_ACORDADA' | 'ACEPTADA' | 'VENCIDA' | 'CANCELADA' | 'ENTREGA_POR_CONFIRMAR' | 'EN_CURSO' | 'DEVOLUCION_PENDIENTE' | 'DEVUELTA' | 'SERVICIO_CONFIRMADO';
  motivoRechazo: string | null;
  version: number;
  creadoEn: string;
  participacion: 'cliente' | 'proveedor';
  tipoSolicitud: 'alquiler' | 'visita';
  condiciones: { politica: string; tarifaCentimos: number; dias: number; importeCentimos: number; toleranciaMinutos: number; comisionCentimos: number; medioPago: 'efectivo' } | null;
  venceEn: string | null;
  pagoEstado: 'PENDIENTE' | 'REGISTRADO_PROVEEDOR' | 'CONFIRMADO_PARTICIPANTES';
  efectivoCentimos: number;
  entregadoEn: string | null;
  recibidoEn: string | null;
  devolucionInformadaEn: string | null;
  devueltoEn: string | null;
  importeFinalCentimos: number | null;
  saldoCentimos: number;
  diasExtra: number;
  motivoOperacion: string | null;
}
export interface PaginaReservas { items: SolicitudReserva[]; total: number; page: number; limit: number; vista: 'cliente' | 'proveedor' }
export function fechaReserva(iso: string) {
  return new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}
export function dinero(centimos: number) { return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(centimos / 100); }
export function rangoLima(inicio: string, fin: string) {
  const a = new Date(inicio + ':00-05:00'), b = new Date(fin + ':00-05:00');
  if (!Number.isFinite(a.getTime()) || !Number.isFinite(b.getTime()) || a.getTime() <= Date.now() || b <= a) throw new Error('El inicio debe ser futuro y anterior al fin.');
  return { inicio: a.toISOString(), fin: b.toISOString(), dias: Math.ceil((b.getTime() - a.getTime()) / 86400000) };
}

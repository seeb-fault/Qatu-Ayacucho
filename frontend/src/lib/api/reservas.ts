export interface SolicitudReserva {
  id: string;
  publicacionId: string;
  proveedorId: string;
  recursoId: string;
  inicio: string;
  fin: string;
  descripcionTrabajo: string;
  snapshot: { titulo: string; tipo: 'herramienta' | 'servicio'; proveedor: string; recurso: string; tarifaReferenciaCentimos: number | null; unidad: string | null };
  estado: 'PENDIENTE' | 'RECHAZADA';
  motivoRechazo: string | null;
  version: number;
  creadoEn: string;
  participacion: 'cliente' | 'proveedor';
}
export interface PaginaReservas { items: SolicitudReserva[]; total: number; page: number; limit: number; vista: 'cliente' | 'proveedor' }
export function fechaReserva(iso: string) {
  return new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

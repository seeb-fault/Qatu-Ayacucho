export type EstadoItemLista = 'listo' | 'tarifa_cambiada' | 'fechas_vencidas' | 'no_disponible' | 'inactiva';
export interface ItemLista {
  id: string; publicacionId: string; recursoId: string; tipo: 'herramienta' | 'servicio'; inicio: string; fin: string; descripcion: string;
  tarifaVistaCentimos: number | null; creadoEn: string; titulo: string; proveedor: string; proveedorId: string | null; recurso: string;
  unidad: string | null; tarifaActualCentimos: number | null; estado: EstadoItemLista;
}
export interface ResultadoEnvio { itemId: string; estado: 'enviado' | 'rechazado'; solicitudId?: string; motivo?: string }
export interface ItemPendiente { publicacionId: string; recursoId: string; inicio: string; fin: string; descripcionTrabajo?: string }

/** Avisa al contador del encabezado que la lista cambió. */
export const avisarCambioLista = () => window.dispatchEvent(new Event('qatu:lista'));

// La elección de un visitante espera aquí mientras inicia sesión; solo en esta pestaña.
const PENDIENTE = 'qatu:lista-pendiente';
export function guardarPendiente(item: ItemPendiente) { try { sessionStorage.setItem(PENDIENTE, JSON.stringify(item)); } catch { /* sin almacenamiento: tendrá que elegir de nuevo */ } }
export function tomarPendiente(publicacionId: string): ItemPendiente | null {
  try {
    const crudo = sessionStorage.getItem(PENDIENTE);
    if (!crudo) return null;
    const item = JSON.parse(crudo) as ItemPendiente;
    if (item.publicacionId !== publicacionId) return null;
    sessionStorage.removeItem(PENDIENTE);
    return item;
  } catch { return null; }
}

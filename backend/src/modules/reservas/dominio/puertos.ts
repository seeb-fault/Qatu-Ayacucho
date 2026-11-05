import type { NuevaSolicitud, Solicitud } from './solicitud';
import type { AccionReserva } from './alquiler';
import type { PropuestaCotizacion } from './cotizacion';

export interface IdentidadReservas { resolver(token: string): Promise<{ id: string }> }
export interface CatalogoReservas {
  consultar(id: string): Promise<{
    id: string; proveedorId: string; titulo: string; tipo: 'herramienta' | 'servicio';
    tarifaCentimos: number | null; unidad: string | null;
    proveedor: { nombrePublico: string };
    recursos: { id?: string; identificador: string; activo: boolean }[];
  }>;
}
export interface ProveedoresReservas { titular(id: string): Promise<{ usuarioId: string }> }
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
}
